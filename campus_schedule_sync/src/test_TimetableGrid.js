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

