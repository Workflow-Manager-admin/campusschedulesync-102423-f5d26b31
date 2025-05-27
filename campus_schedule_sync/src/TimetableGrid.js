import React, { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";

// PUBLIC_INTERFACE
/**
 * TimetableGrid displays a week-view calendar to show/manage timetable/session blocks.
 * Integrates with Supabase for CRUD and displays course, faculty, and room allocation.
 */
function TimetableGrid() {
  // State for timetable, reference data, and UI/modal management
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [selectedSession, setSelectedSession] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState("create"); // "create" | "edit"

  const [error, setError] = useState("");

  // Timetable params (customize as needed)
  const weekdays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const timeslots = [
    "08:00", "09:00", "10:00", "11:00", "12:00",
    "13:00", "14:00", "15:00", "16:00", "17:00"
  ];

  // Fetch sessions and reference data
  useEffect(() => {
    fetchReferenceData();
    fetchSessions();
    // eslint-disable-next-line
  }, []);

  async function fetchReferenceData() {
    // Fetch list of courses, faculty, rooms
    let { data: courseData } = await supabase.from("course").select("*").order("code");
    let { data: facultyData } = await supabase.from("faculty").select("*").order("name");
    let { data: roomData } = await supabase.from("room").select("*").order("code");
    setCourses(courseData || []);
    setFaculty(facultyData || []);
    setRooms(roomData || []);
  }

  async function fetchSessions() {
    // Fetch sessions from timetable/schedule/session table with relevant joins
    // Likely table is "session", with FK to course, faculty, room
    const { data, error } = await supabase
      .from("session")
      .select(`
        *,
        course:course_id ( id, code, name ),
        faculty:faculty_id ( id, name ),
        room:room_id ( id, code )
      `);
    if (error) setError(error.message);
    setSessions(data || []);
  }

  function handleCellDoubleClick(day, slot) {
    // Open modal for "create" with default time
    setSelectedSession({
      id: null,
      day_of_week: day,
      start_time: slot,
      end_time: timeslots[timeslots.indexOf(slot) + 1] || slot,
      course_id: "",
      faculty_id: "",
      room_id: "",
    });
    setModalMode("create");
    setModalOpen(true);
    setError("");
  }

  function handleSessionClick(session) {
    setSelectedSession(session);
    setModalMode("edit");
    setModalOpen(true);
    setError("");
  }

  async function handleDelete(sessionId) {
    if (!window.confirm("Delete this session?")) return;
    const { error } = await supabase.from("session").delete().eq("id", sessionId);
    if (error) setError(error.message);
    setModalOpen(false);
    fetchSessions();
  }

  async function handleModalSubmit(e) {
    e.preventDefault();
    const payload = {
      day_of_week: selectedSession.day_of_week,
      start_time: selectedSession.start_time,
      end_time: selectedSession.end_time,
      course_id: selectedSession.course_id,
      faculty_id: selectedSession.faculty_id,
      room_id: selectedSession.room_id,
    };
    if (modalMode === "create") {
      // Insert new session
      const { error } = await supabase.from("session").insert(payload);
      if (error) setError(error.message);
    } else if (modalMode === "edit") {
      // Update session
      const { error } = await supabase
        .from("session")
        .update(payload)
        .eq("id", selectedSession.id);
      if (error) setError(error.message);
    }
    setModalOpen(false);
    fetchSessions();
  }

  // UTIL: Find session in a grid cell
  function sessionForCell(day, slot) {
    return sessions.find(
      (s) =>
        s.day_of_week === day &&
        s.start_time === slot
    );
  }

  // UTIL: Display allocation info in a block
  function sessionInfoBlock(session) {
    if (!session) return null;
    return (
      <div
        className="session-block"
        onClick={() => handleSessionClick(session)}
        title="Edit session"
        style={{
          cursor: "pointer",
          background: "var(--kavia-orange, #E87A41)",
          color: "#fff",
          borderRadius: 6,
          padding: 4,
          fontSize: 13,
        }}
      >
        <b>{session.course?.code || ""}</b> - {session.course?.name || ""}
        <div>
          {session.faculty?.name} | {session.room?.code}
        </div>
        <div style={{ fontSize: 11 }}>
          {session.start_time} - {session.end_time}
        </div>
      </div>
    );
  }

  // FORM for CREATE/EDIT Modal
  function timetableModal() {
    if (!modalOpen) return null;
    return (
      <div className="modal-backdrop" onClick={() => setModalOpen(false)}>
        <div
          className="modal"
          onClick={(e) => e.stopPropagation()}
          style={{
            background: "#fff",
            padding: 24,
            borderRadius: 8,
            minWidth: 320,
            maxWidth: 400,
            position: "relative",
          }}
        >
          <h3 style={{ marginTop: 0 }}>
            {modalMode === "create" ? "Add Session" : "Edit Session"}
          </h3>
          {error && <div style={{ color: "red", marginBottom: 8 }}>{error}</div>}
          <form onSubmit={handleModalSubmit}>
            <label>
              Day of Week
              <select
                value={selectedSession.day_of_week}
                onChange={(e) =>
                  setSelectedSession((ss) => ({ ...ss, day_of_week: e.target.value }))
                }
                required
                style={{ width: "100%" }}
              >
                <option value="">-- Select Day --</option>
                {weekdays.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Start Time
              <select
                value={selectedSession.start_time}
                onChange={(e) =>
                  setSelectedSession((ss) => ({ ...ss, start_time: e.target.value }))
                }
                required
                style={{ width: "100%" }}
              >
                <option value="">-- Select Start --</option>
                {timeslots.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              End Time
              <select
                value={selectedSession.end_time}
                onChange={(e) =>
                  setSelectedSession((ss) => ({ ...ss, end_time: e.target.value }))
                }
                required
                style={{ width: "100%" }}
              >
                <option value="">-- Select End --</option>
                {timeslots
                  .filter(
                    (t) => timeslots.indexOf(t) > timeslots.indexOf(selectedSession.start_time)
                  )
                  .map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
              </select>
            </label>
            <label>
              Course
              <select
                value={selectedSession.course_id}
                onChange={(e) =>
                  setSelectedSession((ss) => ({ ...ss, course_id: e.target.value }))
                }
                required
                style={{ width: "100%" }}
              >
                <option value="">-- Select Course --</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.code}: {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Faculty
              <select
                value={selectedSession.faculty_id}
                onChange={(e) =>
                  setSelectedSession((ss) => ({ ...ss, faculty_id: e.target.value }))
                }
                required
                style={{ width: "100%" }}
              >
                <option value="">-- Select Faculty --</option>
                {faculty.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Room
              <select
                value={selectedSession.room_id}
                onChange={(e) =>
                  setSelectedSession((ss) => ({ ...ss, room_id: e.target.value }))
                }
                required
                style={{ width: "100%" }}
              >
                <option value="">-- Select Room --</option>
                {rooms.map((r) => (
                  <option key={r.id} value={r.id}>
                    {r.code}
                  </option>
                ))}
              </select>
            </label>
            <div style={{ marginTop: 12, display: "flex", justifyContent: "space-between" }}>
              <button type="button" className="btn" onClick={() => setModalOpen(false)}>
                Cancel
              </button>
              {modalMode === "edit" && (
                <button
                  type="button"
                  className="btn"
                  style={{ background: "red" }}
                  onClick={() => handleDelete(selectedSession.id)}
                >
                  Delete
                </button>
              )}
              <button type="submit" className="btn btn-large" style={{ background: "var(--kavia-orange, #E87A41)" }}>
                {modalMode === "create" ? "Add" : "Save"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // Grid CSS
  const gridStyle = {
    display: "grid",
    gridTemplateColumns: `90px repeat(${weekdays.length}, 1fr)`,
    border: "1px solid var(--border-color, #ddd)",
    borderRadius: "8px",
    overflow: "hidden",
    background: "#fff"
  };

  return (
    <div>
      <div className="timetable-grid" style={gridStyle}>
        {/* Header Row */}
        <div style={{ background: "#f6f6f6", borderBottom: "1px solid #eee" }}></div>
        {weekdays.map((day) => (
          <div
            key={day}
            style={{
              background: "#f6f6f6",
              fontWeight: "bold",
              borderBottom: "1px solid #eee",
              textAlign: "center",
              padding: "8px 0"
            }}
          >
            {day}
          </div>
        ))}
        {/* Slots */}
        {timeslots.map((slot) => (
          <React.Fragment key={slot}>
            {/* Time label */}
            <div
              style={{
                borderRight: "1px solid #eee",
                fontWeight: 500,
                background: "#f6f6f6",
                padding: "6px 0",
                textAlign: "center"
              }}
            >
              {slot}
            </div>
            {weekdays.map((day) => {
              const session = sessionForCell(day, slot);
              return (
                <div
                  key={day + slot}
                  onDoubleClick={() => handleCellDoubleClick(day, slot)}
                  style={{
                    minHeight: 50,
                    borderRight:
                      weekdays.indexOf(day) < weekdays.length - 1
                        ? "1px solid #eee"
                        : undefined,
                    borderBottom:
                      timeslots.indexOf(slot) < timeslots.length - 1
                        ? "1px solid #eee"
                        : undefined,
                    background: session ? "rgba(40, 170, 100, 0.09)" : "#fff",
                    padding: 6,
                    cursor: session ? "pointer" : "pointer",
                  }}
                  title={
                    session
                      ? `Edit: ${session.course?.name || session.course_id}`
                      : "Double-click to add session"
                  }
                >
                  {sessionInfoBlock(session)}
                  {!session && (
                    <span style={{ color: "#bbb", fontSize: 11 }}>+</span>
                  )}
                </div>
              );
            })}
          </React.Fragment>
        ))}
      </div>
      <div style={{ marginTop: 10, fontSize: 12, color: "#777" }}>
        <b>Instructions:</b> Double-click any cell to add a session. Click a session block to edit.
      </div>
      {timetableModal()}
    </div>
  );
}

export default TimetableGrid;
