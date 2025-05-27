# CampusScheduleSync: Requirements & Implementation Strategy

## 1. Overview

CampusScheduleSync is a web-based timetable management application tailored for college IT departments. Built in React, it delivers comprehensive scheduling, course allocation, and resource management, and integrates directly with Supabase for real-time, scalable database operations.

This document is intended for developers and technical stakeholders, outlining exhaustive requirements, proposed technical architecture, and a clear implementation roadmap for steady and reliable project execution.

---

## 2. Functional Requirements

### 2.1. Timetable Scheduling
- Users can create, update, and view class timetables by course, department, and semester.
- Support for both simple single-day and complex weekly/multi-day patterns.
- Interactive grid/calendar view to navigate and manage timetables.
- Conflict detection (e.g., double-booking of resources, faculty, or rooms).

### 2.2. Course Allocation
- Assign courses to faculty/staff and allocate available rooms or resources.
- Visualize who is teaching what, when, and where.
- Bulk import/export of course allocation data (CSV, Excel).

### 2.3. Resource Management
- Manage rooms, labs, and special resources (e.g., A/V equipment).
- Track availability and usage status of all resources.
- Resource filtering and search by type, location, or features.

### 2.4. Supabase Integration
- Support real-time read and write to Supabase tables for schedules, resources, allocations.
- Handle authentication and secure client-side credentials.
- App provides a guided setup for users to configure their Supabase credentials and run database schema SQL manually.

### 2.5. User Experience
- Responsive UI: Usable on desktop and modern tablets.
- Clean, modern interface using a green (#2ecc40), white (#ffffff), and accent (#27ae60) theme.
- Initial "Setup Guide" screen for first-time configuration and connection to Supabase.
- Error-handling and guidance in the event of failed operations or misconfigurations.

---

## 3. Non-Functional Requirements

- **Performance:** Fast load times; react state management optimized for large data sets.
- **Reliability:** Graceful handling of API/offline errors; local caching (if feasible).
- **Security:** Protect Supabase keys and sensitive data via best practices.
- **Maintainability:** Modular components, clear folder structure, ESLint-configured codebase.
- **Accessibility:** Core features navigable with a keyboard and screen readers.
- **Scalability:** Can support large numbers of courses, resources, and schedules.
- **Documentation:** In-app and external setup instructions; code comments.

---

## 4. Architecture & Component Model

### 4.1. High-Level Architecture

```mermaid
graph TD
    A[App (Root)] --> B[Navbar]
    A --> C[Main Dashboard]
    C --> D[TimetableGrid]
    C --> E[CourseAllocation]
    C --> F[ResourceManager]
    A --> G[SetupGuide]
    A --> H[SupabaseProvider (Context)]
    H --> I[Data Hooks & Fetchers]
    style G fill:#2ecc40,color:#fff
```

### 4.2. Main Components

- **App**: Root component; manages high-level layout, routing, and setup state.
- **Navbar**: Persistent top navigation bar.
- **SetupGuide**: Onboards user to enter Supabase credentials and guides initial DB setup.
- **MainDashboard**: Hosts the main timetable, allocation, and resource management views.
- **TimetableGrid**: Calendar/grid UI for scheduling; supports interaction and editing.
- **CourseAllocation**: UI and logic for assigning courses, teachers, and rooms.
- **ResourceManager**: List/search/edit for all resources.
- **SupabaseProvider (Context)**: React context for managing Supabase config and authentication state globally.
- **Data Hooks**: Custom hooks (`useSchedules`, `useAllocations`, etc.) for CRUD operations with Supabase.

### 4.3. Data Models (Example Entities)
- **User**: id, name, role (admin/staff), authentication details
- **Course**: id, name, department, code
- **Faculty**: id, name, contact info, assigned courses
- **Timetable**: id, course_id, faculty_id, room_id, start_time, end_time, day(s)
- **Room/Resource**: id, name, type (lab/classroom/etc), capacity, availability

---

## 5. Implementation Plan

### 5.1. Initial Setup
- Scaffold project from lightweight React template.
- Set up ESLint, Prettier, and standardized code style.
- Prepare CSS color variables and theme in `App.css`.

### 5.2. Core Components & Routing
- Build `App`, `Navbar`, and routing logic (use `react-router` if needed).
- Implement the `SetupGuide` as landing screen with Supabase config fields.

### 5.3. Supabase Integration
- Integrate `@supabase/supabase-js` client.
- Create `SupabaseProvider` context to store and share configuration.
- Implement hooks for basic CRUD against Supabase: `useSupabase`, `useSchedules`, `useResources`, etc.
- Provide user guidance for pasting in Supabase API keys and running DB schema SQL.

### 5.4. Dashboard and Feature Modules
- Create the `MainDashboard` container.
- Develop `TimetableGrid` UI with creation and edit features; implement conflict checking.
- Create `CourseAllocation` and `ResourceManager` components with forms and real-time state updates.

### 5.5. Data Model Implementation
- Draft Supabase SQL schema scripts for key tables: Users, Courses, Faculty, Timetables, Resources.
- Ensure scripts can be run manually in the Supabase UI.

### 5.6. Advanced UX and Error Handling
- Add notification system for errors and success.
- Implement loading indicators and fallbacks for offline/in-progress API calls.
- Make all main views accessible and keyboard-navigable.

### 5.7. Finalization and Testing
- Manual and automated testing with Jest (setup already scaffolded).
- Detailed README and inline documentation.
- User walkthrough and troubleshooting scenarios in the Setup Guide.

### 5.8. Deployment
- Clean up dependencies.
- Provide notes for running, building, and deploying the application.

---

## 6. Development Roadmap (Step-by-Step)

1. **Project Bootstrap**
   - Confirm React/ESLint/Prettier setup.
2. **Theme & Layout**
   - Apply theme colors; build out basic layout and persistent navbar.
3. **Setup & Supabase Connection**
   - Implement SetupGuide; provide Supabase connection UX.
   - Add `SupabaseProvider` context for later feature work.
4. **DB Models & Supabase Scripts**
   - Deliver SQL schema files for users, courses, faculty, timetables, and rooms; test on Supabase.
5. **Dashboard Foundation**
   - Stub out dashboard shell and core views/tabs.
6. **Develop Feature Components**
   - Timetable, allocation, and resource management modules (UI, views, CRUD logic).
7. **Integration Hooks**
   - Add and validate all custom hooks for live Supabase data access.
8. **UX Enhancements & Validation**
   - Polish error handling, notifications, accessibility.
   - Edge-case testing (conflicts, missing config, network errors).
9. **Testing & Docs**
   - Expand test coverage and finish documentation.
10. **Polish & Release**
    - Final Q/A, dependency check, deployment setup.

---

## 7. Appendices

### 7.1. Technologies Used
- **Frontend:** React.js (ES6+), Context API, Custom Hooks
- **Styling:** Vanilla CSS (variables for color theme)
- **Backend/Data:** Supabase (manual SQL setup by user)
- **Testing:** Jest, @testing-library/react (pre-scaffolded)
- **Other:** ESLint, Prettier

### 7.2. Notes on Supabase Setup
- Secure API keys: Only store in memory or session, never commit to source code.
- Database schema must be manually applied by following supplied SQL instructions.
- All CRUD happens via Supabase client; no backend server is in scope.

---

### 7.3. Contact & Support

For technical support or contribution guidance, refer to the contributing section in the main README or contact the project maintainer.

---

*This requirements specification and implementation plan document is actively maintained and should be consulted and updated with each significant project milestone.*
