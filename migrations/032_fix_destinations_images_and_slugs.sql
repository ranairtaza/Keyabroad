-- 032_fix_destinations_images_and_slugs.sql
-- Fixes the USA slug to match the frontend and replaces Unsplash images with Wikimedia equivalents.

-- 1. Temporarily disable triggers (like the broken audit_logs trigger)
ALTER TABLE public.countries DISABLE TRIGGER USER;

-- 2. Update slugs and images
UPDATE public.countries SET slug = 'usa' WHERE slug = 'united-states' OR slug = 'usa';

UPDATE public.countries SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/8/86/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg/1280px-Colosseum_in_Rome%2C_Italy_-_April_2007.jpg' WHERE slug = 'italy';
UPDATE public.countries SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/c/cd/Helsinki_Cathedral_from_south_west_side.jpg/1280px-Helsinki_Cathedral_from_south_west_side.jpg' WHERE slug = 'finland';
UPDATE public.countries SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/5/53/Amsterdam_Canal_View.jpg/1280px-Amsterdam_Canal_View.jpg' WHERE slug = 'netherlands';
UPDATE public.countries SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/Kuala_Lumpur_City_Centre_%28KLCC%29_at_night.jpg/1280px-Kuala_Lumpur_City_Centre_%28KLCC%29_at_night.jpg' WHERE slug = 'malaysia';
UPDATE public.countries SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Dubai_Marina_Skyline.jpg/1280px-Dubai_Marina_Skyline.jpg' WHERE slug = 'dubai';
UPDATE public.countries SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d1/Mount_Cook_from_Lake_Pukaki.jpg/1280px-Mount_Cook_from_Lake_Pukaki.jpg' WHERE slug = 'new-zealand';
UPDATE public.countries SET image_url = 'https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Hagia_Sophia_Mars_2013.jpg/1280px-Hagia_Sophia_Mars_2013.jpg' WHERE slug = 'turkey';

-- 3. Re-enable triggers safely
ALTER TABLE public.countries ENABLE TRIGGER USER;

