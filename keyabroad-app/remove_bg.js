const { removeBackground } = require('@imgly/background-removal-node');
const fs = require('fs');

async function processImage() {
  try {
    const inputPath = 'C:/Users/DeLL/OneDrive/Desktop/Keyabroad/Gemini_Generated_Image_i3k3e4i3k3e4i3k3.png';
    const outputPath = 'C:/Users/DeLL/OneDrive/Desktop/Keyabroad/keyabroad-app/public/destinations/waving-flags-transparent.png';
    
    console.log("Starting background removal (this uses local AI, might take a moment)...");
    
    // Read the file as a buffer
    const inputBuffer = fs.readFileSync(inputPath);
    // Convert to Blob for imgly
    const inputBlob = new Blob([inputBuffer], { type: 'image/png' });
    
    const blob = await removeBackground(inputBlob);
    const arrayBuffer = await blob.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    
    fs.writeFileSync(outputPath, buffer);
    console.log("Successfully saved transparent image to:", outputPath);
  } catch (error) {
    console.error("Error removing background:", error);
  }
}

processImage();
