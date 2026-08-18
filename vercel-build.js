const { execSync } = require('child_process');
const path = require('path');

const root = process.cwd();
const adminDir = path.join(root, 'apps/admin');

console.log('Installing dependencies...');
execSync('npm install', { cwd: root, stdio: 'inherit' });

console.log('Building admin app...');
execSync('npm run build', { cwd: adminDir, stdio: 'inherit' });
