const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const fs = require('fs');
const PAT = process.env.PAT || process.env.GITHUB_TOKEN;
const CATALOG_FILES_BASE = 'https://api.github.com/repos/dlun1971/catalog-files/contents/';

async function getImageFiles() {
  const r = await fetch(CATALOG_FILES_BASE + 'images', {
    headers: { Authorization: 'token ' + PAT, 'User-Agent': 'catalog-scraper' }
  });
  const files = await r.json();
  return files.filter(f => f.name.match(/\.(png|jpg|jpeg)$/i));
}

(async () => {
  let result = {};
  if (fs.existsSync('part-images.json')) {
    result = JSON.parse(fs.readFileSync('part-images.json', 'utf-8'));
    console.log('Loaded part-images.json: ' + Object.keys(result).length + ' entries');
  }

  const imageFiles = await getImageFiles();
  console.log('Images in repo: ' + imageFiles.length);

  let added = 0;
  for (const file of imageFiles) {
    const part = file.name.replace(/\.(png|jpg|jpeg)$/i, '');
    const url = 'https://dlun1971.github.io/catalog-files/images/' + file.name;
    if (!result[part]) {
      result[part] = url;
      added++;
      console.log('Added: ' + part + ' -> ' + url);
    }
  }

  console.log('Added ' + added + ' missing entries');
  console.log('Total in part-images.json: ' + Object.keys(result).length);
  fs.writeFileSync('part-images.json', JSON.stringify(result, null, 2));
  console.log('Written to part-images.json');
})();