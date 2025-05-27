import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react";
import ImportExportPanel from "./ImportExportPanel";

// Mocks for subcomponents and utils
jest.mock("./CourseBulkImportExport", () => (props) => (
  <div data-testid="courses-import-export">
    <button data-testid="import-courses" onClick={() => props.onImport([{ x: 1 }])}>
      Import Courses
    </button>
  </div>
));
jest.mock("./FacultyBulkImportExport", () => (props) => (
  <div data-testid="faculty-import-export">
    <button data-testid="import-faculty" onClick={() => props.onImport([{ x: 11 }])}>
      Import Faculty
    </button>
  </div>
));
jest.mock("./RoomBulkImportExport", () => (props) => (
  <div data-testid="rooms-import-export">
    <button data-testid="import-rooms" onClick={() => props.onImport([{ x: 111 }])}>
      Import Rooms
    </button>
  </div>
));

jest.mock("./utils", () => ({
  triggerCSVDownload: jest.fn(),
  triggerExcelDownload: jest.fn(),
  triggerImageExport: jest.fn(),
  readSpreadsheetFile: (file, cb) => cb(
    [
      ["course_id", "faculty_id", "room_id", "day", "start_time", "end_time"],
      ["1", "2", "3", "Monday", "08:00", "09:00"]
    ],
    {}
  ),
}));

jest.mock("./SupabaseProvider", () => ({
  useSupabase: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [] })),
      insert: jest.fn(() => ({ error: null })),
    })),
  }),
}));

jest.mock("./Notification", () => (props) => (
  <div data-testid="notifier" role="alert">{props.type}:{props.message}</div>
));

// ----------- TESTS -------------- //
beforeEach(() => {
  jest.clearAllMocks();
});

test("renders all import/export panel sections", () => {
  render(<ImportExportPanel />);
  expect(screen.getByText(/Import \/ Export Center/i)).toBeInTheDocument();
  expect(screen.getByTestId("courses-import-export")).toBeInTheDocument();
  expect(screen.getByTestId("faculty-import-export")).toBeInTheDocument();
  expect(screen.getByTestId("rooms-import-export")).toBeInTheDocument();
  expect(screen.getByText(/Timetable Sessions/i)).toBeInTheDocument();
});

test("downloads template on click", () => {
  render(<ImportExportPanel />);
  fireEvent.click(screen.getByText(/Download Template/i));
  // Should call utils.triggerCSVDownload
  expect(require("./utils").triggerCSVDownload).toHaveBeenCalled();
});

test("runs export CSV or export grid image actions", () => {
  render(<ImportExportPanel />);
  fireEvent.click(screen.getByText(/Export CSV/i));
  expect(require("./utils").triggerCSVDownload).toHaveBeenCalled();
  fireEvent.click(screen.getByText(/Export Grid Image/i));
  expect(require("./utils").triggerImageExport).toHaveBeenCalled();
});

test("shows ARIA live region with feedback or loading", () => {
  render(<ImportExportPanel />);
  // Import preview action triggers feedback in live region
  fireEvent.click(screen.getByTestId("import-courses"));
  expect(screen.getByRole("alert")).toHaveTextContent(/Preview loaded: 1 courses/);
});

test("handles course/faculty/room import preview/confirm/cancel", () => {
  render(<ImportExportPanel />);
  // Courses
  fireEvent.click(screen.getByTestId("import-courses"));
  expect(screen.getByText(/Confirm Import/i)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/Confirm courses import/i));
  // Faculty
  fireEvent.click(screen.getByTestId("import-faculty"));
  expect(screen.getByText(/Confirm Import/i)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/Confirm faculty import/i));
  // Rooms
  fireEvent.click(screen.getByTestId("import-rooms"));
  expect(screen.getByText(/Confirm Import/i)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/Confirm rooms import/i));
});

test("handles timetable file upload, preview, and confirm import", async () => {
  render(<ImportExportPanel />);
  // Simulate file import
  const importBtn = screen.getByText("Import");
  // Directly call onChange handler of file input
  const fileInput = screen.getByTestId("tt-import-file");
  await act(async () => {
    fireEvent.change(fileInput, { target: { files: [new File(["csv"], "f.csv", { type: "text/csv" })] } });
  });
  // Should display feedback and confirm button
  expect(screen.getByText(/Confirm Import/i)).toBeInTheDocument();
  fireEvent.click(screen.getByLabelText(/Confirm timetable import/i));
});

test("shows error feedback for validation issues", async () => {
  require("./utils").readSpreadsheetFile = (file, cb) => cb(
    [
      ["wrong", "header", "columns"]
    ],
    {}
  );
  render(<ImportExportPanel />);
  const fileInput = screen.getByTestId("tt-import-file");
  fireEvent.change(fileInput, { target: { files: [new File(["csv"], "bad.csv", { type: "text/csv" })] } });
  expect(screen.getByRole("alert")).toHaveTextContent(/header/i);
});

test("ARIA: all ARIA live regions and confirm/cancel have proper roles and action", () => {
  render(<ImportExportPanel />);
  fireEvent.click(screen.getByTestId("import-courses"));
  expect(screen.getByRole("alert")).toBeInTheDocument();
  // Confirm and cancel buttons
  fireEvent.click(screen.getByText("Cancel"));
});
