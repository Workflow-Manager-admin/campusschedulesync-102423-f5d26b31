import React, { useEffect } from "react";

// PUBLIC_INTERFACE
/**
 * Notification: displays a notification (toast) message.
 * Supports: info, success, error. Dismisses automatically after `timeout` ms unless sticky.
 *
 * @param {string} type - "info" | "success" | "error"
 * @param {string} message - Main notification message
 * @param {function} [onClose] - Callback when notification is dismissed
 * @param {number} [timeout=3500] - Time in milliseconds before auto-close
 * @param {boolean} [sticky=false] - If true, will not auto-dismiss
 */
function Notification({ type = "info", message, onClose, timeout = 3500, sticky = false }) {
  const notifRef = React.useRef(null);
  // Auto-focus when shown for a11y (optional for screen reader jump)
  React.useEffect(() => {
    if (notifRef.current) notifRef.current.focus();
  }, []);
  // Close on escape key when notification is in focus
  React.useEffect(() => {
    const escHandler = (e) => {
      if ((e.key === "Escape" || e.keyCode === 27) && onClose) {
        onClose();
      }
    };
    if (notifRef.current) {
      notifRef.current.addEventListener("keydown", escHandler);
      return () => notifRef.current && notifRef.current.removeEventListener("keydown", escHandler);
    }
  }, [onClose]);
  // Auto-close unless sticky
  useEffect(() => {
    if (sticky) return;
    const timeoutId = setTimeout(() => {
      if (onClose) onClose();
    }, timeout);
    return () => clearTimeout(timeoutId);
  }, [timeout, sticky, onClose]);

  return (
    <div
      className={`notification ${type}`}
      ref={notifRef}
      role="status"
      aria-live={type === "error" ? "assertive" : "polite"}
      tabIndex={0}
      aria-atomic="true"
      style={{ outline: "none" }}
    >
      <div className="notification-content">{message}</div>
      {onClose && (
        <button
          className="notification-close"
          onClick={onClose}
          title="Close"
          aria-label="Close notification"
        >
          ×
        </button>
      )}
    </div>
  );
}

/**
 * NotificationRoot: Wraps and displays a list of notifications. (Typically rendered at app root)
 * @param {Array<{ id, type, message, onClose }>} notifications
 */
export function NotificationRoot({ notifications }) {
  return (
    <div
      className="notification-root"
      role="region"
      aria-label="Notification area"
      aria-live={
        notifications.length > 0 && notifications[0].type === "error"
          ? "assertive"
          : "polite"
      }
      tabIndex={-1}
      aria-relevant="additions text"
      aria-atomic="true"
    >
      {notifications.map((n) => (
        <Notification key={n.id} {...n} />
      ))}
    </div>
  );
}

export default Notification;
