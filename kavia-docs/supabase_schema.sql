-- CampusScheduleSync Supabase SQL Schema
-- This file defines all tables, relationships, indexes, and critical constraints
-- for use with Supabase (PostgreSQL). Please review before applying to your instance.

-- ===========================================
-- 1. COURSES TABLE
-- ===========================================
CREATE TABLE courses (
    id SERIAL PRIMARY KEY,
    code VARCHAR(16) NOT NULL UNIQUE, -- e.g. "CSC101"
    name VARCHAR(128) NOT NULL,
    description TEXT,
    requirements TEXT, -- JSON or comma-separated list of pre-req course codes
    semester SMALLINT,
    credits INTEGER,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- 2. FACULTY TABLE
-- ===========================================
CREATE TABLE faculty (
    id SERIAL PRIMARY KEY,
    faculty_code VARCHAR(16) UNIQUE NOT NULL,
    name VARCHAR(128) NOT NULL,
    email VARCHAR(128) UNIQUE NOT NULL,
    phone VARCHAR(32),
    department VARCHAR(64),
    profile TEXT,
    status VARCHAR(32) DEFAULT 'active',  -- active/inactive/on_leave, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
    -- class_load will be computed/joined, not stored here (see below)
);

-- ===========================================
-- 3. ROOMS/RESOURCES TABLE
-- ===========================================
CREATE TABLE rooms (
    id SERIAL PRIMARY KEY,
    room_code VARCHAR(32) UNIQUE NOT NULL, -- e.g. "B201"
    name VARCHAR(128),           -- e.g. "Physics Lab"
    type VARCHAR(32) NOT NULL,   -- e.g. "lecture", "lab", "seminar"
    capacity INTEGER NOT NULL,
    features TEXT,               -- JSON or CSV for extra details, e.g., projector, AC
    is_available BOOLEAN DEFAULT TRUE,
    location VARCHAR(128),       
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- ===========================================
-- 4. TIMETABLE ENTRIES TABLE
-- ===========================================
CREATE TABLE timetable_entries (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE ON UPDATE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE ON UPDATE CASCADE,
    -- Use block start/end for flexibility; or use a single block column for time slots
    scheduled_date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    -- e.g. "2024-01-12", 09:00, 10:00 = Monday 9-10AM
    -- Optionally, add a recurring pattern column (not enforced by schema)
    recurrence_pattern VARCHAR(32),
    week SMALLINT, -- Used for week-of-semester or to filter max-classes-of-faculty
    status VARCHAR(32) DEFAULT 'scheduled', -- scheduled, cancelled, etc.
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT fk_timetable_course FOREIGN KEY(course_id) REFERENCES courses(id) ON DELETE CASCADE,
    CONSTRAINT fk_timetable_faculty FOREIGN KEY(faculty_id) REFERENCES faculty(id) ON DELETE CASCADE,
    CONSTRAINT fk_timetable_room FOREIGN KEY(room_id) REFERENCES rooms(id) ON DELETE CASCADE
);

-- ===========================================
-- 5. FACULTY-COURSE ALLOCATION (Many:Many) TABLE
-- ===========================================
-- If a faculty can teach multiple courses, and each course may have multiple eligible faculty
CREATE TABLE faculty_course_allocations (
    id SERIAL PRIMARY KEY,
    faculty_id INTEGER NOT NULL REFERENCES faculty(id) ON DELETE CASCADE ON UPDATE CASCADE,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE ON UPDATE CASCADE,
    assigned_by VARCHAR(64), -- for auditing/admin
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_faculty_course UNIQUE (faculty_id, course_id)
);

-- ===========================================
-- 6. COURSE-ROOM ALLOCATION (Optional: restrict which rooms a course can use)
-- ===========================================
CREATE TABLE course_room_allocations (
    id SERIAL PRIMARY KEY,
    course_id INTEGER NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    room_id INTEGER NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
    notes TEXT,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    CONSTRAINT unique_course_room UNIQUE (course_id, room_id)
);

-- ===========================================
-- 7. INDEXES
-- ===========================================

-- Fast search on timetable associations
CREATE INDEX idx_timetable_faculty ON timetable_entries (faculty_id);
CREATE INDEX idx_timetable_course ON timetable_entries (course_id);
CREATE INDEX idx_timetable_room ON timetable_entries (room_id);
CREATE INDEX idx_timetable_date ON timetable_entries (scheduled_date);

-- For looking up all classes for a given faculty by week, add:
CREATE INDEX idx_timetable_faculty_week ON timetable_entries (faculty_id, week);

-- ===========================================
-- 8. CONSTRAINTS/COMMENTS
-- ===========================================

-- Application-level constraint comment:
-- Supabase/Postgres cannot directly limit a faculty to max 12 sessions per week in the schema.
-- Please enforce the "max 12 classes assigned to a faculty per week" policy in the application logic.
COMMENT ON TABLE timetable_entries IS 'Enforce: No more than 12 sessions assigned to a faculty per week at the application level.';

-- Optionally, use a view to summarize teaching loads:
CREATE VIEW faculty_weekly_class_count AS
SELECT 
    faculty_id, 
    week, 
    COUNT(*) AS session_count
FROM timetable_entries
GROUP BY faculty_id, week;

-- This view can help your app/query enforce or monitor load limits. Use it in frontend logic.

-- ===========================================
-- 9. SAMPLE DATA (REMOVE IN PROD; for testing only)
-- ===========================================
-- INSERT INTO courses (code, name, description, semester, credits) VALUES ('CSC101', 'Intro to CS', 'Basics...', 1, 4);
-- INSERT INTO faculty (faculty_code, name, email) VALUES ('FAC031', 'Prof. Arun', 'arun@univ.edu');
-- INSERT INTO rooms (room_code, type, capacity) VALUES ('B201', 'lecture', 60);
-- INSERT INTO timetable_entries (course_id, faculty_id, room_id, scheduled_date, start_time, end_time, week)
--   VALUES (1, 1, 1, '2024-01-12', '09:00', '10:00', 1);

-- ===========================================
-- END OF SCHEMA
-- ===========================================
