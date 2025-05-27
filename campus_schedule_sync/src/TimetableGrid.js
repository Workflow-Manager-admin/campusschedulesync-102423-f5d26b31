import React, { useEffect, useState } from "react";
import "./App.css";
import TimetableEntryForm from "./TimetableEntryForm";
import { useSupabase } from "./SupabaseProvider";
// DnD imports
import {
  DragDropContext,
  Droppable,
  Draggable
} from "@hello-pangea/dnd";
// No longer need local Supabase config or client creation.

// Helpers for days and time slots (could be extracted)
const weekdays = [
  { key: "mon", label: "Mon" },
  { key: "tue", label: "Tue" },
  { key: "wed", label: "Wed" },
  { key: "thu", label: "Thu" },
  { key: "fri", label: "Fri" },
];

const timeSlots = [
  "8:00", "9:00", "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00", "16:00", "17:00"
];

function getSlotIndex(time) {
  // Maps a start_time like '10:00' to its slot index.
  return timeSlots.indexOf(time);
}

/**
 * Render course/faculty/room for a session block
 */
function TimetableBlock({ entry, onClick }) {
  return (
    <div
      className="tt-block"
      style={{
        background: "var(--kavia-orange, #E87A41)",
        color: "#fff",
        cursor: "pointer",
        borderRadius: 6,
        padding: 6,
        marginBottom: 2,
        boxShadow: "0 1px 3px rgba(30,40,70,0.05)",
        fontSize: 13,
      }}
      onClick={() => onClick(entry)}
      title={`${entry.course_code}\n${entry.faculty_name} @${entry.room_name}`}
    >
      <b>{entry.course_code}</b>
      <div style={{ fontSize: 11 }}>{entry.faculty_name}</div>
      <div style={{ fontSize: 10, color: "#ffe9b9" }}>{entry.room_name}</div>
    </div>
  );
}

