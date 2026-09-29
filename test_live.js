const https = require('https');

function testUrl(url) {
  return new Promise((resolve) => {
    https.get(url, (res) => {
      resolve(`${url} -> ${res.statusCode}`);
    }).on('error', (e) => {
      resolve(`${url} -> ERROR ${e.message}`);
    });
  });
}

async function main() {
  const urls = [
    'https://keyabroad.com/',
    'https://keyabroad.com/universities/university-of-law',
    'https://keyabroad.com/universities/fake-slug',
    'https://keyabroad.com/destinations/united-kingdom',
    'https://keyabroad.com/destinations/moon',
    'https://keyabroad.com/sitemap.xml'
  ];
  
  for (const url of urls) {
    console.log(await testUrl(url));
  }
}

main();
