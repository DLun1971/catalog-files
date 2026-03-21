const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));
const fs = require('fs');
const PAT = process.env.PAT || process.env.GITHUB_TOKEN;

async function getImageFiles() {
  const headers = { Authorization: 'token ' + PAT, 'User-Agent': 'catalog-scraper' };

  const repoRes = await fetch('https://api.github.com/repos/dlun1971/catalog-files/git/refs/heads/main', { headers });
  const repoData = await repoRes.json();
  const commitSha = repoData.object.sha;

  const treeRes = await fetch('https://api.github.com/repos/dlun1971/catalog-files/git/trees/' + commitSha + '?recursive=1', { headers });
  const treeData = await treeRes.json();

  if (!Array.isArray(treeData.tree)) {
    console.error('Tree API error:', JSON.stringify(treeData));
    return [];
  }

  return treeData.tree.filter(f => f.path.startsWith('images/') && f.path.match(/\.(png|jpg|jpeg)$/i));
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
    const filename = file.path.replace('images/', '');
    const part = filename.replace(/\.(png|jpg|jpeg)$/i, '');
    const url = 'https://dlun1971.github.io/catalog-files/' + file.path;
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
