import React, { useState } from "react";
import "./App.css";
import Navbar from "./Navbar";
import Notification, { NotificationRoot } from "./Notification";
import Dashboard from "./Dashboard";

/**
 * App component: main layout for CampusScheduleSync.
 * - Applies persistent Navbar and modular Notification system.
 * - Theme: green/white (see App.css).
 */
function App() {
  // Demo notification state (will move to context/store for full app)
  const [notifications, setNotifications] = useState([
    // { id: 1, type: "info", message: "Welcome to CampusScheduleSync!", onClose: () => { ... } },
  ]);

  const addNotification = (notif) => {
    const ts = Date.now();
    setNotifications((prev) => [
      ...prev,
      { ...notif, id: ts, onClose: () => removeNotification(ts) }
    ]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="app">
      <Navbar>
        {/* Navbar right side (can fill with nav/user/settings) */}
        <button className="btn" onClick={() => addNotification({ type: "info", message: "This is a demo notification!" })}>
          Demo Notify
        </button>
      </Navbar>

      <NotificationRoot notifications={notifications} />

      <main style={{ marginTop: 60 }}>
        <div className="container">
          {/* Replace hero with Dashboard main entry */}
          <Dashboard />
        </div>
      </main>
    </div>
  );
}

export default App;