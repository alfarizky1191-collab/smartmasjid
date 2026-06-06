// Script to fetch Indonesia administrative dataset (provinces/cities) and save to public/indonesia-locations.json
// Source: https://raw.githubusercontent.com/edwardsamuel/Wilayah-Administratif-Indonesia/master/JSON/wilayah.json
// Usage: node scripts/fetch_indonesia_locations.js

const https = require('https');
const fs = require('fs');
const path = require('path');

const urls = [
  'https://raw.githubusercontent.com/edwardsamuel/Wilayah-Administratif-Indonesia/master/JSON/wilayah.json',
  'https://raw.githubusercontent.com/edwardsamuel/Wilayah-Administratif-Indonesia/main/JSON/wilayah.json',
  'https://raw.githubusercontent.com/edwardsamuel/Wilayah-Administratif-Indonesia/master/wilayah.json',
  'https://raw.githubusercontent.com/edwardsamuel/Wilayah-Administratif-Indonesia/main/wilayah.json',
];
const outPath = path.join(__dirname, '..', 'public', 'indonesia-locations.json');

function tryUrl(index) {
  if (index >= urls.length) {
    console.error('All fetch attempts failed');
    process.exit(1);
  }
  const url = urls[index];
  console.log('Fetching Indonesia locations from', url);
  https.get(url, (res) => {
    if (res.statusCode !== 200) {
      console.error('Failed to fetch:', url, res.statusCode);
      tryUrl(index + 1);
      return;
    }

    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', () => {
      try {
        const parsed = JSON.parse(data);
        fs.mkdirSync(path.dirname(outPath), { recursive: true });
        fs.writeFileSync(outPath, JSON.stringify(parsed, null, 2), 'utf8');
        console.log('Saved dataset to', outPath);
      } catch (err) {
        console.error('Failed to parse JSON from', url, err);
        tryUrl(index + 1);
      }
    });
  }).on('error', (err) => {
    console.error('Request error:', err);
    tryUrl(index + 1);
  });
}

tryUrl(0);
