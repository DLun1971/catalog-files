const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const PARTS = ['PMNN4807A', 'PMNN4809A', 'PMMN4128A', 'PMLN8300A', 'PMPN4576A'];

async function getImageUrl(part) {
  const url = 'https://shop.motorolasolutions.com/ccstore/v1/products/' + part;
  try {
    const r = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' }
    });
    const text = await r.text();
    const img = text.match(/ccstore\/v1\/images\/\?source=[^"'\\]+/i);
    console.log(part + ': ' + (img ? 'https://shop.motorolasolutions.com/' + img[0] : 'NOT FOUND'));
  } catch(e) {
    console.log(part + ': ERROR - ' + e.message);
  }
}

(async () => {
  for (const part of PARTS) {
    await getImageUrl(part);
    await new Promise(r => setTimeout(r, 500));
  }
})();
