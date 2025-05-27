import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * FacultyForm: Add or edit a faculty member.
 * Fields: name, email, department, classes_per_week.
 * Enforces no more than 12 classes/week in UI.
 * Props:
 *   - faculty: { id?, name, email, department, classes_per_week }
 *   - onSave: async (facultyObj) => true/false
 *   - onCancel: () => void
 */
function FacultyForm({ faculty, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: faculty?.name || "",
    email: faculty?.email || "",
    department: faculty?.department || "",
    classes_per_week:
      typeof faculty?.classes_per_week === "number"
        ? faculty.classes_per_week
        : (faculty?.classes_per_week || ""),
    id: faculty?.id || undefined,
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    let { name, value } = e.target;
    // Force numeric input for classes_per_week
    if (name === "classes_per_week") value = value.replace(/[^0-9]/g, "");
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    // Basic validation
    if (!form.name.trim() || !form.email.trim() || !form.department.trim()) {
      setError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (
      String(form.classes_per_week).trim() === "" ||
      isNaN(Number(form.classes_per_week))
    ) {
      setError("Classes per week is required.");
      return;
    }
    if (Number(form.classes_per_week) > 12) {
      setError("A faculty member cannot be assigned more than 12 classes per week.");
      return;
    }
    // Submit to parent
    const result = await onSave({
      ...form,
      classes_per_week: Number(form.classes_per_week)
    });
    if (result === false) {
      setError(
        "Save failed. Please check your data and try again."
      );
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
      aria-label={form.id ? "Edit Faculty" : "Add Faculty"}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>
        {form.id ? "Edit Faculty" : "Add Faculty"}
      </h3>
      {error && (
        <div className="notification error" style={{ margin: "10px 0" }}>
          {error}
        </div>
      )}
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: 14 }}>
          <label>
            <b>Name:</b>
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
            <b>Email:</b>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: 14 }}>
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
        <div style={{ marginBottom: 18 }}>
          <label>
            <b>Classes/Week:</b>
            <input
              type="number"
              min={0}
              max={12}
              name="classes_per_week"
              value={form.classes_per_week}
              onChange={handleChange}
              style={{
                ...inputStyle,
                borderColor:
                  Number(form.classes_per_week) > 12
                    ? "var(--notification-error)" : "var(--border-color)",
                color:
                  Number(form.classes_per_week) > 12
                    ? "var(--notification-error)" : "#222",
                fontWeight:
                  Number(form.classes_per_week) > 12
                    ? 700 : 400,
              }}
              required
              aria-invalid={Number(form.classes_per_week) > 12}
              aria-describedby={
                Number(form.classes_per_week) > 12
                  ? "class-count-limit"
                  : undefined
              }
            />
          </label>
          {Number(form.classes_per_week) > 12 && (
            <span
              id="class-count-limit"
              style={{
                color: "var(--notification-error)",
                fontSize: "0.97em",
                marginLeft: 6,
                fontWeight: 700,
              }}
            >
              Max 12 classes/week allowed
            </span>
          )}
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" type="submit">
            {form.id ? "Save Changes" : "Add Faculty"}
          </button>
          <button
            className="btn"
            type="button"
            style={{ background: "var(--border-color)", color: "#222" }}
            onClick={onCancel}
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

export default FacultyForm;
