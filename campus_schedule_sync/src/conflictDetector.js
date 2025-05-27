//
// conflictDetector.js
// Timetable session conflict detection utilities for real-time validation
//

/**
 * PUBLIC_INTERFACE
 * checkSessionConflicts - Returns list of detected conflicts (room, faculty, policy) when moving or creating a session.
 *
 * @param {Object} session - {id, course_id, faculty_id, room_id, day, start_time, end_time}
 * @param {Array} allSessions - Array of all session objects (from timetable)
 * @param {Object} options:
 *   - facultyAllocations: [{faculty_id, classes_per_week}]
 *   - roomAssignments: [{room_id, ...}]
 *   - policies: { facultyMaxPerWeek: number }
 *
 * Returns: { hasConflict: boolean, conflicts: [{type, message}], canOverride: boolean }
 */
export function checkSessionConflicts(session, allSessions, options = {}) {
  const { facultyAllocations = [], policies = {} } = options;
  const conflicts = [];

  // Helper: time overlap
  function overlaps(a, b) {
    return (
      a.day === b.day &&
      a.id !== b.id &&
      a.room_id === b.room_id &&
      ((a.start_time < b.end_time && a.end_time > b.start_time))
    );
  }

  // Room conflict (same room, overlapping times, same day)
  for (const s of allSessions) {
    if (
      s.room_id === session.room_id &&
      s.day === session.day &&
      s.id !== session.id &&
      ((session.start_time < s.end_time && session.end_time > s.start_time))
    ) {
      conflicts.push({
        type: "room",
        message: "Selected room is already booked for this time slot.",
        session: s,
      });
      break;
    }
  }

  // Faculty conflict (faculty busy in another session)
  for (const s of allSessions) {
    if (
      s.faculty_id === session.faculty_id &&
      s.day === session.day &&
      s.id !== session.id &&
      ((session.start_time < s.end_time && session.end_time > s.start_time))
    ) {
      conflicts.push({
        type: "faculty",
        message: "Selected faculty is assigned to another session at this time.",
        session: s,
      });
      break;
    }
  }

  // Faculty policy: total per week (if allocation data and policy given)
  if (
    session.faculty_id &&
    policies.facultyMaxPerWeek &&
    Array.isArray(facultyAllocations)
  ) {
    // Sessions in week for this faculty (not just new one, but after move)
    let count = 1; // include this session being placed
    for (const s of allSessions) {
      if (
        s.faculty_id === session.faculty_id &&
        s.id !== session.id
      ) {
        count += 1;
      }
    }
    // Optionally override by classes_per_week policy (if session represents >1 weekly class)
    if (count > policies.facultyMaxPerWeek) {
      conflicts.push({
        type: "policy",
        message: `Faculty exceeds max allowed classes per week: ${policies.facultyMaxPerWeek}.`,
        faculty_id: session.faculty_id,
        actual: count,
        allowed: policies.facultyMaxPerWeek,
      });
    }
  }

  // Add more rules here as needed (e.g. room capacity, etc.)

  const hasConflict = conflicts.length > 0;
  // Can override only policy, not resource (room/faculty timings) by default
  const canOverride =
    hasConflict &&
    conflicts.every((c) => c.type === "policy");

  return { hasConflict, conflicts, canOverride };
}

/**
 * PUBLIC_INTERFACE
 * explainConflicts - Human-readable string summary for dialog
 * @param {Array} conflicts - Output from checkSessionConflicts
 * @returns string
 */
export function explainConflicts(conflicts) {
  if (!conflicts || conflicts.length === 0) return "No conflicts detected.";
  return conflicts
    .map((c) => {
      if (c.type === "policy") {
        return c.message;
      } else if (c.type === "room" || c.type === "faculty") {
        return c.message;
      } else {
        return "Resource conflict detected.";
      }
    })
    .join("\n");
}
