-- PATCH: Ensure all relevant 'id' columns are integer autoincrement (SERIAL/BIGSERIAL).
-- This resolves errors with missing/NULL primary keys and allows record/bulk creation/import without specifying the ID.

-- STEP 1: Patch TABLES to ensure 'id' is integer autoincrement with a sequence as default
-- This file is safe for repeated execution and will NOT DROP or remove constraints or columns.
-- NO UUID, NO gen_random_uuid, NO type casting!

-- COURSES TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='courses' AND column_name='id'
    ) THEN
        EXECUTE 'ALTER TABLE courses ALTER COLUMN id SET DEFAULT nextval(''courses_id_seq'');';
    END IF;
END$$;

-- FACULTY TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='faculty' AND column_name='id'
    ) THEN
        EXECUTE 'ALTER TABLE faculty ALTER COLUMN id SET DEFAULT nextval(''faculty_id_seq'');';
    END IF;
END$$;

-- ROOMS TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='rooms' AND column_name='id'
    ) THEN
        EXECUTE 'ALTER TABLE rooms ALTER COLUMN id SET DEFAULT nextval(''rooms_id_seq'');';
    END IF;
END$$;

-- TIMETABLE_ENTRIES TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='timetable_entries' AND column_name='id'
    ) THEN
        EXECUTE 'ALTER TABLE timetable_entries ALTER COLUMN id SET DEFAULT nextval(''timetable_entries_id_seq'');';
    END IF;
END$$;

-- FACULTY_COURSE_ALLOCATIONS TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='faculty_course_allocations' AND column_name='id'
    ) THEN
        EXECUTE 'ALTER TABLE faculty_course_allocations ALTER COLUMN id SET DEFAULT nextval(''faculty_course_allocations_id_seq'');';
    END IF;
END$$;

-- COURSE_ROOM_ALLOCATIONS TABLE
DO $$
BEGIN
    IF EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_name='course_room_allocations' AND column_name='id'
    ) THEN
        EXECUTE 'ALTER TABLE course_room_allocations ALTER COLUMN id SET DEFAULT nextval(''course_room_allocations_id_seq'');';
    END IF;
END$$;

-- INSTRUCTIONS:
-- 1. Run this file in your Supabase SQL editor or psql. It is safe to run multiple times.
-- 2. If you encounter errors stating the sequence does not exist, your table may be missing an auto-increment;
--    you may need to CREATE SEQUENCE and ensure the column is integer first, then rerun this patch.
-- 3. All foreign key fields are expected to be integers—never uuid!
-- 4. Avoid adding/removing columns in this patch; convert those separately to prevent data loss.
-- 5. For new tables, regenerate using `SERIAL` or `BIGSERIAL` primary keys as seen in the main schema.
