import https from 'https';
import fs from 'fs';

const url = 'https://www.studyinternational.com/wp-content/uploads/2019/08/ICEF_Agency_Status.png';
const file = fs.createWriteStream('apps/web/public/icef-logo.png');

https.get(url, function(response) {
  if (response.statusCode === 200) {
    response.pipe(file);
    file.on('finish', () => {
      file.close();
      console.log('Download Completed');
    });
  } else {
    console.error(`Failed to download: ${response.statusCode}`);
    // fallback URL
    const fallbackUrl = 'https://www.shiksha.com/public/images/icef-logo.png';
    https.get(fallbackUrl, (fallbackRes) => {
      if (fallbackRes.statusCode === 200) {
        fallbackRes.pipe(file);
        file.on('finish', () => {
          file.close();
          console.log('Download Completed (Fallback)');
        });
      }
    });
  }
});
