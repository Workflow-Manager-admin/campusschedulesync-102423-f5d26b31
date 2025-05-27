-- Insert sample data for CampusScheduleSync
-- First insert rooms, courses, faculty with explicit IDs and required NOT NULL columns
-- Then insert timetable_entries with correct referencing IDs

-- Rooms (ensure room_code is unique and non-null for every room)
INSERT INTO rooms (id, room_code, name, capacity, type)
VALUES 
  (1, 'RM001', 'Room A', 30, 'Lecture Hall'),
  (2, 'RM002', 'Room B', 25, 'Lecture Hall'),
  (3, 'RM003', 'Lab 1', 20, 'Laboratory');

-- Courses
INSERT INTO courses (id, code, name, department)
VALUES 
  (1, 'CS101', 'Introduction to Computer Science', 'Computer Science'),
  (2, 'MATH201', 'Calculus I', 'Mathematics'),
  (3, 'PHY301', 'Physics Basics', 'Physics');

-- Faculty
-- Ensure unique, non-null faculty_code for every faculty row, and all NOT NULL columns populated
INSERT INTO faculty (id, name, department, email, faculty_code)
VALUES 
  (1, 'Dr. Alice Smith', 'Computer Science', 'alice.smith@university.edu', 'FAC001'),
  (2, 'Dr. Bob Johnson', 'Mathematics', 'bob.johnson@university.edu', 'FAC002'),
  (3, 'Dr. Carol Lee', 'Physics', 'carol.lee@university.edu', 'FAC003');

-- Timetable Entries (ensure all foreign keys are valid: room_id, course_id, faculty_id)
-- Only include columns present in the latest schema:
-- id, course_id, faculty_id, room_id, scheduled_date, start_time, end_time
INSERT INTO timetable_entries (id, course_id, faculty_id, room_id, scheduled_date, start_time, end_time)
VALUES
  (1, 1, 1, 1, '2024-06-03', '09:00', '10:00'),    -- CS101, Dr. Alice, Room A
  (2, 2, 2, 2, '2024-06-03', '10:00', '11:00'),    -- MATH201, Dr. Bob, Room B
  (3, 3, 3, 3, '2024-06-04', '11:00', '12:00'),    -- PHY301, Dr. Carol, Lab 1
  (4, 1, 1, 1, '2024-06-05', '09:00', '10:00'),    -- CS101, Dr. Alice, Room A
  (5, 2, 2, 2, '2024-06-06', '10:00', '11:00'),    -- MATH201, Dr. Bob, Room B
  (6, 3, 3, 3, '2024-06-07', '11:00', '12:00');    -- PHY301, Dr. Carol, Lab 1

-- (Optional) Add a few more with only valid foreign keys if needed
-- INSERT INTO timetable_entries (...) VALUES (...);

