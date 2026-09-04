-- ==============================================================================
-- DEVBUG TRACKER - PRODUCTION DATABASE SCHEMA (PLUG & PLAY SETUP)
-- Run this entire script in your Supabase SQL Editor to initialize or reset.
-- ==============================================================================

-- 0. Enable Essential PostgreSQL Extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Clean Reset of Existing Tables
DROP TABLE IF EXISTS public.attachments CASCADE;
DROP TABLE IF EXISTS public.bug_items CASCADE;
DROP TABLE IF EXISTS public.api_keys CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

-- 2. Create Projects Table
CREATE TABLE public.projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
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

-- 3. Create Bug Items Table
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

-- 4. Create Attachments Table
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

-- 5. Create API Keys Table
CREATE TABLE public.api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
    name VARCHAR(255) NOT NULL,
    key_hash VARCHAR(255) NOT NULL UNIQUE,
    key_prefix VARCHAR(50) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    last_used_at TIMESTAMPTZ
);

-- 6. Create Database Indexes for High-Performance Queries
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_bug_items_project_id ON public.bug_items(project_id);
CREATE INDEX IF NOT EXISTS idx_bug_items_status ON public.bug_items(status);
CREATE INDEX IF NOT EXISTS idx_bug_items_severity ON public.bug_items(severity);
CREATE INDEX IF NOT EXISTS idx_bug_items_created_at ON public.bug_items(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_attachments_bug_item_id ON public.attachments(bug_item_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON public.api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON public.api_keys(user_id);

-- 7. Enable Row Level Security (RLS)
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bug_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attachments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.api_keys ENABLE ROW LEVEL SECURITY;

-- 8. Define RLS Policies (User-isolated multi-tenant with fallback to unassigned legacy data)
CREATE POLICY "Users can manage own projects" ON public.projects
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL)
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can manage bugs in accessible projects" ON public.bug_items
    FOR ALL TO authenticated
    USING (
      project_id IS NULL OR project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid() OR user_id IS NULL
      )
    )
    WITH CHECK (
      project_id IS NULL OR project_id IN (
        SELECT id FROM public.projects WHERE user_id = auth.uid() OR user_id IS NULL
      )
    );

CREATE POLICY "Users can manage attachments in accessible bugs" ON public.attachments
    FOR ALL TO authenticated
    USING (
      bug_item_id IN (
        SELECT b.id FROM public.bug_items b
        LEFT JOIN public.projects p ON b.project_id = p.id
        WHERE p.id IS NULL OR p.user_id = auth.uid() OR p.user_id IS NULL
      )
    )
    WITH CHECK (
      bug_item_id IN (
        SELECT b.id FROM public.bug_items b
        LEFT JOIN public.projects p ON b.project_id = p.id
        WHERE p.id IS NULL OR p.user_id = auth.uid() OR p.user_id IS NULL
      )
    );

CREATE POLICY "Users can manage own api_keys" ON public.api_keys
    FOR ALL TO authenticated
    USING (user_id = auth.uid() OR user_id IS NULL)
    WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

-- 9. Setup Supabase Realtime Broadcasting
ALTER TABLE public.projects REPLICA IDENTITY FULL;
ALTER TABLE public.bug_items REPLICA IDENTITY FULL;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'projects'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.projects;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'bug_items'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE public.bug_items;
    END IF;
END $$;

-- 10. Setup Storage Bucket for Bug Attachments & Screenshots
INSERT INTO storage.buckets (id, name, public, allowed_mime_types, file_size_limit) 
VALUES ('bug-attachments', 'bug-attachments', true, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/gif'], 10485760)
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    allowed_mime_types = EXCLUDED.allowed_mime_types,
    file_size_limit = EXCLUDED.file_size_limit;

-- 11. Storage Policies (Idempotent Drop & Recreate)
DROP POLICY IF EXISTS "Public Access for bug-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload to bug-attachments" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can delete from bug-attachments" ON storage.objects;

CREATE POLICY "Public Access for bug-attachments" ON storage.objects
    FOR SELECT TO public USING (bucket_id = 'bug-attachments');

CREATE POLICY "Authenticated users can upload to bug-attachments" ON storage.objects
    FOR INSERT TO authenticated WITH CHECK (bucket_id = 'bug-attachments');

CREATE POLICY "Authenticated users can delete from bug-attachments" ON storage.objects
    FOR DELETE TO authenticated USING (bucket_id = 'bug-attachments');
