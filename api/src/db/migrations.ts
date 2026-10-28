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
  {
    version: 7,
    name: 'server_maintenance',
    // 遊戲伺服器維護的目前狀態(D-283):Eranarch 抓到官網公告後通知內部端點,以文章 ID upsert(冪等);
    // 前端橫幅讀這張表。官網維護不會進來。過期資料在寫入時順手刪,不另開清理排程。
    sql: `
CREATE TABLE server_maintenance (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  start_at TEXT NOT NULL,
  end_at TEXT NOT NULL,
  finished_at TEXT,
  updated_at TEXT NOT NULL
);
`,
  },
  {
    version: 8,
    name: 'submarine_upkeep',
    // 配件維修提醒(D-288):每艘潛艇最多一列(列存在 = 已開啟)。獨立一張表,不放進 route_sub_bindings——
    // 儲存航線配置時綁定會整組重寫,維修進度會被洗掉。潛艇刪除時連帶刪除,不需清理排程。
    // route_points 為有順序的航點代碼(JSON 文字);limit_voyages 是開啟當下的快照(可手改);
    // parts_sig 為開啟時的零件組合(例如 `3,1,2,4`),用來偵測配置被改過。路線與趟數的驗證在 API。
    sql: `
CREATE TABLE submarine_upkeep (
  submarine_id TEXT PRIMARY KEY REFERENCES submarines(id) ON DELETE CASCADE,
  route_key TEXT NOT NULL,
  route_sea INTEGER NOT NULL,
  route_points TEXT NOT NULL,
  voyages_done INTEGER NOT NULL,
  limit_voyages INTEGER NOT NULL,
  parts_sig TEXT NOT NULL,
  repaired_at TEXT,
  updated_at TEXT NOT NULL
);
`,
  },
  {
    version: 9,
    name: 'submarine_progress',
    // 潛艇等級與練級輔助(D-289):每艘潛艇最多一列(列存在 = 有填等級,沒填就沒有列、畫面不顯示)。
    // 放在潛艇身上而不是配置:同一組配置常綁多艘、各艘等級不同。不動 submarines 表;潛艇刪除時連帶刪除。
    // pending_*:派出時記下的路線與它的經驗,返航後(下一次讀取或更新時)才加進等級,不需要排程。
    // last_*:最近一次記下的路線(結算後也保留),讓下次一鍵「跟上次一樣」。
    // level 可記到 130(截圖辨識可能讀到);練級輔助只算到 85。驗證在 API。
    sql: `
CREATE TABLE submarine_progress (
  submarine_id TEXT PRIMARY KEY REFERENCES submarines(id) ON DELETE CASCADE,
  level INTEGER NOT NULL,
  exp_in_level INTEGER NOT NULL DEFAULT 0,
  source TEXT NOT NULL DEFAULT 'manual',
  sim_on INTEGER NOT NULL DEFAULT 0,
  school TEXT,
  pending_sea INTEGER,
  pending_points TEXT,
  pending_exp INTEGER,
  last_sea INTEGER,
  last_points TEXT,
  updated_at TEXT NOT NULL
);
`,
  },
  {
    version: 10,
    name: 'workshop_charts',
    // 海圖探索紀錄(D-293):每間工坊、每個海域最多一列,points 為已發現的航點 id(航線資料集的 id,JSON 文字)。
    // 主鍵用 (workshop_id, sea),和 submarine_upkeep 一樣不另開流水號;工坊刪除時連帶刪除,不需清理排程。
    // 寫入只覆寫該海域(整筆取代),沒有任何已發現的點就刪除該列。點是否屬於該海域的驗證在 API。
    sql: `
CREATE TABLE workshop_charts (
  workshop_id TEXT NOT NULL REFERENCES workshops(id) ON DELETE CASCADE,
  sea INTEGER NOT NULL,
  points TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  PRIMARY KEY (workshop_id, sea)
);
`,
  },
];
