import React, { useState, useEffect, useMemo } from "react";
import useTimetable from "./useTimetable";
import TimetableEntryForm from "./TimetableEntryForm";
import { useSupabase } from "./SupabaseProvider";
import Notification from "./Notification";

/**
 * PUBLIC_INTERFACE
 * TimetableGrid: Week-view timetable/calendar for viewing and managing sessions.
 * - Displays grid with days as columns and time slots as rows.
 * - Allows creating, editing, and deleting sessions (CRUD) using useTimetable.js.
 * - Integrates TimetableEntryForm.js for session add/edit.
 * - Sessions are associated with courses, faculty, and rooms (resolved by ID).
 */
function TimetableGrid() {
  // Data: timetable session CRUD
  const {
    sessions,
    loading,
    error,
    addSession,
    updateSession,
    deleteSession,
    refresh,
  } = useTimetable();

  // Data: courses, faculty, rooms for lookup
  const supabase = useSupabase();
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [lookupError, setLookupError] = useState("");

  // UI State
  const [showForm, setShowForm] = useState(false);
  const [formMode, setFormMode] = useState("add"); // "add" | "edit"
  const [editingEntry, setEditingEntry] = useState(null); // session object or null
  const [notification, setNotification] = useState(null); // { type, message }

  // Timetable config
  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const TIME_START = "08:00";
  const TIME_END = "18:00";
  // 1hr granularity for now
  const TIME_INTERVAL_MINS = 60;

  /** Fetch necessary lookup data for session forms */
  useEffect(() => {
    async function fetchLookups() {
      try {
        const [courseRes, facultyRes, roomRes] = await Promise.all([
          supabase.from("courses").select("id,name,code"),
          supabase.from("faculty").select("id,name"),
          supabase.from("rooms").select("id,name"),
        ]);
        if (courseRes.error) throw new Error(`Courses: ${courseRes.error.message}`);
        if (facultyRes.error) throw new Error(`Faculty: ${facultyRes.error.message}`);
        if (roomRes.error) throw new Error(`Rooms: ${roomRes.error.message}`);
        setCourses(courseRes.data || []);
        setFaculty(facultyRes.data || []);
        setRooms(roomRes.data || []);
      } catch (err) {
        setLookupError(err.message || "Failed to lookup data.");
      }
    }
    fetchLookups();
  }, [supabase]);

  // Help: map ID to entity for display
  const courseMap = useMemo(() => Object.fromEntries(courses.map(c => [c.id, c])), [courses]);
  const facultyMap = useMemo(() => Object.fromEntries(faculty.map(f => [f.id, f])), [faculty]);
  const roomMap = useMemo(() => Object.fromEntries(rooms.map(r => [r.id, r])), [rooms]);

  /** Generate timetable grid time slots */
  const timeSlots = useMemo(() => {
    const slots = [];
    let [h, m] = TIME_START.split(":").map(Number);
    const [endH, endM] = TIME_END.split(":").map(Number);
    while (h < endH || (h === endH && m < endM)) {
      const nextM = m + TIME_INTERVAL_MINS;
      let nextH = h;
      if (nextM >= 60) {
        nextH = h + Math.floor(nextM / 60);
      }
      const currStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const nextStr = `${nextH.toString().padStart(2, "0")}:${(nextM % 60).toString().padStart(2, "0")}`;
      slots.push({ start: currStr, end: nextStr });
      h = nextH;
      m = nextM % 60;
    }
    return slots;
  }, []);

  /** Filter sessions for a cell (day, time slot) - only show if it starts in this slot */
  function cellSessions(day, timeStart) {
    return sessions.filter(
      (s) =>
        s.day === day &&
        s.start_time === timeStart // strict match, "09:00"
    );
  }

  /** Handle clicking an empty cell: open add form for that day/time */
  function handleAdd(day, time) {
    setFormMode("add");
    setEditingEntry({
      day,
      start_time: time,
      end_time: nextTime(time), // default 1hr
      course_id: "",
      faculty_id: "",
      room_id: "",
    });
    setShowForm(true);
  }

  /** Handle editing an existing session */
  function handleEdit(session) {
    setFormMode("edit");
    setEditingEntry(session);
    setShowForm(true);
  }

  /** Handler for form submission (add or update) */
  async function handleSave(form) {
    if (formMode === "add") {
      const ok = await addSession(form);
      if (ok) {
        setNotification({ type: "success", message: "Session added." });
        refresh();
        return true;
      } else {
        setNotification({ type: "error", message: "Failed to add session." });
        return false;
      }
    } else if (formMode === "edit" && editingEntry?.id) {
      const ok = await updateSession(editingEntry.id, form);
      if (ok) {
        setNotification({ type: "success", message: "Session updated." });
        refresh();
        return true;
      } else {
        setNotification({ type: "error", message: "Failed to update session." });
        return false;
      }
    }
    return false;
  }

  /** Handler for session deletion */
  async function handleDelete(session) {
    if (!window.confirm("Delete this session?")) return;
    const ok = await deleteSession(session.id);
    if (ok) {
      setNotification({ type: "success", message: "Session deleted." });
      refresh();
    } else {
      setNotification({ type: "error", message: "Failed to delete session." });
    }
  }

  /** Utility: add 1hr to timeStr "09:00" by interval (returns "10:00") */
  function nextTime(timeStr) {
    let [h, m] = timeStr.split(":").map(Number);
    m += TIME_INTERVAL_MINS;
    if (m >= 60) {
      h += 1;
      m = m % 60;
    }
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
  }

  return (
    <div>
      <h2 className="title" style={{ marginTop: 0, marginBottom: 18 }}>
        Timetable (Week View)
      </h2>
      <ul style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
        <li>
          <b>Click</b> a cell to <b>add</b> a session.
        </li>
        <li>
          <b>Click a session</b> to <b>edit</b> or <b>delete</b>.
        </li>
      </ul>
      {error && (
        <Notification type="error" message={error} onClose={() => {}} />
      )}
      {lookupError && (
        <Notification type="error" message={lookupError} onClose={() => setLookupError("")} />
      )}
      {notification && (
        <Notification
          type={notification.type}
          message={notification.message}
          onClose={() => setNotification(null)}
        />
      )}
      <div
        style={{
          overflowX: "auto",
          border: "1px solid var(--border-color)",
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px 0 rgba(46,204,64,0.04)",
        }}
      >
        <table
          style={{
            borderCollapse: "collapse",
            minWidth: 940,
            width: "100%",
          }}
        >
          <thead>
            <tr>
              <th style={cellStyleHeader}>Time</th>
              {WEEKDAYS.map((d) => (
                <th style={cellStyleHeader} key={d}>
                  {d}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, i) => (
              <tr key={slot.start}>
                <td style={cellStyleTime}>
                  {slot.start} - {slot.end}
                </td>
                {WEEKDAYS.map((day) => {
                  const slotSessions = cellSessions(day, slot.start);
                  return (
                    <td
                      key={day + slot.start}
                      style={{
                        ...cellStyleBody,
                        background:
                          slotSessions.length === 0 ? "#fafbfa" : "#e8f5e9",
                        position: "relative",
                        cursor: slotSessions.length === 0 ? "pointer" : "default",
                        minWidth: 140,
                      }}
                      tabIndex={0}
                      aria-label={
                        slotSessions.length === 0
                          ? `Add session, ${day} at ${slot.start}`
                          : `Session for ${day} at ${slot.start}`
                      }
                      onClick={() =>
                        slotSessions.length === 0
                          ? handleAdd(day, slot.start)
                          : undefined
                      }
                    >
                      {slotSessions.length === 0 ? (
                        <span style={{ color: "#bbb" }}>+</span>
                      ) : (
                        slotSessions.map((s) => (
                          <div
                            key={s.id}
                            style={{
                              background: "#b3e5c7",
                              color: "#222",
                              borderRadius: 5,
                              marginBottom: 7,
                              padding: "0.3em 0.6em",
                              fontSize: "1em",
                              boxShadow: "0 1px 4px 0 rgba(46, 204, 64, 0.12)",
                              cursor: "pointer",
                              outline: "2px solid transparent",
                            }}
                            tabIndex={0}
                            role="button"
                            aria-label={`Session: ${courseMap[s.course_id]?.name || "Unknown"}; Faculty: ${facultyMap[s.faculty_id]?.name || "Unknown"}; Room: ${roomMap[s.room_id]?.name || "Unknown"}; Edit`}
                            onClick={e => {
                              e.stopPropagation();
                              handleEdit(s);
                            }}
                          >
                            <div title="Course" style={{ fontWeight: 600 }}>
                              {courseMap[s.course_id]?.name || "(Unknown)"}{" "}
                              <span style={{ fontSize: "0.96em", fontWeight: 400, color: "#2ecc40" }}>
                                {courseMap[s.course_id]?.code ? `(${courseMap[s.course_id]?.code})` : ""}
                              </span>
                            </div>
                            <div style={{ fontSize: "0.95em" }}>
                              <b>Faculty:</b> {facultyMap[s.faculty_id]?.name || "-"}
                            </div>
                            <div style={{ fontSize: "0.95em" }}>
                              <b>Room:</b> {roomMap[s.room_id]?.name || "-"}
                            </div>
                            <div style={{ fontSize: "0.97em", color: "#222" }}>
                              {s.start_time} - {s.end_time}
                            </div>
                            <div style={{ display: "flex", gap: 6, marginTop: 3 }}>
                              <button
                                className="btn"
                                type="button"
                                style={{
                                  fontSize: "0.96em",
                                  padding: "3px 12px",
                                  background: "var(--primary-green)",
                                  color: "#fff",
                                }}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleEdit(s);
                                }}
                              >
                                Edit
                              </button>
                              <button
                                className="btn"
                                type="button"
                                style={{
                                  fontSize: "0.96em",
                                  padding: "3px 10px",
                                  background: "var(--notification-error)",
                                  color: "#fff",
                                }}
                                onClick={e => {
                                  e.stopPropagation();
                                  handleDelete(s);
                                }}
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {/* Entry form drawer/modal */}
      {showForm && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            zIndex: 2000,
            width: "100vw",
            height: "100vh",
            background: "rgba(47, 59, 49, 0.16)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
          onClick={() => {
            setShowForm(false);
            setEditingEntry(null);
          }}
        >
          <div
            style={{ zIndex: 2010 }}
            onClick={e => e.stopPropagation()}
          >
            <TimetableEntryForm
              mode={formMode}
              entry={editingEntry}
              onSave={handleSave}
              onCancel={() => {
                setShowForm(false);
                setEditingEntry(null);
              }}
              courses={courses}
              faculty={faculty}
              rooms={rooms}
            />
          </div>
        </div>
      )}
      {loading ? (
        <div style={{ marginTop: 18, color: "#888" }}>Loading sessions…</div>
      ) : null}
    </div>
  );
}

// Cell styling for timetable grid
const cellStyleHeader = {
  padding: "10px 4px",
  textAlign: "center",
  background: "var(--border-color)",
  color: "#222",
  minWidth: 100,
  fontWeight: 700,
  borderBottom: "2px solid #e8f5e9",
};

const cellStyleTime = {
  padding: "9px 4px",
  background: "#fafafa",
  color: "#444",
  fontWeight: 600,
  minWidth: 70,
  borderRight: "1px solid #edf8ed",
  textAlign: "right",
};

const cellStyleBody = {
  minHeight: 46,
  padding: "7px 4px",
  borderLeft: "1px solid #eeeeee",
  borderBottom: "1px solid #f5f8f5",
  verticalAlign: "top",
};

// PUBLIC_INTERFACE: default export
export default TimetableGrid;
