import React from "react";
import { render, fireEvent, screen, act } from "@testing-library/react";
import CourseAllocation from "./CourseAllocation";

jest.mock("./SupabaseProvider", () => ({
  useSupabase: () => ({
    from: jest.fn(() => ({
      select: jest.fn(() => ({ data: [{ id: 1, name: "C1", code: "C1C" }], error: null })),
      insert: jest.fn(() => ({ error: null })),
      delete: jest.fn(() => ({ eq: jest.fn(() => ({ error: null })) })),
    })),
  }),
}));

jest.mock("./Notification", () => (props) => (
  <div data-testid="notifier" role="alert">{props.type}:{props.message}</div>
));

const baseAlloc = [{
  id: 5, course_id: 1, faculty_id: 1, classes_per_week: 5
}];
const faculty = [
  { id: 1, name: "F1", email: "f1@x.com" },
  { id: 2, name: "F2", email: "f2@x.com" }
];
const courses = [
  { id: 1, name: "C1", code: "C1C" },
  { id: 2, name: "C2", code: "C2C" }
];

beforeEach(() => {
  jest.resetModules();
});

test("renders allocations and form, submits valid new allocation", async () => {
  // Overwrite fetch for test-data control
  const actualModule = jest.requireActual("./SupabaseProvider");
  actualModule.useSupabase = () => ({
    from: jest.fn((t) => {
      if (t === "courses") return { select: () => ({ data: courses }) };
      if (t === "faculty") return { select: () => ({ data: faculty }) };
      if (t === "allocations") return { select: () => ({ data: baseAlloc }) };
      return { select: () => ({ data: [] }) };
    }),
  });
  render(<CourseAllocation />);
  expect(screen.getByText(/Current Allocations/i)).toBeInTheDocument();
  // Can submit form
  fireEvent.change(screen.getByLabelText(/Course:/i), { target: { value: 2 } });
  fireEvent.change(screen.getByLabelText(/Faculty:/i), { target: { value: 2 } });
  fireEvent.change(screen.getByLabelText(/Classes per week/i), { target: { value: 3 } });

  await act(async () => {
    fireEvent.click(screen.getByText("Allocate"));
  });
  // Success feedback is displayed via Notification
});

test("cannot assign >12 classes per allocation", async () => {
  render(<CourseAllocation />);
  fireEvent.change(screen.getByLabelText(/Course:/i), { target: { value: 1 } });
  fireEvent.change(screen.getByLabelText(/Faculty:/i), { target: { value: 1 } });
  fireEvent.change(screen.getByLabelText(/Classes per week/i), { target: { value: 18 } });
  await act(async () => {
    fireEvent.click(screen.getByText("Allocate"));
  });
  expect(screen.getByRole("alert")).toHaveTextContent(/assign more than 12/);
});

test("prevents duplicate allocations per faculty/course", async () => {
  render(<CourseAllocation />);
  // Assign course 1, faculty 1 again (already exists in baseAlloc)
  fireEvent.change(screen.getByLabelText(/Course:/i), { target: { value: 1 } });
  fireEvent.change(screen.getByLabelText(/Faculty:/i), { target: { value: 1 } });
  fireEvent.change(screen.getByLabelText(/Classes per week/i), { target: { value: 1 } });
  await act(async () => {
    fireEvent.click(screen.getByText("Allocate"));
  });
  expect(screen.getByRole("alert")).toHaveTextContent(/already allocated/);
});

test("prevents exceeding max 12/week per faculty across allocations", async () => {
  // facultyClassCounts maps id1 => 5, adding 8 => 13
  render(<CourseAllocation />);
  fireEvent.change(screen.getByLabelText(/Course:/i), { target: { value: 2 } });
  fireEvent.change(screen.getByLabelText(/Faculty:/i), { target: { value: 1 } });
  fireEvent.change(screen.getByLabelText(/Classes per week/i), { target: { value: 8 } });
  await act(async () => {
    fireEvent.click(screen.getByText("Allocate"));
  });
  expect(screen.getByRole("alert")).toHaveTextContent(/would exceed 12 classes/);
});

test("removes allocation on confirmation", async () => {
  window.confirm = jest.fn(() => true);
  render(<CourseAllocation />);
  // Remove allocation button
  await act(async () => {
    fireEvent.click(screen.getByLabelText(/Remove allocation/i));
  });
  expect(window.confirm).toHaveBeenCalled();
});

test("a11y: form labels connect to inputs", () => {
  render(<CourseAllocation />);
  expect(screen.getByLabelText(/Course:/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Faculty:/i)).toBeInTheDocument();
  expect(screen.getByLabelText(/Classes per week/i)).toBeInTheDocument();
});
