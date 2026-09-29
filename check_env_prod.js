require('dotenv').config({ path: '.env.production.local' });
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

console.log("URL PRESENT:", !!url);
if (url) {
  console.log("URL STARTS WITH HTTPS:", url.startsWith('https://'));
  try {
    new URL(url);
    console.log("URL VALID FORMAT: true");
  } catch (e) {
    console.log("URL VALID FORMAT: false");
  }
} else {
  console.log("URL MISSING");
}
console.log("KEY PRESENT:", !!key);
