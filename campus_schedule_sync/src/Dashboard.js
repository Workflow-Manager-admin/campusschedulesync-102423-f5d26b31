import React, { useState } from "react";
import CourseList from "./CourseList";

/**
 * Dashboard container: hosts all major app panels (Timetable, Courses, Faculty, Rooms, Import/Export, Allocation).
 * Provides primary navigation (tabs/links) between sections. No Supabase or authentication logic.
 *
 * Sections scaffolded: Timetable, Courses, Faculty, Rooms, Import/Export, Allocation.
 * Each section is a placeholder stub for now.
 *
 * Theme: CampusScheduleSync green/white.
 */

// Section tab definitions
const SECTIONS = [
  { key: "timetable", label: "Timetable" },
  { key: "courses", label: "Courses" },
  { key: "faculty", label: "Faculty" },
  { key: "rooms", label: "Rooms" },
  { key: "import_export", label: "Import/Export" },
  { key: "allocation", label: "Allocation" },
];

// Stub panel for each main module; to be replaced with full feature modules
function getSectionComponent(section) {
  switch (section) {
    case "timetable":
      return <div>📅 <b>Timetable View</b> (grid/calendar coming soon)</div>;
    case "courses":
      return <CourseList />;
    case "faculty":
      return <div>🧑‍🏫 <b>Faculty Directory</b> (manage teaching staff)</div>;
    case "rooms":
      return <div>🏢 <b>Rooms/Resources</b> (room/resource management)</div>;
    case "import_export":
      return (
        <div>
          ⬇️⬆️ <b>Import/Export</b> (CSV/Excel for timetable & allocation)
        </div>
      );
    case "allocation":
      return <div>🔗 <b>Allocation</b> (assign courses, teachers, and rooms)</div>;
    default:
      return null;
  }
}

// PUBLIC_INTERFACE
/**
 * Dashboard: main navigation container for all app modules.
 */
function Dashboard() {
  // Track current section with state (simple client-side routing)
  const [active, setActive] = useState(SECTIONS[0].key);

  return (
    <div style={{ minHeight: "75vh", marginTop: 24 }}>
      {/* Tab navigation */}
      <nav
        aria-label="Dashboard sections"
        style={{
          display: "flex",
          gap: 6,
          borderBottom: "2px solid var(--border-color)",
          marginBottom: 20,
        }}
      >
        {SECTIONS.map((s) => (
          <button
            key={s.key}
            className="btn"
            style={{
              background:
                active === s.key
                  ? "var(--primary-green)"
                  : "var(--navbar-bg)",
              color:
                active === s.key
                  ? "#fff"
                  : "var(--text-dark)",
              borderBottom:
                active === s.key
                  ? "3px solid var(--accent-green)"
                  : "3px solid transparent",
              borderRadius: "4px 4px 0 0",
              fontWeight: active === s.key ? 700 : 500,
              boxShadow: "none",
              fontSize: "1.04rem",
              marginBottom: "-2px",
              cursor: "pointer",
              minWidth: 120,
              padding: "10px 0",
              outline: active === s.key ? "2px solid var(--accent-green)" : "none"
            }}
            aria-current={active === s.key ? "page" : undefined}
            onClick={() => setActive(s.key)}
          >
            {s.label}
          </button>
        ))}
      </nav>
      {/* Main section content */}
      <section
        style={{
          background: "#fff",
          borderRadius: 8,
          boxShadow: "0 2px 8px 0 rgba(46,204,64,0.02)",
          padding: 32,
          minHeight: 260,
          transition: "box-shadow 0.18s",
        }}
        aria-live="polite"
      >
        {getSectionComponent(active)}
      </section>
    </div>
  );
}

export default Dashboard;
