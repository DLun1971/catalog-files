const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const PARTS = ['PMNN4807', 'PMMN4128', 'PMLN8300', 'PMKN4265', 'PMPN4576A'];

async function getImageUrl(part) {
  const url = 'https://shop.motorolasolutions.com/ccstore/v1/products/' + part;
  try {
    const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const d = await r.json();
    const img = d.primaryFullImageURL || d.primarySmallImageURL || d.primaryThumbImageURL || null;
    console.log(part + ': ' + (img || 'NOT FOUND'));
    return img;
  } catch(e) {
    console.log(part + ': ERROR - ' + e.message);
    return null;
  }
}

(async () => {
  for (const part of PARTS) {
    await getImageUrl(part);
  }
})();
