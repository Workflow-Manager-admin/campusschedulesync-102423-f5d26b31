import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import ConflictModal from "./ConflictModal";

test("renders nothing if open is false", () => {
  render(<ConflictModal open={false} conflicts={[]} canOverride={false} onClose={jest.fn()} onOverride={jest.fn()} />);
  expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
});

test("renders conflict list and non-override text when canOverride is false", () => {
  render(
    <ConflictModal
      open={true}
      conflicts={[{ message: "Room is double-booked" }, { message: "Faculty not available" }]}
      canOverride={false}
      onClose={jest.fn()}
      onOverride={jest.fn()}
    />
  );
  expect(screen.getByRole("dialog")).toBeInTheDocument();
  expect(screen.getByText(/Room is double-booked/)).toBeInTheDocument();
  expect(screen.getByText(/Faculty not available/)).toBeInTheDocument();
  expect(screen.getByText(/cannot be overridden/i)).toBeInTheDocument();
  expect(screen.queryByText(/Override & Proceed/)).not.toBeInTheDocument();
});

test("renders override button and click triggers event", () => {
  const mockOverride = jest.fn();
  render(
    <ConflictModal
      open={true}
      conflicts={[{ message: "Policy violation only" }]}
      canOverride={true}
      onClose={jest.fn()}
      onOverride={mockOverride}
    />
  );
  expect(screen.getByText(/Override & Proceed/i)).toBeInTheDocument();
  fireEvent.click(screen.getByText(/Override & Proceed/i));
  expect(mockOverride).toHaveBeenCalled();
});

test("close button triggers onClose and dialog closes", () => {
  const mockClose = jest.fn();
  render(
    <ConflictModal
      open={true}
      conflicts={[{ message: "Test conflict" }]}
      canOverride={false}
      onClose={mockClose}
      onOverride={jest.fn()}
    />
  );
  fireEvent.click(screen.getByText(/Close/i));
  expect(mockClose).toHaveBeenCalled();
});

test("a11y: modal role, ARIA attributes present", () => {
  render(
    <ConflictModal
      open={true}
      conflicts={[]}
      canOverride={false}
      onClose={jest.fn()}
      onOverride={jest.fn()}
    />
  );
  const dialog = screen.getByRole("dialog");
  expect(dialog).toHaveAttribute("aria-modal", "true");
});
