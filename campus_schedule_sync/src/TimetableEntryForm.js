import React, { useState, useEffect } from "react";

/**
 * Modal form for creating/editing a timetable session.
 * Props:
 *   isOpen: bool, onClose: func, onSubmit: func
 *   onDelete: func (for edit)
 *   courses, faculty, rooms: array of selects
 *   initialData: object for initial values
 */
// PUBLIC_INTERFACE
export default function TimetableEntryForm({
  isOpen,
  onClose,
  onSubmit,
  onDelete,
  courses = [],
  faculty = [],
  rooms = [],
  initialData = {},
}) {
  const [form, setForm] = useState({
    course_id: "",
    faculty_id: "",
    room_id: "",
    day_of_week: "",
    start_time: "",
    ...initialData,
  });

  useEffect(() => {
    setForm({
      course_id: "",
      faculty_id: "",
      room_id: "",
      day_of_week: "",
      start_time: "",
      ...initialData,
    });
  }, [isOpen, initialData]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  function handleSubmit(e) {
    e.preventDefault();
    onSubmit({
      ...form,
      id: initialData.id,
      course_id: +form.course_id,
      faculty_id: +form.faculty_id,
      room_id: +form.room_id,
    });
  }

  if (!isOpen) return null;

  return (
    <div className="tt-modal-bk" tabIndex={-1} style={{
      position: "fixed", zIndex: 30,
      top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(0,0,0,0.12)",
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div className="tt-modal" style={{
        minWidth: 380, minHeight: 240,
        background: "#fff",
        borderRadius: 10,
        padding: "30px 32px 22px 32px",
        boxShadow: "0 10px 32px rgba(40,60,100,0.15)",
        position: "relative"
      }}>
        <button onClick={onClose} style={{
          position: "absolute", top: 18, right: 20, background: "none", border: "none", fontSize: 26, cursor: "pointer"
        }} title="Close">&times;</button>
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <h3 style={{ margin: "0 0 15px 0" }}>{initialData.id ? "Edit Session" : "Add Session"}</h3>

          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="course_id">Course</label>
            <select name="course_id" value={form.course_id} onChange={handleChange} required>
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>{c.course_code}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="faculty_id">Faculty</label>
            <select name="faculty_id" value={form.faculty_id} onChange={handleChange} required>
              <option value="">Select faculty</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>{f.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <label htmlFor="room_id">Room</label>
            <select name="room_id" value={form.room_id} onChange={handleChange} required>
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 24 }}>
            <div style={{ flex: 1 }}>
              <label htmlFor="day_of_week">Day</label>
              <select name="day_of_week" value={form.day_of_week} onChange={handleChange} required>
                <option value="">Select day</option>
                <option value="mon">Monday</option>
                <option value="tue">Tuesday</option>
                <option value="wed">Wednesday</option>
                <option value="thu">Thursday</option>
                <option value="fri">Friday</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label htmlFor="start_time">Time</label>
              <select name="start_time" value={form.start_time} onChange={handleChange} required>
                {["8:00", "9:00", "10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00"].map((v) =>
                  <option key={v} value={v}>{v}</option>
                )}
              </select>
            </div>
          </div>
          <div style={{ display: "flex", flexDirection: "row", gap: 16, marginTop: 10 }}>
            <button type="submit" className="btn btn-large" style={{ flex: 2, background: "#2ecc40" }}>
              {initialData.id ? "Save" : "Add"}
            </button>
            {onDelete &&
              <button type="button" onClick={onDelete} className="btn" style={{
                background: "#ec665a",
                color: "#fff"
              }}>Delete</button>
            }
          </div>
        </form>
      </div>
    </div>
  );
}
