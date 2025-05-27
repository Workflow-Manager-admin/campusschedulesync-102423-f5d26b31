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
INSERT INTO rooms (id, name, building, capacity) VALUES
  (1, 'A101', 'Main Building', 40),
  (2, 'B202', 'Science Block', 35),
  (3, 'C303', 'Engineering Wing', 60),
  (4, 'D404', 'Mathematics Hall', 25),
  (5, 'Lab01', 'Lab Complex', 28),
  (6, 'A102', 'Main Building', 40),
  (7, 'H201', 'Humanities', 30),
  (8, 'E505', 'Innovation Center', 50),
  (9, 'G301', 'Library Annex', 22),
  (10, 'ArtRoom', 'Arts Block', 20),
  (11, 'ChemLab', 'Science Block', 30);

-- ===== COURSES =====
INSERT INTO courses (id, code, name, department, faculty_id, room_id) VALUES
  (1, 'CS101', 'Intro to Computer Science', 'Computer Science', 1, 1),
  (2, 'ME201', 'Thermodynamics', 'Mechanical Engineering', 2, 3),
  (3, 'PHYS110', 'Classical Physics', 'Physics', 3, 2),
  (4, 'MATH120', 'Calculus I', 'Mathematics', 4, 4),
  (5, 'CHEM130', 'Organic Chemistry', 'Chemistry', 5, 11),
  (6, 'CE210', 'Structural Analysis', 'Civil Engineering', 6, 3),
  (7, 'EE220', 'Circuit Theory', 'Electrical Engineering', 7, 8),
  (8, 'BIO101', 'General Biology', 'Biology', 8, 7),
  (9, 'HIST150', 'World History', 'History', 9, 7),
  (10, 'PHIL140', 'Introduction to Philosophy', 'Philosophy', 10, 9),
  (11, 'ECON101', 'Principles of Economics', 'Economics', 11, 6);

-- ===== TIMETABLE_ENTRIES =====
-- Example structure: (id, course_id, faculty_id, room_id, day_of_week, start_time, end_time)
INSERT INTO timetable_entries (id, course_id, faculty_id, room_id, day_of_week, start_time, end_time) VALUES
  (1, 1, 1, 1, 'Monday', '09:00', '10:30'),   -- CS101 in A101 
  (2, 1, 1, 1, 'Wednesday', '09:00', '10:30'), -- CS101 in A101 
  (3, 2, 2, 3, 'Tuesday', '13:00', '14:30'),  -- ME201 in Engineering Wing
  (4, 6, 6, 3, 'Friday', '15:00', '16:30'),   -- CE210 in Engineering Wing
  (5, 3, 3, 2, 'Thursday', '10:00', '11:30'), -- PHYS110 in Science Block
  (6, 5, 5, 11, 'Wednesday', '11:00', '12:30'), -- CHEM130 in ChemLab
  (7, 8, 8, 7, 'Monday', '15:00', '16:30'),   -- BIO101 in Humanities
  (8, 4, 4, 4, 'Tuesday', '09:00', '10:00'),  -- MATH120 in Mathematics Hall
  (9, 7, 7, 8, 'Thursday', '15:00', '16:30'), -- EE220 in Innovation Center
  (10, 10, 10, 9, 'Friday', '10:30', '12:00'), -- PHIL140 in Library Annex
  (11, 9, 9, 7, 'Wednesday', '12:00', '13:30'), -- HIST150 in Humanities
  (12, 11, 11, 6, 'Friday', '14:00', '15:30');  -- ECON101 in Main Building

-- All faculty_id, course_id, and room_id refer to valid, existing rows above.
-- Adjust datatypes, field names, and fields as per your real schema if needed.
