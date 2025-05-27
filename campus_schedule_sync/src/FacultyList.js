import React, { useEffect, useState } from "react";
import FacultyForm from "./FacultyForm";
import FacultyBulkImportExport from "./FacultyBulkImportExport";
import { useSupabase } from "./SupabaseProvider";

/**
 * PUBLIC_INTERFACE
 * FacultyList displays all faculty and supports CRUD and bulk operations.
 * Strictly: No faculty can have more than 12 classes/week; UI enforces and provides robust feedback.
 */
function FacultyList() {
  const supabase = useSupabase();
  const [faculty, setFaculty] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch data from Supabase 'faculty' table
  const fetchFaculty = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("faculty")
      .select("*")
      .order("id", { ascending: true });
    setLoading(false);
    if (error) setError("Failed to fetch faculty: " + error.message);
    else setFaculty(data || []);
  };

  useEffect(() => {
    fetchFaculty();
    // eslint-disable-next-line
  }, []);

  // Save new/edit faculty
  const handleSave = async (facultyObj) => {
    setLoading(true);
    setError("");
    let response;
    // Enforce max 12 classes/week
    if (Number(facultyObj.classes_per_week || 0) > 12) {
      setLoading(false);
      setError("A faculty member cannot be assigned more than 12 classes per week.");
      return false;
    }
    if (facultyObj.id) {
      response = await supabase
        .from("faculty")
        .update(facultyObj)
        .eq("id", facultyObj.id)
        .select();
    } else {
      response = await supabase
        .from("faculty")
        .insert([facultyObj])
        .select();
    }
    setLoading(false);
    if (response.error) {
      setError("Save failed: " + response.error.message);
      return false;
    }
    setShowForm(false);
    setEditing(null);
    fetchFaculty();
    return true;
  };

  // Delete faculty member
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this faculty member?")) return;
    setLoading(true);
    setError("");
    const { error } = await supabase
      .from("faculty")
      .delete()
      .eq("id", id);
    setLoading(false);
    if (error) setError("Delete failed: " + error.message);
    else fetchFaculty();
  };

  // Handle bulk import
  const handleBulkImport = async (facultyImported) => {
    // Validate constraint for all
    const violating = facultyImported.find(
      f => Number(f.classes_per_week || 0) > 12
    );
    if (violating) {
      setError(
        `Faculty "${violating.name}" exceeds 12 classes/week. Please fix and re-import.`
      );
      return;
    }
    setLoading(true);
    setError("");
    const { error } = await supabase.from("faculty").insert(facultyImported);
    setLoading(false);
    if (error) setError("Bulk import failed: " + error.message);
    else fetchFaculty();
  };

  return (
    <div>
      <h2 className="title" style={{ marginTop: 0, marginBottom: 22 }}>Faculty</h2>
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: 10
      }}>
        <button
          className="btn"
          onClick={() => { setEditing(null); setShowForm(true); }}
        >
          + Add Faculty
        </button>
        <FacultyBulkImportExport
          faculty={faculty}
          onImport={handleBulkImport}
        />
      </div>
      {error && (
        <div className="notification error" style={{ margin: "18px 0" }}>
          {error}
        </div>
      )}
      {showForm && (
        <FacultyForm
          faculty={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      <div style={{ marginTop: 28 }}>
        {loading ? (
          <div>Loading…</div>
        ) : faculty.length === 0 ? (
          <div>No faculty found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ background: "var(--border-color)" }}>
                <th style={{ padding: 8, textAlign: "left" }}>ID</th>
                <th style={{ padding: 8, textAlign: "left" }}>Name</th>
                <th style={{ padding: 8, textAlign: "left" }}>Email</th>
                <th style={{ padding: 8, textAlign: "left" }}>Department</th>
                <th style={{ padding: 8, textAlign: "left" }}>Classes/Week</th>
                <th style={{ padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {faculty.map(f => (
                <tr key={f.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: 8 }}>{f.id}</td>
                  <td style={{ padding: 8 }}>{f.name}</td>
                  <td style={{ padding: 8 }}>{f.email}</td>
                  <td style={{ padding: 8 }}>{f.department}</td>
                  <td style={{
                    padding: 8,
                    color: Number(f.classes_per_week) > 12 ? "var(--notification-error)" : undefined,
                    fontWeight: Number(f.classes_per_week) > 12 ? 700 : 400
                  }}>
                    {f.classes_per_week}
                  </td>
                  <td style={{ padding: 8, minWidth: 90 }}>
                    <button
                      className="btn"
                      style={{ fontSize: "0.9em", marginRight: 6 }}
                      onClick={() => { setEditing(f); setShowForm(true); }}
                      aria-label={`Edit ${f.name}`}
                    >
                      Edit
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: "0.9em", background: "var(--notification-error)", color: "#fff" }}
                      onClick={() => handleDelete(f.id)}
                      aria-label={`Delete ${f.name}`}
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

export default FacultyList;
