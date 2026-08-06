-- 1. Create the blogs table
CREATE TABLE IF NOT EXISTS public.blogs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    excerpt TEXT,
    content TEXT NOT NULL,
    author TEXT NOT NULL,
    image_url TEXT,
    published BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable Row Level Security (RLS)
ALTER TABLE public.blogs ENABLE ROW LEVEL SECURITY;

-- 3. Create policies
DROP POLICY IF EXISTS "Enable read access for published blogs" ON public.blogs;
-- Policy: Anyone can read published blogs
CREATE POLICY "Enable read access for published blogs" ON public.blogs
    FOR SELECT USING (published = true);

DROP POLICY IF EXISTS "Enable all access for authenticated users to blogs" ON public.blogs;
-- Policy: Authenticated users can read ALL blogs (including drafts)
CREATE POLICY "Enable all access for authenticated users to blogs" ON public.blogs
    FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_blogs_updated_at ON public.blogs;
CREATE TRIGGER update_blogs_updated_at
BEFORE UPDATE ON public.blogs
FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
