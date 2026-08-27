require('dotenv').config({ path: './apps/admin/.env.local' });
const { createClient } = require('@supabase/supabase-js');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function fixData() {
  const { data: countries, error: cErr } = await supabase.from('countries').select('id, name, slug');
  const { data: unis, error: uErr } = await supabase.from('universities').select('id, name, country').is('country_id', null);
  
  if (cErr || uErr) {
    console.error(cErr, uErr);
    return;
  }
  
  console.log('Found ' + unis.length + ' universities missing country_id.');
  for (const uni of unis) {
    let matchedCountry = countries.find(c => 
      c.name.toLowerCase() === uni.country.toLowerCase() || 
      c.slug.toLowerCase() === uni.country.toLowerCase()
    );
    
    if (!matchedCountry && uni.country.toLowerCase() === 'uk') matchedCountry = countries.find(c => c.name.includes('United Kingdom'));
    if (!matchedCountry && uni.country.toLowerCase() === 'usa') matchedCountry = countries.find(c => c.name.includes('United States'));
    if (!matchedCountry && uni.country.toLowerCase() === 'uae') matchedCountry = countries.find(c => c.name.includes('United Arab'));

    if (matchedCountry) {
      await supabase.from('universities').update({ country_id: matchedCountry.id }).eq('id', uni.id);
      console.log('Updated ' + uni.name + ' to country ' + matchedCountry.name);
    } else {
      console.log('No country matched for ' + uni.name + ' (Country: ' + uni.country + ')');
    }
  }
}

fixData();
