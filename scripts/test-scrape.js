const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const fs = require('fs');
const path = require('path');
const PAT = process.env.GITHUB_TOKEN;
const BASE = 'https://api.github.com/repos/dlun1971/pcr-catalog/contents/data/';
const IMAGES_DIR = 'images';
if (!fs.existsSync(IMAGES_DIR)) fs.mkdirSync(IMAGES_DIR);

async function getDataFiles() {
  const r = await fetch(BASE, { headers: { Authorization: 'token ' + PAT, 'User-Agent': 'catalog-scraper' } });
  const files = await r.json();
  return files.filter(f => f.name.endsWith('-data.js')).map(f => f.name);
}

async function extractParts(filename) {
  const r = await fetch(BASE + filename, { headers: { Authorization: 'token ' + PAT, 'User-Agent': 'catalog-scraper' } });
  const d = await r.json();
  const text = Buffer.from(d.content, 'base64').toString('utf-8');
  const parts = [];
  const matches = text.matchAll(/part:\s*['"]([A-Z0-9\-]+)['"]/g);
  for (const m of matches) parts.push(m[1]);
  return [...new Set(parts)];
}

async function getImageUrl(part) {
  const suffixes = ['', 'A', 'B', 'C', 'D', '01', '02', '03', '04'];
  for (const sfx of suffixes) {
    const url = 'https://shop.motorolasolutions.com/ccstore/v1/products/' + part + sfx;
    try {
      const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
      const text = await r.text();
      const img = text.match(/ccstore\/v1\/images\/\?source=([^"'\\]+)/i);
      if (img) {
        console.log(part + ': found with suffix "' + sfx + '"');
        return 'https://shop.motorolasolutions.com/ccstore/v1/images/?source=' + img[1];
      }
    } catch(e) {
      // continue to next suffix
    }
    await new Promise(r => setTimeout(r, 150));
  }
  return null;
}

async function downloadImage(part, url) {
  try {
    const r = await fetch(url + '&height=640&width=640', { headers: { 'User-Agent': 'Mozilla/5.0' } });
    if (!r.ok) return null;
    const contentType = r.headers.get('content-type') || '';
    const ext = contentType.includes('png') ? '.png' : '.jpg';
    const filepath = path.join(IMAGES_DIR, part + ext);
    const buffer = await r.buffer();
    fs.writeFileSync(filepath, buffer);
    return 'https://dlun1971.github.io/catalog-files/' + filepath;
  } catch(e) {
    return null;
  }
}

(async () => {
  // Load existing results to skip already-found parts
  let result = {};
  if (fs.existsSync('part-images.json')) {
    try {
      result = JSON.parse(fs.readFileSync('part-images.json', 'utf-8'));
      console.log('Loaded existing part-images.json with ' + Object.keys(result).length + ' entries');
    } catch(e) {
      console.log('Could not parse existing part-images.json, starting fresh');
    }
  }

  const files = await getDataFiles();
  console.log('Data files found:', files.length);
  const allParts = [];
  for (const f of files) {
    const parts = await extractParts(f);
    console.log(f + ': ' + parts.length + ' parts');
    allParts.push(...parts);
  }
  const unique = [...new Set(allParts)];
  console.log('Total unique parts:', unique.length);

  // Filter out parts we already have
  const toProcess = unique.filter(p => !result[p]);
  console.log('Parts to process (skipping already found):', toProcess.length);

  let found = 0;
  let skipped = 0;
  for (const part of toProcess) {
    // Also skip if image file already downloaded
    const pngPath = path.join(IMAGES_DIR, part + '.png');
    const jpgPath = path.join(IMAGES_DIR, part + '.jpg');
    if (fs.existsSync(pngPath) || fs.existsSync(jpgPath)) {
      const localUrl = 'https://dlun1971.github.io/catalog-files/' + (fs.existsSync(pngPath) ? pngPath : jpgPath);
      result[part] = localUrl;
      skipped++;
      console.log(part + ': already downloaded, skipping');
      continue;
    }

    const cdnUrl = await getImageUrl(part);
    if (cdnUrl) {
      const localUrl = await downloadImage(part, cdnUrl);
      if (localUrl) {
        result[part] = localUrl;
        found++;
        console.log(part + ': OK -> ' + localUrl);
      } else {
        console.log(part + ': CDN OK but download failed');
      }
    } else {
      console.log(part + ': NOT FOUND');
    }
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Images downloaded this run: ' + found);
  console.log('Already had / skipped: ' + skipped);
  console.log('Total in part-images.json: ' + Object.keys(result).length);
  fs.writeFileSync('part-images.json', JSON.stringify(result, null, 2));
  console.log('Written to part-images.json');
})();
