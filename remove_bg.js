const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');
const path = require('path');

async function processImages() {
  try {
    console.log("Starting background removal for France, Sweden, and Cyprus flags...");

    const countries = ['france', 'sweden', 'cyprus'];

    for (const country of countries) {
      const imgPath = `C:/Users/DeLL/OneDrive/Desktop/Keyabroad/keyabroad-app/public/destinations/${country}-waving-flag.png`;
      const inputUrl = `file:///${imgPath}`;
      
      console.log(`Processing ${inputUrl}...`);
      const blob = await removeBackground(inputUrl);
      const arrayBuffer = await blob.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      fs.writeFileSync(imgPath, buffer);
      console.log(`Saved transparent image to: ${imgPath}`);
    }
    
    console.log("All done!");
  } catch (error) {
    console.error("Error removing background:", error);
  }
}

processImages();
