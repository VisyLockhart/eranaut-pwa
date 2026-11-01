import { LIMITS, type SubmarineDto, type SubmarinesChangeResult, type WorkshopWithSubmarines } from '@eranaut/shared';
import { newId } from './demo-id';
import { applyProgressInput, hasReturned, progressDto } from './demo-levels';
import type { DemoStore } from './demo-store';

// 展示模式的「工坊管理模式」假後端(D-313~D-315):新增 / 刪除 / 位置編輯 / 搬移與複製。
// 規則與回應格式對齊正式版 api/src/services/manage.ts:全成功或全不寫,回受影響工坊的全部潛艇與新建的 id。

export interface ManageReply {
  status: number;
  body: unknown;
}
const ok = (body: unknown): ManageReply => ({ status: 200, body });
const fail = (status: number, error: string): ManageReply => ({ status, body: { error } });
const BAD = fail(400, 'validation_failed');
const NOT_FOUND = fail(404, 'not_found');
const TOO_MANY = fail(409, 'too_many_submarines');
const COPY_SUFFIX = '(複製)';
const chars = (s: string): number => [...s].length;

export interface ManageEnv {
  store: DemoStore;
  decorate: (s: SubmarineDto, now?: number) => SubmarineDto;
}

/** 不是管理模式的端點回 null,交還給原本的路由 */
export function manageRoute(env: ManageEnv, method: string, path: string, b: Record<string, unknown>): ManageReply | null {
  if (method !== 'POST') return null;
  if (path === '/api/submarines/transfer') return transfer(env, b);
  const m = /^\/api\/workshops\/([^/]+)\/submarines(?:\/(delete|layout))?$/.exec(path);
  if (!m) return null;
  const workshop = env.store.workshops.find((w) => w.id === decodeURIComponent(m[1]!));
  if (!workshop) return NOT_FOUND;
  return m[2] === 'delete' ? remove(env, workshop, b) : m[2] === 'layout' ? layout(env, workshop, b) : create(env, workshop, b);
}

function snapshot(env: ManageEnv, ids: string[], created: string[]): SubmarinesChangeResult {
  const now = Date.now();
  return {
    workshops: [...new Set(ids)].map((id) => {
      const w = env.store.workshops.find((x) => x.id === id)!;
      return { workshop_id: id, submarines: w.submarines.map((s) => env.decorate(s, now)) };
    }),
    created_ids: created,
  };
}

function freePosition(w: WorkshopWithSubmarines): number | undefined {
  const used = new Set(w.submarines.map((s) => s.position));
  for (let p = 1; p <= LIMITS.maxSubmarineRecords; p++) if (!used.has(p)) return p;
  return undefined;
}

function sorted(w: WorkshopWithSubmarines): void {
  w.submarines = [...w.submarines].sort((a, c) => a.position - c.position);
}

/** 刪除後預設重排:剩下的依原順序補成 1、2、3… */
function compact(w: WorkshopWithSubmarines): void {
  sorted(w);
  w.submarines = w.submarines.map((s, i) => ({ ...s, position: i + 1 }));
}

function registered(w: WorkshopWithSubmarines, position: number, name: string | null, now: number): SubmarineDto {
  const s: SubmarineDto = { id: newId(), workshop_id: w.id, position, name, status: 'registered', expected_return_at: null, last_synced_at: new Date(now).toISOString() };
  w.submarines = [...w.submarines, s];
  sorted(w);
  return s;
}

function create(env: ManageEnv, w: WorkshopWithSubmarines, b: Record<string, unknown>): ManageReply {
  let name: string | null = null;
  const raw = b['name'];
  if (raw !== undefined && raw !== null) {
    if (typeof raw !== 'string' || chars(raw.trim()) > LIMITS.submarineName) return BAD;
    name = raw.trim() === '' ? null : raw.trim();
  }
  const pos = freePosition(w);
  if (pos === undefined) return TOO_MANY;
  const s = registered(w, pos, name, Date.now());
  env.store.commit();
  return ok(snapshot(env, [w.id], [s.id]));
}

function ownIds(w: WorkshopWithSubmarines, ids: unknown): string[] | ManageReply {
  if (!Array.isArray(ids) || ids.length === 0 || ids.some((i) => typeof i !== 'string') || new Set(ids).size !== ids.length) return BAD;
  const own = new Set(w.submarines.map((s) => s.id));
  return (ids as string[]).every((i) => own.has(i)) ? (ids as string[]) : NOT_FOUND;
}

