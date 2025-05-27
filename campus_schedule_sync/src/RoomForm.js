import React, { useState } from "react";

/**
 * PUBLIC_INTERFACE
 * RoomForm: Add or edit a room/resource.
 * Fields: name, type, capacity, location.
 * Props:
 *   - room: { id?, name, type, capacity, location } (optional, for edit)
 *   - onSave: async (roomObj) => true/false
 *   - onCancel: () => void
 */
function RoomForm({ room, onSave, onCancel }) {
  const [form, setForm] = useState({
    name: room?.name || "",
    type: room?.type || "",
    capacity: typeof room?.capacity === "number" ? room.capacity : (room?.capacity || ""),
    location: room?.location || "",
    id: room?.id || undefined,
  });
  const [error, setError] = useState("");

  function handleChange(e) {
    let { name, value } = e.target;
    // Only accept numeric for capacity
    if (name === "capacity") value = value.replace(/[^0-9]/g, "");
    setForm(f => ({ ...f, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    // Basic validation
    if (!form.name.trim() || !form.type.trim() || !form.capacity || !form.location.trim()) {
      setError("All fields are required.");
      return;
    }
    if (!/^[0-9]+$/.test(form.capacity) || Number(form.capacity) < 1) {
      setError("Capacity must be a positive integer.");
      return;
    }
    // Submit to parent
    const result = await onSave({
      ...form,
      capacity: Number(form.capacity),
    });
    if (result === false) {
      setError("Save failed. Please check your data and try again.");
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
      aria-label={form.id ? "Edit Room/Resource" : "Add Room/Resource"}
    >
      <h3 style={{ marginTop: 0, marginBottom: 16 }}>
        {form.id ? "Edit Room/Resource" : "Add Room/Resource"}
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
            <b>Type:</b>
            <input
              type="text"
              name="type"
              value={form.type}
              onChange={handleChange}
              style={inputStyle}
              required
              placeholder="e.g. Classroom, Lab, Auditorium"
            />
          </label>
        </div>
        <div style={{ marginBottom: 14 }}>
          <label>
            <b>Capacity:</b>
            <input
              type="number"
              name="capacity"
              min={1}
              value={form.capacity}
              onChange={handleChange}
              style={inputStyle}
              required
            />
          </label>
        </div>
        <div style={{ marginBottom: 18 }}>
          <label>
            <b>Location:</b>
            <input
              type="text"
              name="location"
              value={form.location}
              onChange={handleChange}
              style={inputStyle}
              required
              placeholder="e.g. Main Building Floor 2"
            />
          </label>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn" type="submit">
            {form.id ? "Save Changes" : "Add Room/Resource"}
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

export default RoomForm;
