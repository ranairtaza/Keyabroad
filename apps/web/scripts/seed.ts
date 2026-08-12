import { createClient } from '@supabase/supabase-js';
import { destinations } from '../src/data/destinations';

// Configuration
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error("❌ ERROR: Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables.");
  console.error("Please add SUPABASE_SERVICE_ROLE_KEY to your .env.local file to bypass RLS for this bulk migration.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
}

async function seedDatabase() {
  console.log("🚀 Starting KeyAbroad Data Migration (STRICT MODE)...");
  
  let countriesInserted = 0;
  let featuresInserted = 0;
  let universitiesInserted = 0;
  let programsInserted = 0;
  
  const universitySlugs = new Set<string>();

  for (const dest of destinations) {
    if (!dest.name || !dest.id) continue;
    
    // Deterministic slug based on country name
    const countrySlug = slugify(dest.name);
    
    // 1. Upsert Country
    const { data: countryData, error: countryError } = await supabase
      .from('countries')
      .upsert({
        name: dest.name,
        slug: countrySlug,
        description: dest.about || null,
        image_url: dest.image || null,
        flag_code: dest.flagCode || null,
        waving_flag_image: dest.wavingFlagImage || null,
        waving_flag_style: dest.wavingFlagStyle || null,
        source_type: 'legacy_import',
        verification_status: 'unverified'
      }, { onConflict: 'slug', ignoreDuplicates: false })
      .select('id')
      .single();

    if (countryError || !countryData) {
      console.error(`❌ Failed to insert country ${dest.name}:`, countryError);
      continue;
    }
    
    const countryId = countryData.id;
    countriesInserted++;
    
    // 2. Insert Country Features
    if (dest.whyChoose && dest.whyChoose.length > 0) {
      await supabase.from('country_features').delete().eq('country_id', countryId);
      
      const featureRows = dest.whyChoose.map(f => ({ country_id: countryId, feature: f.trim() }));
      const { error: featureError } = await supabase.from('country_features').insert(featureRows);
      
      if (featureError) console.error(`⚠️ Failed to insert features for ${dest.name}:`, featureError);
      else featuresInserted += featureRows.length;
    }
    
    // 3. Upsert Universities
    if (dest.universities && dest.universities.length > 0) {
      for (const uni of dest.universities) {
        if (!uni.name) continue;
        
        // Deterministic stable identity: country + university
        const slug = slugify(`${countrySlug}-${uni.name}`);
        
        if (universitySlugs.has(slug)) {
           continue; // Skip duplicate stable identities silently
        }
        universitySlugs.add(slug);
        
        const { data: uniData, error: uniError } = await supabase
          .from('universities')
          .upsert({
            country_id: countryId,
            name: uni.name.trim(),
            slug: slug,
            url: uni.url === '#' ? null : uni.url,
            source_type: 'legacy_import',
            verification_status: 'unverified'
          }, { onConflict: 'slug', ignoreDuplicates: false })
          .select('id')
          .single();
          
        if (uniError || !uniData) {
          console.error(`❌ Failed to insert university ${uni.name}:`, uniError);
          continue;
        }
        
        const uniId = uniData.id;
        universitiesInserted++;
        
        // 4. Insert Programs (Courses)
        if (dest.courses && dest.courses.length > 0) {
           await supabase.from('programs').delete().eq('university_id', uniId);
           
           const programRows = dest.courses.map(c => ({
             university_id: uniId,
             name: c.trim(),
             // UNKNOWN DATA - Explicitly not fabricating degree levels, tuition, or durations
             degree_level: null,
             tuition_fee: null,
             duration: null,
             source_type: 'legacy_import',
             verification_status: 'unverified'
           }));
           
           const { error: progError } = await supabase.from('programs').insert(programRows);
           if (progError) console.error(`⚠️ Failed to insert programs for ${uni.name}:`, progError);
           else programsInserted += programRows.length;
        }
      }
    }
    
    console.log(`✅ Processed: ${dest.name}`);
  }
  
  console.log("\n🎉 MIGRATION COMPLETE");
  console.log("------------------------");
  console.log(`Countries Upserted: ${countriesInserted}`);
  console.log(`Features Inserted: ${featuresInserted}`);
  console.log(`Universities Upserted: ${universitiesInserted}`);
  console.log(`Programs Inserted: ${programsInserted}`);
  console.log("------------------------");
}

seedDatabase().catch(console.error);
