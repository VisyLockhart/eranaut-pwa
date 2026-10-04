import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { createPaddleEngine } from '../src/ocr/engine.js';
import { createOcrService } from '../src/ocr/service.js';

// 真實引擎 + 真實截圖的整合測試(PP-OCRv4 模型,約 1 秒一張)。
// 截圖與「標準答案.txt」不放在 repo(隱私),所以預設跳過;指定資料夾才會跑:
//   Windows:  set OCR_TEST_DIR=C:\path\to\ocr-test  然後  npm test -w api
//   macOS/Linux:  OCR_TEST_DIR=/path/to/ocr-test npm test -w api
// 也用來在新平台(Windows x64、Docker linux/arm64)確認 onnxruntime-node 與 sharp 載得起來、結果一致。
// 「標準答案.txt」每行:  01.png: 8小時52分 | 8小時51分 | ...
const dir = process.env.OCR_TEST_DIR;

test('真實截圖整合(OCR_TEST_DIR)', { skip: dir ? false : '未設定 OCR_TEST_DIR,略過', timeout: 300_000 }, async () => {
  const answers = new Map<string, string[]>();
  for (const line of readFileSync(join(dir!, '標準答案.txt'), 'utf8').split(/\r?\n/)) {
    const m = /^(\S+):\s*(.+)$/.exec(line.trim());
    if (m) answers.set(m[1]!, m[2]!.split('|').map((x) => x.trim()));
  }
  assert.ok(answers.size > 0, '標準答案.txt 讀不到內容');

  const ocr = createOcrService(createPaddleEngine());
  const toText = (minutes: number | null) => (minutes === null ? '?' : `${Math.floor(minutes / 60)}小時${minutes % 60}分`);
  const files = readdirSync(dir!).filter((f) => answers.has(f)).sort();
  assert.equal(files.length, answers.size, '有標準答案的截圖檔不齊');
  for (const f of files) {
    const result = await ocr.recognize(readFileSync(join(dir!, f)));
    assert.ok(result, `${f} 應該辨識得出潛艇列`);
    assert.deepEqual(result.submarines.map((s) => toText(s.remaining_minutes)), answers.get(f), f);
    assert.ok(result.submarines.every((s) => !s.suspect.name && !s.suspect.time), `${f} 不應有可疑欄位`);
  }
});
