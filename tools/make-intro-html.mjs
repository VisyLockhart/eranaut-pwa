// 部署用:從建置好的 index.html 為幾個 SPA 路由各產生一份靜態 HTML(`<路由>/index.html`),只改連結預覽卡(Open Graph / Twitter)的內容。
// 社群平台的爬蟲不執行 JavaScript,SPA 路由又沒有自己的檔案,所以要有靜態 HTML 才能顯示各頁專用的預覽卡。
// 要新增頁面:在 PAGES 加一筆,並把 1200×630 的預覽圖放到 web/public/og/。
// 用法:node tools/make-intro-html.mjs <建置輸出資料夾>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://demo.eranaut.aequoreranos.com';

const PAGES = [
  {
    path: 'intro',
    title: '純水與銀礦之詩,靜謐海域交換所',
    description: 'FFXIV 繁體中文版的潛艇同好會。單人玩潛艇的孤狼,來這裡收艇不誤點,認識大地主、擁有強力的後盾。',
    image: 'og/intro.png',
  },
  {
    path: 'route',
    title: '潛水艇航線模擬器 ・ Eranaut 線上展示',
    description: '選航點、配配件,算出航行時間、燃料與經驗,還能依練級、探索、掉落物找出最適合的路線與配置。展示版直接試玩。',
    image: 'og/route.png',
  },
];

const dir = process.argv[2];
if (!dir) {
  console.error('用法:node tools/make-intro-html.mjs <建置輸出資料夾>');
  process.exit(1);
}

const source = readFileSync(join(dir, 'index.html'), 'utf8');

function render(page) {
  let html = source;
  const set = (attr, key, value) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
    if (!re.test(html)) throw new Error(`index.html 找不到 <meta ${attr}="${key}">`);
    html = html.replace(re, (_, a, b) => a + value.replace(/"/g, '&quot;') + b);
  };
  const url = `${ORIGIN}/${page.path}`;
  const image = `${ORIGIN}/${page.image}`;
  set('property', 'og:title', page.title);
  set('property', 'og:description', page.description);
  set('property', 'og:url', url);
  set('property', 'og:image', image);
  set('name', 'twitter:title', page.title);
  set('name', 'twitter:description', page.description);
  set('name', 'twitter:image', image);
  set('name', 'description', page.description);
  if (!/<title>[^<]*<\/title>/.test(html)) throw new Error('index.html 找不到 <title>');
  return html.replace(/<title>[^<]*<\/title>/, `<title>${page.title}</title>`);
}

for (const page of PAGES) {
  mkdirSync(join(dir, page.path), { recursive: true });
  writeFileSync(join(dir, page.path, 'index.html'), render(page));
  console.log(`已產生 ${page.path}/index.html`);
}
