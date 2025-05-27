import React, { useRef } from "react";

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
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...TEMPLATE_SAMPLE.map(row => row.map(field => `"${field}"`).join(","))
    ].join("\r\n");
    triggerCSVDownload(csv, "Rooms_Template.csv");
  }

  function handleExportRooms() {
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
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        if (!parsed.length || parsed[0].length < 4) {
          alert("Invalid file: requires name, type, capacity, location");
          return;
        }
        const header = parsed[0].map(h => h.trim().toLowerCase());
        if (
          header[0] !== "name" ||
          header[1] !== "type" ||
          header[2] !== "capacity" ||
          header[3] !== "location"
        ) {
          alert("CSV header must be: name, type, capacity, location");
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
          alert("All capacities must be positive integers.");
          return;
        }
        if (mapped.length === 0) {
          alert("No valid rows in file.");
          return;
        }
        if (onImport) onImport(mapped);
      } catch (err) {
        alert("Could not parse file: " + err.message);
      }
    };
    reader.readAsText(file);
  }

  return (
    <div style={{ display: "flex", gap: 9 }}>
      <button className="btn" type="button" onClick={handleDownloadTemplate}>
        Download Template
      </button>
      <button
        className="btn"
        type="button"
        onClick={handleExportRooms}
        disabled={rooms.length === 0}
      >
        Export
      </button>
      <input
        type="file"
        accept=".csv,text/csv"
        ref={fileInput}
        style={{ display: "none" }}
        onChange={handleFileChange}
        data-testid="bulkimport-file"
      />
      <button
        className="btn"
        type="button"
        onClick={() => fileInput.current?.click()}
      >
        Import
      </button>
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
