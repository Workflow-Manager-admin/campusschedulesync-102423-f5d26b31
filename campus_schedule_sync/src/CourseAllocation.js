import React, { useEffect, useState } from "react";
import { useSupabase } from "./SupabaseProvider";
import Notification from "./Notification";

// PUBLIC_INTERFACE
/**
 * CourseAllocation:
 * Assign courses to faculty, enforcing a maximum limit of 12 classes per week per faculty.
 * Live feedback UI for edge cases (violating max/week), current allocations listing, and integration with Supabase data.
 * - Connects to 'courses', 'faculty', and 'allocations' tables via Supabase.
 */
function CourseAllocation() {
  const supabase = useSupabase();

  // Data state
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [allocations, setAllocations] = useState([]);

  // Form state
  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedFacultyId, setSelectedFacultyId] = useState("");
  const [classesPerWeek, setClassesPerWeek] = useState(1);

  // UI/feedback state
  const [feedback, setFeedback] = useState(null); // {type,message}
  const [loading, setLoading] = useState(false);

  // Fetch data
  useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  async function fetchAll() {
    setLoading(true);
    setFeedback(null);
    try {
      const [c, f, a] = await Promise.all([
        supabase.from("courses").select("*"),
        supabase.from("faculty").select("*"),
        supabase.from("allocations").select("*"),
      ]);
      if (c.error) throw new Error("Failed to fetch courses: " + c.error.message);
      if (f.error) throw new Error("Failed to fetch faculty: " + f.error.message);
      if (a.error) throw new Error("Failed to fetch allocations: " + a.error.message);
      setCourses(c.data || []);
      setFaculty(f.data || []);
      setAllocations(a.data || []);
    } catch (err) {
      setFeedback({ type: "error", message: err.message });
    }
    setLoading(false);
  }

  function getFacultyName(faculty_id) {
    const fac = faculty.find((f) => f.id === faculty_id);
    return fac ? fac.name : "(unknown)";
  }
  function getCourseName(course_id) {
    const c = courses.find((c) => c.id === course_id);
    return c ? c.name : "(unknown)";
  }

  // Count all assigned weekly classes per faculty (summed from allocations)
  function calculateClassesPerFaculty() {
    const map = {};
    allocations.forEach((a) => {
      const fid = a.faculty_id;
      const count = Number(a.classes_per_week) || 0;
      map[fid] = (map[fid] || 0) + count;
    });
    return map;
  }
  const facultyClassCounts = calculateClassesPerFaculty();


  // Handler for allocation submit
  async function handleAllocate(e) {
    e.preventDefault();

    // Validation
    const courseId = Number(selectedCourseId);
    const facultyId = Number(selectedFacultyId);
    const nClasses = Number(classesPerWeek);

    if (!courseId || !facultyId || !nClasses) {
      setFeedback({ type: "error", message: "Please select a course, faculty, and number of classes per week." });
      return;
    }
    if (nClasses < 1 || nClasses > 12) {
      setFeedback({ type: "error", message: "Each allocation must be 1-12 classes/week." });
      return;
    }

    // Check if faculty already has allocation for this course
    const existing = allocations.find(
      (a) => a.course_id === courseId && a.faculty_id === facultyId
    );
    if (existing) {
      setFeedback({ type: "error", message: "This faculty is already allocated to this course." });
      return;
    }

    // Will this assignment push faculty over 12 per week?
    const current = facultyClassCounts[facultyId] || 0;
    if (current + nClasses > 12) {
      setFeedback({
        type: "error",
        message: `This allocation would exceed 12 classes/week for ${getFacultyName(facultyId)} (current: ${current}).`,
      });
      return;
    }

    setLoading(true);
    // Write allocation to Supabase
    const { error } = await supabase
      .from("allocations")
      .insert([{ course_id: courseId, faculty_id: facultyId, classes_per_week: nClasses }]);
    setLoading(false);

    if (error) {
      setFeedback({ type: "error", message: "Allocation failed: " + error.message });
    } else {
      setFeedback({ type: "success", message: "Allocation successful!" });
      // Clear form
      setSelectedCourseId("");
      setSelectedFacultyId("");
      setClassesPerWeek(1);
      // Refresh allocations list
      fetchAll();
    }
  }

  // Handler for deallocating an assignment
  async function handleDeleteAllocation(allocationId) {
    if (!window.confirm("Remove this course-to-faculty allocation?")) return;
    setLoading(true);
    const { error } = await supabase
      .from("allocations")
      .delete()
      .eq("id", allocationId);
    setLoading(false);
    if (error) {
      setFeedback({ type: "error", message: "Failed to remove allocation: " + error.message });
    } else {
      setFeedback({ type: "success", message: "Allocation removed." });
      fetchAll();
    }
  }

  return (
    <div>
      <h2 style={{ marginTop: 0, marginBottom: 12 }}>Assign Courses to Faculty</h2>
      <ul style={{ color: "var(--text-secondary)", marginBottom: 20 }}>
        <li>
          <b>Faculty max classes/week:</b> <span style={{ color: "var(--notification-error)", fontWeight: 600 }}>12</span>
        </li>
        <li>
          Allocations are summed per faculty. Prevents exceeding 12/week total (across all courses).
        </li>
      </ul>
      {feedback && (
        <Notification type={feedback.type} message={feedback.message} onClose={() => setFeedback(null)} />
      )}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 24, alignItems: "flex-start" }}>
        {/* New allocation form */}
        <form
          onSubmit={handleAllocate}
          style={{
            padding: 18,
            background: "#fafbfa",
            border: "1px solid var(--border-color)",
            borderRadius: 7,
            minWidth: 300,
            flex: "0 0 340px",
          }}
        >
          <h4 style={{ marginTop: 0 }}>Allocate Course</h4>
          <label>
            <b>Course:</b>
            <select
              value={selectedCourseId}
              onChange={(e) => setSelectedCourseId(e.target.value)}
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
            <b>Faculty:</b>
            <select
              value={selectedFacultyId}
              onChange={e => setSelectedFacultyId(e.target.value)}
              style={inputStyle}
              required
            >
              <option value="">Select faculty</option>
              {faculty.map((f) => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.email}) — Assigned: {facultyClassCounts[f.id] || 0} / 12 classes
                </option>
              ))}
            </select>
          </label>
          <label style={{ marginTop: 14, display: "block" }}>
            <b>Classes per week:</b>
            <input
              type="number"
              value={classesPerWeek}
              min={1}
              max={12}
              onChange={e => setClassesPerWeek(e.target.value)}
              style={{
                ...inputStyle,
                borderColor:
                  Number(classesPerWeek) > 12
                    ? "var(--notification-error)"
                    : "var(--border-color)",
                color:
                  Number(classesPerWeek) > 12
                    ? "var(--notification-error)"
                    : "#222",
              }}
              required
            />
            {Number(classesPerWeek) > 12 && (
              <div style={{ color: "var(--notification-error)", fontSize: 13, fontWeight: 600 }}>
                Cannot assign more than 12 classes/week!
              </div>
            )}
          </label>
          <button
            className="btn"
            type="submit"
            disabled={loading}
            style={{ marginTop: 18 }}
          >
            Allocate
          </button>
        </form>
        {/* Allocations List */}
        <div style={{ flex: "2 1 500px" }}>
          <h4 style={{ marginTop: 0 }}>Current Allocations</h4>
          {loading ? (
            <div>Loading…</div>
          ) : allocations.length === 0 ? (
            <div style={{ color: "#888", marginTop: 14 }}>No assignments found.</div>
          ) : (
            <table
              style={{
                width: "100%",
                borderCollapse: "collapse",
                background: "#fff",
              }}
            >
              <thead>
                <tr style={{ background: "var(--border-color)" }}>
                  <th style={thStyle}>Course</th>
                  <th style={thStyle}>Faculty</th>
                  <th style={thStyle}>Classes/Week</th>
                  <th style={thStyle}></th>
                </tr>
              </thead>
              <tbody>
                {allocations.map((a) => (
                  <tr key={a.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                    <td style={tdStyle}>{getCourseName(a.course_id)}</td>
                    <td style={tdStyle}>{getFacultyName(a.faculty_id)}</td>
                    <td style={tdStyle}>{a.classes_per_week}</td>
                    <td style={tdStyle}>
                      <button
                        className="btn"
                        style={{
                          background: "var(--notification-error)",
                          color: "#fff",
                          fontSize: 14,
                          padding: "5px 12px"
                        }}
                        onClick={() => handleDeleteAllocation(a.id)}
                        aria-label="Remove allocation"
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
  marginBottom: 2,
};

const thStyle = {
  padding: 8, textAlign: "left"
};
const tdStyle = {
  padding: 8,
};

export default CourseAllocation;
