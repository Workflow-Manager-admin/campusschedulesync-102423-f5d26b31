import * as XLSX from "xlsx";

/**
 * PUBLIC_INTERFACE
 * Minimal CSV parser (handles comma, quotes, newlines)
 */
export function parseCSV(str) {
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
      if (char === "\r" && str[i + 1] === "\n") i++;
    } else {
      field += char;
    }
  }
  if (field !== "" || row.length) row.push(field);
  if (row.length) rows.push(row);
  return rows;
}

/**
 * PUBLIC_INTERFACE
 * Trigger CSV download in browser
 */
export function triggerCSVDownload(csv, filename) {
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 8000);
}

/**
 * PUBLIC_INTERFACE
 * Trigger Excel (XLSX) file download from JS array of objects or array of arrays.
 * data: array of arrays or array of objects, header is optional if array-of-objects
 * filename: string, should end with .xlsx
 * sheetName: Excel worksheet name (default: 'Sheet1')
 */
export function triggerExcelDownload(data, filename, sheetName = "Sheet1", header = undefined) {
  let ws;
  if (Array.isArray(data) && data.length && Array.isArray(data[0])) {
    ws = XLSX.utils.aoa_to_sheet(header ? [header, ...data] : data);
  } else {
    ws = XLSX.utils.json_to_sheet(data, { header });
  }
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

/**
 * PUBLIC_INTERFACE
 * Read Excel (XLSX) or CSV file as array of arrays or array of objects.
 * - callback(rows, { type }) will receive parsed rows and a type ("csv" or "xlsx")
 * - Accepts .csv, .xlsx files
 */
export function readSpreadsheetFile(file, callback, isPreview = false) {
  const ext = file.name.split(".").pop().toLowerCase();
  const reader = new FileReader();
  reader.onload = function(event) {
    try {
      if (ext === "csv") {
        const rows = parseCSV(event.target.result);
        callback(rows, { type: "csv" });
      } else if (ext === "xlsx") {
        const workbook = XLSX.read(event.target.result, { type: "array" });
        const wsname = workbook.SheetNames[0];
        const ws = workbook.Sheets[wsname];
        // SheetJS: get array of arrays
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });
        callback(rows, { type: "xlsx" });
      } else {
        throw new Error("Unsupported file type: " + ext);
      }
    } catch (err) {
      if (!isPreview) alert("Failed to parse file: " + err.message);
      callback(null, { type: ext, error: err });
    }
  };
  if (ext === "csv") {
    reader.readAsText(file);
  } else {
    reader.readAsArrayBuffer(file);
  }
}

/**
 * PUBLIC_INTERFACE
 * Trigger download of a PNG image of an HTML node using html2canvas.
 * If html2canvas is not loaded, will fetch from CDN.
 * @param {HTMLElement} node - DOM node to snapshot
 * @param {string} filename - name of the PNG file to download
 */
export async function triggerImageExport(node, filename) {
  let html2canvas = window.html2canvas;
  if (!html2canvas) {
    html2canvas = await loadHtml2Canvas();
  }
  if (node && html2canvas) {
    const canvas = await html2canvas(node);
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
  } else {
    alert("Unable to export image (no node or html2canvas)");
  }
}

/**
 * PUBLIC_INTERFACE
 * Dynamically load html2canvas from CDN if not available
 */
export async function loadHtml2Canvas() {
  return new Promise((resolve, reject) => {
    if (window.html2canvas) return resolve(window.html2canvas);
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/html2canvas@1.4.1/dist/html2canvas.min.js";
    script.onload = () => resolve(window.html2canvas);
    script.onerror = (e) => reject(new Error("html2canvas load failed"));
    document.body.appendChild(script);
  });
}
