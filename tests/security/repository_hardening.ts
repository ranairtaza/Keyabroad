import * as fs from 'fs';
import * as path from 'path';

function scanDirectory(dir: string, fileList: string[] = []): string[] {
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      scanDirectory(fullPath, fileList);
    } else if (fullPath.endsWith('.ts') || fullPath.endsWith('.tsx')) {
      fileList.push(fullPath);
    }
  }
  return fileList;
}

function auditRepositoryHardening() {
  console.log('Running Repository-Wide Security Hardening Audit...');
  let hasErrors = false;

  const apiDir = path.join(process.cwd(), 'apps', 'admin', 'src', 'app', 'api');
  const files = scanDirectory(apiDir);

  const unsafePatterns = [
    { pattern: /role\.(includes|indexOf)\s*\(\s*['"`](admin|ceo|founder)['"`]\s*\)/i, desc: 'Substring matching on role' },
    { pattern: /user\.email\s*===\s*['"`]junaid@keyabroad\.com['"`]/i, desc: 'Hardcoded identity bypass' },
    { pattern: /pRole\s*===\s*['"`]super_admin['"`]/i, desc: 'Legacy hardcoded role check (use requireAnyRole)' }
  ];

  for (const file of files) {
    const content = fs.readFileSync(file, 'utf8');
    for (const { pattern, desc } of unsafePatterns) {
      if (pattern.test(content)) {
        console.error(`❌ VIOLATION FOUND in ${file}`);
        console.error(`   -> ${desc}`);
        hasErrors = true;
      }
    }
  }

  if (hasErrors) {
    console.error('Repository Hardening Audit FAILED.');
    process.exit(1);
  } else {
    console.log('✅ PASS: No insecure role substring matching or hardcoded identities found in API routes.');
    console.log('✅ PASS: Centralized authorization appears fully adopted.');
  }
}

auditRepositoryHardening();
