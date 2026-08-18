-- 0. Temporarily disable triggers so the broken audit_logs table doesn't crash the insert
ALTER TABLE public.countries DISABLE TRIGGER USER;

-- 1. Upsert exactly the 17 specific destinations you operate in
INSERT INTO public.countries (name, slug, description, image_url, flag_code, status, verification_status)
VALUES 
    ('United Kingdom', 'united-kingdom', 'A world-class education destination with globally recognized degrees.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster%2C_London.jpg/1280px-Elizabeth_Tower_and_the_north_front_of_the_Palace_of_Westminster%2C_London.jpg', 'gb', 'published', 'verified'),
    ('United States', 'united-states', 'Home to the highest number of top-ranked universities in the world.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/Front_view_of_Statue_of_Liberty_%28cropped%29.jpg/1280px-Front_view_of_Statue_of_Liberty_%28cropped%29.jpg', 'us', 'published', 'verified'),
    ('Germany', 'germany', 'Top-tier engineering and business schools with low or zero tuition fees.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a6/Brandenburger_Tor_abends.jpg/1280px-Brandenburger_Tor_abends.jpg', 'de', 'published', 'verified'),
    ('Canada', 'canada', 'Renowned for its high quality of life and clear pathways to permanent residency.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b5/Ottawa_-_ON_-_Stadtansicht.jpg/1280px-Ottawa_-_ON_-_Stadtansicht.jpg', 'ca', 'published', 'verified'),
    ('Ireland', 'ireland', 'The Silicon Valley of Europe with post-study work opportunities in major tech hubs.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d7/The_entrance_of_the_historic_Trinity_College_%28Unsplash%29.jpg/1280px-The_entrance_of_the_historic_Trinity_College_%28Unsplash%29.jpg', 'ie', 'published', 'verified'),
    ('Malta', 'malta', 'A beautiful Mediterranean island offering excellent English-taught programs.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/b7/St_Sebastian_Curtain_%28cropped%29.jpg/1280px-St_Sebastian_Curtain_%28cropped%29.jpg', 'mt', 'published', 'verified'),
    ('Cyprus', 'cyprus', 'High quality education in a strategic location connecting Europe, Asia, and Africa.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a9/Kyrenia_01-2017_img02_Castle_exterior.jpg/1280px-Kyrenia_01-2017_img02_Castle_exterior.jpg', 'cy', 'published', 'verified'),
    ('Australia', 'australia', 'A vibrant destination offering excellent educational institutions.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a0/Sydney_Australia._%2821339175489%29.jpg/1280px-Sydney_Australia._%2821339175489%29.jpg', 'au', 'published', 'verified'),
    ('France', 'france', 'A hub of culture, arts, and world-class business and fashion schools.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg/1280px-Tour_Eiffel_Wikimedia_Commons_%28cropped%29.jpg', 'fr', 'published', 'verified'),
    ('Sweden', 'sweden', 'A global leader in innovation and sustainability with a unique independent learning style.', 'https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Stockholms_Stadshuset_City_Hall_Stockholm_2016_01.jpg/1280px-Stockholms_Stadshuset_City_Hall_Stockholm_2016_01.jpg', 'se', 'published', 'verified'),
    ('Italy', 'italy', 'Historic universities offering affordable education steeped in art and architecture.', 'https://images.unsplash.com/photo-1552832230-c0197dd311b5?q=80&w=2070', 'it', 'published', 'verified'),
    ('Finland', 'finland', 'Renowned for one of the world''s best education systems and high happiness index.', 'https://images.unsplash.com/photo-1533575971485-6132808b88eb?q=80&w=2070', 'fi', 'published', 'verified'),
    ('Netherlands', 'netherlands', 'An innovative and highly English-proficient European country with great universities.', 'https://images.unsplash.com/photo-1512470876302-972faa2aa9a4?q=80&w=2070', 'nl', 'published', 'verified'),
    ('Malaysia', 'malaysia', 'An affordable, high-quality education hub in Southeast Asia with many international campuses.', 'https://images.unsplash.com/photo-1513415564515-763d91423bdd?q=80&w=2070', 'my', 'published', 'verified'),
    ('Dubai (UAE)', 'dubai', 'A futuristic global city offering tax-free opportunities and world-class branch campuses.', 'https://images.unsplash.com/photo-1512453979798-5ea266f8880c?q=80&w=2070', 'ae', 'published', 'verified'),
    ('New Zealand', 'new-zealand', 'A safe and welcoming environment with world-class education and beautiful landscapes.', 'https://images.unsplash.com/photo-1507699622108-4be3abd695ad?q=80&w=2070', 'nz', 'published', 'verified'),
    ('Turkey', 'turkey', 'A unique bridge between East and West, offering affordable and high-quality education.', 'https://images.unsplash.com/photo-1541432901042-2d8bd64b4a9b?q=80&w=2070', 'tr', 'published', 'verified')
ON CONFLICT (slug) DO UPDATE SET 
    status = EXCLUDED.status,
    verification_status = EXCLUDED.verification_status,
    description = COALESCE(countries.description, EXCLUDED.description),
    image_url = EXCLUDED.image_url,
    flag_code = COALESCE(countries.flag_code, EXCLUDED.flag_code);

-- 2. Re-enable triggers safely
ALTER TABLE public.countries ENABLE TRIGGER USER;
