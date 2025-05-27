import { useState, useCallback, useRef } from "react";

/**
 * PUBLIC_INTERFACE
 * useDragDrop - Hook for managing drag-and-drop of timetable sessions.
 * Handles drag state, hovered cell, source/destination, drop event.
 *
 * @param {Object} options
 *   - sessions: timetable sessions array
 *   - onDrop: async (session, destCell) => Result object (may include conflict info)
 *
 * Returns: {
 *   draggingSession: session|undefined,
 *   dragState: "idle"|"dragging"|"dropping",
 *   dragOrigin: {day, time}|undefined,
 *   hovered: {day, time}|undefined,
 *   beginDrag(session, originCell),
 *   updateHover(day, time),
 *   endDrag(),
 *   handleDrop(destCell),
 * }
 */
function useDragDrop({ sessions, onDrop }) {
  const [draggingSession, setDraggingSession] = useState(null);
  const [dragOrigin, setDragOrigin] = useState(null); // {day, time}
  const [hovered, setHovered] = useState(null); // {day, time}
  const [dragState, setDragState] = useState("idle");
  const droppingRef = useRef(false);

  // Begin drag for a session
  const beginDrag = useCallback((session, originCell) => {
    setDraggingSession(session);
    setDragOrigin(originCell);
    setDragState("dragging");
    setHovered(null);
    droppingRef.current = false;
  }, []);
  
  // Update hovered drop cell
  const updateHover = useCallback((day, time) => {
    setHovered({ day, time });
  }, []);

  // Called on drop event
  const handleDrop = useCallback(
    async (destCell) => {
      if (!draggingSession || !destCell || droppingRef.current) return { status: "noop" };
      droppingRef.current = true;
      setDragState("dropping");
      try {
        // onDrop expects {session, destCell}
        const result = await onDrop(draggingSession, destCell);
        setDragState("idle");
        setDraggingSession(null);
        setDragOrigin(null);
        setHovered(null);
        droppingRef.current = false;
        return result;
      } catch (err) {
        setDragState("idle");
        setDraggingSession(null);
        setDragOrigin(null);
        setHovered(null);
        droppingRef.current = false;
        return { status: "error", error: err.message };
      }
    },
    [draggingSession, onDrop]
  );

  // End drag/cancel
  const endDrag = useCallback(() => {
    setDraggingSession(null);
    setDragOrigin(null);
    setDragState("idle");
    setHovered(null);
    droppingRef.current = false;
  }, []);

  return {
    draggingSession,
    dragState,
    dragOrigin,
    hovered,
    beginDrag,
    updateHover,
    handleDrop,
    endDrag,
  };
}

export default useDragDrop;
