// 海圖辨識的參考資料產生腳本(D-293)。
// 輸入:web/src/app/route/data/seas.json(航點座標與解鎖關係)+ 一個資料夾的海圖圖片(灰機 wiki「部队潜水艇小工具」各海域的海圖截圖,
//       檔名以海域編號開頭,例如 `1-溺沒海.png`;圖片是遊戲美術,不放進 repo)。
// 輸出:api/src/ocr/chart-data.ts —— 各海域的航點座標、上一個點,以及「底圖色塊」:海圖範圍切成 30×30 格,每格取遮掉圓圈、連線、文字後的顏色中位數。
//       伺服器只用這些數值比對截圖屬於哪一張海圖,不保存、也不傳出原圖。
// 用法:node tools/chart-data/build.mjs <海圖資料夾>
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, '../..');
const sharp = createRequire(path.join(root, 'api/package.json'))('sharp');
const mapsDir = process.argv[2];
if (!mapsDir) {
  console.error('用法:node tools/chart-data/build.mjs <海圖資料夾>');
  process.exit(1);
}

const seas = JSON.parse(fs.readFileSync(path.join(root, 'web/src/app/route/data/seas.json'), 'utf8')).seas;

/** 格子:中心從 48 起、每 32 一格、共 30 格(資料座標 32~1008);伺服器端用同一組常數 */
const GRID = { start: 48, step: 32, n: 30 };

/** 把 wiki 圖片上的藍色圓圈中心找出來(4 連通區塊,面積夠大才算) */
function blobs(px, w, h, test, minArea) {
  const seen = new Uint8Array(w * h);
  const out = [];
  for (let i = 0; i < w * h; i++) {
    if (seen[i] || !test(i)) continue;
    let sx = 0, sy = 0, n = 0;
    const stack = [i];
    seen[i] = 1;
    while (stack.length) {
      const j = stack.pop();
      const x = j % w, y = (j / w) | 0;
      sx += x; sy += y; n++;
      for (const k of [j - 1, j + 1, j - w, j + w]) {
        if (k < 0 || k >= w * h || seen[k]) continue;
        if ((k === j - 1 && x === 0) || (k === j + 1 && x === w - 1)) continue;
        if (test(k)) { seen[k] = 1; stack.push(k); }
      }
    }
    if (n >= minArea) out.push([sx / n, sy / n, n]);
  }
  return out;
}

/** 資料座標 → 圖片像素的相似轉換(只有縮放與平移):最近點配對 + 最小平方法,反覆幾次 */
function fitTransform(points, centers) {
  let t = { s: 0.73, tx: 34, ty: 92 }; // wiki 圖的典型值,當起點
  for (let iter = 0; iter < 8; iter++) {
    const pairs = points.map((p) => {
      const qx = p.x * t.s + t.tx, qy = p.y * t.s + t.ty;
      let best = null, bd = Infinity;
      for (const c of centers) {
        const d = Math.hypot(c[0] - qx, c[1] - qy);
        if (d < bd) { bd = d; best = c; }
      }
      return [p, best, bd];
    });
    const use = pairs.filter((q) => q[2] < 40);
    // 最小平方:u = s*x + tx, v = s*y + ty
    let n = 0, sx = 0, sy = 0, su = 0, sv = 0, sxx = 0, sxu = 0;
    for (const [p, c] of use) {
      n++; sx += p.x; sy += p.y; su += c[0]; sv += c[1];
      sxx += p.x * p.x + p.y * p.y; sxu += p.x * c[0] + p.y * c[1];
    }
    const mx = sx / n, my = sy / n, mu = su / n, mv = sv / n;
    const s = (sxu / n - (mx * mu + my * mv)) / (sxx / n - (mx * mx + my * my));
    t = { s, tx: mu - s * mx, ty: mv - s * my };
  }
  const res = points.map((p) => {
    const qx = p.x * t.s + t.tx, qy = p.y * t.s + t.ty;
    return Math.min(...centers.map((c) => Math.hypot(c[0] - qx, c[1] - qy)));
  });
  return { ...t, medianErr: res.sort((a, b) => a - b)[res.length >> 1] };
}

/** 遮罩膨脹(方形鄰域,半徑 r) */
function dilate(mask, w, h, r) {
  const out = new Uint8Array(w * h);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      if (!mask[y * w + x]) continue;
      for (let dy = -r; dy <= r; dy++)
        for (let dx = -r; dx <= r; dx++) {
          const xx = x + dx, yy = y + dy;
          if (xx >= 0 && yy >= 0 && xx < w && yy < h) out[yy * w + xx] = 1;
        }
    }
  return out;
}

