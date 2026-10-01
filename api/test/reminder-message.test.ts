import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildReminderMessage, circled } from '../src/services/reminder-message.js';

const base = { workshopName: '貝殼工坊', server: '伊弗利特', captain: '芙寧娜', lead: false, returnAt: null, mentionDiscordUserId: null };
const RETURN = new Date('2026-10-01T08:30:00Z');
const UNIX = Math.floor(RETURN.getTime() / 1000);

test('逐艘・返航(D-147 ①)', () => {
  assert.equal(
    buildReminderMessage({ ...base, scope: { kind: 'submarine', position: 2, name: '潛水艇-2' } }),
    '⚓ 潛水艇已返航\n②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)',
  );
});

test('逐艘・預先提醒:多一行預計返航時間,用 Discord 時間戳(絕對 t + 相對 R)(D-147 ②)', () => {
  assert.equal(
    buildReminderMessage({ ...base, lead: true, returnAt: RETURN, scope: { kind: 'submarine', position: 2, name: '潛水艇-2' } }),
    `⏳ 潛水艇即將返航\n②「潛水艇-2」・貝殼工坊(伊弗利特・芙寧娜)\n預計 <t:${UNIX}:t> 返航(<t:${UNIX}:R>)`,
  );
});

test('整批・返航與預先提醒(D-147 ③④)', () => {
  assert.equal(buildReminderMessage({ ...base, scope: { kind: 'batch', count: 3 } }), '⚓ 工坊的潛水艇已全部返航\n貝殼工坊(伊弗利特・芙寧娜)・共 3 艘');
  assert.equal(
    buildReminderMessage({ ...base, lead: true, returnAt: RETURN, scope: { kind: 'batch', count: 3 } }),
    `⏳ 工坊的潛水艇即將全部返航\n貝殼工坊(伊弗利特・芙寧娜)・共 3 艘\n預計 <t:${UNIX}:t> 返航(<t:${UNIX}:R>)`,
  );
});

test('代表角色沒填就只顯示伺服器;潛艇沒有名稱只顯示圈號', () => {
  assert.equal(
    buildReminderMessage({ ...base, captain: null, scope: { kind: 'submarine', position: 4, name: null } }),
    '⚓ 潛水艇已返航\n④・貝殼工坊(伊弗利特)',
  );
});

test('頻道版:只在第一行最前面加提及,其餘相同', () => {
  const dm = buildReminderMessage({ ...base, scope: { kind: 'batch', count: 1 } });
  const ch = buildReminderMessage({ ...base, mentionDiscordUserId: '123456789012345678', scope: { kind: 'batch', count: 1 } });
  assert.equal(ch, `<@123456789012345678> ${dm}`);
});

test('圈號 ①②③④', () => {
  assert.deepEqual([1, 2, 3, 4].map(circled), ['①', '②', '③', '④']);
});
