import type { AssistMode, ProgressDto, ProgressInput, ProgressRoute, ProgressSource, SubmarineDto, SubmarineStatus } from '@eranaut/shared';
import { ASSIST_MAX_HOURS, clampExp, levelExp, routeExp, settleProgress } from '@eranaut/shared';
import type { Db } from '../db/index.js';

// 潛艇等級與練級輔助(D-289)。一艘潛艇最多一列,列存在 = 有填等級。呼叫端須先確認潛艇屬於該使用者。
// 派出時只記路線(pending),返航後才把經驗加進等級:讀取時即時算(attachProgress),下一次更新時才寫回(settleOnDispatch)。

interface Row {
  submarine_id: string;
  level: number;
  exp_in_level: number;
  source: ProgressSource;
  assist_on: number;
  assist_mode: string;
  max_hours: number | null;
  filter_id: string | null;
  pending_sea: number | null;
  pending_points: string | null;
  pending_exp: number | null;
  last_sea: number | null;
  last_points: string | null;
  updated_at: string;
}

/** 練級資料被拒絕(沒有等級就想記路線等);呼叫端轉成 400 `fields.progress` */
export class ProgressRejected extends Error {
  constructor(
    readonly reason: 'level_required' | 'invalid_value',
    readonly position?: number,
  ) {
    super(`progress_rejected: ${reason}`);
  }
}

type Phase = { status: SubmarineStatus; expected_return_at: string | null };

/** 這艘潛艇在 `now` 是否已返航(探索完成,或預計返航時間已過) */
export function hasReturned(s: Phase, now: Date): boolean {
  return s.status === 'complete' || (s.expected_return_at !== null && new Date(s.expected_return_at).getTime() <= now.getTime());
}

function pendingOf(r: Row): (ProgressRoute & { exp: number }) | null {
  return r.pending_points === null || r.pending_sea === null || r.pending_exp === null
    ? null
    : { sea: r.pending_sea, points: JSON.parse(r.pending_points) as string[], exp: r.pending_exp };
}

function toDto(r: Row, returned: boolean): ProgressDto {
  const pending = pendingOf(r);
  const eff = settleProgress({ level: r.level, exp_in_level: r.exp_in_level, pending }, returned);
  return {
    level: r.level,
    exp_in_level: r.exp_in_level,
    source: r.source,
    assist_on: r.assist_on === 1,
    assist_mode: (r.assist_mode === 'combo' ? 'combo' : 'level') satisfies AssistMode,
    max_hours: ASSIST_MAX_HOURS.includes(r.max_hours) ? r.max_hours : null,
    filter_id: r.filter_id,
    pending,
    last_route: r.last_sea === null || r.last_points === null ? null : { sea: r.last_sea, points: JSON.parse(r.last_points) as string[] },
    effective_level: eff.level,
    effective_exp: eff.exp_in_level,
    updated_at: r.updated_at,
  };
}

/** 把等級附到潛艇上(沒填等級的潛艇不加欄位) */
export function attachProgress(db: Db, subs: SubmarineDto[], now: Date = new Date()): SubmarineDto[] {
  if (subs.length === 0) return subs;
  const rows = db.prepare(`SELECT * FROM submarine_progress WHERE submarine_id IN (${subs.map(() => '?').join(',')})`).all(...subs.map((s) => s.id)) as Row[];
  const byId = new Map(rows.map((r) => [r.submarine_id, r]));
  return subs.map((s) => {
    const r = byId.get(s.id);
    return r ? { ...s, progress: toDto(r, hasReturned(s, now)) } : s;
  });
}

function getRow(db: Db, id: string): Row | undefined {
  return db.prepare('SELECT * FROM submarine_progress WHERE submarine_id = ?').get(id) as Row | undefined;
}

export function deleteProgress(db: Db, submarineId: string): boolean {
  return db.prepare('DELETE FROM submarine_progress WHERE submarine_id = ?').run(submarineId).changes > 0;
}

/**
 * 更新潛艇「之前」呼叫(要先讀舊列):送出探索中、而且上一趟已返航 → 把上一趟待結算的經驗寫進等級。
 * 探索還沒回來就重送(同一趟)不結算。沒有等級列或沒有待結算的路線什麼都不做。
 */
