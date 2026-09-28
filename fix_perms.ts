import fs from 'fs';
const modifyFiles = [
  'apps/admin/src/app/api/biometrics/devices/[id]/route.ts',
  'apps/admin/src/app/api/biometrics/devices/[id]/revoke-key/route.ts',
  'apps/admin/src/app/api/biometrics/devices/[id]/rotate-key/route.ts',
  'apps/admin/src/app/api/biometrics/mappings/route.ts',
  'apps/admin/src/app/api/biometrics/events/reprocess/route.ts'
];
for(const file of modifyFiles) {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/requireAnyRole\(\['owner', 'admin', 'hr', 'operations head'\]\)/g, "requireAnyRole(['owner', 'admin'])");
  fs.writeFileSync(file, content);
  console.log('Updated ' + file);
}
