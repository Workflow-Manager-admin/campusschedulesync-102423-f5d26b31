-- PATCH: Add 'department' column to courses table for CampusScheduleSync

ALTER TABLE courses
ADD COLUMN department VARCHAR(64);

-- Optionally, update all rows to some default if desired; here we leave as NULL
-- UPDATE courses SET department = 'N/A';

-- Rerun your Supabase UI or CLI migrations as needed.
-- After running, your table will match frontend app CRUD/import/export expectations!
