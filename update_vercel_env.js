require('dotenv').config({ path: 'apps/web/.env.local' });
const { spawnSync } = require('child_process');

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

function setEnv(name, value) {
  console.log(`Setting ${name}...`);
  // First remove
  spawnSync('npx.cmd', ['vercel', 'env', 'rm', name, 'production', '-y'], { stdio: 'inherit' });
  // Then add
  const child = spawnSync('npx.cmd', ['vercel', 'env', 'add', name, 'production'], {
    input: value + '\n',
    stdio: ['pipe', 'inherit', 'inherit']
  });
  if (child.status !== 0) {
    console.error(`Failed to set ${name}`);
  }
}

setEnv('NEXT_PUBLIC_SUPABASE_URL', url);
setEnv('NEXT_PUBLIC_SUPABASE_ANON_KEY', key);
console.log("Done.");
