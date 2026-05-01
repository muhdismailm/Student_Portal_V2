-- -- 1. Enable UUID extension for generating unique IDs
-- CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -- 2. Create Profiles Table (Admins and Students)
-- CREATE TABLE IF NOT EXISTS public.profiles (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
--     name TEXT,
--     email TEXT UNIQUE,
--     mobile TEXT,
--     password TEXT, -- Stores plain text password
--     role TEXT DEFAULT 'student',
--     session TEXT, -- Used as the Register Number / Login ID for students
--     gender TEXT,
--     dob TEXT,
--     batch TEXT,
--     section TEXT,
--     guardian TEXT,
--     status TEXT DEFAULT 'Active',
--     place TEXT,
--     campus TEXT
-- );

-- -- 3. Create Academic Results Table
-- CREATE TABLE IF NOT EXISTS public.academic_results (
--     id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--     student_name TEXT,
--     register_number TEXT,
--     batch TEXT,
--     subject TEXT,
--     pass_mark NUMERIC,
--     marks NUMERIC,
--     grade TEXT,
--     date_posted TEXT
-- );

-- -- 4. Initial Admin User Setup
-- -- Login: admin@gmail.com / admin123
-- INSERT INTO public.profiles (name, email, password, role, status)
-- VALUES ('System Admin', 'admin@gmail.com', 'admin123', 'admin', 'Active')
-- ON CONFLICT (email) DO NOTHING;

-- -- 5. Row Level Security (RLS) Configuration
-- ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE public.academic_results ENABLE ROW LEVEL SECURITY;

-- -- Basic policy to allow public access via the anon key
-- CREATE POLICY "Public Read/Write Access" ON public.profiles FOR ALL USING (true);
-- CREATE POLICY "Public Read/Write Access" ON public.academic_results FOR ALL USING (true);
