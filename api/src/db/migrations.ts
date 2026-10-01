// 依序執行的 migration。只能新增、不可修改已發布的項目。
// 建立順序 users → workshops → submarines → reminders → reminder_deliveries;sessions 只依賴 users。
// 規格來源:docs/SCHEMA.md(D-132、D-133、D-135、D-136、D-137、D-138、D-139)。
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
];
