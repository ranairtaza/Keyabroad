require('fs').writeFileSync('url.txt', require('dotenv').config({path: 'apps/web/.env.local'}).parsed.NEXT_PUBLIC_SUPABASE_URL);
require('fs').writeFileSync('key.txt', require('dotenv').config({path: 'apps/web/.env.local'}).parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY);
