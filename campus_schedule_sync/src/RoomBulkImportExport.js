import React, { useRef, useState } from "react";

/**
 * PUBLIC_INTERFACE
 * RoomBulkImportExport:
 *  - Download template (CSV)
 *  - Export current rooms/resources (CSV)
 *  - Import new rooms/resources in bulk
 *
 * Props:
 *   - rooms: array of room objects
 *   - onImport: async (parsedRoomsArray) => void
 */
function RoomBulkImportExport({ rooms = [], onImport }) {
  const fileInput = useRef(null);

  // Accessibility and feedback state
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const liveRegionRef = useRef(null);

  // Template CSV header/sample rows
  const TEMPLATE_HEADER = [
    "name",
    "type",
    "capacity",
    "location"
  ];
  const TEMPLATE_SAMPLE = [
    ["Physics Lab", "Lab", "30", "Science Building L2"],
    ["Main Auditorium", "Auditorium", "180", "Central Block"],
    ["Room 104", "Classroom", "42", "Main Building 1st Floor"]
  ];

  function handleDownloadTemplate() {
    setFeedback({ type: "info", message: "Room template CSV downloaded." });
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...TEMPLATE_SAMPLE.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\r\n");
    triggerCSVDownload(csv, "Rooms_Template.csv");
  }

  function handleExportRooms() {
    setFeedback({ type: "info", message: "Room records exported." });
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...rooms.map(r =>
        [
          r.name || "",
          r.type || "",
          typeof r.capacity === "number" ? r.capacity : (r.capacity || ""),
          r.location || "",
        ].map(field => `"${field}"`).join(",")
      )
    ].join("\r\n");
    triggerCSVDownload(csv, "Rooms_Export.csv");
  }

  function handleFileChange(e) {
    setFeedback({ type: "", message: "" }); // Clear previous
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        if (!parsed.length || parsed[0].length < 4) {
          setFeedback({ type: "error", message: "Invalid file: requires name, type, capacity, location" });
          fileInput.current.value = "";
          liveRegionRef.current && liveRegionRef.current.focus();
          return;
        }
        const header = parsed[0].map(h => h.trim().toLowerCase());
        if (
          header[0] !== "name" ||
          header[1] !== "type" ||
          header[2] !== "capacity" ||
          header[3] !== "location"
        ) {
          setFeedback({ type: "error", message: "CSV header must be: name, type, capacity, location" });
          fileInput.current.value = "";
          liveRegionRef.current && liveRegionRef.current.focus();
          return;
        }
        const rows = parsed
          .slice(1)
          .filter(r => r.some(field => field && field.trim()));
        const mapped = rows
          .map(r => ({
            name: r[0]?.trim() || "",
            type: r[1]?.trim() || "",
            capacity: Number(r[2]?.trim() || "0"),
            location: r[3]?.trim() || ""
          }))
          .filter(
            rr =>
              rr.name &&
              rr.type &&
              String(rows[0]?.[2] || "").length > 0 &&
              rr.location &&
              rr.capacity > 0
          );
        // Validation: All fields required and capacity positive int
        if (mapped.some(rr => isNaN(Number(rr.capacity)) || Number(rr.capacity) < 1)) {
          setFeedback({ type: "error", message: "All capacities must be positive integers." });
          fileInput.current.value = "";
          liveRegionRef.current && liveRegionRef.current.focus();
          return;
        }
        if (mapped.length === 0) {
          setFeedback({ type: "error", message: "No valid rows in file." });
          fileInput.current.value = "";
          liveRegionRef.current && liveRegionRef.current.focus();
          return;
        }
        if (onImport) {
          setFeedback({ type: "success", message: `Ready to import: ${mapped.length} rooms.` });
          onImport(mapped);
        }
      } catch (err) {
        setFeedback({ type: "error", message: "Could not parse file: " + err.message });
        fileInput.current.value = "";
        liveRegionRef.current && liveRegionRef.current.focus();
      }
    };
    reader.readAsText(file);
  }

  function handleImportButtonKeyDown(e) {
    if (e.key === "Enter" || e.key === " " || e.keyCode === 32 || e.keyCode === 13) {
      fileInput.current?.click();
    } else if (e.key === "Escape" || e.keyCode === 27) {
      setFeedback({ type: "", message: "" });
      fileInput.current.value = "";
    }
  }

  React.useEffect(() => {
    if (feedback.type === "error" || feedback.type === "success") {
      liveRegionRef.current && liveRegionRef.current.focus();
    }
  }, [feedback]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
      <div style={{ display: "flex", gap: 9 }}>
        <button
          className="btn"
          type="button"
          onClick={handleDownloadTemplate}
          aria-label="Download room CSV template"
        >
          Download Template
        </button>
        <button
          className="btn"
          type="button"
          onClick={handleExportRooms}
          disabled={rooms.length === 0}
          aria-label="Export current rooms as CSV"
        >
          Export
        </button>
        <input
          type="file"
          accept=".csv,text/csv"
          ref={fileInput}
          style={{ display: "none" }}
          onChange={handleFileChange}
          tabIndex={-1}
          aria-hidden="true"
          data-testid="bulkimport-file"
        />
        <button
          className="btn"
          type="button"
          onClick={() => fileInput.current?.click()}
          onKeyDown={handleImportButtonKeyDown}
          aria-label="Import rooms from CSV"
        >
          Import
        </button>
      </div>
      <div
        ref={liveRegionRef}
        tabIndex={-1}
        aria-live={feedback.type === "error" ? "assertive" : "polite"}
        aria-atomic="true"
        style={{
          position: "absolute",
          left: "-9999px",
          width: "1px",
          height: "1px",
          overflow: "hidden"
        }}
      >
        {feedback.message}
      </div>
      {feedback.message && (
        <div
          className={`feedback-message ${feedback.type}`}
          role={feedback.type === "error" ? "alert" : "status"}
          aria-live={feedback.type === "error" ? "assertive" : "polite"}
          aria-atomic="true"
          style={{
            marginTop: 6,
            color:
              feedback.type === "error"
                ? "#b00020"
                : feedback.type === "success"
                ? "#215a35"
                : "#222"
          }}
        >
          {feedback.message}
        </div>
      )}
    </div>
  );
}

/** Helper: trigger CSV download in browser */
function triggerCSVDownload(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/** Minimal CSV parser (handles comma, quotes, newlines) */
function parseCSV(str) {
  const rows = [];
  let row = [];
  let inQuotes = false,
    field = "";
  for (let i = 0; i < str.length; i++) {
    const char = str[i];
    if (char === '"' && str[i + 1] === '"') {
      field += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      row.push(field);
      field = "";
    } else if ((char === "\n" || char === "\r") && !inQuotes) {
      if (field !== "" || row.length) row.push(field);
      if (row.length) rows.push(row);
      row = [];
      field = "";
      if (char === "\r" && str[i + 1] === "\n") i++;
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) row.push(field);
  if (row.length) rows.push(row);
  return rows;
}

export default RoomBulkImportExport;
