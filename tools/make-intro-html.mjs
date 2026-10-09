// 部署用:從建置好的 index.html 產生 `intro/index.html`,只改連結預覽卡(Open Graph / Twitter)的內容。
// 社群平台的爬蟲不執行 JavaScript,SPA 路由 /intro 又沒有自己的檔案,所以要有一份靜態 HTML 才能顯示「海域介紹」專用的預覽卡。
// 用法:node tools/make-intro-html.mjs <建置輸出資料夾>
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const ORIGIN = 'https://demo.eranaut.aequoreranos.com';
const TITLE = '純水與銀礦之詩,靜謐海域交換所';
const DESC = 'FFXIV 繁體中文版的潛艇同好會。單人玩潛艇的孤狼,來這裡收艇不誤點,認識大地主、擁有強力的後盾。';
const IMAGE = `${ORIGIN}/og/intro.png`;
const URL_ = `${ORIGIN}/intro`;

const dir = process.argv[2];
if (!dir) {
  console.error('用法:node tools/make-intro-html.mjs <建置輸出資料夾>');
  process.exit(1);
}

let html = readFileSync(join(dir, 'index.html'), 'utf8');

function setMeta(attr, key, value) {
  const re = new RegExp(`(<meta ${attr}="${key}" content=")[^"]*(")`);
  if (!re.test(html)) throw new Error(`index.html 找不到 <meta ${attr}="${key}">`);
  html = html.replace(re, (_, a, b) => a + value.replace(/"/g, '&quot;') + b);
}

setMeta('property', 'og:title', TITLE);
setMeta('property', 'og:description', DESC);
setMeta('property', 'og:url', URL_);
setMeta('property', 'og:image', IMAGE);
setMeta('name', 'twitter:title', TITLE);
setMeta('name', 'twitter:description', DESC);
setMeta('name', 'twitter:image', IMAGE);
setMeta('name', 'description', DESC);
if (!/<title>[^<]*<\/title>/.test(html)) throw new Error('index.html 找不到 <title>');
html = html.replace(/<title>[^<]*<\/title>/, `<title>${TITLE}</title>`);

mkdirSync(join(dir, 'intro'), { recursive: true });
writeFileSync(join(dir, 'intro', 'index.html'), html);
console.log('已產生 intro/index.html');
