const fetch = (...args) => import('node-fetch').then(({default: f}) => f(...args));

const PARTS = ['PMNN4807'];

async function getImageUrl(part) {
  const url = 'https://www.motorolasolutions.com/en_us/products/' + part + '.html';
  try {
    const r = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html'
      },
      redirect: 'follow'
    });
    console.log('Status:', r.status, r.url);
    const text = await r.text();
    console.log('Body length:', text.length);
    console.log('First 500 chars:', text.substring(0, 500));
  } catch(e) {
    console.log('ERROR:', e.message);
  }
}

(async () => { await getImageUrl('PMNN4807'); })();
