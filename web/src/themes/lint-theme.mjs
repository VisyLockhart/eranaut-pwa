// 主題規範檢查(D-277):色碼、rgba()、漸層只能出現在主題檔(themes/)與 styles.scss 開頭的 :root 色盤。
// 其他地方一律用 var(--token),這樣「加新元件」不需要為三個主題各寫一份樣式。
// 用法:node src/themes/lint-theme.mjs   (有違規時以 exit code 1 結束)
// 例外:該行含 theme-exempt 字樣(遊戲水晶色、宣傳頁深海配色等刻意不跟主題走的地方)。
import { readdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..');
const SKIP_DIRS = new Set(['themes', 'intro']);
const SKIP_FILES = new Set(['app/core/theme.ts', 'index.html', 'app/craft/crystal-icon.ts']);
const EXT = /\.(scss|css|html|ts)$/;
const RULES = [
  { name: '色碼', re: /(?<=[:,(="']\s*)#[0-9a-fA-F]{3,8}\b(?![\w-])/ },
  { name: 'rgb()/rgba()/hsl()', re: /\b(?:rgba?|hsla?)\(/ },
  { name: '漸層', re: /-gradient\(/ },
];

function* walk(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) {
      if (!SKIP_DIRS.has(name)) yield* walk(p);
    } else if (EXT.test(name) && !/\.spec\.ts$/.test(name)) yield p;
  }
}

/** styles.scss 內 `:root { ... }` 與 html[data-theme] 以外的區塊才檢查:色盤本身就是「定義 token」的地方 */
function inPalette(text, index) {
  const before = text.slice(0, index);
  const open = Math.max(before.lastIndexOf(':root'), before.lastIndexOf('[data-theme'));
  if (open < 0) return false;
  const depth = (before.slice(open).match(/{/g) ?? []).length - (before.slice(open).match(/}/g) ?? []).length;
  return depth > 0 && before.slice(open).split('\n').length < 80;
}

let bad = 0;
for (const file of walk(SRC)) {
  const rel = relative(SRC, file).split(sep).join('/');
  if (SKIP_FILES.has(rel)) continue;
  const text = readFileSync(file, 'utf8');
  let offset = 0;
  for (const [i, line] of text.split('\n').entries()) {
    const at = offset;
    offset += line.length + 1;
    if (line.includes('theme-exempt')) continue;
    for (const { name, re } of RULES) {
      const m = re.exec(line);
      if (m && !(rel === 'styles.scss' && inPalette(text, at + m.index))) {
        bad++;
        console.log(`${rel}:${i + 1}  ${name}  ${line.trim().slice(0, 110)}`);
      }
    }
  }
}
console.log(bad ? `\n${bad} 處違規:請改用 var(--token),或在該行加上 theme-exempt 並說明原因。` : '主題規範檢查通過。');
process.exit(bad ? 1 : 0);
