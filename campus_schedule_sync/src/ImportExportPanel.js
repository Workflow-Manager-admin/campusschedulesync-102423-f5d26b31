import React, { useState, useRef } from "react";
import CourseBulkImportExport from "./CourseBulkImportExport";
import FacultyBulkImportExport from "./FacultyBulkImportExport";
import RoomBulkImportExport from "./RoomBulkImportExport";
import TimetableGrid from "./TimetableGrid";
import { useSupabase } from "./SupabaseProvider";
import Notification from "./Notification";
import {
  parseCSV,
  triggerCSVDownload,
  triggerExcelDownload,
  triggerImageExport,
  readSpreadsheetFile
} from "./utils";

/**
 * PUBLIC_INTERFACE
 * ImportExportPanel — Unified UI for importing/exporting Courses, Faculty, Rooms, and Timetable.
 * - Download blank templates for each type
 * - Export all table data (CSV/Excel)
 * - Export timetable grid as image (PNG)
 * - Import preview for all (CSV bulk upload)
 * - Validation/feedback for bulk upload batches
 */
function ImportExportPanel() {
  const supabase = useSupabase();

  // Data states for Courses, Faculty, Rooms, Timetable
  const [courses, setCourses] = useState([]);
  const [faculty, setFaculty] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [timetable, setTimetable] = useState([]);
  const [loading, setLoading] = useState(false);

  // Import preview and result state for all tables
  const [importFeedback, setImportFeedback] = useState(null); // {type,message}
  const [importPreview, setImportPreview] = useState(null); // for showing mapped/parsing preview

  // Timetable export as image: ref to grid DOM node
  const timetableRef = useRef(null);

  // Initial fetch of all tables
  React.useEffect(() => {
    fetchAll();
    // eslint-disable-next-line
  }, []);

  async function fetchAll() {
    setLoading(true);
    setImportFeedback(null);
    try {
      const [c, f, r, t] = await Promise.all([
        supabase.from("courses").select("*"),
        supabase.from("faculty").select("*"),
        supabase.from("rooms").select("*"),
        supabase.from("timetable_entries").select("*"),
      ]);
      if (c.error) throw new Error("Courses fetch error: " + c.error.message);
      if (f.error) throw new Error("Faculty fetch error: " + f.error.message);
      if (r.error) throw new Error("Rooms fetch error: " + r.error.message);
      if (t.error) throw new Error("Timetable fetch error: " + t.error.message);
      setCourses(c.data ?? []);
      setFaculty(f.data ?? []);
      setRooms(r.data ?? []);
      setTimetable(t.data ?? []);
    } catch (err) {
      setImportFeedback({ type: "error", message: "Failed to fetch all data: " + err.message });
    }
    setLoading(false);
  }

  // Centralized bulk import commit handler
  async function handleBulkImport(type, items) {
    setLoading(true);
    setImportFeedback(null);
    setImportPreview(null);
    let result;
    try {
      if (type === "courses") {
        // Insert courses
        const { error } = await supabase.from("courses").insert(items);
        if (error) throw new Error(error.message);
        setImportFeedback({ type: "success", message: `Imported ${items.length} courses.` });
      } else if (type === "faculty") {
        const viol = items.find(f => Number(f.classes_per_week) > 12);
        if (viol) throw new Error(`Faculty ${viol.name} exceeds 12 classes/week.`);
        const { error } = await supabase.from("faculty").insert(items);
        if (error) throw new Error(error.message);
        setImportFeedback({ type: "success", message: `Imported ${items.length} faculty.` });
      } else if (type === "rooms") {
        const { error } = await supabase.from("rooms").insert(items);
        if (error) throw new Error(error.message);
        setImportFeedback({ type: "success", message: `Imported ${items.length} rooms.` });
      } else if (type === "timetable") {
        // Update to use timetable_entries fields for validation/insertion
        const invalid = items.filter(e => (
          !e.course_id || !e.faculty_id || !e.room_id || !e.day_of_week || !e.start_time
        ));
        if (invalid.length > 0) throw new Error("Some rows in the CSV were incomplete.");
        // Only insert the valid columns
        const records = items.map(e => ({
          course_id: +e.course_id,
          faculty_id: +e.faculty_id,
          room_id: +e.room_id,
          day_of_week: e.day_of_week,
          start_time: e.start_time,
        }));
        const { error } = await supabase.from("timetable_entries").insert(records);
        if (error) throw new Error(error.message);
        setImportFeedback({ type: "success", message: `Imported ${items.length} timetable sessions.` });
      }
      fetchAll();
    } catch (err) {
      setImportFeedback({ type: "error", message: err.message });
    }
    setLoading(false);
  }

  // ------------------- Timetable Export as CSV/Excel/Image  -------------------------
  function handleTimetableExportCSV() {
    // Export timetable as CSV (flat, not grid format)
    const headers = ["course_id", "faculty_id", "room_id", "day_of_week", "start_time"];
    const csv = [headers.join(","),
      ...timetable.map(e =>
        headers.map(h => `"${e[h] ?? ""}"`).join(",")
      ),
    ].join("\r\n");
    triggerCSVDownload(csv, "Timetable_Export.csv");
  }

  // Export grid view as image using utils (html2canvas)
  async function handleTimetableExportImage() {
    if (timetableRef.current) {
      try {
        await triggerImageExport(timetableRef.current, "TimetableGrid.png");
      } catch (err) {
        setImportFeedback({ type: "error", message: "Export as image failed: " + err.message });
      }
    } else {
      setImportFeedback({ type: "error", message: "Timetable grid not found." });
    }
  }

  async function loadHtml2Canvas() {
    return new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
      script.onload = resolve;
      script.onerror = reject;
      document.body.appendChild(script);
    });
  }

  // ----------------- Bulk Import for Timetable Sessions ----------------------------
  // Template for timetable import
  const TIMETABLE_TEMPLATE_HEADER = [
    "course_id", "faculty_id", "room_id", "day", "start_time", "end_time"
  ];
  const TIMETABLE_TEMPLATE_SAMPLE = [
    // Example rows
    ["1", "7", "2", "Monday", "09:00", "10:00"],
    ["2", "8", "3", "Wednesday", "12:00", "13:00"]
  ];

  function handleTimetableDownloadTemplate() {
    const csv = [
      TIMETABLE_TEMPLATE_HEADER.join(","),
      ...TIMETABLE_TEMPLATE_SAMPLE.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\r\n");
    triggerCSVDownload(csv, "Timetable_Template.csv");
  }

  function handleTimetableFileImport(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    readSpreadsheetFile(file, (rows, meta) => {
      try {
        if (!rows || !rows.length || rows[0].length < 6)
          throw new Error("Invalid header/columns.");
        const header = rows[0].map(h => h.trim().toLowerCase());
        if (header.slice(0, 6).join(",") !== TIMETABLE_TEMPLATE_HEADER.join(",").toLowerCase()) {
          throw new Error(`Header must be: ${TIMETABLE_TEMPLATE_HEADER.join(", ")}`);
        }
        const mapped = rows
          .slice(1)
          .filter(r => r.some(cell => cell && cell.trim()))
          .map(r => ({
            course_id: r[0]?.trim(),
            faculty_id: r[1]?.trim(),
            room_id: r[2]?.trim(),
            day: r[3]?.trim(),
            start_time: r[4]?.trim(),
            end_time: r[5]?.trim(),
          }));
        if (mapped.length === 0) throw new Error("No valid data rows.");
        setImportPreview({ type: "timetable", items: mapped });
        setImportFeedback({ type: "info", message: `Preview loaded: ${mapped.length} sessions. Confirm to commit.` });
      } catch (err) {
        setImportFeedback({ type: "error", message: err.message });
      }
    }, true);
  }

  function handleConfirmTimetableImport() {
    if (importPreview && importPreview.type === "timetable") {
      handleBulkImport("timetable", importPreview.items);
      setImportPreview(null);
    }
  }

  // Ref for ARIA live status region for accessibility
  const liveRegionPanelRef = React.useRef();

  // ----------------- Render UI Sections ----------------
  return (
    <div>
      <h2 className="title" style={{ marginTop: 0, marginBottom: 16 }}>
        Import / Export Center
      </h2>
      {/* ARIA live region for all status, errors, loads */}
      <div
        ref={liveRegionPanelRef}
        tabIndex={-1}
        aria-live={
          importFeedback?.type === "error"
            ? "assertive"
            : importFeedback?.type === "success"
            ? "polite"
            : loading
              ? "polite"
              : "polite"
        }
        aria-atomic="true"
        style={{
          position: "absolute",
          width: "1px",
          height: "1px",
          left: "-9999px",
          overflow: "hidden"
        }}
      >
        {loading && "Loading or importing..."}
        {importFeedback && importFeedback.message}
        {importPreview &&
          `Preview: ${String(importPreview.items?.length)} items. Press Confirm Import to proceed.`}
      </div>
      <div style={{
        display: "flex", flexDirection: "column", gap: 28
      }}>
        {/* Courses Import/Export */}
        <section style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Courses</h3>
          <CourseBulkImportExport
            courses={courses}
            // Show preview before commit
            onImport={data => {
              setImportPreview({ type: "courses", items: data });
              setImportFeedback({
                type: "info",
                message: `Preview loaded: ${data.length} courses. Confirm to commit.`
              });
              // Move focus to ARIA region for accessible preview notification
              setTimeout(() => {
                if (liveRegionPanelRef.current) liveRegionPanelRef.current.focus();
              }, 150);
            }}
          />
        </section>

        {/* Faculty Import/Export */}
        <section style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Faculty</h3>
          <FacultyBulkImportExport
            faculty={faculty}
            onImport={data => {
              setImportPreview({ type: "faculty", items: data });
              setImportFeedback({
                type: "info",
                message: `Preview loaded: ${data.length} faculty. Confirm to commit.`
              });
              setTimeout(() => {
                if (liveRegionPanelRef.current) liveRegionPanelRef.current.focus();
              }, 150);
            }}
          />
        </section>

        {/* Rooms Import/Export */}
        <section style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Rooms / Resources</h3>
          <RoomBulkImportExport
            rooms={rooms}
            onImport={data => {
              setImportPreview({ type: "rooms", items: data });
              setImportFeedback({
                type: "info",
                message: `Preview loaded: ${data.length} rooms. Confirm to commit.`
              });
              setTimeout(() => {
                if (liveRegionPanelRef.current) liveRegionPanelRef.current.focus();
              }, 150);
            }}
          />
        </section>

        {/* Timetable Import/Export */}
        <section style={sectionBoxStyle}>
          <h3 style={sectionTitleStyle}>Timetable Sessions</h3>
          <div style={{ display: "flex", gap: 10, alignItems: "center", flexWrap: "wrap" }}>
            <button className="btn" onClick={handleTimetableDownloadTemplate}>
              Download Template
            </button>
            <button
              className="btn"
              type="button"
              onClick={handleTimetableExportCSV}
              disabled={timetable.length === 0}
            >
              Export CSV
            </button>
            <button
              className="btn"
              type="button"
              onClick={handleTimetableExportImage}
              disabled={timetable.length === 0}
              title="Export the visual timetable grid as a PNG image"
            >
              Export Grid Image
            </button>
            <input
              type="file"
              accept=".csv,text/csv"
              style={{ display: "none" }}
              id="tt-import-input"
              disabled={loading}
              onChange={handleTimetableFileImport}
              data-testid="tt-import-file"
            />
            <button
              className="btn"
              type="button"
              disabled={loading}
              onClick={() => document.getElementById("tt-import-input")?.click()}
            >
              Import
            </button>
          </div>
        </section>
      </div>

      {/* Preview/commit bar for all tables */}
      {importPreview && (
        <section
          aria-label="Bulk Import Preview"
          style={{
            margin: "30px 0",
            background: "#fffbe8",
            border: "1px solid #fae2c4",
            borderRadius: 6,
            padding: 18,
          }}
        >
          <b>Import Preview:</b> {String(importPreview.items?.length)} items.
          {importPreview.type === "courses" && (
            <button className="btn" style={{ marginLeft: 14 }} disabled={loading}
              onClick={() => { handleBulkImport("courses", importPreview.items); setImportPreview(null); }}
              aria-label="Confirm courses import"
            >
              Confirm Import
            </button>
          )}
          {importPreview.type === "faculty" && (
            <button className="btn" style={{ marginLeft: 14 }} disabled={loading}
              onClick={() => { handleBulkImport("faculty", importPreview.items); setImportPreview(null); }}
              aria-label="Confirm faculty import"
            >
              Confirm Import
            </button>
          )}
          {importPreview.type === "rooms" && (
            <button className="btn" style={{ marginLeft: 14 }} disabled={loading}
              onClick={() => { handleBulkImport("rooms", importPreview.items); setImportPreview(null); }}
              aria-label="Confirm rooms import"
            >
              Confirm Import
            </button>
          )}
          {importPreview.type === "timetable" && (
            <button className="btn" style={{ marginLeft: 14 }} disabled={loading}
              onClick={handleConfirmTimetableImport}
              aria-label="Confirm timetable import"
            >
              Confirm Import
            </button>
          )}
          <button
            className="btn"
            style={{
              marginLeft: 10,
              background: "var(--notification-error)",
              color: "#fff",
              fontWeight: 600,
            }}
            disabled={loading}
            aria-label="Cancel import preview"
            onClick={() => { setImportPreview(null); setImportFeedback(null); }}
          >Cancel</button>
        </section>
      )}

      <div style={{ marginTop: 25, marginLeft: 2 }}>
        {importFeedback && (
          <Notification type={importFeedback.type} message={importFeedback.message} onClose={() => setImportFeedback(null)} />
        )}
      </div>

      {/* Render (hidden) timetable grid for exporting as image */}
      <div style={{ opacity: 0, pointerEvents: "none", position: "absolute", zIndex: -9999 }}>
        <div ref={timetableRef}>
          <TimetableGridExportOnly sessions={timetable} />
        </div>
      </div>

      {loading && (
        <div style={{
          marginTop: 28,
          fontWeight: 500,
          color: "#999"
        }} aria-live="polite">
          Loading or importing...
        </div>
      )}
    </div>
  );
}



