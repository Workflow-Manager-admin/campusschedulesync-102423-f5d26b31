import React, { useEffect, useState } from "react";
import RoomForm from "./RoomForm";
import RoomBulkImportExport from "./RoomBulkImportExport";
import { useSupabase } from "./SupabaseProvider";

/**
 * PUBLIC_INTERFACE
 * RoomList displays all rooms/resources and supports CRUD and bulk operations.
 */
function RoomList() {
  const supabase = useSupabase();
  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState(null);
  const [showForm, setShowForm] = useState(false);

  // Fetch rooms/resources from Supabase
  const fetchRooms = async () => {
    setLoading(true);
    setError("");
    const { data, error } = await supabase
      .from("rooms")
      .select("*")
      .order("id", { ascending: true });
    setLoading(false);
    if (error) setError("Failed to fetch rooms: " + error.message);
    else setRooms(data || []);
  };

  useEffect(() => {
    fetchRooms();
    // eslint-disable-next-line
  }, []);

  // Save new or edited room/resource
  const handleSave = async (roomObj) => {
    setLoading(true);
    setError("");
    let response;
    if (roomObj.id) {
      response = await supabase
        .from("rooms")
        .update(roomObj)
        .eq("id", roomObj.id)
        .select();
    } else {
      response = await supabase.from("rooms").insert([roomObj]).select();
    }
    setLoading(false);
    if (response.error) {
      setError("Save failed: " + response.error.message);
      return false;
    }
    setShowForm(false);
    setEditing(null);
    fetchRooms();
    return true;
  };

  // Delete room/resource
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this room/resource?")) return;
    setLoading(true);
    setError("");
    const { error } = await supabase.from("rooms").delete().eq("id", id);
    setLoading(false);
    if (error) setError("Delete failed: " + error.message);
    else fetchRooms();
  };

  // Handle bulk import
  const handleBulkImport = async (roomsImported) => {
    setLoading(true);
    setError("");
    const { error } = await supabase.from("rooms").insert(roomsImported);
    setLoading(false);
    if (error) setError("Bulk import failed: " + error.message);
    else fetchRooms();
  };

  return (
    <div>
      <h2 className="title" style={{ marginTop: 0, marginBottom: 22 }}>Rooms/Resources</h2>
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
          + Add Room/Resource
        </button>
        <RoomBulkImportExport
          rooms={rooms}
          onImport={handleBulkImport}
        />
      </div>
      {error && (
        <div className="notification error" style={{ margin: "18px 0" }}>
          {error}
        </div>
      )}
      {showForm && (
        <RoomForm
          room={editing}
          onSave={handleSave}
          onCancel={() => { setShowForm(false); setEditing(null); }}
        />
      )}
      <div style={{ marginTop: 28 }}>
        {loading ? (
          <div>Loading…</div>
        ) : rooms.length === 0 ? (
          <div>No rooms/resources found.</div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: 20 }}>
            <thead>
              <tr style={{ background: "var(--border-color)" }}>
                <th style={{ padding: 8, textAlign: "left" }}>ID</th>
                <th style={{ padding: 8, textAlign: "left" }}>Room/Resource Name</th>
                <th style={{ padding: 8, textAlign: "left" }}>Type</th>
                <th style={{ padding: 8, textAlign: "left" }}>Capacity</th>
                <th style={{ padding: 8, textAlign: "left" }}>Location</th>
                <th style={{ padding: 8 }} />
              </tr>
            </thead>
            <tbody>
              {rooms.map((r) => (
                <tr key={r.id} style={{ borderBottom: "1px solid var(--border-color)" }}>
                  <td style={{ padding: 8 }}>{r.id}</td>
                  <td style={{ padding: 8 }}>{r.name}</td>
                  <td style={{ padding: 8 }}>{r.type}</td>
                  <td style={{ padding: 8 }}>{r.capacity}</td>
                  <td style={{ padding: 8 }}>{r.location}</td>
                  <td style={{ padding: 8, minWidth: 90 }}>
                    <button
                      className="btn"
                      style={{ fontSize: "0.9em", marginRight: 6 }}
                      onClick={() => { setEditing(r); setShowForm(true); }}
                      aria-label={`Edit ${r.name}`}
                    >
                      Edit
                    </button>
                    <button
                      className="btn"
                      style={{ fontSize: "0.9em", background: "var(--notification-error)", color: "#fff" }}
                      onClick={() => handleDelete(r.id)}
                      aria-label={`Delete ${r.name}`}
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

export default RoomList;
