import React, { useEffect, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * TimetableEntryForm: Add or edit a timetable session entry.
 * 
 * Props:
 *   mode: "add"|"edit"
 *   entry: session object (for edit, else null)
 *   onSave: (fieldsObj) => Promise<boolean> (parent handles DB/optimistic state)
 *   onCancel: () => void
 *   courses: [{id, name, code}]
 *   faculty: [{id, name}]
 *   rooms: [{id, name}]
 */
function TimetableEntryForm({
  mode = "add",
  entry = null,
  onSave,
  onCancel,
  courses = [],
  faculty = [],
  rooms = [],
}) {
  // Fields
  const [form, setForm] = useState({
    course_id: entry?.course_id || "",
    faculty_id: entry?.faculty_id || "",
    room_id: entry?.room_id || "",
    day: entry?.day || "Monday",
    start_time: entry?.start_time || "09:00",
    end_time: entry?.end_time || "10:00",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (entry) {
      setForm({
        course_id: entry.course_id || "",
        faculty_id: entry.faculty_id || "",
        room_id: entry.room_id || "",
        day: entry.day || "Monday",
        start_time: entry.start_time || "09:00",
        end_time: entry.end_time || "10:00",
      });
    }
  }, [entry]);

  // Handle form changes
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // PUBLIC_INTERFACE
  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    // Validation
    if (
      !form.course_id ||
      !form.faculty_id ||
      !form.room_id ||
      !form.day ||
      !form.start_time ||
      !form.end_time
    ) {
      setError("All fields are required.");
      return;
    }
    // End time must be later than start time
    if (form.start_time >= form.end_time) {
      setError("End time must be after start time.");
      return;
    }

    setSubmitting(true);
    const result = await onSave(form);
    setSubmitting(false);
    if (result === false) {
      setError("Failed to save entry. Please try again.");
    } else {
      onCancel(); // auto-close
    }
  }

  return (
    <div
      style={{
        background: "#fafbfa",
        border: "1px solid var(--border-color)",
        borderRadius: 8,
        padding: 24,
        minWidth: 320,
        maxWidth: 420,
      }}
      aria-label={mode === "add" ? "Add Session" : "Edit Session"}
    >
      <h3 style={{ marginTop: 0, marginBottom: 14 }}>{mode === "add" ? "Add Session" : "Edit Session"}</h3>
      {error && (
        <div className="notification error" style={{ margin: "10px 0" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit} autoComplete="off">
        <div style={{ marginBottom: 12 }}>
          <label>
            <b>Course:</b>
            <select
              name="course_id"
              value={form.course_id}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            <b>Faculty:</b>
            <select
              name="faculty_id"
              value={form.faculty_id}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select faculty</option>
              {faculty.map((f) => (
                <option value={f.id} key={f.id}>{f.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            <b>Room:</b>
            <select
              name="room_id"
              value={form.room_id}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option value={r.id} key={r.id}>{r.name}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 12 }}>
          <label>
            <b>Day:</b>
            <select
              name="day"
              value={form.day}
              onChange={handleChange}
              style={inputStyle}
              required
            >
              {["Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"].map((d)=>(
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </label>
        </div>
        <div style={{ marginBottom: 12, display: "flex", gap: 12 }}>
          <label style={{ flex: 1 }}>
            <b>Start:</b>
            <input
              type="time"
              name="start_time"
              value={form.start_time}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </label>
          <label style={{ flex: 1 }}>
            <b>End:</b>
            <input
              type="time"
              name="end_time"
              value={form.end_time}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10, marginTop: 12 }}>
          <button className="btn" type="submit" disabled={submitting}>
            {mode === "add" ? "Add Session" : "Save Changes"}
          </button>
          <button
            className="btn"
            type="button"
            style={{ background: "var(--border-color)", color: "#222" }}
            onClick={onCancel}
            disabled={submitting}
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

const inputStyle = {
  display: "block",
  padding: "8px 10px",
  border: "1px solid var(--border-color)",
  borderRadius: 4,
  marginTop: 4,
  fontSize: "1rem",
  width: "100%",
  background: "#fff",
};

export default TimetableEntryForm;
