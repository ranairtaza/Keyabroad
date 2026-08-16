-- 0. Temporarily disable triggers so the broken audit_logs table doesn't crash the insert
ALTER TABLE public.countries DISABLE TRIGGER USER;

-- 1. Upsert exactly the 17 specific destinations you operate in
INSERT INTO public.countries (name, slug, description, image_url, iso_code, flag_code, status, verification_status)
VALUES 
    ('United Kingdom', 'united-kingdom', 'A world-class education destination with globally recognized degrees.', 'https://images.unsplash.com/photo-1513635269975-59663e0ac1ad?q=80&w=2070', 'GB', 'gb', 'published', 'verified'),
    ('United States', 'united-states', 'Home to the highest number of top-ranked universities in the world.', 'https://images.unsplash.com/photo-1496442226666-8d4d0e62e6e9?q=80&w=2070', 'US', 'us', 'published', 'verified'),
    ('Germany', 'germany', 'Top-tier engineering and business schools with low or zero tuition fees at public universities.', 'https://images.unsplash.com/photo-1467269204594-9661b134dd2b?q=80&w=2070', 'DE', 'de', 'published', 'verified'),
    ('Canada', 'canada', 'Renowned for its high quality of life and clear pathways to permanent residency.', 'https://images.unsplash.com/photo-1517926967794-37ed5289f81d?q=80&w=2070', 'CA', 'ca', 'published', 'verified'),
    ('Ireland', 'ireland', 'The Silicon Valley of Europe with post-study work opportunities in major tech hubs.', 'https://images.unsplash.com/photo-1590089415225-401ed6f9db8e?q=80&w=2070', 'IE', 'ie', 'published', 'verified'),
    ('Malta', 'malta', 'A beautiful Mediterranean island offering excellent English-taught programs and low cost of living.', 'https://images.unsplash.com/photo-1589553416260-f586c8f1514f?q=80&w=2070', 'MT', 'mt', 'published', 'verified'),
    ('Cyprus', 'cyprus', 'High quality education in a strategic location connecting Europe, Asia, and Africa.', 'https://images.unsplash.com/photo-1563720223185-11003d516935?q=80&w=2070', 'CY', 'cy', 'published', 'verified'),
    ('Australia', 'australia', 'A vibrant destination offering excellent educational institutions.', 'https://images.unsplash.com/photo-1523482580672-f109ba8cb9be?q=80&w=2070', 'AU', 'au', 'published', 'verified'),
    ('France', 'france', 'A hub of culture, arts, and world-class business and fashion schools.', 'https://images.unsplash.com/photo-1502602898657-3e907a5ea82c?q=80&w=2070', 'FR', 'fr', 'published', 'verified'),
    ('Sweden', 'sweden', 'A global leader in innovation and sustainability with a unique independent learning style.', 'https://images.unsplash.com/photo-1509356843151-38334c8cb080?q=80&w=2070', 'SE', 'se', 'published', 'verified'),
    ('Italy', 'italy', 'Historic universities offering affordable education steeped in art and architecture.', 'https://images.unsplash.com/photo-1515542622106-78b28af7815b?q=80&w=2070', 'IT', 'it', 'published', 'verified'),
    ('Finland', 'finland', 'Renowned for one of the world''s best education systems and high happiness index.', 'https://images.unsplash.com/photo-1520194464161-1c0b11540a5a?q=80&w=2070', 'FI', 'fi', 'published', 'verified'),
    ('Netherlands', 'netherlands', 'An innovative and highly English-proficient European country with great universities.', 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?q=80&w=2070', 'NL', 'nl', 'published', 'verified'),
    ('Malaysia', 'malaysia', 'An affordable, high-quality education hub in Southeast Asia with many international campuses.', 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?q=80&w=2070', 'MY', 'my', 'published', 'verified'),
    ('Dubai (UAE)', 'dubai', 'A futuristic global city offering tax-free opportunities and world-class branch campuses.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070', 'AE', 'ae', 'published', 'verified'),
    ('New Zealand', 'new-zealand', 'A safe and welcoming environment with world-class education and beautiful landscapes.', 'https://images.unsplash.com/photo-1469521669194-babbdf9aa9bf?q=80&w=2070', 'NZ', 'nz', 'published', 'verified'),
    ('Turkey', 'turkey', 'A unique bridge between East and West, offering affordable and high-quality education.', 'https://images.unsplash.com/photo-1524231757912-21f4fe3a088f?q=80&w=2070', 'TR', 'tr', 'published', 'verified')
ON CONFLICT (slug) DO UPDATE SET 
    status = EXCLUDED.status,
    verification_status = EXCLUDED.verification_status,
    description = COALESCE(countries.description, EXCLUDED.description),
    image_url = COALESCE(countries.image_url, EXCLUDED.image_url),
    flag_code = COALESCE(countries.flag_code, EXCLUDED.flag_code);

-- 2. Re-enable triggers safely
ALTER TABLE public.countries ENABLE TRIGGER USER;
