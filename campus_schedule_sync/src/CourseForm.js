import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * CourseForm: Add or edit a course. Fields: name, code, department.
 * Props:
 *   - course: { id?, name, code, department } (optional, for edit)
 *   - onSave: async (courseObj) => true/false (should submit to backend)
 *   - onCancel: () => void
 */
function CourseForm({ course, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: course?.name || "",
    code: course?.code || "",
    department: course?.department || "",
    id: course?.id || undefined,
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim() || !form.code.trim() || !form.department.trim()) {
      setError("All fields are required.");
      return;
    }
    // Any other validation rules can go here
    const result = await onSave(form);
    if (result === false) {
      setError("Save failed. Please try again.");
    }
  }

  return (
    <div
      style={{
        background: "#fafbfa",
        border: "1px solid var(--border-color)",
        padding: 24,
        borderRadius: 7,
        marginTop: 18,
        maxWidth: 480,
      }}
      aria-label={form.id ? "Edit Course" : "Add Course"}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>{form.id ? "Edit Course" : "Add Course"}</h3>
      {error && (
        <div className="notification error" style={{ margin: "10px 0" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label>
            <b>Course Name:</b>
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              style={inputStyle}
              required
              autoFocus
            />
          </label>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>
            <b>Code:</b>
            <input
              type="text"
              name="code"
              value={form.code}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
            <b>Department:</b>
            <input
              type="text"
              name="department"
              value={form.department}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" type="submit">
            {form.id ? "Save Changes" : "Add Course"}
          </button>
          <button className="btn" type="button" style={{ background: "var(--border-color)", color: "#222" }} onClick={onCancel}>
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

export default CourseForm;
