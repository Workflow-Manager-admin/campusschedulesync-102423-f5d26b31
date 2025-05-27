import React, { useRef } from "react";

/**
 * PUBLIC_INTERFACE
 * FacultyBulkImportExport:
 *  - Download template (CSV)
 *  - Export existing faculty (CSV)
 *  - Import new in bulk, with validation (no >12 classes/week)
 *
 * Props:
 *   - faculty: array of faculty objects
 *   - onImport: async (parsedFacultyArray) => void
 */
function FacultyBulkImportExport({ faculty = [], onImport }) {
  const fileInput = useRef(null);

  // Template CSV header/row
  const TEMPLATE_HEADER = [
    "name",
    "email",
    "department",
    "classes_per_week"
  ];
  const TEMPLATE_SAMPLE = [
    ["Alice Braswell", "alice.b@college.edu", "Mathematics", "7"],
    ["Thomas Ko", "thomas.k@college.edu", "Physics", "10"]
  ];

  /** Download empty template */
  function handleDownloadTemplate() {
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...TEMPLATE_SAMPLE.map(row => row.map(field => `"${field}"`).join(",")),
    ].join("\r\n");
    triggerCSVDownload(csv, "Faculty_Template.csv");
  }

  /** Download current faculty (export) */
  function handleExportFaculty() {
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...faculty.map(f =>
        [
          f.name || "",
          f.email || "",
          f.department || "",
          typeof f.classes_per_week === "number"
            ? f.classes_per_week
            : (f.classes_per_week || "")
        ].map(field => `"${field}"`).join(",")
      )
    ].join("\r\n");
    triggerCSVDownload(csv, "Faculty_Export.csv");
  }

  /** Upload & import CSV */
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        if (!parsed.length || parsed[0].length < 4) {
          alert(
            "Invalid file: requires fields name, email, department, classes_per_week"
          );
          return;
        }
        const header = parsed[0].map(h => h.trim().toLowerCase());
        if (
          header[0] !== "name" ||
          header[1] !== "email" ||
          header[2] !== "department" ||
          header[3] !== "classes_per_week"
        ) {
          alert("CSV header must be: name, email, department, classes_per_week");
          return;
        }
        const rows = parsed
          .slice(1)
          .filter(r => r.some(field => field && field.trim())); // skip blank
        const mapped = rows
          .map(r => ({
            name: r[0]?.trim() || "",
            email: r[1]?.trim() || "",
            department: r[2]?.trim() || "",
            classes_per_week: Number(r[3]?.trim() || "0")
          }))
          .filter(
            f =>
              f.name &&
              f.email &&
              f.department &&
              // Accepts zero classes/week but field required
              String(r[3]?.trim() || "").length > 0
          );
        // Validation: no >12 classes/week
        const violating = mapped.find(f => Number(f.classes_per_week) > 12);
        if (violating) {
          alert(
            `Faculty "${violating.name}" exceeds 12 classes/week. Please fix the file.`
          );
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
        onClick={handleExportFaculty}
        disabled={faculty.length === 0}
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

export default FacultyBulkImportExport;