// PUBLIC_INTERFACE
export default function TimetableGrid() {
  /**
   * Week-view calendar grid, CRUD with Supabase.
   */

  // Timetable state
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState(null);
  const [formSlot, setFormSlot] = useState(null);
  const [error, setError] = useState(null);

  const supabase = useSupabase();

  // Support for lookup of faculty, room, and course codes
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [faculty, setFaculty] = useState([]);

  // On mount: fetch all, subscribe to updates
  useEffect(() => {
    fetchAll();
    // No real-time - could subscribe to changes for full live sync if needed
    // eslint-disable-next-line
  }, []);

  // Filter unscheduled courses for drag-and-drop cards
  const scheduledCourseIds = new Set(timetable.map((t) => t.course_id));
  const unscheduledCourses = courses.filter(
    (c) => !scheduledCourseIds.has(c.id)
  );

  // PUBLIC_INTERFACE
  async function fetchAll() {
    setLoading(true);
    try {
      // 1. Get all timetable entries (for the week); join courses, rooms, faculty for display.
      const { data: timetableData, error: ttError } = await supabase
        .from("timetable_entries")
        .select(`*, 
          courses ( course_code ),
          faculty ( name ),
          rooms ( name )
        `);
      if (ttError) throw ttError;

      // Compose for calendar
      const entries = (timetableData || []).map((e) => ({
        ...e,
        course_code: e.courses?.course_code || "",
        faculty_name: e.faculty?.name || "",
        room_name: e.rooms?.name || "",
      }));
      setTimetable(entries);

      // Courses
      const { data: coursesData } = await supabase.from("courses").select("*");
      setCourses(coursesData || []);
      // Faculty
      const { data: facultyData } = await supabase.from("faculty").select("*");
      setFaculty(facultyData || []);
      // Rooms
      const { data: roomsData } = await supabase.from("rooms").select("*");
      setRooms(roomsData || []);
    } catch (err) {
      setError(err.message || "Failed to fetch timetable data.");
    }
    setLoading(false);
  }

  // PUBLIC_INTERFACE
  function openCreateModal(day, slot) {
    setEditingEntry(null);
    setModalOpen(true);
    setFormSlot({ day, slot });
  }

  // PUBLIC_INTERFACE
  function openEditModal(entry) {
    setEditingEntry(entry);
    setModalOpen(true);
    setFormSlot({ day: entry.day_of_week, slot: entry.start_time });
  }

  // PUBLIC_INTERFACE
  async function handleDelete(entry) {
    if (!window.confirm("Delete this session?")) return;
    await supabase.from("timetable_entries").delete().eq("id", entry.id);
    fetchAll();
  }

  // PUBLIC_INTERFACE
  async function handleFormSubmit({ id, course_id, faculty_id, room_id, day_of_week, start_time }) {
    if (!course_id || !faculty_id || !room_id) {
      alert("Please select course, faculty, and room.");
      return;
    }
    if (id) {
      // Edit
      await supabase.from("timetable_entries")
        .update({ course_id, faculty_id, room_id, day_of_week, start_time })
        .eq("id", id);
    } else {
      // Create
      await supabase.from("timetable_entries")
        .insert([{ course_id, faculty_id, room_id, day_of_week, start_time }]);
    }
    setModalOpen(false);
    setEditingEntry(null);
    setFormSlot(null);
    fetchAll();
  }

  // Render grid as table
  function renderTable() {
    // Structure: cols = days, rows = times
    return (
      <div className="tt-gridwrap">
        <table className="tt-grid">
          <thead>
            <tr>
              <th style={{ width: 74 }}></th>
              {weekdays.map((d) => (
                <th key={d.key}>{d.label}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {timeSlots.map((slot, rowIdx) => (
              <tr key={slot}>
                <td style={{ fontWeight: 600 }}>{slot}</td>
                {weekdays.map((day) => (
                  <td key={day.key} className="tt-cell">
                    {/* Render all blocks at this slot+day */}
                    {(timetable.filter(
                      (entry) =>
                        entry.day_of_week === day.key &&
                        entry.start_time === slot
                    )).map((entry) => (
                      <TimetableBlock
                        key={entry.id}
                        entry={entry}
                        onClick={openEditModal}
                      />
                    ))}
                    <div style={{ marginTop: 2 }}>
                      <button
                        className="btn btn-small"
                        style={{
                          fontSize: 11,
                          padding: "0 6px",
                          lineHeight: "16px",
                          background: "#208b48",
                          color: "#fff",
                          letterSpacing: "0.06em",
                          borderRadius: 4,
                        }}
                        aria-label={`Add session for ${day.label} ${slot}`}
                        onClick={() => openCreateModal(day.key, slot)}
                        tabIndex={0}
                      >
                        +
                      </button>
                    </div>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  }

  return (
    <div className="timetable-area">
      {loading && <div className="tt-loading">Loading timetable...</div>}
      {error && <div className="tt-error">{error}</div>}
      {!loading && renderTable()}

      {/* Session Modal */}
      {modalOpen && (
        <TimetableEntryForm
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setEditingEntry(null);
          }}
          onSubmit={handleFormSubmit}
          onDelete={editingEntry ? () => handleDelete(editingEntry) : undefined}
          courses={courses}
          faculty={faculty}
          rooms={rooms}
          initialData={
            editingEntry
              ? {
                  ...editingEntry,
                }
              : {
                  day_of_week: formSlot?.day,
                  start_time: formSlot?.slot,
                }
          }
        />
      )}
      {/* Basic styles for the grid */}
      <style>{`
        .tt-gridwrap { overflow-x: auto; margin: 0 auto; }
        .tt-grid { border-collapse: separate; border-spacing: 0; width: 100%; background: #fff; }
        .tt-grid th, .tt-grid td { border: 1px solid var(--border-color, #ddd); text-align: center; min-width: 86px; vertical-align: top; }
        .tt-grid th { background: var(--kavia-dark,#208b48); color: #fff; font-weight: bold; }
        .tt-cell { position: relative; min-height: 48px; height: 64px; }
        .tt-block { margin: 2px 0; }
        .tt-loading, .tt-error { margin: 22px 0; color: #d15; }
      `}</style>
    </div>
  );
}
