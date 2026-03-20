const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const fs = require('fs');

const PAT = process.env.GITHUB_TOKEN;
const BASE = 'https://api.github.com/repos/dlun1971/pcr-catalog/contents/data/';

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
  const matches = text.matchAll(/part:\s*['"]([A-Z0-9]+)['"]/g);
  for (const m of matches) parts.push(m[1]);
  return [...new Set(parts)];
}

async function getImageUrl(part) {
  const url = 'https://shop.motorolasolutions.com/ccstore/v1/products/' + part + 'A';
  try {
    const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } });
    const text = await r.text();
    const img = text.match(/ccstore\/v1\/images\/\?source=[^"'\\]+/i);
    if (img) return 'https://shop.motorolasolutions.com/' + img[0];
    return null;
  } catch(e) {
    return null;
  }
}

(async () => {
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

  const result = {};
  let found = 0;
  for (const part of unique) {
    const url = await getImageUrl(part);
    if (url) { result[part] = url; found++; }
    console.log(part + ': ' + (url ? 'OK' : 'NOT FOUND'));
    await new Promise(r => setTimeout(r, 300));
  }

  console.log('Images found: ' + found + '/' + unique.length);
  fs.writeFileSync('part-images.json', JSON.stringify(result, null, 2));
  console.log('Written to part-images.json');
})();
