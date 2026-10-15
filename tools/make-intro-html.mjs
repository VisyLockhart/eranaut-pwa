// 部署用:從建置好的 index.html 為幾個 SPA 路由各產生一份靜態 HTML(`<路由>/index.html`)。
// 社群平台與搜尋引擎的爬蟲不一定執行 JavaScript,SPA 路由又沒有自己的檔案,所以每頁要有靜態 HTML 才能帶出
// 各頁專用的 title / description / canonical / 連結預覽卡(Open Graph、Twitter)/ 結構化資料(JSON-LD)。
// `/intro` 另外把主要文案放進 <app-root>(Angular 啟動後會取代它),讓不跑 JS 的爬蟲也讀得到。
// 要新增頁面:在 PAGES 加一筆,並把 1200×630 的預覽圖放到 web/public/og/,再把網址加進 web/public/sitemap.xml。
// 用法:node tools/make-intro-html.mjs <建置輸出資料夾>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://demo.eranaut.aequoreranos.com';

const INTRO_BODY = `<main style="max-width:720px;margin:0 auto;padding:32px 20px;line-height:1.8">
<p>FFXIV 繁體中文版 ・ 潛水艇同好會</p>
<h1>純水與銀礦之詩 靜謐海域交換所</h1>
<p>Aequor Eranos</p>
<p>我們希望海面是平靜的,海面以下,潛水艇悄然作業。圈子裡的人互相照應。這個名字,就是這兩件事。</p>
<h2>名字裡的兩層意思</h2>
<h3>靜謐海域</h3>
<p>潛水艇都在海面下作業,我們要的是一片平靜的海。沒有驚濤,只有能安心出航、準時收艇的日子。</p>
<h3>交換所</h3>
<p>不是櫃檯做生意。是成員之間互相協助,讓金錢和物資在圈子裡轉起來。</p>
<p>正式名稱是「純水與銀礦之詩,靜謐海域交換所」。通訊貝只能寫七個字,所以招募時只掛了後半段「靜謐海域交換所」,剛好七個字。</p>
<h2>Aequor Eranos 是什麼意思</h2>
<p>對外想掛一個羅馬字母名稱,最後定案為 Aequor Eranos。Aequor 是拉丁文,本義是被風整平的海面,對應「靜謐海域」;Eranos 是古希臘文 ἔρανος,是各出一份的互助圈子,對應「交換所」。</p>
<h2>加入靜謐海域交換所</h2>
<p>專為單人公會設立的同好會:增加交流,以及潛水艇打撈物與裝備的跨服買賣與支援。在遊戲內的同好會搜尋「純水與銀礦之詩, 靜謐海域交換所」即可。</p>
<h2>Eranaut:潛水艇返航追蹤工具</h2>
<p>Eranaut 是同好會自行開發的工具,同時支援手機與桌機。線上展示版可試玩潛艇總覽與工坊管理、航線模擬器、配件製作。</p>
<p><a href="/">Eranaut 線上展示</a> ・ <a href="/route">潛水艇航線模擬器</a></p>
</main>`;

const ld = (obj) => obj;

const PAGES = [
  {
    path: 'intro',
    title: '靜謐海域交換所(Aequor Eranos)・FFXIV 繁中潛水艇同好會',
    description: '純水與銀礦之詩,靜謐海域交換所(Aequor Eranos):FFXIV 繁體中文版的潛水艇同好會。單人玩潛艇的孤狼,來這裡收艇不誤點,結識其他潛艇玩家、擁有強力的資源後盾。',
    image: 'og/intro.png',
    imageAlt: '靜謐海域交換所 Aequor Eranos:FFXIV 繁體中文版潛水艇同好會',
    body: INTRO_BODY,
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'Organization',
        name: '靜謐海域交換所',
        alternateName: ['Aequor Eranos', '純水與銀礦之詩,靜謐海域交換所'],
        url: `${ORIGIN}/intro`,
        description: 'FFXIV 繁體中文版的潛水艇同好會。',
      },
      {
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: '靜謐海域交換所(Aequor Eranos)',
        url: `${ORIGIN}/intro`,
        inLanguage: 'zh-Hant',
        isPartOf: { '@type': 'WebSite', name: 'Aequor Eranos', url: `${ORIGIN}/` },
      },
    ],
  },
  {
    path: 'route',
    title: '潛水艇航線模擬器 + 配件製作 ・ Aequor Eranos Eranaut 線上展示',
    description: '靜謐海域交換所(Aequor Eranos)同好會自製的 Eranaut:選航點、配配件,算出航行時間、燃料與經驗;選好配件,列出完整材料表、記錄庫存。展示版直接試玩。',
    image: 'og/route-2.png',
    imageAlt: 'Eranaut 潛水艇航線模擬器與配件製作畫面',
    jsonLd: [
      {
        '@context': 'https://schema.org',
        '@type': 'WebApplication',
        name: 'Eranaut 潛水艇航線模擬器',
        alternateName: 'Aequor Eranos',
        url: `${ORIGIN}/route`,
        applicationCategory: 'GameApplication',
        operatingSystem: 'Web',
        inLanguage: 'zh-Hant',
        isAccessibleForFree: true,
      },
    ],
  },
];

const dir = process.argv[2];
if (!dir) {
  console.error('用法:node tools/make-intro-html.mjs <建置輸出資料夾>');
  process.exit(1);
}

const source = readFileSync(join(dir, 'index.html'), 'utf8');
const esc = (v) => v.replace(/&/g, '&amp;').replace(/"/g, '&quot;');

function render(page) {
  let html = source;
  const set = (attr, key, value) => {
    const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
    if (!re.test(html)) throw new Error(`index.html 找不到 <meta ${attr}="${key}">`);
    html = html.replace(re, (_, a, b) => a + esc(value) + b);
  };
  const url = `${ORIGIN}/${page.path}`;
  const image = `${ORIGIN}/${page.image}`;
  set('property', 'og:title', page.title);
  set('property', 'og:description', page.description);
  set('property', 'og:url', url);
  set('property', 'og:image', image);
  set('property', 'og:image:alt', page.imageAlt);
  set('name', 'twitter:title', page.title);
  set('name', 'twitter:description', page.description);
  set('name', 'twitter:image', image);
  set('name', 'twitter:image:alt', page.imageAlt);
  set('name', 'description', page.description);

  if (!/<link rel="canonical" href="[^"]*">/.test(html)) throw new Error('index.html 找不到 canonical');
  html = html.replace(/<link rel="canonical" href="[^"]*">/, `<link rel="canonical" href="${url}">`);

  const ldRe = /<script type="application\/ld\+json" id="ld">[\s\S]*?<\/script>/;
  if (!ldRe.test(html)) throw new Error('index.html 找不到 JSON-LD(id="ld")');
  const json = JSON.stringify(page.jsonLd.map(ld)).replace(/</g, '\\u003c');
  html = html.replace(ldRe, () => `<script type="application/ld+json" id="ld">${json}</script>`);

  if (!/<title>[^<]*<\/title>/.test(html)) throw new Error('index.html 找不到 <title>');
  html = html.replace(/<title>[^<]*<\/title>/, () => `<title>${page.title}</title>`);

  if (page.body) {
    if (!html.includes('<app-root></app-root>')) throw new Error('index.html 找不到 <app-root></app-root>');
    html = html.replace('<app-root></app-root>', () => `<app-root>${page.body}</app-root>`);
  }
  return html;
}

for (const page of PAGES) {
  mkdirSync(join(dir, page.path), { recursive: true });
  writeFileSync(join(dir, page.path, 'index.html'), render(page));
  console.log(`已產生 ${page.path}/index.html`);
}
