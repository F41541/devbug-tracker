-- ==============================================================================
-- DEVBUG TRACKER - TOTAL UUID DATABASE SCHEMA (RESET & MIGRATION)
-- ==============================================================================

-- 0. Reset Existing Tables
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.bug_items CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- 1. Create Projects Table (UUID Primary Key)
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    color VARCHAR(20) DEFAULT '#6366f1',
    repository_url TEXT,
    tech_stack TEXT[] DEFAULT '{}',
    package_manager VARCHAR(50) DEFAULT 'npm',
    test_command TEXT DEFAULT 'npm test',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Create Bug Items Table (UUID Primary Key & UUID Foreign Key)
CREATE TABLE public.bug_items (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    environment VARCHAR(255),
    status VARCHAR(50) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    severity VARCHAR(50) DEFAULT 'medium' CHECK (severity IN ('critical', 'high', 'medium', 'low')),
    investigation_state VARCHAR(50) DEFAULT 'unconfirmed' CHECK (investigation_state IN ('unconfirmed', 'reproduced', 'root_cause_isolated', 'fix_in_progress', 'fix_blocked', 'verified')),
    reproduction_reliability VARCHAR(50) DEFAULT 'untested' CHECK (reproduction_reliability IN ('untested', 'deterministic', 'intermittent', 'cannot_reproduce')),
    fix_hint TEXT,
    suspected_files TEXT[] DEFAULT '{}',
    confirmed_files TEXT[] DEFAULT '{}',
    root_cause TEXT,
    failed_attempts JSONB DEFAULT '[]'::jsonb,
    branch_name VARCHAR(255),
    base_commit_sha VARCHAR(100),
    resolved_commit VARCHAR(100),
    stack_trace TEXT,
    steps_to_reproduce TEXT,
    expected_result TEXT,
    actual_result TEXT,
    resolved_at TIMESTAMPTZ,
    "order" INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Create Attachments Table (UUID Primary Key & UUID Foreign Key)
CREATE TABLE public.attachments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    bug_item_id UUID REFERENCES public.bug_items(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(100) NOT NULL,
    file_size BIGINT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Create API Keys Table (UUID Primary Key)
CREATE TABLE public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(50) NOT NULL,
    raw_key TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 6. Create RLS Policies (Allow Authenticated Admin full access)
CREATE POLICY "Allow authenticated users all on projects" ON public.projects
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users all on bug_items" ON public.bug_items
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users all on attachments" ON public.attachments
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

CREATE POLICY "Allow authenticated users all on api_keys" ON public.api_keys
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 7. Setup Supabase Storage Bucket for screenshots
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit) 
VALUES ('bug-attachments', 'bug-attachments', true, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'], 10485760)
ON CONFLICT (id) DO UPDATE SET 
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    file_size_limit = EXCLUDED.file_size_limit;

-- Storage policies
CREATE POLICY "Public Access for bug-attachments" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'bug-attachments');

CREATE POLICY "Authenticated users can upload to bug-attachments" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bug-attachments');

CREATE POLICY "Authenticated users can delete from bug-attachments" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'bug-attachments');