const median = (a) => {
  const s = Float64Array.from(a).sort();
  return s[s.length >> 1];
};

const files = fs.readdirSync(mapsDir);
const out = [];
for (const sea of seas) {
  const file = files.find((f) => f.startsWith(`${sea.sea}-`));
  if (!file) throw new Error(`找不到海域 ${sea.sea}(${sea.name})的海圖圖片`);
  const { data, info } = await sharp(path.join(mapsDir, file)).removeAlpha().raw().toBuffer({ resolveWithObject: true });
  const w = info.width, h = info.height;
  const r = (i) => data[i * 3], g = (i) => data[i * 3 + 1], b = (i) => data[i * 3 + 2];
  const pin = (i) => b(i) > 190 && r(i) < 60 && g(i) > 120 && g(i) < 190;
  const t = fitTransform(sea.points, blobs(data, w, h, pin, 200));
  if (t.medianErr > 3) throw new Error(`${sea.name}:圓圈與資料集座標對不起來(誤差中位數 ${t.medianErr.toFixed(1)} px)`);

  // 遮掉 wiki 畫上去的東西:藍色圓圈與起點、黑色連線、白色文字
  const blue = new Uint8Array(w * h), dark = new Uint8Array(w * h), text = new Uint8Array(w * h);
  for (let i = 0; i < w * h; i++) {
    const L = (r(i) + g(i) + b(i)) / 3;
    const S = Math.max(r(i), g(i), b(i)) - Math.min(r(i), g(i), b(i));
    blue[i] = b(i) > 170 && r(i) < 90 && g(i) > 90 ? 1 : 0;
    dark[i] = L < 50 && S < 30 ? 1 : 0;
    text[i] = L > 200 && S < 25 ? 1 : 0;
  }
  const b1 = dilate(blue, w, h, 7), d1 = dilate(dark, w, h, 3), t1 = dilate(text, w, h, 2);

  const cells = [];
  for (let gy = 0; gy < GRID.n; gy++)
    for (let gx = 0; gx < GRID.n; gx++) {
      const cx = GRID.start + gx * GRID.step, cy = GRID.start + gy * GRID.step;
      const x0 = Math.ceil((cx - GRID.step / 2) * t.s + t.tx), x1 = Math.floor((cx + GRID.step / 2) * t.s + t.tx);
      const y0 = Math.ceil((cy - GRID.step / 2) * t.s + t.ty), y1 = Math.floor((cy + GRID.step / 2) * t.s + t.ty);
      const rs = [], gs = [], bs = [];
      for (let y = Math.max(0, y0); y <= Math.min(h - 1, y1); y++)
        for (let x = Math.max(0, x0); x <= Math.min(w - 1, x1); x++) {
          const i = y * w + x;
          if (b1[i] || d1[i] || t1[i]) continue;
          rs.push(r(i)); gs.push(g(i)); bs.push(b(i));
        }
      cells.push(rs.length > 40 ? [median(rs), median(gs), median(bs)].map(Math.round) : null);
    }
  const byId = new Map(sea.points.map((p) => [p.id, p]));
  const parent = new Map();
  for (const p of sea.points) for (const c of p.unlocks) if (byId.has(c)) parent.set(c, p.id);
  out.push({
    sea: sea.sea,
    name: sea.name,
    home: [sea.home.x, sea.home.y],
    points: sea.points.map((p) => [p.id, p.code, p.x, p.y, parent.get(p.id) ?? null]),
    cells,
  });
  console.log(`${sea.name}:對齊誤差中位數 ${t.medianErr.toFixed(2)} px,有效格 ${cells.filter(Boolean).length}/${cells.length}`);
}

const header = `// 由 tools/chart-data/build.mjs 產生,請勿手改(D-293)。
// points:[航點 id, 代號, x, y, 同海域的上一個點 id 或 null];座標與 web 的 seas.json 相同(航線資料集,CC BY-NC-SA 3.0,見 web/src/app/route/data/NOTICE.md)。
// cells:海圖底圖 30×30 格的顏色中位數(由灰機 wiki 的海圖截圖算出;原圖不放進 repo),null = 被遮住、不比對。
`;
const body = `export interface ChartSeaData {
  sea: number;
  name: string;
  home: [number, number];
  points: [number, string, number, number, number | null][];
  cells: ([number, number, number] | null)[];
}

export const CHART_GRID = ${JSON.stringify(GRID)} as const;

export const CHART_SEAS: ChartSeaData[] = ${JSON.stringify(out)};
`;
fs.writeFileSync(path.join(root, 'api/src/ocr/chart-data.ts'), header + '\n' + body);
console.log('已寫入 api/src/ocr/chart-data.ts');
