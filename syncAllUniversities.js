require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function syncAll() {
  const { data: countries, error: cErr } = await supabase.from('countries').select('id, name, slug');
  if (cErr) {
    console.error('Error fetching countries:', cErr);
    return;
  }

  const destinationsFile = fs.readFileSync('./apps/web/src/data/destinations.ts', 'utf8');
  const destinationsMatch = destinationsFile.match(/export const destinations: Destination\[\] = (\[[\s\S]*?\]);/);
  if (!destinationsMatch) {
    console.error('Could not find destinations array');
    return;
  }

  let destinations;
  try {
    const cleanCode = `
      const defaultCourses = ["Health/Science", "Business", "I.T", "Computing", "Accounting/Finance/HRM", "Engineering"];
      const destinations = ${destinationsMatch[1]};
      destinations;
    `;
    destinations = eval(cleanCode);
  } catch (e) {
    console.error('Eval error:', e);
    return;
  }

  const { data: existingUnis, error: uErr } = await supabase.from('universities').select('id, name, country_id');
  if (uErr) {
    console.error('Error fetching universities:', uErr);
    return;
  }

  const existingMap = new Set(existingUnis.map(u => `${u.name.toLowerCase().trim()}__${u.country_id}`));

  const toInsert = [];
  const sqlStatements = [];

  for (const dest of destinations) {
    const matchedCountry = countries.find(c => 
      c.slug.toLowerCase() === dest.id.toLowerCase() ||
      c.name.toLowerCase() === dest.name.toLowerCase() ||
      (dest.id === 'united-states' && c.name.includes('United States')) ||
      (dest.id === 'dubai' && c.name.includes('Dubai'))
    );

    if (!matchedCountry) continue;

    for (const uni of dest.universities) {
      const key = `${uni.name.toLowerCase().trim()}__${matchedCountry.id}`;
      if (!existingMap.has(key)) {
        // Generate a URL slug for the university
        const slug = uni.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
        
        const safeName = uni.name.replace(/'/g, "''");
        const safeCountry = matchedCountry.name.replace(/'/g, "''");
        const safeUrl = uni.url && uni.url !== '#' ? `'${uni.url.replace(/'/g, "''")}'` : 'NULL';
        
        // Use JSON format for required_documents since it is JSONB
        const jsonbDocs = `\'["Passport", "Transcripts", "Recommendation Letter", "English Proficiency Test (IELTS/PTE)"]\'::jsonb`;
        
        sqlStatements.push(`INSERT INTO public.universities (name, country, country_id, url, avg_bachelors_tuition, avg_masters_tuition, application_fee, status, source_type, verification_status, required_documents) VALUES ('${safeName}', '${safeCountry}', '${matchedCountry.id}', ${safeUrl}, 15000, 20000, 100, 'published', 'manual', 'verified', ${jsonbDocs}) ON CONFLICT DO NOTHING;`);
      }
    }
  }

  // Write SQL migration file
  const fullSql = `-- Migration 041: Sync all destination universities to database\n-- Temporarily disable user triggers\nALTER TABLE public.universities DISABLE TRIGGER USER;\n\n${sqlStatements.join('\n')}\n\n-- Re-enable user triggers\nALTER TABLE public.universities ENABLE TRIGGER USER;\n`;
  fs.writeFileSync('./migrations/041_sync_all_destination_universities.sql', fullSql, 'utf8');
  console.log('Saved migrations/041_sync_all_destination_universities.sql');
}

syncAll();
