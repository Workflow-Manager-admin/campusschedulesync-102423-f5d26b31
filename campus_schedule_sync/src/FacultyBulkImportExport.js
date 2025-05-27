import React, { useRef, useState } from "react";

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

  // Accessibility and feedback state
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const liveRegionRef = useRef(null);

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
    setFeedback({ type: "info", message: "Faculty template CSV downloaded." });
    const csv = [
      TEMPLATE_HEADER.join(","),
      ...TEMPLATE_SAMPLE.map(row => row.map(field => `"${field}"`).join(",")),
    ].join("\r\n");
    triggerCSVDownload(csv, "Faculty_Template.csv");
  }

  /** Download current faculty (export) */
  function handleExportFaculty() {
    setFeedback({ type: "info", message: "Faculty records exported." });
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
    setFeedback({ type: "", message: "" }); // Clear earlier
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = function (event) {
      const text = event.target.result;
      try {
        const parsed = parseCSV(text);
        if (!parsed.length || parsed[0].length < 4) {
          setFeedback({
            type: "error",
            message: "Invalid file: requires fields name, email, department, classes_per_week"
          });
          fileInput.current.value = "";
          liveRegionRef.current && liveRegionRef.current.focus();
          return;
        }
        const header = parsed[0].map(h => h.trim().toLowerCase());
        if (
          header[0] !== "name" ||
          header[1] !== "email" ||
          header[2] !== "department" ||
          header[3] !== "classes_per_week"
        ) {
          setFeedback({
            type: "error",
            message: "CSV header must be: name, email, department, classes_per_week"
          });
          fileInput.current.value = "";
          liveRegionRef.current && liveRegionRef.current.focus();
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
              String(f.classes_per_week || "").length > 0
          );
        // Validation: no >12 classes/week
        const violating = mapped.find(f => Number(f.classes_per_week) > 12);
        if (violating) {
          setFeedback({
            type: "error",
            message: `Faculty "${violating.name}" exceeds 12 classes/week. Please fix the file.`
          });
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
          setFeedback({ type: "success", message: `Ready to import: ${mapped.length} faculty (see preview above).`});
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

  // Keyboard: Enter on visible Import triggers file input, Escape clears state
  function handleImportButtonKeyDown(e) {
    if (e.key === "Enter" || e.key === " " || e.keyCode === 32 || e.keyCode === 13) {
      fileInput.current?.click();
    } else if (e.key === "Escape" || e.keyCode === 27) {
      setFeedback({ type: "", message: "" });
      fileInput.current.value = "";
    }
  }

  // Ensure feedback region focus on error/info for screen readers
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
          aria-label="Download faculty CSV template"
        >
          Download Template
        </button>
        <button
          className="btn"
          type="button"
          onClick={handleExportFaculty}
          disabled={faculty.length === 0}
          aria-label="Export current faculty as CSV"
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
          aria-label="Import faculty from CSV"
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
      {/* Optionally show feedback inline visually for all users */}
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

export default FacultyBulkImportExport;
