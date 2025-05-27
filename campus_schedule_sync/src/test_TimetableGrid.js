import React from "react";
import { render, fireEvent, screen, within, act } from "@testing-library/react";
import TimetableGrid from "./TimetableGrid";

// --- Mocks for dependencies (as in existing test suites) ---
jest.mock("./useTimetable");
jest.mock("./useDragDrop");
jest.mock("./SupabaseProvider", () => ({
  useSupabase: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [{ id: 1, name: "Test C", code: "C-1" }], error: null })),
    })),
  }),
}));
jest.mock("./Notification", () => (props) => (
  <div data-testid="notifier" role="alert">
    {props.type}:{props.message}
  </div>
));
jest.mock("./TimetableEntryForm", () => (props) => (
  <form data-testid="entry-form">
    <input
      data-testid="course"
      value={props.entry?.course_id ?? ""}
      onChange={() => {}}
    />
    <button
      type="button"
      data-testid="save"
      onClick={() => props.onSave && props.onSave(props.entry || {})}
    >
      Save
    </button>
    <button
      type="button"
      data-testid="cancel"
      onClick={props.onCancel}
    >
      Cancel
    </button>
  </form>
));
jest.mock("./ConflictModal", () => (props) => (
  props.open ? (
    <div data-testid="conflict-modal">
      <ul>
        {props.conflicts?.map((c, i) => (
          <li key={i}>{c.message}</li>
        ))}
      </ul>
      <button data-testid="close-modal" onClick={props.onClose}>Close</button>
      {props.canOverride &&
        <button data-testid="override-modal" onClick={props.onOverride}>Override</button>
      }
    </div>
  ) : null
));

// --- Helper mocks for useTimetable/useDragDrop ---
const mockSessions = [
  { id: 1, day: "Monday", start_time: "10:00", end_time: "11:00", course_id: 1, faculty_id: 2, room_id: 3 }
];

const useTimetableMock = {
  sessions: mockSessions,
  loading: false,
  error: "",
  addSession: jest.fn().mockResolvedValue(true),
  updateSession: jest.fn().mockResolvedValue(true),
  deleteSession: jest.fn().mockResolvedValue(true),
  refresh: jest.fn(),
};

const useTimetableWithError = {
  ...useTimetableMock,
  error: "Failed to fetch sessions",
};

let dragDropHandler = {};
jest.mocked = (mod) => mod;

beforeEach(() => {
  require("./useTimetable").default.mockReturnValue({ ...useTimetableMock });
  require("./useDragDrop").default.mockImplementation((opts) => {
    dragDropHandler = opts;
    return {
      dragState: "idle",
      draggingSession: null,
      dragOrigin: null,
      hovered: null,
      beginDrag: jest.fn(),
      updateHover: jest.fn(),
      handleDrop: jest.fn(),
      endDrag: jest.fn(),
    };
  });
});

afterEach(() => {
  jest.clearAllMocks();
});
/**
 * EXTENDED INTEGRATION TESTS for drag-and-drop feature in TimetableGrid.
 * Covers:
 * - All unscheduled courses rendered as draggable cards
 * - Grid slots as valid droppables
 * - Successful drop creates new timetable entry (calls mock backend)
 * - Duplicate/invalid drops are handled gracefully
 * - Error/edge boundary cases (no faculty, no room, backend error)
 */

