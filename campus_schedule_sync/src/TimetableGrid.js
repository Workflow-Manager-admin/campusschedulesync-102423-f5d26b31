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

  // Render grid as table with drag-and-drop support for unscheduled courses
  function renderTable() {
    // Structure: cols = days, rows = times

    return (
      <div>
        {/* DnD block for unscheduled courses */}
        <DragDropContext
          onDragEnd={async (result) => {
            // If not dropped on a valid cell, do nothing
            if (!result.destination) return;
            const { droppableId, index } = result.destination;
            const match = droppableId.match(/^ttcell-(.+)-(.+)$/);
            if (!match) return;
            const [_, day, slot] = match;

            // Scheduling a course (trigger Supabase insert)
            const course = unscheduledCourses[result.source.index];
            // UI expects faculty and room to be selected; for demo, leave null or pick first(??)
            // Here, faculty and room will be prompted by modal/form in real app, but for
            // demo, try to assign the first available if exists
            const defaultFacultyId = faculty.length > 0 ? faculty[0].id : null;
            const defaultRoomId = rooms.length > 0 ? rooms[0].id : null;
            // If no faculty or room, do nothing
            if (!defaultFacultyId || !defaultRoomId) {
              alert("Please add faculty and rooms before scheduling!");
              return;
            }
            // Insert to timetable_entries via Supabase
            await handleFormSubmit({
              course_id: course.id,
              faculty_id: defaultFacultyId,
              room_id: defaultRoomId,
              day_of_week: day,
              start_time: slot,
              id: null, // insert
            });
            // After insertion, the fetchAll() in handleFormSubmit will refresh local timetable/courses
          }}
        >
          {/* Render unscheduled courses as draggable cards */}
          <Droppable droppableId="unscheduledCourses" direction="horizontal">
            {(provided, snapshot) => (
              <div
                ref={provided.innerRef}
                {...provided.droppableProps}
                style={{
                  display: "flex",
                  flexDirection: "row",
                  gap: 8,
                  marginBottom: 16,
                  minHeight: 64,
                  background: snapshot.isDraggingOver
                    ? "#e8ffe3"
                    : "var(--background, #f9fcfa)",
                  border: "1.5px dashed #a8e5c2",
                  borderRadius: 7,
                  padding: 6,
                }}
              >
                {unscheduledCourses.length === 0 && (
                  <span style={{ color: "#888", fontStyle: "italic" }}>
                    All courses scheduled!
                  </span>
                )}
                {unscheduledCourses.map((course, idx) => (
                  <Draggable
                    key={course.id}
                    draggableId={`course-${course.id}`}
                    index={idx}
                  >
                    {(provided, snapshot) => (
                      <div
                        className="unscheduled-course-card"
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        style={{
                          userSelect: "none",
                          ...provided.draggableProps.style,
                          padding: "8px 12px",
                          borderRadius: 5,
                          background: snapshot.isDragging
                            ? "#e87a41"
                            : "#f6faf7",
                          color: "#242c22",
                          border: "1px solid #e8e7e3",
                          minWidth: 120,
                          boxShadow: snapshot.isDragging
                            ? "0 2px 8px #e6af82"
                            : "0 1.5px 4px #eaeaea",
                          fontWeight: 500,
                          fontSize: 15,
                          cursor: "grab",
                          transition: "background 0.14s",
                        }}
                      >
                        <div>
                          <b>{course.course_code}</b>
                        </div>
                        <div style={{ fontSize: 12, opacity: 0.7 }}>
                          {course.name}
                        </div>
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
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
                      <Droppable
                        key={day.key}
                        droppableId={`ttcell-${day.key}-${slot}`}
                      >
                        {(provided, snapshot) => (
                          <td
                            ref={provided.innerRef}
                            {...provided.droppableProps}
                            className="tt-cell"
                            style={{
                              background: snapshot.isDraggingOver
                                ? "#cbeedf"
                                : undefined,
                              transition: "background 0.15s",
                            }}
                          >
                            {(timetable
                              .filter(
                                (entry) =>
                                  entry.day_of_week === day.key &&
                                  entry.start_time === slot
                              )
                            ).map((entry) => (
                              <TimetableBlock
                                key={entry.id}
                                entry={entry}
                                onClick={openEditModal}
                              />
                            ))}
                            {/* Drop button remains for manual creation */}
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
                            {provided.placeholder}
                          </td>
                        )}
                      </Droppable>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </DragDropContext>
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
