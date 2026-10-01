import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createPermissions, loadPermissionsFromEnv, matchesRoleRule, parseRoleRule, RoleRuleError } from '../src/auth/permissions.js';

const A = '111111111111111111';
const B = '222222222222222222';
const C = '333333333333333333';
const D = '444444444444444444';

test('解析:單一、或、且、混用', () => {
  assert.deepEqual(parseRoleRule(A), [[A]]);
  assert.deepEqual(parseRoleRule(`${A},${B},${C}`), [[A], [B], [C]]);
  assert.deepEqual(parseRoleRule(`${A}+${B}`), [[A, B]]);
  assert.deepEqual(parseRoleRule(`${A}+${B},${C}`), [[A, B], [C]]);
});

test('解析:容許項目前後空白', () => {
  assert.deepEqual(parseRoleRule(` ${A} + ${B} , ${C} `), [[A, B], [C]]);
});

test('解析:空規則與格式錯誤一律丟錯(啟動失敗,不默默放行)', () => {
  for (const bad of [undefined, null, '', '   ', ',', `${A},`, `,${A}`, `${A},,${B}`, `${A}+`, `+${A}`, `${A}++${B}`, 'abc', '123', `${A};${B}`, `${A}&${B}`, `(${A})`, `!${A}`, '1'.repeat(21)]) {
    assert.throws(() => parseRoleRule(bad as string | undefined), RoleRuleError, `應拒絕:${String(bad)}`);
  }
});

test('判斷:OR 任一符合', () => {
  const r = parseRoleRule(`${A},${B}`);
  assert.equal(matchesRoleRule(r, [A]), true);
  assert.equal(matchesRoleRule(r, [B, D]), true);
  assert.equal(matchesRoleRule(r, [D]), false);
  assert.equal(matchesRoleRule(r, []), false);
});

test('判斷:AND 需同時擁有', () => {
  const r = parseRoleRule(`${A}+${B}`);
  assert.equal(matchesRoleRule(r, [A]), false);
  assert.equal(matchesRoleRule(r, [B]), false);
  assert.equal(matchesRoleRule(r, [A, B]), true);
  assert.equal(matchesRoleRule(r, [B, A, D]), true);
});

test('判斷:混用 A+B,C = (A 且 B) 或 C', () => {
  const r = parseRoleRule(`${A}+${B},${C}`);
  assert.equal(matchesRoleRule(r, [A]), false);
  assert.equal(matchesRoleRule(r, [A, B]), true);
  assert.equal(matchesRoleRule(r, [C]), true);
  assert.equal(matchesRoleRule(r, [A, D]), false);
});

test('判斷:可吃任何 Iterable(Set、generator)', () => {
  const r = parseRoleRule(`${A}+${B}`);
  assert.equal(matchesRoleRule(r, new Set([A, B])), true);
  assert.equal(matchesRoleRule(r, (function* () { yield A; })()), false);
});

test('權限群組:member 依規則、public 全放行', () => {
  const p = createPermissions({ member: parseRoleRule(`${A}+${B},${C}`) });
  assert.equal(p.can('member', [C]), true);
  assert.equal(p.can('member', [A]), false);
  assert.equal(p.can('public', []), true);
});

test('權限群組:管理員獨立,不自動算有資格;未設定管理員規則時無人是管理員', () => {
  const noAdmin = createPermissions({ member: parseRoleRule(A) });
  assert.equal(noAdmin.can('admin', [A, B, C]), false);

  const p = createPermissions({ member: parseRoleRule(A), admin: parseRoleRule(B) });
  assert.equal(p.can('admin', [B]), true);
  assert.equal(p.can('member', [B]), false, '管理員不自動算有資格');
  assert.equal(p.can('admin', [A]), false, '有資格者不自動是管理員');
});

test('從環境變數載入:缺少或錯誤時啟動失敗', () => {
  assert.throws(() => loadPermissionsFromEnv({}), RoleRuleError);
  assert.throws(() => loadPermissionsFromEnv({ ELIGIBLE_ROLE_RULE: 'oops' }), RoleRuleError);
  const p = loadPermissionsFromEnv({ ELIGIBLE_ROLE_RULE: `${A}+${B},${C}` });
  assert.equal(p.can('member', [A, B]), true);
});
