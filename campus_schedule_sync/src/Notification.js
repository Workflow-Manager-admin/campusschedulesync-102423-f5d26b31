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
  useEffect(() => {
    if (sticky) return;
    const timeoutId = setTimeout(() => {
      if (onClose) onClose();
    }, timeout);
    return () => clearTimeout(timeoutId);
  }, [timeout, sticky, onClose]);

  return (
    <div className={`notification ${type}`} role="status" aria-live="polite">
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
    <div className="notification-root">
      {notifications.map((n) => (
        <Notification key={n.id} {...n} />
      ))}
    </div>
  );
}

export default Notification;