export function settleOnDispatch(db: Db, submarineId: string, prev: Phase, next: { status: SubmarineStatus }, now: Date): void {
  if (next.status !== 'exploring' || !hasReturned(prev, now)) return;
  const r = getRow(db, submarineId);
  const pending = r && pendingOf(r);
  if (!r || !pending) return;
  const s = settleProgress({ level: r.level, exp_in_level: r.exp_in_level, pending }, true);
  db.prepare(
    `UPDATE submarine_progress SET level = ?, exp_in_level = ?, source = 'sim', pending_sea = NULL, pending_points = NULL, pending_exp = NULL, updated_at = ?
     WHERE submarine_id = ?`,
  ).run(s.level, s.exp_in_level, now.toISOString(), submarineId);
}

/**
 * 套用使用者(或截圖辨識)送來的等級資料。`status` = 這艘潛艇更新後的狀態(只有探索中才能記路線)。
 * 沒有等級列時至少要帶 `level`;`source: 'ocr'` 以辨識為準:清掉待結算的路線,同等級保留經驗、換等級歸 0。
 */
export function applyProgressInput(db: Db, submarineId: string, input: ProgressInput, status: SubmarineStatus, now: Date, position?: number): void {
  const cur = getRow(db, submarineId);
  if (!cur && input.level === undefined) throw new ProgressRejected('level_required', position);

  const level = input.level ?? cur!.level;
  const levelChanged = cur !== undefined && level !== cur.level;
  let exp = input.exp_in_level ?? (cur && !levelChanged ? cur.exp_in_level : 0);
  const need = levelExp(level);
  if (need !== null && exp >= need) {
    if (input.exp_in_level !== undefined) throw new ProgressRejected('invalid_value', position);
    exp = clampExp(level, exp);
  }

  const ocr = input.source === 'ocr';
  let pending: (ProgressRoute & { exp: number }) | null = cur ? pendingOf(cur) : null;
  // 使用者(或截圖)明確給了等級 / 經驗 = 現況以那個數字為準,舊的待結算路線作廢,否則返航後會重複加一次
  if (ocr || input.level !== undefined || input.exp_in_level !== undefined) pending = null;
  if (input.route === null) pending = null;
  else if (input.route !== undefined) {
    const e = routeExp(input.route.sea, input.route.points);
    if (e === null || status !== 'exploring') throw new ProgressRejected('invalid_value', position);
    pending = { sea: input.route.sea, points: [...input.route.points], exp: e };
  }

  const last = input.route ? { sea: input.route.sea, points: input.route.points } : cur && cur.last_sea !== null && cur.last_points !== null ? { sea: cur.last_sea, points: JSON.parse(cur.last_points) as string[] } : null;
  const assistOn = input.assist_on ?? (cur ? cur.assist_on === 1 : false);
  const mode: AssistMode = input.assist_mode ?? (cur?.assist_mode === 'combo' ? 'combo' : 'level');
  const maxHours = input.max_hours === undefined ? (cur?.max_hours ?? null) : input.max_hours;
  const filterId = input.filter_id === undefined ? (cur?.filter_id ?? null) : input.filter_id;
  // 條件組合只能選自己的條件(條件被刪除時資料庫會自動設回 null)
  if (filterId !== null && filterId !== (cur?.filter_id ?? null)) {
    const own = db
      .prepare('SELECT 1 FROM route_filters f JOIN workshops w ON w.user_id = f.user_id JOIN submarines s ON s.workshop_id = w.id WHERE f.id = ? AND s.id = ?')
      .get(filterId, submarineId);
    if (!own) throw new ProgressRejected('invalid_value', position);
  }
  const source: ProgressSource = ocr ? 'ocr' : input.level !== undefined || input.exp_in_level !== undefined ? 'manual' : (cur?.source ?? 'manual');
  db.prepare(
    `INSERT INTO submarine_progress (submarine_id, level, exp_in_level, source, assist_on, assist_mode, max_hours, filter_id, pending_sea, pending_points, pending_exp, last_sea, last_points, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
     ON CONFLICT(submarine_id) DO UPDATE SET level = excluded.level, exp_in_level = excluded.exp_in_level, source = excluded.source,
       assist_on = excluded.assist_on, assist_mode = excluded.assist_mode, max_hours = excluded.max_hours, filter_id = excluded.filter_id, pending_sea = excluded.pending_sea, pending_points = excluded.pending_points,
       pending_exp = excluded.pending_exp, last_sea = excluded.last_sea, last_points = excluded.last_points, updated_at = excluded.updated_at`,
  ).run(
    submarineId,
    level,
    exp,
    source,
    assistOn ? 1 : 0,
    mode,
    maxHours,
    filterId,
    pending?.sea ?? null,
    pending ? JSON.stringify(pending.points) : null,
    pending?.exp ?? null,
    last?.sea ?? null,
    last ? JSON.stringify(last.points) : null,
    now.toISOString(),
  );
}