function remove(env: ManageEnv, w: WorkshopWithSubmarines, b: Record<string, unknown>): ManageReply {
  const ids = ownIds(w, b['submarine_ids']);
  if (!Array.isArray(ids)) return ids;
  w.submarines = w.submarines.filter((s) => !ids.includes(s.id));
  env.store.forgetSubmarines(ids);
  compact(w);
  env.store.commit();
  return ok(snapshot(env, [w.id], []));
}

function layout(env: ManageEnv, w: WorkshopWithSubmarines, b: Record<string, unknown>): ManageReply {
  const N = LIMITS.maxSubmarinesPerWorkshop;
  const slots = b['slots'];
  const unplaced = b['unplaced'] === undefined ? [] : b['unplaced'];
  if (!Array.isArray(slots) || slots.length !== N || !slots.every((s) => s === null || typeof s === 'string')) return BAD;
  if (!Array.isArray(unplaced) || !unplaced.every((s) => typeof s === 'string')) return BAD;
  const placed = (slots as (string | null)[]).filter((s): s is string => s !== null);
  const all = [...placed, ...(unplaced as string[])];
  if (new Set(all).size !== all.length || all.length !== w.submarines.length || !w.submarines.every((s) => all.includes(s.id))) return BAD;
  const where = new Map<string, number>();
  (slots as (string | null)[]).forEach((id, i) => id && where.set(id, i + 1));
  (unplaced as string[]).forEach((id, i) => where.set(id, N + 1 + i));
  w.submarines = w.submarines.map((s) => ({ ...s, position: where.get(s.id)! }));
  sorted(w);
  env.store.commit();
  return ok(snapshot(env, [w.id], []));
}

function copyName(name: string | null, same: boolean): string | null {
  if (!same || name === null) return name;
  return `${[...name].slice(0, Math.max(0, LIMITS.submarineName - [...COPY_SUFFIX].length)).join('')}${COPY_SUFFIX}`;
}

function transfer(env: ManageEnv, b: Record<string, unknown>): ManageReply {
  const { store } = env;
  const source = store.workshops.find((w) => w.id === b['source_workshop_id']);
  if (!source) return NOT_FOUND;
  const mode = b['mode'];
  if (mode !== 'move' && mode !== 'copy') return BAD;
  const ids = ownIds(source, b['submarine_ids']);
  if (!Array.isArray(ids)) return ids;
  const t = b['target_workshop_ids'];
  if (!Array.isArray(t) || t.length === 0 || new Set(t).size !== t.length) return BAD;
  const targets: WorkshopWithSubmarines[] = [];
  for (const id of t) {
    const w = store.workshops.find((x) => x.id === id);
    if (!w) return NOT_FOUND;
    targets.push(w);
  }
  if (mode === 'move' && (targets.length !== 1 || targets[0] === source)) return BAD;

  const now = Date.now();
  // 全成功或全不寫:先預演目的工坊放得下(每間最多 20 艘)
  const room = (w: WorkshopWithSubmarines): number => LIMITS.maxSubmarineRecords - w.submarines.length;
  if (targets.some((w) => room(w) < ids.length)) return TOO_MANY;

  const created: string[] = [];
  if (mode === 'move') {
    const target = targets[0]!;
    for (const id of ids) {
      const s = source.submarines.find((x) => x.id === id)!;
      source.submarines = source.submarines.filter((x) => x.id !== id);
      target.submarines = [...target.submarines, { ...s, workshop_id: target.id, position: freePosition(target)! }];
    }
    sorted(target);
    compact(source);
  } else {
    const originals = ids.map((id) => source.submarines.find((x) => x.id === id)!);
    for (const target of targets) {
      for (const o of originals) {
        const s = registered(target, freePosition(target)!, copyName(o.name, target === source), now);
        const bd = store.build[o.id];
        if (bd) store.build[s.id] = { ...bd, updated_at: new Date(now).toISOString() };
        const p = store.progress[o.id];
        if (p) {
          const eff = progressDto(p, hasReturned(o, now));
          store.progress[s.id] = applyProgressInput(undefined, { level: eff.effective_level, exp_in_level: eff.effective_exp }, 'complete', now, () => false);
        }
        created.push(s.id);
      }
    }
  }
  store.commit();
  return ok(snapshot(env, [source.id, ...targets.map((x) => x.id)], created));
}
