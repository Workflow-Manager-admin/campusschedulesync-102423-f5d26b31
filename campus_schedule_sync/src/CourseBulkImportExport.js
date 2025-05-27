import React, { useRef } from "react";

/**
 * PUBLIC_INTERFACE
 * CourseBulkImportExport:
 *  - Download template for courses as CSV
 *  - Export existing courses as CSV
 *  - Import new courses (from CSV, with validation)
 * 
 * Props:
 *   - courses: array of course objects (current data)
 *   - onImport: async (parsedCourses) => void
 */
function CourseBulkImportExport({ courses = [], onImport }) {
  const fileInput = useRef(null);

  // Template header
  const TEMPLATE_HEADER = ["name", "code", "department"];
  const TEMPLATE_SAMPLE = [
    ["Mathematics", "MATH101", "Mathematics"],
    ["Physics", "PHYS201", "Physics"]
  ];

  // CSV download of empty template
  function handleDownloadTemplate() {
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...TEMPLATE_SAMPLE.map(row => row.map(field => `"${field}"`).join(",")),
    ].join("\r\n");
    triggerCSVDownload(csv, "Course_Template.csv");
  }

  // CSV download of data
  function handleExportCourses() {
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...courses.map(c =>
        [c.name, c.code, c.department].map(field => `"${field || ""}"`).join(",")
      ),
    ].join("\r\n");
    triggerCSVDownload(csv, "Courses_Export.csv");
  }

  // CSV upload and parse
  function handleFileChange(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function(event) {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        if (!parsed.length || parsed[0].length < 3) {
          alert("Invalid file: requires fields name, code, department");
          return;
        }
        // Validate header
        const header = parsed[0].map(h => h.trim().toLowerCase());
        if (
          header[0] !== "name" ||
          header[1] !== "code" ||
          header[2] !== "department"
        ) {
          alert("CSV header must be: name, code, department");
          return;
        }
        // Remove header and map to objects
        const rows = parsed.slice(1).filter(r =>
          r.some(field => field && field.trim())
        ); // skip blank
        const mapped = rows.map(r => ({
          name: r[0]?.trim() || "",
          code: r[1]?.trim() || "",
          department: r[2]?.trim() || "",
        })).filter(c => c.name && c.code && c.department);

        if (mapped.length === 0) {
          alert("No valid rows in file.");
          return;
        }
        // Submit to parent
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
      <button className="btn" type="button" onClick={handleExportCourses} disabled={courses.length === 0}>
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
      <button className="btn" type="button" onClick={() => fileInput.current?.click()}>
        Import
      </button>
    </div>
  );
}

/** Helper to trigger browser CSV download */
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
  let inQuotes = false, field = "";
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
      // skip \r\n
      if (char === "\r" && str[i + 1] === "\n") i++;
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) row.push(field);
  if (row.length) rows.push(row);
  return rows;
}

export default CourseBulkImportExport;