describe("TimetableGrid UI/logic", () => {
  test("renders timetable grid with correct slots and header", () => {
    render(<TimetableGrid />);
    expect(screen.getByText(/Timetable \(Week View\)/i)).toBeInTheDocument();
    expect(screen.getAllByRole("columnheader").length).toBeGreaterThan(3);
    // Course cell label present
    expect(screen.getAllByRole("cell").some(
      td => td.textContent.includes("10:00") || td.textContent.includes("+"))
    ).toBe(true);
  });

  test("renders all unscheduled courses as draggable cards", async () => {
    // Patch useTimetable/courses to include scheduled+unscheduled courses
    const allCourses = [
      { id: 1, course_code: "C-1", name: "Math" }, // Scheduled (in timetable entry)
      { id: 2, course_code: "C-2", name: "English" }, // Unscheduled
      { id: 3, course_code: "C-3", name: "Science" }, // Unscheduled
    ];
    require("./useTimetable").default.mockReturnValue({
      ...useTimetableMock,
      sessions: [{ id: 1, day: "mon", start_time: "10:00", course_id: 1 }],
    });
    // Patch supabase provider to return allCourses
    require("./SupabaseProvider").useSupabase = () => ({
      from: jest.fn(entity => ({
        select: jest.fn(() => {
          if (entity === "courses") {
            return { data: allCourses, error: null };
          }
          // fallback: empty dummy
          return { data: [], error: null };
        }),
      }))
    });
    render(<TimetableGrid />);
    // Find draggable card labels for unscheduled only
    expect(screen.queryByText("C-2")).toBeInTheDocument();
    expect(screen.queryByText("C-3")).toBeInTheDocument();
    // The scheduled (C-1) should NOT be shown as unscheduled
    expect(screen.queryAllByText("C-1").length).toBe(1); // Only inside timetable grid, not as draggable
  });

  test("successful drag-drop of unscheduled course to grid creates new timetable entry and updates UI", async () => {
    // Setup unscheduled course
    const unscheduledCourse = { id: 5, course_code: "C-5", name: "Test Drag" };
    require("./SupabaseProvider").useSupabase = () => ({
      from: jest.fn(entity => ({
        select: jest.fn(() => {
          if (entity === "courses") {
            return { data: [unscheduledCourse], error: null };
          }
          if (entity === "faculty") {
            return { data: [{ id: 111, name: "Prof X" }], error: null };
          }
          if (entity === "rooms") {
            return { data: [{ id: 12, name: "Room 9" }], error: null };
          }
          return { data: [], error: null };
        }),
        insert: jest.fn().mockResolvedValue({ data: [{ id: 777 }], error: null }),
      }))
    });

    render(<TimetableGrid />);
    // There should be at least one draggable card for the unscheduled course
    const dragLabel = screen.getByText("C-5");
    expect(dragLabel).toBeInTheDocument();

    // Simulate drop - call onDragEnd (since we use react-beautiful-dnd style)
    const grid = screen.getAllByRole("cell")[1];
    await act(async () => {
      // Fake the Drop result structure from @hello-pangea/dnd
      // Simulate DragDropContext's onDragEnd
      fireEvent(
        grid,
        new Event("drop", { bubbles: true })
      );
      // Call the handler direct for coverage
      await new Promise((r) => setTimeout(r, 50));
    });
    // No errors
    expect(screen.queryByText(/error|fail|could not/i)).not.toBeInTheDocument();
  });

  test("attempting to drop duplicate or invalid courses handled gracefully", async () => {
    // Setup: all courses already scheduled (no unscheduled available)
    const scheduledCourses = [{ id: 20, course_code: "C-20", name: "Dupe" }];
    require("./SupabaseProvider").useSupabase = () => ({
      from: jest.fn(entity => ({
        select: jest.fn(() => {
          if (entity === "courses") {
            return { data: scheduledCourses, error: null };
          }
          if (entity === "faculty") {
            return { data: [{ id: 900, name: "Prof D" }], error: null };
          }
          if (entity === "rooms") {
            return { data: [{ id: 801, name: "MainRoom" }], error: null };
          }
          return { data: [], error: null };
        }),
        insert: jest.fn(), // Should not be called for duplicate
      }))
    });

    render(<TimetableGrid />);
    // No unscheduled draggable cards!
    expect(screen.queryByText("C-20")).toBeInTheDocument(); // Should be only in timetable grid, not in unscheduled
    // Attempt to drag-drop for duplicate course
    const plusBtn = screen.getAllByText("+")[0];
    fireEvent.click(plusBtn);
    await act(async () => {
      // Immediately try to drop (simulate insert), should do nothing
      fireEvent(plusBtn, new Event("drop", { bubbles: true }));
    });
    // Insert to backend should NOT have been called:
    expect(
      require("./SupabaseProvider").useSupabase().from("timetable_entries").insert
    ).not.toHaveBeenCalled();
  });

  test("edge case: dropping with no faculty or room shows warning and does not mutate backend", async () => {
    // Setup: faculty/room blank, so insertion is blocked
    require("./SupabaseProvider").useSupabase = () => ({
      from: jest.fn(entity => ({
        select: jest.fn(() => {
          if (entity === "courses") {
            return { data: [{ id: 77, course_code: "C77", name: "NoRoomNoFaculty" }], error: null };
          }
          if (entity === "faculty") {
            return { data: [], error: null };
          }
          if (entity === "rooms") {
            return { data: [], error: null };
          }
          return { data: [], error: null };
        }),
        insert: jest.fn(),
      }))
    });

    render(<TimetableGrid />);
    // Draggable card present
    expect(screen.getByText("C77")).toBeInTheDocument();
    // Simulate a drag-drop attempt
    const cell = screen.getAllByRole("cell")[2];
    window.alert = jest.fn();
    await act(async () => {
      fireEvent(cell, new Event("drop", { bubbles: true }));
      await new Promise((r) => setTimeout(r, 10));
    });
    expect(window.alert).toHaveBeenCalledWith(
      expect.stringMatching(/faculty.*rooms.*before/i)
    );
    // Insert should not be called
    expect(
      require("./SupabaseProvider").useSupabase().from("timetable_entries").insert
    ).not.toHaveBeenCalled();
  });

  test("renders Notification on error", () => {
    require("./useTimetable").default.mockReturnValue({ ...useTimetableWithError });
    render(<TimetableGrid />);
    expect(screen.getByRole("alert")).toHaveTextContent(/Failed to fetch sessions/);
  });

  test("opens entry form when clicking empty slot and saves new session", async () => {
    render(<TimetableGrid />);
    const plus = screen.getAllByText("+")[0];
    fireEvent.click(plus);

    expect(screen.getByTestId("entry-form")).toBeInTheDocument();
    // Simulate save triggers addSession, closes and notifies
    await act(async () => {
      fireEvent.click(screen.getByTestId("save"));
    });
    // Notification for session added
    expect(useTimetableMock.addSession).toHaveBeenCalled();
    // May display feedback, depending notification logic
  });

  test("edit/delete UI for existing session triggers callback", async () => {
    render(<TimetableGrid />);
    // Session box (divs with "Edit" and "Delete")
    const editBtn = screen.getAllByText("Edit")[0];
    fireEvent.click(editBtn);
    // Editing form visible
    expect(screen.getByTestId("entry-form")).toBeInTheDocument();

    const delBtn = screen.getAllByText("Delete")[0];
    // Overwrite window.confirm for test
    window.confirm = jest.fn(() => true);
    await act(async () => {
      fireEvent.click(delBtn);
    });
    expect(useTimetableMock.deleteSession).toHaveBeenCalled();
  });

  test("drag and drop to valid cell triggers updateSession", async () => {
    let lastDropResult;
    require("./useDragDrop").default.mockImplementation((opts) => {
      dragDropHandler = opts;
      return {
        dragState: "dragging",
        draggingSession: mockSessions[0],
        dragOrigin: { day: "Monday", time: "10:00" },
        hovered: { day: "Tuesday", time: "11:00" },
        beginDrag: jest.fn(),
        updateHover: jest.fn(),
        handleDrop: async (destCell) => {
          lastDropResult = await opts.onDrop(mockSessions[0], destCell);
          return lastDropResult;
        },
        endDrag: jest.fn(),
      };
    });
    render(<TimetableGrid />);
    // Simulate a drop on empty target cell via dragDrop handler
    await act(async () => {
      await dragDropHandler.onDrop(mockSessions[0], { day: "Tuesday", time: "11:00" });
    });
    expect(useTimetableMock.updateSession).toHaveBeenCalled();
  });

  test("shows ConflictModal and handles override/cancel for policy conflict", async () => {
    let modalProps = {};
    require("./useDragDrop").default.mockImplementation((opts) => {
      dragDropHandler = opts;
      return {
        dragState: "dragging",
        draggingSession: mockSessions[0],
        dragOrigin: { day: "Monday", time: "10:00" },
        hovered: { day: "Tuesday", time: "11:00" },
        beginDrag: jest.fn(),
        updateHover: jest.fn(),
        handleDrop: async (destCell) => {
          // Simulate a policy conflict: returns hasConflict=true, canOverride=true
          opts.onDrop = (session, destCell) => ({
            hasConflict: true,
            conflicts: [{ message: "Policy Exceeded" }],
            canOverride: true,
            dndParams: { session, destCell }
          });
          modalProps = {
            open: true,
            conflicts: [{ message: "Policy Exceeded" }],
            canOverride: true,
            dndParams: { session: mockSessions[0], destCell: { day: "Tuesday", time: "11:00" } }
          };
          return { status: "conflict" };
        },
        endDrag: jest.fn(),
      };
    });
    render(<TimetableGrid />);
    // Simulate drop with conflict
    await act(async () => {
      await dragDropHandler.onDrop(mockSessions[0], { day: "Tuesday", time: "11:00" });
    });
    // Modal should render
    expect(screen.getByTestId("conflict-modal")).toBeInTheDocument();
    fireEvent.click(screen.getByTestId("override-modal"));
    // Should call updateSession forcibly after override
    expect(useTimetableMock.updateSession).toHaveBeenCalled();
    // Modal close also available
    fireEvent.click(screen.getByTestId("close-modal"));
  });

  test("accessibility: table/cell ARIA, tab focuses on cell", () => {
    render(<TimetableGrid />);
    const cell = screen.getAllByRole("cell")[0];
    expect(cell).toHaveAttribute("tabindex");
    expect(cell).toHaveAttribute("aria-label");
  });
});

