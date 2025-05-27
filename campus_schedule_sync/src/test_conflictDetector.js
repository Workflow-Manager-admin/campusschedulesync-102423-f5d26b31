import { checkSessionConflicts, explainConflicts } from "./conflictDetector";

describe("checkSessionConflicts", () => {
  const sampleSessions = [
    { id: 1, day: "Mon", start_time: "09:00", end_time: "10:00", room_id: 1, faculty_id: 1 },
    { id: 2, day: "Mon", start_time: "09:00", end_time: "10:00", room_id: 2, faculty_id: 1 }, // faculty shared
    { id: 3, day: "Mon", start_time: "10:00", end_time: "11:00", room_id: 1, faculty_id: 2 },
    { id: 4, day: "Tue", start_time: "11:00", end_time: "12:00", room_id: 1, faculty_id: 2 },
  ];
  const facultyAllocations = [{ faculty_id: 1, classes_per_week: 5 }];
  const defaultOptions = {
    facultyAllocations,
    policies: { facultyMaxPerWeek: 3 },
  };

  it("returns no conflict for isolated session", () => {
    const session = { ...sampleSessions[0], id: 10, day: "Wed", start_time: "13:00", end_time: "14:00", room_id: 99, faculty_id: 99 };
    const result = checkSessionConflicts(session, sampleSessions, defaultOptions);
    expect(result.hasConflict).toBe(false);
    expect(result.conflicts).toHaveLength(0);
    expect(result.canOverride).toBe(false);
  });

  it("detects room conflict", () => {
    const session = { ...sampleSessions[0], id: 10, room_id: 1, day: "Mon", start_time: "09:30", end_time: "10:30", faculty_id: 99 };
    const result = checkSessionConflicts(session, sampleSessions, defaultOptions);
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts.some(c => c.type === "room")).toBe(true);
    expect(result.canOverride).toBe(false);
  });

  it("detects faculty time conflict", () => {
    const session = { ...sampleSessions[0], id: 15, room_id: 77, day: "Mon", start_time: "09:00", end_time: "10:00", faculty_id: 1 };
    const result = checkSessionConflicts(session, sampleSessions, defaultOptions);
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts.some(c => c.type === "faculty")).toBe(true);
    expect(result.canOverride).toBe(false);
  });

  it("detects faculty max/week policy violation", () => {
    // Give faculty 1 max = 3, current allocations: 5
    const session = { ...sampleSessions[0], id: 20, faculty_id: 1, room_id: 77, day: "Thu" };
    const result = checkSessionConflicts(session, sampleSessions, defaultOptions);
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts.some(c => c.type === "policy")).toBe(true);
    expect(result.canOverride).toBe(true); // Only policy violation, so can override
  });

  it("combines multiple conflicts", () => {
    // Collide both faculty time and room
    const session = { ...sampleSessions[0], id: 25, day: "Mon", start_time: "09:15", end_time: "10:15", room_id: 1, faculty_id: 1 };
    const result = checkSessionConflicts(session, sampleSessions, defaultOptions);
    expect(result.hasConflict).toBe(true);
    expect(result.conflicts.length).toBeGreaterThan(0);
    expect(result.canOverride).toBe(false);
  });
});

describe("explainConflicts", () => {
  it("returns 'No conflicts detected' for empty", () => {
    expect(explainConflicts([])).toMatch(/No conflicts/i);
    expect(explainConflicts(null)).toMatch(/No conflicts/i);
  });
  it("summarizes all conflict types", () => {
    const conflicts = [
      { type: "policy", message: "Policy violation" },
      { type: "room", message: "Room conflict" },
      { type: "faculty", message: "Faculty conflict" },
      { type: "weird", message: "Other resource" },
    ];
    const out = explainConflicts(conflicts);
    expect(out).toContain("Policy violation");
    expect(out).toContain("Room conflict");
    expect(out).toContain("Faculty conflict");
    expect(out).toContain("Resource conflict");
  });
});
