const fs = require('fs');
const path = require('path');
const https = require('https');

const components = [
  'select', 'checkbox', 'switch', 'radio-group', 'form', 'tabs', 
  'breadcrumb', 'dropdown-menu', 'accordion', 'scroll-area', 
  'separator', 'alert', 'sonner', 'tooltip', 'progress', 
  'table', 'avatar', 'sheet', 'alert-dialog'
];

const targetDir = path.join(__dirname, 'keyabroad-app', 'src', 'components', 'ui');

if (!fs.existsSync(targetDir)) {
  fs.mkdirSync(targetDir, { recursive: true });
}

async function fetchComponent(name) {
  const url = `https://ui.shadcn.com/r/styles/new-york/${name}.json`;
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          if (res.statusCode === 200) {
            const json = JSON.parse(data);
            if (json.files && json.files.length > 0) {
              const file = json.files[0];
              const filePath = path.join(targetDir, `${name}.tsx`);
              // Replace standard import with ours if needed
              let content = file.content;
              fs.writeFileSync(filePath, content);
              console.log(`Saved ${name}.tsx`);
              resolve();
            } else {
              console.log(`No files for ${name}`);
              resolve();
            }
          } else {
            console.log(`Failed to fetch ${name}: ${res.statusCode}`);
            resolve();
          }
        } catch (e) {
          console.error(`Error parsing ${name}:`, e);
          resolve();
        }
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const comp of components) {
    await fetchComponent(comp);
  }
}

run();
