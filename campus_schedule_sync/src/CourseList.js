import React, { useEffect, useState } from "react";
import CourseForm from "./CourseForm";
import CourseBulkImportExport from "./CourseBulkImportExport";
import { useSupabase } from "./SupabaseProvider";

/**
 * PUBLIC_INTERFACE
 * CourseList displays all courses in a table and supports CRUD and bulk operations.
 */
function CourseList() {
  const supabase = useSupabase();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null); // course object or null
  const [showForm, setShowForm] = useState(false);

  // Fetch courses from Supabase
  const fetchCourses = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase.from("courses").select("*").order("id", { ascending: true });
    setLoading(false);
    if (error) {
      setError("Failed to fetch courses: " + error.message);
    } else {
      setCourses(data || []);
    }
  };

  useEffect(() => {
    fetchCourses();
    // eslint-disable-next-line
  }, []);

  // Handle add/edit
  const handleSave = async (course) => {
    setLoading(true);
    setError("");
    let response;
    if (course.id) {
      response = await supabase.from("courses").update(course).eq("id", course.id).select();
    } else {
      response = await supabase.from("courses").insert([course]).select();
    }
    setLoading(false);
    if (response.error) {
      setError("Save failed: " + response.error.message);
      return false;
    }
    setShowForm(false);
    setEditing(null);
    fetchCourses();
    return true;
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this course?")) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.from("courses").delete().eq("id", id);
    setLoading(false);
    if (error) {
      setError("Delete failed: " + error.message);
    } else {
      fetchCourses();
    }
  };

  // Handle bulk import
  const handleBulkImport = async (coursesImported) => {
    setLoading(true);
    setError("");
    const { error } = await supabase.from("courses").insert(coursesImported);
    setLoading(false);
    if (error) {
      setError("Bulk import failed: " + error.message);
    } else {
      fetchCourses();
    }
  };

  return (
    <div>
      <h2 className="title" style={{ marginTop: 0, marginBottom: 22 }}>Courses</h2>
      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: 10 }}>
        <button className="btn" onClick={() => { setEditing(null); setShowForm(true); }}>
          + Add Course
        </button>
        <CourseBulkImportExport
          courses={courses}
          onImport={handleBulkImport}
        />
      </div>
      {error && (
        <div className="notification error" style={{ margin: "18px 0" }}>
          {error}
        </div>
      )}
      {showForm && (
        <CourseForm
          course={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      <div style={{ marginTop: 28 }}>
        {loading ? (
          <div>Loading…</div>
        ) : courses.length === 0 ? (
          <div>No courses found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ background: "var(--border-color)" }}>
                <th style={{ padding: 8, textAlign: "left" }}>ID</th>
                <th style={{ padding: 8, textAlign: "left" }}>Course Name</th>
                <th style={{ padding: 8, textAlign: "left" }}>Code</th>
                <th style={{ padding: 8, textAlign: "left" }}>Department</th>
                <th style={{ padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {courses.map((c) => (
                <tr key={c.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: 8 }}>{c.id}</td>
                  <td style={{ padding: 8 }}>{c.name}</td>
                  <td style={{ padding: 8 }}>{c.code}</td>
                  <td style={{ padding: 8 }}>{c.department}</td>
                  <td style={{ padding: 8, minWidth: 90 }}>
                    <button
                      className="btn"
                      style={{ fontSize: "0.9em", marginRight: 6 }}
                      onClick={() => { setEditing(c); setShowForm(true); }}
                      aria-label={`Edit ${c.name}`}
                    >
                      Edit
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: "0.9em", background: "var(--notification-error)", color: "#fff" }}
                      onClick={() => handleDelete(c.id)}
                      aria-label={`Delete ${c.name}`}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default CourseList;
