import { renderHook, act } from "@testing-library/react-hooks";
import useDragDrop from "./useDragDrop";

describe("useDragDrop", () => {
  const sessions = [
    { id: 1, name: "A" },
    { id: 2, name: "B" },
  ];
  const mockSession = sessions[0];
  const originCell = { day: "Monday", time: "09:00" };
  const destCell = { day: "Tuesday", time: "10:00" };

  it("starts in idle state", () => {
    const { result } = renderHook(() =>
      useDragDrop({ sessions, onDrop: jest.fn() })
    );
    expect(result.current.dragState).toBe("idle");
    expect(result.current.draggingSession).toBeNull();
    expect(result.current.dragOrigin).toBeNull();
    expect(result.current.hovered).toBeNull();
  });

  it("beginDrag sets session and origin, state 'dragging'", () => {
    const { result } = renderHook(() =>
      useDragDrop({ sessions, onDrop: jest.fn() })
    );
    act(() => {
      result.current.beginDrag(mockSession, originCell);
    });
    expect(result.current.dragState).toBe("dragging");
    expect(result.current.draggingSession).toBe(mockSession);
    expect(result.current.dragOrigin).toEqual(originCell);
    expect(result.current.hovered).toBeNull();
  });

  it("updateHover sets hovered cell", () => {
    const { result } = renderHook(() =>
      useDragDrop({ sessions, onDrop: jest.fn() })
    );
    act(() => {
      result.current.beginDrag(mockSession, originCell);
      result.current.updateHover("Tuesday", "10:00");
    });
    expect(result.current.hovered).toEqual({ day: "Tuesday", time: "10:00" });
  });

  it("handleDrop: success outcome", async () => {
    const onDrop = jest.fn().mockResolvedValue({ status: "success" });
    const { result, waitForNextUpdate } = renderHook(() =>
      useDragDrop({ sessions, onDrop })
    );
    act(() => {
      result.current.beginDrag(mockSession, originCell);
    });
    await act(async () => {
      const outcome = await result.current.handleDrop(destCell);
      expect(onDrop).toHaveBeenCalledWith(mockSession, destCell);
      expect(outcome).toEqual({ status: "success" });
    });
    expect(result.current.dragState).toBe("idle");
    expect(result.current.draggingSession).toBeNull();
    expect(result.current.dragOrigin).toBeNull();
    expect(result.current.hovered).toBeNull();
  });

  it("handleDrop: error outcome", async () => {
    const onDrop = jest.fn().mockRejectedValue(new Error("fail reason"));
    const { result } = renderHook(() =>
      useDragDrop({ sessions, onDrop })
    );
    act(() => {
      result.current.beginDrag(mockSession, originCell);
    });
    await act(async () => {
      const resultObj = await result.current.handleDrop(destCell);
      expect(resultObj.status).toBe("error");
      expect(resultObj.error).toBe("fail reason");
    });
    expect(result.current.dragState).toBe("idle");
    expect(result.current.draggingSession).toBeNull();
  });

  it("endDrag resets drag state", () => {
    const { result } = renderHook(() =>
      useDragDrop({ sessions, onDrop: jest.fn() })
    );
    act(() => {
      result.current.beginDrag(mockSession, originCell);
      result.current.endDrag();
    });
    expect(result.current.draggingSession).toBeNull();
    expect(result.current.dragOrigin).toBeNull();
    expect(result.current.dragState).toBe("idle");
    expect(result.current.hovered).toBeNull();
  });

  it("handleDrop ignored if no session, destCell, or double-call", async () => {
    const onDrop = jest.fn();
    const { result } = renderHook(() =>
      useDragDrop({ sessions, onDrop })
    );
    await act(async () => {
      // No drag started yet
      const res = await result.current.handleDrop(destCell);
      expect(res).toEqual({ status: "noop" });
      // Start drag, but pass no destCell
      result.current.beginDrag(mockSession, originCell);
      const res2 = await result.current.handleDrop(null);
      expect(res2).toEqual({ status: "noop" });
    });
  });
});
