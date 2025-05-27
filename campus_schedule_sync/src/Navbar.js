import React from "react";

// PUBLIC_INTERFACE
/**
 * Navbar: persistent green/white top bar for CampusScheduleSync.
 * Shows logo and provides right-side slot for actions (children).
 */
function Navbar({ children }) {
  return (
    <nav className="navbar" role="navigation" aria-label="main navigation">
      <div className="navbar-inner">
        <div className="logo" aria-label="CampusScheduleSync Home">
          <span className="logo-symbol">⟳</span>
          <span>CampusScheduleSync</span>
        </div>
        <div className="navbar-actions" data-testid="navbar-actions">
          {children}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;
