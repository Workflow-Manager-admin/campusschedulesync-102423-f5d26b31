import React, { useState } from "react";
import "./App.css";
import Navbar from "./Navbar";
import Notification, { NotificationRoot } from "./Notification";

/**
 * App component: main layout for CampusScheduleSync.
 * - Applies persistent Navbar and modular Notification system.
 * - Theme: green/white (see App.css).
 */
function App() {
  // Demo notification state (will move to context/store for full app)
  const [notifications, setNotifications] = useState([
    // Example on start:
    // { id: 1, type: "info", message: "Welcome to CampusScheduleSync!", onClose: () => { ... } },
  ]);

  const addNotification = (notif) => {
    setNotifications((prev) => [
      ...prev,
      { ...notif, id: Date.now(), onClose: () => removeNotification(Date.now()) }
    ]);
  };

  const removeNotification = (id) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  // Example way to show a notification (for demonstration, to be replaced in real usage)
  // React.useEffect(() => {
  //   addNotification({ type: "success", message: "Scheduling feature coming soon!" });
  // }, []);

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
          <div className="hero">
            <div className="subtitle">
              Timetable Management for Colleges • Modern, Fast, User-Friendly
            </div>
            <h1 className="title">CampusScheduleSync</h1>
            <div className="description">
              Efficient class, faculty, and resource scheduling. Real-time Supabase integration. Streamlined with an accessible green/white theme.
            </div>
            <button
              className="btn btn-large"
              onClick={() => addNotification({ type: "success", message: "Get started with timetable creation soon!" })}
            >
              Try Demo Action
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

export default App;