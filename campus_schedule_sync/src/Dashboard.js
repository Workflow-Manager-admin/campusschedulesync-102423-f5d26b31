import React from "react";
import TimetableGrid from "./TimetableGrid";

/**
 * Dashboard component for CampusScheduleSync
 * Shows the main Timetable grid view with a title.
 */
export default function Dashboard() {
  return (
    <div>
      <h1 className="title">Campus Timetable</h1>
      <TimetableGrid />
      {/* You can add stats/shortcuts/dashboard widgets here */}
    </div>
  );
}
