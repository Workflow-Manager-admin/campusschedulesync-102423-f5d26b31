import React from "react";

/**
 * PUBLIC_INTERFACE
 * ConflictModal - Modal/dialog to display conflicts and handle admin override for timetable changes.
 * 
 * Props:
 *   open: boolean
 *   conflicts: array from conflictDetector
 *   canOverride: boolean (if override allowed)
 *   onClose: function (always called to close)
 *   onOverride: function (called if user confirms override)
 */
function ConflictModal({ open, conflicts, canOverride, onClose, onOverride }) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        zIndex: 3100,
        width: "100vw",
        height: "100vh",
        background: "rgba(44, 62, 80, 0.24)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
      onClick={onClose}
    >
      <div
        style={{
          background: "#fff",
          color: "#111",
          padding: "32px 30px 22px 30px",
          borderRadius: 10,
          boxShadow: "0 8px 48px rgba(48,174,72,0.12)",
          width: "100%",
          maxWidth: 440,
          minWidth: 312,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 style={{ marginTop: 0, marginBottom: 16, color: "#E87A41" }}>
          ⚠️ Scheduling Conflict
        </h3>
        <ul style={{ color: "#D63439", margin: "0 0 18px 0", paddingLeft: 22, fontWeight: 500 }}>
          {conflicts.map((c, i) => (
            <li key={i} style={{ marginBottom: 7 }}>
              {c.message}
            </li>
          ))}
        </ul>
        <div style={{ marginBottom: 15, color: "#888", fontSize: "1em" }}>
          {canOverride
            ? "You may override policy violations as an admin, but resource/time conflicts cannot be overridden."
            : "This change cannot be overridden. Please resolve conflicts and try again."}
        </div>
        <div style={{ display: "flex", justifyContent: "flex-end", gap: 13 }}>
          <button
            className="btn"
            style={{
              background: "var(--border-color)",
              color: "#222",
              fontWeight: 500,
              marginRight: 4,
            }}
            onClick={onClose}
          >
            Close
          </button>
          {canOverride && (
            <button
              className="btn"
              style={{ background: "#e67e22", color: "#fff", fontWeight: 700 }}
              onClick={onOverride}
            >
              Override & Proceed
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConflictModal;
