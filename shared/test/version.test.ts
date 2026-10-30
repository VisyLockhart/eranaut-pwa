import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { APP_VERSION } from '../src/version.js';

test('APP_VERSION 是 SemVer,且與根目錄與各套件 package.json 一致', () => {
  assert.match(APP_VERSION, /^\d+\.\d+\.\d+$/);
  for (const rel of ['../../../package.json', '../../../web/package.json', '../../../api/package.json', '../../../shared/package.json']) {
    const pkg = JSON.parse(readFileSync(new URL(rel, import.meta.url), 'utf8')) as { version: string };
    assert.equal(pkg.version, APP_VERSION, rel);
  }
});
