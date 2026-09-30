const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://recztpctppoyWqdcnrdr.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJlY3p0cGN0cHBveXdxZGNucmRyIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NDU0NTk3MCwiZXhwIjoyMTAwMTIxOTcwfQ.WE3OATqttPuo28vGTUrImBXBynDVCKHp7N8fBiROrA4';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function run() {
  console.log("Starting deletion of test data...");

  const { data: team } = await supabase.from('team_members').select('*').ilike('name', '%test%');
  if (team && team.length > 0) {
    for (const m of team) {
      await supabase.from('employee_biometric_mappings').delete().eq('employee_id', m.id);
      await supabase.from('attendance_records').delete().eq('employee_id', m.id);
      await supabase.from('team_members').delete().eq('id', m.id);
      console.log("Deleted team member", m.name);
    }
  }

  const { data: devices } = await supabase.from('biometric_devices').select('*').ilike('device_name', '%test%');
  if (devices && devices.length > 0) {
    for (const d of devices) {
      await supabase.from('employee_biometric_mappings').delete().eq('device_id', d.id);
      await supabase.from('biometric_events').delete().eq('device_id', d.id);
      await supabase.from('biometric_devices').delete().eq('id', d.id);
      console.log("Deleted device", d.device_name);
    }
  }
}

run();
