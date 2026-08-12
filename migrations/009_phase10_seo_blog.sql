-- 009_phase10_seo_blog.sql
-- Expands the schema for the Blog structure and custom SEO metadata overrides

-- ============================================================================
-- 1. SEO METADATA (Catalog Tables)
-- ============================================================================
-- Add custom SEO override fields to countries
ALTER TABLE countries ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE countries ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Add custom SEO override fields to universities
ALTER TABLE universities ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE universities ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Add custom SEO override fields to programs
ALTER TABLE programs ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE programs ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- ============================================================================
-- 2. BLOG CATEGORIES ENUM
-- ============================================================================
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'blog_category') THEN
        CREATE TYPE blog_category AS ENUM (
            'Study Abroad',
            'Admissions',
            'Scholarships',
            'Visa',
            'IELTS',
            'PTE',
            'Country Guides',
            'University Guides',
            'Student Finance',
            'Career'
        );
    END IF;
END $$;

-- ============================================================================
-- 3. BLOGS TABLE (With SEO fields)
-- ============================================================================
CREATE TABLE IF NOT EXISTS blogs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    category blog_category NOT NULL,
    excerpt TEXT,
    content TEXT NOT NULL,
    author_id UUID REFERENCES profiles(id) ON DELETE SET NULL,
    featured_image_url TEXT,
    view_count INT DEFAULT 0
);

-- Safely add new columns in case the table already existed
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'draft';
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT FALSE;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS published_at TIMESTAMPTZ;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE blogs ADD COLUMN IF NOT EXISTS canonical_url TEXT;

-- Enable RLS for Blogs
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view published blogs" ON blogs;
CREATE POLICY "Public can view published blogs" ON blogs
    FOR SELECT USING (
        status = 'published'
    );

-- Staff can manage blogs
DROP POLICY IF EXISTS "Staff can manage blogs" ON blogs;
CREATE POLICY "Staff can manage blogs" ON blogs
    FOR ALL USING (
        EXISTS (SELECT 1 FROM profiles WHERE profiles.id = auth.uid() AND profiles.staff_role IN ('super_admin', 'admin', 'content_manager', 'marketing_staff'))
    );
