import fs from 'fs';
import path from 'path';

function processDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      processDirectory(fullPath);
    } else if (fullPath.endsWith('route.ts')) {
      let content = fs.readFileSync(fullPath, 'utf8');
      
      let modified = false;

      // Add import if not exists
      if (content.includes('requireAuthenticatedUser') || content.includes('requireAnyRole') || content.includes('requireRole')) {
        if (!content.includes('handleApiError')) {
          content = content.replace(/import \{([^}]+)\} from '(@\/lib\/auth\/authorization|\.\.\/.*?lib\/auth\/authorization)';/g, (match, p1, p2) => {
            if (!p1.includes('handleApiError')) {
              return `import { ${p1.trim()}, handleApiError } from '${p2}';`;
            }
            return match;
          });
          modified = true;
        }
      } else {
          continue;
      }

      // Replace catch block
      if (content.match(/catch \((?:err|error|e)(?:[^)]*)\) \{[\s\n]*return NextResponse\.json\([^;]+;[\s\n]*\}/g)) {
          content = content.replace(/catch \((err|error|e)(?:[^)]*)\) \{[\s\n]*return NextResponse\.json\([^;]+;[\s\n]*\}/g, (match, errName) => {
              return `catch (${errName}: any) {\n    return handleApiError(${errName});\n  }`;
          });
          modified = true;
      }
      
      if (modified) {
        fs.writeFileSync(fullPath, content);
        console.log('Modified ' + fullPath);
      }
    }
  }
}

processDirectory('apps/admin/src/app/api');
