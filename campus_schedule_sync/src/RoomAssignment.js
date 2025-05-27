import React, { useEffect, useState } from "react";
import { useSupabase } from "./SupabaseProvider";
import Notification from "./Notification";

// PUBLIC_INTERFACE
/**
 * RoomAssignment
 * Assign courses/sessions to rooms, enforcing:
 *   - No double-booking for same time slot (room)
 *   - Room is suitable for course (capacity, optionally type)
 *   - Course/session/day/time assignment model (simple for now)
 * Uses Supabase for live database sync.
 */
function RoomAssignment() {
  const supabase = useSupabase();
  // Basic form fields
  const [courses, setCourses] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [assignments, setAssignments] = useState([]);

  // Assignment form
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedRoomId, setSelectedRoomId] = useState("");
  const [day, setDay] = useState("Monday");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");

  const [feedback, setFeedback] = useState(null);
  const [loading, setLoading] = useState(false);

  // Load data
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  async function fetchAll() {
    setLoading(true);
    setFeedback(null);
    try {
      const [crs, rms, asn] = await Promise.all([
        supabase.from("courses").select("*"),
        supabase.from("rooms").select("*"),
        supabase.from("room_assignments").select("*")
      ]);
      if (crs.error) throw new Error("Courses fetch error: " + crs.error.message);
      if (rms.error) throw new Error("Rooms fetch error: " + rms.error.message);
      if (asn.error) throw new Error("Assignments fetch error: " + asn.error.message);
      setCourses(crs.data || []);
      setRooms(rms.data || []);
      setAssignments(asn.data || []);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
    setLoading(false);
  }

  // Utilities
  function getRoomById(id) {
    return rooms.find((r) => String(r.id) === String(id));
  }
  function getCourseById(id) {
    return courses.find((c) => String(c.id) === String(id));
  }

  // Check for double-booking
  function isRoomDoubleBooked(roomId, day, start, end) {
    // Check if any assignment overlaps with this new assignment in the same room
    return assignments.some(
      (a) =>
        String(a.room_id) === String(roomId) &&
        a.day === day &&
        (
          // Overlap: startA < endB && endA > startB
          a.start_time < end && a.end_time > start
        )
    );
  }
  // Handler for assignment submit
  async function handleAssign(e) {
    e.preventDefault();
    if (!selectedCourseId || !selectedRoomId || !day || !startTime || !endTime) {
      setFeedback({ type: "error", message: "All fields are required." });
      return;
    }
    if (endTime <= startTime) {
      setFeedback({ type: "error", message: "End time must be after start time." });
      return;
    }
    const course = getCourseById(selectedCourseId);
    const room = getRoomById(selectedRoomId);

    // Suitability: capacity (could extend to type/features)
    if (room && course) {
      if (Number(room.capacity) < 1) {
        setFeedback({ type: "error", message: "Room capacity not defined." });
        return;
      }
      // If course has capacity requirement (future), else just room capacity
      // For now, warn only if capacity < 20 students (or as needed)
      // Optional: type suitability, e.g., "Lab", "Classroom"
    }

    // Double-booking
    if (isRoomDoubleBooked(room.id, day, startTime, endTime)) {
      setFeedback({
        type: "error",
        message: "Room is already booked for that slot. Please adjust time or choose another room."
      });
      return;
    }

    setLoading(true);
    const { error } = await supabase.from("room_assignments").insert([{
      course_id: Number(selectedCourseId),
      room_id: Number(selectedRoomId),
      day,
      start_time: startTime,
      end_time: endTime,
    }]);
    setLoading(false);

    if (error) {
      setFeedback({ type: "error", message: "Assignment failed: " + error.message });
    } else {
      setFeedback({ type: "success", message: "Room assigned successfully!" });
      setSelectedCourseId("");
      setSelectedRoomId("");
      setDay("Monday");
      setStartTime("09:00");
      setEndTime("10:00");
      fetchAll();
    }
  }

  // Handler to remove assignment
  async function handleDeleteAssignment(id) {
    if (!window.confirm("Remove this room assignment?")) return;
    setLoading(true);
    const { error } = await supabase.from("room_assignments").delete().eq("id", id);
    setLoading(false);
    if (error) setFeedback({ type: "error", message: "Delete failed: " + error.message });
    else {
      setFeedback({ type: "success", message: "Assignment removed." });
      fetchAll();
    }
  }

  return (
    <div style={{ marginTop: 40 }}>
      <h2 style={{ marginTop: 0 }}>Assign Course Sessions to Rooms</h2>
      <ul style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
        <li>
          <b>Double-booking is prevented.</b> Cannot assign room for overlapping slots.
        </li>
        <li>
          <b>Room suitability:</b> Validate capacity (and optionally type) before assignment.
        </li>
      </ul>
      {feedback && (
        <Notification type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        {/* Assignment form */}
        <form
          onSubmit={handleAssign}
          style={{
            padding: 18,
            background: "#fafbfa",
            border: "1px solid var(--border-color)",
            borderRadius: 7,
            minWidth: 300,
            flex: "0 0 340px"
          }}
        >
          <h4 style={{ marginTop: 0 }}>Assign Session</h4>
          <label>
            <b>Course:</b>
            <select
              value={selectedCourseId}
              onChange={e => setSelectedCourseId(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">Select course</option>
              {courses.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.code})
                </option>
              ))}
            </select>
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <b>Room:</b>
            <select
              value={selectedRoomId}
              onChange={e => setSelectedRoomId(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">Select room</option>
              {rooms.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name} — {r.type}, Capacity: {r.capacity}
                </option>
              ))}
            </select>
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <b>Day:</b>
            <select
              value={day}
              onChange={e => setDay(e.target.value)}
              style={inputStyle}
              required
            >
              {["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((d) => (
                <option value={d} key={d}>{d}</option>
              ))}
            </select>
          </label>
          <div style={{ marginTop: 12 }}>
            <label>
              <b>Start:</b>
              <input
                type="time"
                value={startTime}
                onChange={e => setStartTime(e.target.value)}
                style={{ ...inputStyle, maxWidth: 140, marginBottom: 0 }}
                required
              />
            </label>
            <span style={{ margin: "0 8px", fontWeight: 500 }}>to</span>
            <label>
              <b>End:</b>
              <input
                type="time"
                value={endTime}
                onChange={e => setEndTime(e.target.value)}
                style={{ ...inputStyle, maxWidth: 140, marginBottom: 0 }}
                required
              />
            </label>
          </div>
          {getRoomById(selectedRoomId) && getCourseById(selectedCourseId) && (
            Number(getRoomById(selectedRoomId).capacity) < 20 && (
              <div style={{ color: "var(--notification-error)", fontSize: "0.97em", marginTop: 6, fontWeight: 600 }}>
                Room has low capacity for a class. Please double-check suitability.
              </div>
            )
          )}
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            Assign Room
          </button>
        </form>
        <div style={{ flex: "2 1 500px" }}>
          <h4 style={{ marginTop: 0 }}>Current Room Assignments</h4>
          {loading ? (
            <div>Loading…</div>
          ) : assignments.length === 0 ? (
            <div style={{ color: "#888", marginTop: 14 }}>No room assignments found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", background: "#fff" }}>
              <thead>
                <tr style={{ background: "var(--border-color)" }}>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Room</th>
                  <th style={thStyle}>Day</th>
                  <th style={thStyle}>Start</th>
                  <th style={thStyle}>End</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    style={{ borderBottom: "1px solid var(--border-color)" }}
                  >
                    <td style={tdStyle}>{getCourseById(a.course_id)?.name || "(unknown)"}</td>
                    <td style={tdStyle}>{getRoomById(a.room_id)?.name || "(unknown)"}</td>
                    <td style={tdStyle}>{a.day}</td>
                    <td style={tdStyle}>{a.start_time}</td>
                    <td style={tdStyle}>{a.end_time}</td>
                    <td style={tdStyle}>
                      <button
                        className="btn"
                        style={{
                          background: "var(--notification-error)",
                          color: "#fff",
                          fontSize: 14,
                          padding: "5px 12px"
                        }}
                        onClick={() => handleDeleteAssignment(a.id)}
                        aria-label="Remove room assignment"
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

const inputStyle = {
  width: "100%",
  padding: "8px 10px",
  border: "1px solid var(--border-color)",
  borderRadius: 4,
  marginTop: 4,
  fontSize: "1rem",
  background: "#fff",
  marginBottom: 2
};

const thStyle = {
  padding: 8, textAlign: "left"
};
const tdStyle = {
  padding: 8,
};

export default RoomAssignment;
