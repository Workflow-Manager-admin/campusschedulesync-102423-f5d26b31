-- Sample Data Insertions for CampusScheduleSync
-- The following assumes 'id' columns are auto-incrementing or assigned as shown.

-- ===== FACULTY =====
INSERT INTO faculty (id, name, department, email, faculty_code) VALUES
  (1, 'Dr. Alice Martin', 'Computer Science', 'alice.martin@campus.edu', 'FAC001'),
  (2, 'Prof. Bob Gupta', 'Mechanical Engineering', 'bob.gupta@campus.edu', 'FAC002'),
  (3, 'Dr. Carol Lin', 'Physics', 'carol.lin@campus.edu', 'FAC003'),
  (4, 'Dr. David Osei', 'Mathematics', 'david.osei@campus.edu', 'FAC004'),
  (5, 'Prof. Emily Wang', 'Chemistry', 'emily.wang@campus.edu', 'FAC005'),
  (6, 'Dr. Frank Gomez', 'Civil Engineering', 'frank.gomez@campus.edu', 'FAC006'),
  (7, 'Prof. Grace Lee', 'Electrical Engineering', 'grace.lee@campus.edu', 'FAC007'),
  (8, 'Dr. Henry Kim', 'Biology', 'henry.kim@campus.edu', 'FAC008'),
  (9, 'Prof. Irene Petrova', 'History', 'irene.petrova@campus.edu', 'FAC009'),
  (10, 'Dr. Jack Novak', 'Philosophy', 'jack.novak@campus.edu', 'FAC010'),
  (11, 'Prof. Lara Singh', 'Economics', 'lara.singh@campus.edu', 'FAC011');

-- ===== ROOMS =====
INSERT INTO rooms (room_code, name, type, capacity)
VALUES
  ('RM001', 'A101', 'lecture', 40),
  ('RM002', 'B202', 'lecture', 35),
  ('RM003', 'C303', 'lecture', 60),
  ('RM004', 'D404', 'lecture', 25),
  ('RM005', 'Lab01', 'lab', 28),
  ('RM006', 'A102', 'lecture', 40),
  ('RM007', 'H201', 'lecture', 30),
  ('RM008', 'E505', 'seminar', 50),
  ('RM009', 'G301', 'lecture', 22),
  ('RM010', 'ArtRoom', 'lab', 20),
  ('RM011', 'ChemLab', 'lab', 30);

-- ===== COURSES =====
-- Removed faculty_id and room_id columns to match table schema.
INSERT INTO courses (id, code, name, department) VALUES
  (1, 'CS101', 'Intro to Computer Science', 'Computer Science'),
  (2, 'ME201', 'Thermodynamics', 'Mechanical Engineering'),
  (3, 'PHYS110', 'Classical Physics', 'Physics'),
  (4, 'MATH120', 'Calculus I', 'Mathematics'),
  (5, 'CHEM130', 'Organic Chemistry', 'Chemistry'),
  (6, 'CE210', 'Structural Analysis', 'Civil Engineering'),
  (7, 'EE220', 'Circuit Theory', 'Electrical Engineering'),
  (8, 'BIO101', 'General Biology', 'Biology'),
  (9, 'HIST150', 'World History', 'History'),
  (10, 'PHIL140', 'Introduction to Philosophy', 'Philosophy'),
  (11, 'ECON101', 'Principles of Economics', 'Economics');

-- ===== TIMETABLE_ENTRIES =====
-- Structure: (id, course_id, faculty_id, room_id, scheduled_date, start_time, end_time, week, recurrence_pattern, status, notes)
INSERT INTO timetable_entries (id, course_id, faculty_id, room_id, scheduled_date, start_time, end_time, week, recurrence_pattern)
VALUES
  (1, 1, 1, 1, '2024-01-08', '09:00', '10:30', 1, 'WEEKLY'),   -- CS101 in A101 Monday
  (2, 1, 1, 1, '2024-01-10', '09:00', '10:30', 1, 'WEEKLY'),   -- CS101 in A101 Wednesday
  (3, 2, 2, 3, '2024-01-09', '13:00', '14:30', 1, 'WEEKLY'),   -- ME201 in Engineering Wing Tuesday
  (4, 6, 6, 3, '2024-01-12', '15:00', '16:30', 1, 'WEEKLY'),   -- CE210 in Engineering Wing Friday
  (5, 3, 3, 2, '2024-01-11', '10:00', '11:30', 1, 'WEEKLY'),   -- PHYS110 in Science Block Thursday
  (6, 5, 5, 11, '2024-01-10', '11:00', '12:30', 1, 'WEEKLY'),  -- CHEM130 in ChemLab Wednesday
  (7, 8, 8, 7, '2024-01-08', '15:00', '16:30', 1, 'WEEKLY'),   -- BIO101 in Humanities Monday
  (8, 4, 4, 4, '2024-01-09', '09:00', '10:00', 1, 'WEEKLY'),   -- MATH120 in Mathematics Hall Tuesday
  (9, 7, 7, 8, '2024-01-11', '15:00', '16:30', 1, 'WEEKLY'),   -- EE220 in Innovation Center Thursday
  (10, 10, 10, 9, '2024-01-12', '10:30', '12:00', 1, 'WEEKLY'),-- PHIL140 in Library Annex Friday
  (11, 9, 9, 7, '2024-01-10', '12:00', '13:30', 1, 'WEEKLY'),  -- HIST150 in Humanities Wednesday
  (12, 11, 11, 6, '2024-01-12', '14:00', '15:30', 1, 'WEEKLY');-- ECON101 in Main Building Friday

-- All faculty_id, course_id, and room_id refer to valid, existing rows above.
-- Columns/fields align with timetable_entries definition in supabase_schema.sql