// TimetableGridExportOnly: lightweight grid for image export (hidden in UI)
function TimetableGridExportOnly({ sessions }) {
  // Static config as in main grid
  const WEEKDAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const TIME_START = "08:00";
  const TIME_END = "18:00";
  const TIME_INTERVAL_MINS = 60;
  // Build lookup maps for labels
  // Could optionally accept more detail for labels here.

  const timeSlots = React.useMemo(() => {
    const slots = [];
    let [h, m] = TIME_START.split(":").map(Number);
    const [endH, endM] = TIME_END.split(":").map(Number);
    while (h < endH || (h === endH && m < endM)) {
      const nextM = m + TIME_INTERVAL_MINS;
      let nextH = h;
      if (nextM >= 60) {
        nextH = h + Math.floor(nextM / 60);
      }
      const currStr = `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
      const nextStr = `${nextH.toString().padStart(2, "0")}:${(nextM % 60).toString().padStart(2, "0")}`;
      slots.push({ start: currStr, end: nextStr });
      h = nextH;
      m = nextM % 60;
    }
    return slots;
  }, []);
  // Simple filter by cell
  function cellSessions(day, timeStart) {
    return sessions.filter(
      (s) =>
        s.day === day &&
        s.start_time === timeStart
    );
  }
  return (
    <table style={{
      borderCollapse: "collapse",
      minWidth: 900,
      fontSize: 15,
      background: "#fff"
    }}>
      <thead>
        <tr>
          <th style={cellStyleHeader}>Time</th>
          {WEEKDAYS.map((d) => (
            <th style={cellStyleHeader} key={d}>{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {timeSlots.map((slot) => (
          <tr key={slot.start}>
            <td style={cellStyleTime}>{slot.start} - {slot.end}</td>
            {WEEKDAYS.map((day) => {
              const slotSessions = cellSessions(day, slot.start);
              return (
                <td style={cellStyleBody} key={day + slot.start}>
                  {slotSessions.length === 0 ? (
                    ""
                  ) : (
                    slotSessions.map((s, i) =>
                      <div key={i} style={{
                        background: "#b3e5c7", color: "#222", borderRadius: 4,
                        margin: "2px 0", padding: "2px 6px"
                      }}>
                        Course #{s.course_id}<br />
                        Faculty #{s.faculty_id}<br />
                        Room #{s.room_id}<br />
                        {s.start_time} – {s.end_time}
                      </div>
                    )
                  )}
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}

// Style helpers
const sectionBoxStyle = {
  background: "#fafbfa",
  border: "1.2px solid var(--border-color)",
  borderRadius: 10,
  padding: "22px 18px 24px 18px",
  marginBottom: 7,
};
const sectionTitleStyle = {
  marginTop: 0,
  marginBottom: 10,
};

const cellStyleHeader = {
  padding: "7px 4px",
  textAlign: "center",
  background: "#e8f5e9",
  color: "#222",
  fontWeight: 700,
  borderBottom: "2px solid #e8f5e9",
};
const cellStyleTime = {
  padding: "5px 3px",
  background: "#fafafa",
  color: "#444",
  fontWeight: 600,
  minWidth: 70,
  borderRight: "1px solid #edf8ed",
  textAlign: "right",
};
const cellStyleBody = {
  minHeight: 30,
  padding: "4px 3px",
  borderLeft: "1px solid #eeeeee",
  borderBottom: "1px solid #f5f8f5",
  verticalAlign: "top",
  fontSize: "0.97em",
};

export default ImportExportPanel;
