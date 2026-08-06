const fs = require('fs');
const https = require('https');
const path = require('path');

const destinations = {
  uk: "https://upload.wikimedia.org/wikipedia/commons/8/87/Palace_of_Westminster_from_the_dome_on_Methodist_Central_Hall.jpg",
  usa: "https://upload.wikimedia.org/wikipedia/commons/a/a1/Statue_of_Liberty_7.jpg",
  canada: "https://upload.wikimedia.org/wikipedia/commons/3/36/Toronto_-_ON_-_Toronto_Skyline.jpg",
  ireland: "https://upload.wikimedia.org/wikipedia/commons/e/e0/Dublin_Ha%27penny_Bridge_and_Liffey_River_at_dusk.jpg",
  malta: "https://upload.wikimedia.org/wikipedia/commons/0/02/Valletta_Skyline_from_Sliema.jpg",
  cyprus: "https://upload.wikimedia.org/wikipedia/commons/c/cb/Kyrenia_Castle_and_harbour.jpg",
  germany: "https://upload.wikimedia.org/wikipedia/commons/a/a6/Brandenburger_Tor_abends.jpg",
  australia: "https://upload.wikimedia.org/wikipedia/commons/a/a0/Sydney_Australia._%2821339175489%29.jpg",
  france: "https://upload.wikimedia.org/wikipedia/commons/a/a8/Tour_Eiffel_Wikimedia_Commons.jpg",
  sweden: "https://upload.wikimedia.org/wikipedia/commons/3/36/Stockholm_Gamla_Stan_01.jpg",
  italy: "https://upload.wikimedia.org/wikipedia/commons/5/53/Colosseum_in_Rome%2C_Italy_-_April_2007.jpg",
  finland: "https://upload.wikimedia.org/wikipedia/commons/4/4e/Helsinki_Cathedral_2019.jpg",
  netherlands: "https://upload.wikimedia.org/wikipedia/commons/9/91/Amsterdam_canals_2.jpg",
  malaysia: "https://upload.wikimedia.org/wikipedia/commons/f/f6/Kuala_Lumpur_skyline_2022.jpg",
  dubai: "https://upload.wikimedia.org/wikipedia/commons/c/c8/Burj_Khalifa_Dubai_-_UAE.jpg"
};

const dir = path.join(__dirname, 'public', 'destinations');
if (!fs.existsSync(dir)){ fs.mkdirSync(dir, { recursive: true }); }

function download(url, dest) {
  return new Promise((resolve, reject) => {
    const options = {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'image/jpeg,image/png,image/*;q=0.8'
      }
    };
    https.get(url, options, (res) => {
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return download(res.headers.location, dest).then(resolve).catch(reject);
      }
      if (res.statusCode !== 200) {
        return reject(new Error(`Status Code: ${res.statusCode} for ${url}`));
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => { file.close(); console.log('Success:', dest); resolve(); });
    }).on('error', (err) => {
      fs.unlink(dest, () => {}); reject(err);
    });
  });
}

async function run() {
  for (const [country, url] of Object.entries(destinations)) {
    const dest = path.join(dir, `${country}.jpg`);
    try {
      await download(url, dest);
      // Wait 1 second between requests to avoid rate limits
      await new Promise(r => setTimeout(r, 1000));
    } catch (e) {
      console.error(`Failed ${country}:`, e.message);
    }
  }
}
run();
