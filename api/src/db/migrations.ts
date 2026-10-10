// 依序執行的 migration。只能新增、不可修改已發布的項目。
// 建立順序 users → workshops → submarines → reminders → reminder_deliveries;sessions 只依賴 users。
// 規格來源:docs/SCHEMA.md(D-132、D-133、D-135、D-136、D-137、D-138、D-139、D-165)。
// 時間一律存 UTC 的 ISO 8601 字串;主鍵為 UUID v4(TEXT,由應用層以 crypto.randomUUID() 產生)。
// 停用三欄(suspended_*)不加 CHECK,一致性由應用層維持(D-132)。

export interface Migration {
  version: number;
  name: string;
  sql: string;
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'init',
    sql: `
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  discord_user_id TEXT NOT NULL UNIQUE,
  notify_methods INTEGER NOT NULL DEFAULT 1,
  suspended_at TEXT,
  suspended_auto INTEGER,
  suspended_by TEXT,
  created_at TEXT NOT NULL
);

CREATE TABLE workshops (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  name TEXT NOT NULL,
  server TEXT NOT NULL,
  captain TEXT,
  address_district TEXT,
  address_ward INTEGER,
  address_detail TEXT,
  notify_batched INTEGER NOT NULL DEFAULT 0,
  notify_lead_minutes INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_workshops_user ON workshops(user_id);

CREATE TABLE submarines (
  id TEXT PRIMARY KEY,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  name TEXT,
  status TEXT NOT NULL,
  expected_return_at TEXT,
  last_synced_at TEXT NOT NULL,
  UNIQUE(workshop_id, position)
);

CREATE TABLE sessions (
  id TEXT PRIMARY KEY,
  token_hash TEXT NOT NULL UNIQUE,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  avatar_url TEXT,
  created_at TEXT NOT NULL,
  expires_at TEXT NOT NULL
);
CREATE INDEX ix_sessions_user ON sessions(user_id);

CREATE TABLE reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  submarine_id TEXT REFERENCES submarines(id) ON DELETE CASCADE,
  scheduled_at TEXT NOT NULL,
  created_at TEXT NOT NULL
);
CREATE UNIQUE INDEX ux_reminders_submarine ON reminders(submarine_id) WHERE submarine_id IS NOT NULL;
CREATE UNIQUE INDEX ux_reminders_batch ON reminders(workshop_id) WHERE submarine_id IS NULL;

CREATE TABLE reminder_deliveries (
  id TEXT PRIMARY KEY,
  reminder_id TEXT NOT NULL REFERENCES reminders(id) ON DELETE CASCADE,
  method TEXT NOT NULL,
  status TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  next_attempt_at TEXT NOT NULL,
  last_error TEXT,
  UNIQUE(reminder_id, method)
);
CREATE INDEX ix_deliveries_due ON reminder_deliveries(status, next_attempt_at);
`,
  },
  {
    version: 2,
    name: 'push_subscriptions',
    // 瀏覽器推播訂閱(D-165):一個人可有多台裝置;endpoint 全域唯一(同一個瀏覽器換人登入時改掛到新使用者)
    sql: `
CREATE TABLE push_subscriptions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TEXT NOT NULL
);
CREATE INDEX ix_push_subscriptions_user ON push_subscriptions(user_id);
`,
  },
  {
    version: 3,
    name: 'route_subs',
    // 航線模擬器的儲存潛艇(RS-25、RS-26):每人最多 10 組由 API 檢查,表上不加 CHECK;
    // 綁定的工坊潛艇被刪時自動解除(SET NULL),不需清理排程。
    sql: `
CREATE TABLE route_subs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  level INTEGER NOT NULL,
  hull INTEGER NOT NULL,
  stern INTEGER NOT NULL,
  bow INTEGER NOT NULL,
  bridge INTEGER NOT NULL,
  bound_submarine_id TEXT REFERENCES submarines(id) ON DELETE SET NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX ix_route_subs_user ON route_subs(user_id);
CREATE INDEX ix_route_subs_bound ON route_subs(bound_submarine_id);
`,
  },
  {
    version: 4,
    name: 'route_sub_bindings',
    // 一組配置可綁多艘潛艇(同配置的艇很常見):改成綁定表。submarine_id UNIQUE = 一艘艇只綁一組配置;
    // 兩邊都 CASCADE,刪配置或刪潛艇都自動解除,不需清理排程。
    // 舊欄位 route_subs.bound_submarine_id 有外鍵、SQLite 不能直接 DROP,留著不再讀寫(搬完設 NULL)。
    sql: `
CREATE TABLE route_sub_bindings (
  route_sub_id TEXT NOT NULL REFERENCES route_subs(id) ON DELETE CASCADE,
  submarine_id TEXT NOT NULL UNIQUE REFERENCES submarines(id) ON DELETE CASCADE,
  PRIMARY KEY (route_sub_id, submarine_id)
);
INSERT OR IGNORE INTO route_sub_bindings (route_sub_id, submarine_id)
  SELECT id, bound_submarine_id FROM route_subs WHERE bound_submarine_id IS NOT NULL;
UPDATE route_subs SET bound_submarine_id = NULL;
`,
  },
  {
    version: 5,
    name: 'route_filters',
    // 找路線的「條件組合」:每人最多 10 組由 API 檢查,表上不加 CHECK。
    // spec 是 JSON 文字(不查詢、整筆讀寫),欄位驗證在 services/route-filters.ts(D-229)。
    sql: `
CREATE TABLE route_filters (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  spec TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX ix_route_filters_user ON route_filters(user_id);
`,
  },
  {
    version: 6,
    name: 'route_favorites',
    // 配置與條件組合的「常用」星號(D-237):單一欄位、預設 0;不另開表、不更新 updated_at。
    // 每人上限同時提高為 30 組(常數在 shared,不需要 migration)。
    sql: `
ALTER TABLE route_subs ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0;
ALTER TABLE route_filters ADD COLUMN favorite INTEGER NOT NULL DEFAULT 0;
`,
  },
];
