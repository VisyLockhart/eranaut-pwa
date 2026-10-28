import { newId } from './demo-id';
import { HttpBackend, HttpErrorResponse, HttpResponse, type HttpEvent, type HttpRequest } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import {
  DISTRICTS,
  LIMITS,
  NOTIFY_LEAD_MINUTES,
  SERVERS,
  SUBMARINE_STATUSES,
  type FieldErrorCode,
  type NotifyLeadMinutes,
  type ChartOcrResultDto,
  type OcrResultDto,
  type MaintenanceDto,
  type RouteFilterDto,
  type RouteSubDto,
  type SubmarineDto,
  type SubmarineInput,
  type SubmarinesUpdateResult,
  type WorkshopDto,
  type WorkshopWithSubmarines,
} from '@eranaut/shared';
import { Observable, delay, of, throwError } from 'rxjs';
import { SEAS } from '../route/core/data';
import { DemoStore } from './demo-store';
import {
  DemoRejected,
  applyProgressInput,
  boundParts,
  countVoyage,
  enableUpkeep,
  hasReturned,
  parseProgressInput,
  parseUpkeepInput,
  patchUpkeep,
  progressDto,
  settleOnDispatch,
  upkeepDto,
} from './demo-levels';

// 展示模式的假後端(D-168):取代 HttpClient 底層,攔截所有 `/api/*` 請求。
// 驗證規則與回應格式對齊真 API(shared/src/api.ts),所以前端的表單錯誤、404、提醒略過提示等行為都會照常運作。
// 沒有任何請求會離開瀏覽器。

const MIN = 60_000;
const LATENCY_MS = 90;
const OCR_LATENCY_MS = 900;

class Reply {
  constructor(
    readonly status: number,
    readonly body: unknown = null,
    readonly delayMs = LATENCY_MS,
  ) {}
}
const ok = (body: unknown = null, delayMs?: number): Reply => new Reply(200, body, delayMs);
const fail = (status: number, body: unknown = null): Reply => new Reply(status, body);

const chars = (s: string): number => [...s].length;
const isInt = (v: unknown): v is number => typeof v === 'number' && Number.isInteger(v);

type Fields = Record<string, FieldErrorCode>;

function validateWorkshop(b: Record<string, unknown>): { fields: Fields; value: Omit<WorkshopDto, 'id' | 'created_at'> | null } {
  const fields: Fields = {};
  const optionalText = (key: string, max: number): string | null => {
    const v = b[key];
    if (v === undefined || v === null) return null;
    if (typeof v !== 'string') {
      fields[key] = 'invalid_type';
      return null;
    }
    const t = v.trim();
    if (chars(t) > max) fields[key] = 'too_long';
    return t === '' ? null : t;
  };

  let name = '';
  if (typeof b['name'] !== 'string') fields['name'] = b['name'] === undefined || b['name'] === null ? 'required' : 'invalid_type';
  else {
    name = b['name'].trim();
    if (name === '') fields['name'] = 'required';
    else if (chars(name) > LIMITS.workshopName) fields['name'] = 'too_long';
  }

  const server = b['server'];
  if (typeof server !== 'string') fields['server'] = server === undefined || server === null ? 'required' : 'invalid_type';
  else if (!(SERVERS as readonly string[]).includes(server)) fields['server'] = 'invalid_value';

  const captain = optionalText('captain', LIMITS.captain);
  const detail = optionalText('address_detail', LIMITS.addressDetail);

  let district: WorkshopDto['address_district'] = null;
  const d = b['address_district'];
  if (d !== undefined && d !== null) {
    if (typeof d !== 'string') fields['address_district'] = 'invalid_type';
    else if (!(DISTRICTS as readonly string[]).includes(d)) fields['address_district'] = 'invalid_value';
    else district = d as WorkshopDto['address_district'];
  }

  let ward: number | null = null;
  const w = b['address_ward'];
  if (w !== undefined && w !== null) {
    if (!isInt(w)) fields['address_ward'] = 'invalid_type';
    else if (w < 1) fields['address_ward'] = 'invalid_value';
    else ward = w;
  }

  let batched = false;
  if (b['notify_batched'] !== undefined) {
    if (typeof b['notify_batched'] !== 'boolean') fields['notify_batched'] = 'invalid_type';
    else batched = b['notify_batched'];
  }

  let lead: NotifyLeadMinutes = 0;
  if (b['notify_lead_minutes'] !== undefined) {
    const l = b['notify_lead_minutes'];
    if (!isInt(l)) fields['notify_lead_minutes'] = 'invalid_type';
    else if (!(NOTIFY_LEAD_MINUTES as readonly number[]).includes(l)) fields['notify_lead_minutes'] = 'invalid_value';
    else lead = l as NotifyLeadMinutes;
  }

  if (Object.keys(fields).length > 0) return { fields, value: null };
  return {
    fields,
    value: {
      name,
      server: server as WorkshopDto['server'],
      captain,
      address_district: district,
      address_ward: ward,
      address_detail: detail,
      notify_batched: batched,
      notify_lead_minutes: lead,
    },
  };
}

function validateSubmarine(b: Record<string, unknown>): { fields: Fields; value: SubmarineInput | null } {
  const fields: Fields = {};
  if (!isInt(b['position'])) fields['position'] = b['position'] === undefined ? 'required' : 'invalid_type';
  else if (b['position'] < 1 || b['position'] > LIMITS.maxSubmarinesPerWorkshop) fields['position'] = 'invalid_value';

  let name: string | null = null;
  if (b['name'] !== undefined && b['name'] !== null) {
    if (typeof b['name'] !== 'string') fields['name'] = 'invalid_type';
    else {
      const t = b['name'].trim();
      if (chars(t) > LIMITS.submarineName) fields['name'] = 'too_long';
      name = t === '' ? null : t;
    }
  }

  const status = b['status'];
  if (typeof status !== 'string') fields['status'] = status === undefined ? 'required' : 'invalid_type';
  else if (!(SUBMARINE_STATUSES as readonly string[]).includes(status)) fields['status'] = 'invalid_value';

  let minutes: number | null = null;
  if (status === 'exploring') {
    const m = b['remaining_minutes'];
    if (m === undefined || m === null) fields['remaining_minutes'] = 'required';
    else if (!isInt(m)) fields['remaining_minutes'] = 'invalid_type';
    else if (m < 1 || m > LIMITS.maxRemainingMinutes) fields['remaining_minutes'] = 'invalid_value';
    else minutes = m;
  }

  // 配件維修提醒(D-288)與等級(D-289):物件 = 設定、null = 關閉 / 清除、省略 = 不變
  const upkeep = parseUpkeepInput(b['upkeep']);
  if (upkeep === 'invalid') fields['upkeep'] = 'invalid_value';
  const progress = parseProgressInput(b['progress']);
  if (progress === 'invalid') fields['progress'] = 'invalid_value';

  if (Object.keys(fields).length > 0) return { fields, value: null };
  const value: SubmarineInput = { position: b['position'] as number, name, status: status as SubmarineInput['status'], remaining_minutes: minutes };
  if (upkeep !== undefined && upkeep !== 'invalid') value.upkeep = upkeep;
  if (progress !== undefined && progress !== 'invalid') value.progress = progress;
  return { fields, value };
}

/** 固定的假辨識結果(「請選擇潛水艇」選單視窗),其中一艘的時間標為「請核對」,示範核對流程 */
function fakeOcr(): OcrResultDto {
  const row = (position: number, days: number, hours: number, minutes: number, suspect = false): OcrResultDto['submarines'][number] => ({
    position,
    name: `潛水艇-${position}`,
    status: 'exploring',
    days,
    hours,
    minutes,
    remaining_minutes: days * 1440 + hours * 60 + minutes,
    // 截圖辨識到的等級(D-289):示範用的固定截圖沒有等級,避免蓋掉各工坊示範好的等級
    level: null,
    suspect: { name: false, time: suspect },
    reasons: suspect ? ['low_confidence'] : [],
  });
  return { format: 'menu', submarines: [row(1, 0, 3, 20), row(2, 0, 7, 5, true), row(3, 1, 2, 48), row(4, 0, 0, 55)], warnings: [] };
}

/**
 * 示範的海圖辨識(D-293):展示版沒有伺服器,不管上傳哪張圖都回同一個結果——溺沒海開到 N(和畫面「已發現」相符)。
 * 沒有海圖位置(map_box.size = 0),所以不提供「對照截圖」。
 */
function fakeChartOcr(): ChartOcrResultDto {
  const sea = SEAS.find((s) => s.sea === 1)!;
  const codes = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N', 'P'];
  const points = sea.points.filter((p) => codes.includes(p.code)).map((p) => p.id);
  return { sea: 1, points, filled: [], uncertain: [], screen_count: points.length, map_box: { left: 0, top: 0, size: 0, width: 0, height: 0 } };
}

/** 海圖紀錄的驗證(同真 API):航點必須屬於該海域;空陣列 = 刪除該海域 */
function validateCharts(b: Record<string, unknown>): { sea: number; points: number[] }[] | null {
  const seas = b['seas'];
  if (!Array.isArray(seas) || seas.length === 0 || seas.length > SEAS.length) return null;
  const out: { sea: number; points: number[] }[] = [];
  for (const item of seas as Record<string, unknown>[]) {
    const def = SEAS.find((s) => s.sea === item?.['sea']);
    const pts = item?.['points'];
    if (!def || !Array.isArray(pts) || out.some((o) => o.sea === def.sea)) return null;
    const ids = def.points.map((p) => p.id);
    if (!pts.every((p) => typeof p === 'number' && ids.includes(p))) return null;
    out.push({ sea: def.sea, points: ids.filter((id) => pts.includes(id)) });
  }
  return out;
}

@Injectable()
export class DemoBackend extends HttpBackend {
  private readonly store = inject(DemoStore);

  override handle(req: HttpRequest<unknown>): Observable<HttpEvent<unknown>> {
    const path = req.url.split('?')[0];
    let reply: Reply;
    try {
      reply = this.route(req.method, path, req.body);
    } catch {
      reply = fail(500, { error: 'demo_error' });
    }
    if (reply.status >= 200 && reply.status < 300) {
      return of(new HttpResponse({ status: reply.status, body: reply.body, url: req.url })).pipe(delay(reply.delayMs));
    }
    return throwError(() => new HttpErrorResponse({ status: reply.status, error: reply.body, url: req.url })).pipe(delay(reply.delayMs));
  }

  private route(method: string, path: string, body: unknown): Reply {
    const b = (body && typeof body === 'object' ? body : {}) as Record<string, unknown>;

    if (path === '/api/public-config') return ok({ guildName: 'Eranaut 展示' });
    if (path === '/api/me') {
      return this.store.signedIn ? ok({ displayName: 'Demo', avatarUrl: null }) : fail(401);
    }
    if (path === '/api/auth/logout') {
      this.store.setSignedIn(false);
      return ok();
    }
    // 其餘端點都要登入
    if (!this.store.signedIn) return fail(401);

    if (path === '/api/overview' && method === 'GET') return ok({ workshops: this.store.workshops.map((w) => this.withExtras(w)), maintenance: this.maintenance() });
    if (path === '/api/maintenance' && method === 'GET') return ok({ maintenance: this.maintenance() });

    // 配件維修提醒與等級的單獨調整(D-288、D-289)
    const one = /^\/api\/submarines\/([^/]+)\/(upkeep|progress)$/.exec(path);
    if (one) return this.subExtra(decodeURIComponent(one[1]), one[2] as 'upkeep' | 'progress', method, body);
    const repaired = /^\/api\/workshops\/([^/]+)\/upkeep\/repaired$/.exec(path);
    if (repaired && method === 'POST') return this.markRepaired(decodeURIComponent(repaired[1]), b);

    // 儲存配置與綁定(RS-25、RS-26)、條件組合(D-229):展示版也開放,存在這個瀏覽器(D-292)
    const rs = /^\/api\/route-subs(?:\/([^/]+))?$/.exec(path);
    if (rs) return this.routeSubs(method, rs[1] ? decodeURIComponent(rs[1]) : null, b);
    const rf = /^\/api\/route-filters(?:\/([^/]+))?$/.exec(path);
    if (rf) return this.routeFilters(method, rf[1] ? decodeURIComponent(rf[1]) : null, b);

    if (path === '/api/workshops' && method === 'POST') {
      const { fields, value } = validateWorkshop(b);
      if (!value) return fail(400, { error: 'validation_failed', fields });
      const created: WorkshopWithSubmarines = { ...value, id: newId(), created_at: new Date().toISOString(), submarines: [], charts: [] };
      this.store.workshops.push(created);
      this.store.commit();
      const { submarines: _omit, ...dto } = created;
      void _omit;
      return new Reply(201, dto);
    }

    // 海圖探索紀錄(D-293)
    const ch = /^\/api\/workshops\/([^/]+)\/charts$/.exec(path);
    if (ch) {
      const workshop = this.store.workshops.find((w) => w.id === decodeURIComponent(ch[1]));
      if (!workshop) return fail(404, { error: 'not_found' });
      workshop.charts ??= [];
      if (method === 'GET') return ok(workshop.charts);
      if (method === 'PUT') {
        const seas = validateCharts(b);
        if (!seas) return fail(400, { error: 'validation_failed', fields: { seas: 'invalid_value' } });
        const t = new Date().toISOString();
        for (const s of seas) {
          workshop.charts = workshop.charts.filter((c) => c.sea !== s.sea);
          if (s.points.length) workshop.charts.push({ sea: s.sea, points: s.points, updated_at: t });
        }
        workshop.charts.sort((x, y) => x.sea - y.sea);
        this.store.commit();
        return ok(workshop.charts);
      }
    }
    if (path === '/api/charts/ocr' && method === 'POST') return ok(fakeChartOcr(), OCR_LATENCY_MS);

    const ws = /^\/api\/workshops\/([^/]+)(?:\/submarines(?:\/(\d+))?)?$/.exec(path);
    if (ws) {
      const id = decodeURIComponent(ws[1]);
      const workshop = this.store.workshops.find((w) => w.id === id);
      const isSubmarines = path.includes('/submarines');
      if (!workshop) return fail(404, { error: 'not_found' });

      if (!isSubmarines && method === 'PUT') {
        const { fields, value } = validateWorkshop(b);
        if (!value) return fail(400, { error: 'validation_failed', fields });
        Object.assign(workshop, value);
        this.store.commit();
        const { submarines: _omit, ...dto } = workshop;
        void _omit;
        return ok(dto);
      }
      if (!isSubmarines && method === 'DELETE') {
        this.store.forgetSubmarines(workshop.submarines.map((s) => s.id));
        this.store.workshops.splice(this.store.workshops.indexOf(workshop), 1);
        this.store.commit();
        return ok();
      }
      if (isSubmarines && !ws[2] && method === 'PUT') return this.updateBatch(workshop, b);
      if (isSubmarines && ws[2] && method === 'PUT') return this.updateOne(workshop, Number(ws[2]), b);
    }

    if (path === '/api/ocr' && method === 'POST') return ok(fakeOcr(), OCR_LATENCY_MS);

    if (path === '/api/notify-prefs') {
      if (method === 'GET') return ok(this.store.prefs);
      if (method === 'PUT') {
        const fields: Fields = {};
        for (const k of ['dm', 'channel'] as const) if (typeof b[k] !== 'boolean') fields[k] = b[k] === undefined ? 'required' : 'invalid_type';
        if (Object.keys(fields).length > 0) return fail(400, { error: 'validation_failed', fields });
        this.store.prefs.dm = b['dm'] as boolean;
        this.store.prefs.channel = b['channel'] as boolean;
        this.store.commit();
        return ok(this.store.prefs);
      }
    }

    // 展示版不提供推播:publicKey = null 會讓設定頁隱藏這一項
    if (path === '/api/push/config') return ok({ publicKey: null });
    if (path === '/api/push/subscriptions') return ok({ endpoints: [] });

    return fail(404, { error: 'not_found' });
  }

  /** 總覽與更新回應用:附上維修提醒(含目前綁定的配置簽名)與等級(返航後即時結算) */
  private decorate(s: SubmarineDto, now = Date.now()): SubmarineDto {
    const { upkeep: _u, progress: _p, ...base } = s;
    void _u;
    void _p;
    const out: SubmarineDto = { ...base };
    const u = this.store.upkeep[s.id];
    if (u) out.upkeep = upkeepDto(u, boundParts(this.store.routeSubs, s.id));
    const p = this.store.progress[s.id];
    if (p) out.progress = progressDto(p, hasReturned(s, now));
    return out;
  }

  private withExtras(w: WorkshopWithSubmarines): WorkshopWithSubmarines {
    const now = Date.now();
    return { ...w, charts: w.charts ?? [], submarines: w.submarines.map((s) => this.decorate(s, now)) };
  }

  /** 展示標籤打開「示範維護橫幅」時,回一則進行中的示範維護(D-283、D-292) */
  private maintenance(): MaintenanceDto | null {
    if (!this.store.maintenance) return null;
    const hour = 3_600_000;
    const start = Math.floor(Date.now() / hour) * hour - hour;
    return {
      id: 'demo-maintenance',
      title: '【示範】全伺服器定期維護',
      url: 'https://www.ffxiv.com.tw/web/news/news_list.aspx',
      start_at: new Date(start).toISOString(),
      end_at: new Date(start + 5 * hour).toISOString(),
    };
  }

  /**
   * 更新潛艇(整坊或單艘)。與正式版相同:全成功或全不寫——維修提醒或等級被拒絕時,整筆還原並回 400。
   * 順序:計次與結算(看更新前的狀態)→ 寫入潛艇 → 維修提醒的開關 → 等級。
   */
  private apply(workshop: WorkshopWithSubmarines, inputs: SubmarineInput[]): SubmarinesUpdateResult | DemoRejected {
    const now = Date.now();
    const backup = JSON.stringify({ subs: workshop.submarines, upkeep: this.store.upkeep, progress: this.store.progress });
    const lead = workshop.notify_lead_minutes;
    const updated: SubmarineDto[] = [];
    try {
      for (const input of inputs) {
        const existing = workshop.submarines.find((s) => s.position === input.position);
        if (existing) {
          const u = this.store.upkeep[existing.id];
          if (u && input.upkeep === undefined) countVoyage(u, existing, input, now);
          const p = this.store.progress[existing.id];
          if (p) settleOnDispatch(p, existing, input, now);
        }
        const dto: SubmarineDto = {
          id: existing?.id ?? newId(),
          workshop_id: workshop.id,
          position: input.position,
          name: input.name ?? null,
          status: input.status,
          expected_return_at: input.status === 'exploring' ? new Date(now + (input.remaining_minutes ?? 0) * MIN).toISOString() : null,
          last_synced_at: new Date(now).toISOString(),
        };
        workshop.submarines = [...workshop.submarines.filter((s) => s.position !== input.position), dto].sort((a, c) => a.position - c.position);
        updated.push(dto);
      }
      for (const input of inputs) {
        if (input.upkeep === undefined) continue;
        const id = updated.find((d) => d.position === input.position)!.id;
        if (input.upkeep === null) delete this.store.upkeep[id];
        else this.store.upkeep[id] = enableUpkeep(boundParts(this.store.routeSubs, id), input.upkeep, input.status, now, input.position);
      }
      for (const input of inputs) {
        if (input.progress === undefined) continue;
        const id = updated.find((d) => d.position === input.position)!.id;
        if (input.progress === null) delete this.store.progress[id];
        else this.store.progress[id] = applyProgressInput(this.store.progress[id], input.progress, input.status, now, input.position);
      }
    } catch (e) {
      if (!(e instanceof DemoRejected)) throw e;
      const old = JSON.parse(backup) as { subs: SubmarineDto[]; upkeep: DemoStore['upkeep']; progress: DemoStore['progress'] };
      workshop.submarines = old.subs;
      for (const k of Object.keys(this.store.upkeep)) delete this.store.upkeep[k];
      Object.assign(this.store.upkeep, old.upkeep);
      for (const k of Object.keys(this.store.progress)) delete this.store.progress[k];
      Object.assign(this.store.progress, old.progress);
      return e;
    }
    // 預先提醒時間已過的潛艇會被略過(D-135 ②b):逐艘看自己的剩餘時間;整批只有一則,以最晚返航為準
    const exploring = inputs.filter((i) => i.status === 'exploring');
    let skipped: number[] = [];
    if (lead > 0 && exploring.length > 0) {
      if (workshop.notify_batched) {
        const latest = Math.max(...exploring.map((i) => i.remaining_minutes ?? 0));
        if (latest <= lead) skipped = exploring.map((i) => i.position);
      } else {
        skipped = exploring.filter((i) => (i.remaining_minutes ?? 0) <= lead).map((i) => i.position);
      }
    }
    this.store.commit();
    return { submarines: updated.map((d) => this.decorate(d, now)), reminder_skipped_positions: skipped };
  }

  private findSub(id: string): { workshop: WorkshopWithSubmarines; sub: SubmarineDto } | null {
    for (const w of this.store.workshops) {
      const sub = w.submarines.find((s) => s.id === id);
      if (sub) return { workshop: w, sub };
    }
    return null;
  }

  /** `PUT/DELETE /api/submarines/:id/upkeep|progress`:回更新後的潛艇 */
  private subExtra(id: string, kind: 'upkeep' | 'progress', method: string, body: unknown): Reply {
    const hit = this.findSub(id);
    if (!hit) return fail(404, { error: 'not_found' });
    const now = Date.now();
    if (method === 'DELETE') {
      if (kind === 'upkeep') delete this.store.upkeep[id];
      else delete this.store.progress[id];
    } else if (method === 'PUT') {
      if (kind === 'upkeep') {
        const row = this.store.upkeep[id];
        if (!row) return fail(404, { error: 'not_found' });
        if (!patchUpkeep(row, body, now)) return fail(400, { error: 'validation_failed', fields: {} });
      } else {
        const input = parseProgressInput(body);
        if (input === 'invalid' || input === null || input === undefined) return fail(400, { error: 'validation_failed', fields: { progress: 'invalid_value' } });
        try {
          this.store.progress[id] = applyProgressInput(this.store.progress[id], input, hit.sub.status, now);
        } catch (e) {
          if (!(e instanceof DemoRejected)) throw e;
          return fail(400, { error: 'validation_failed', fields: { progress: 'invalid_value' }, progress_reason: e.reason });
        }
      }
    } else return fail(404, { error: 'not_found' });
    this.store.commit();
    return ok(this.decorate(hit.sub, now));
  }

  /** 面板「標示已維修」:趟數歸 0;回該工坊全部潛艇 */
  private markRepaired(workshopId: string, b: Record<string, unknown>): Reply {
    const workshop = this.store.workshops.find((w) => w.id === workshopId);
    if (!workshop) return fail(404, { error: 'not_found' });
    const ids = b['submarine_ids'];
    if (!Array.isArray(ids) || ids.length === 0 || ids.length > 4 || ids.some((i) => typeof i !== 'string')) {
      return fail(400, { error: 'validation_failed', fields: { submarine_ids: 'invalid_value' } });
    }
    const t = new Date().toISOString();
    for (const s of workshop.submarines) {
      const row = this.store.upkeep[s.id];
      if (row && (ids as string[]).includes(s.id)) Object.assign(row, { voyages_done: 0, repaired_at: t, updated_at: t });
    }
    this.store.commit();
    return ok({ submarines: workshop.submarines.map((s) => this.decorate(s)) });
  }

  private ownsAll(ids: string[]): boolean {
    return ids.every((id) => this.findSub(id) !== null);
  }

  /** 儲存配置(RS-25、RS-26):一艘潛艇只綁一組,綁到新的配置時從舊的搬過來 */
  private routeSubs(method: string, id: string | null, b: Record<string, unknown>): Reply {
    const list = this.store.routeSubs;
    if (id === null && method === 'GET') return ok(list);
    const parsed = (): Omit<RouteSubDto, 'id' | 'favorite' | 'created_at' | 'updated_at'> | Record<string, FieldErrorCode> => {
      const fields: Fields = {};
      const name = typeof b['name'] === 'string' ? b['name'].trim() : '';
      if (name === '') fields['name'] = 'required';
      else if (chars(name) > LIMITS.routeSubName) fields['name'] = 'too_long';
      const num = (k: string, min: number, max: number): number => {
        const v = b[k];
        if (!isInt(v) || v < min || v > max) fields[k] = v === undefined ? 'required' : 'invalid_value';
        return isInt(v) ? v : 0;
      };
      const level = num('level', 1, LIMITS.maxRouteSubLevel);
      const [hull, stern, bow, bridge] = ['hull', 'stern', 'bow', 'bridge'].map((k) => num(k, 1, 10));
      const raw = b['bound_submarine_ids'];
      const bound = Array.isArray(raw) ? [...new Set(raw.filter((x): x is string => typeof x === 'string' && x !== ''))] : [];
      if (bound.length > LIMITS.maxRouteSubBindings || !this.ownsAll(bound)) fields['bound_submarine_ids'] = 'invalid_value';
      if (Object.keys(fields).length > 0) return fields;
      return { name, level, hull: hull!, stern: stern!, bow: bow!, bridge: bridge!, bound_submarine_ids: bound };
    };
    const rebind = (owner: string, bound: string[]): void => {
      this.store.routeSubs = this.store.routeSubs.map((r) => (r.id === owner ? r : { ...r, bound_submarine_ids: r.bound_submarine_ids.filter((x) => !bound.includes(x)) }));
    };
    const now = new Date().toISOString();
    if (id === null && method === 'POST') {
      const v = parsed();
      if (!('level' in v) || typeof v['level'] !== 'number') return fail(400, { error: 'validation_failed', fields: v });
      if (list.length >= LIMITS.maxRouteSubsPerUser) return fail(409, { error: 'limit_reached' });
      const created: RouteSubDto = { ...(v as Omit<RouteSubDto, 'id' | 'favorite' | 'created_at' | 'updated_at'>), id: newId(), favorite: false, created_at: now, updated_at: now };
      this.store.routeSubs = [...list, created];
      rebind(created.id, created.bound_submarine_ids);
      this.store.commit();
      return new Reply(201, created);
    }
    const target = list.find((r) => r.id === id);
    if (!target) return fail(404, { error: 'not_found' });
    if (method === 'PUT') {
      const v = parsed();
      if (!('level' in v) || typeof v['level'] !== 'number') return fail(400, { error: 'validation_failed', fields: v });
      const next: RouteSubDto = { ...target, ...(v as Omit<RouteSubDto, 'id' | 'favorite' | 'created_at' | 'updated_at'>), updated_at: now };
      this.store.routeSubs = list.map((r) => (r.id === id ? next : r));
      rebind(next.id, next.bound_submarine_ids);
      this.store.commit();
      return ok(this.store.routeSubs.find((r) => r.id === id));
    }
    if (method === 'PATCH') {
      if (typeof b['favorite'] !== 'boolean') return fail(400, { error: 'validation_failed', fields: { favorite: 'invalid_type' } });
      target.favorite = b['favorite'];
      this.store.commit();
      return ok(target);
    }
    if (method === 'DELETE') {
      this.store.routeSubs = list.filter((r) => r.id !== id);
      this.store.commit();
      return new Reply(204);
    }
    return fail(404, { error: 'not_found' });
  }

  /** 條件組合(D-229):前端已經驗證過內容,這裡只檢查名稱與數量上限 */
  private routeFilters(method: string, id: string | null, b: Record<string, unknown>): Reply {
    const list = this.store.routeFilters;
    if (id === null && method === 'GET') return ok(list);
    const now = new Date().toISOString();
    const name = typeof b['name'] === 'string' ? b['name'].trim() : '';
    const spec = b['spec'];
    const invalid = (): Fields | null => {
      const fields: Fields = {};
      if (name === '') fields['name'] = 'required';
      else if (chars(name) > LIMITS.routeFilterName) fields['name'] = 'too_long';
      if (!spec || typeof spec !== 'object' || Array.isArray(spec)) fields['spec'] = 'required';
      return Object.keys(fields).length > 0 ? fields : null;
    };
    if (id === null && method === 'POST') {
      const f = invalid();
      if (f) return fail(400, { error: 'validation_failed', fields: f });
      if (list.length >= LIMITS.maxRouteFiltersPerUser) return fail(409, { error: 'limit_reached' });
      const created = { id: newId(), name, spec, favorite: false, created_at: now, updated_at: now } as RouteFilterDto;
      this.store.routeFilters = [...list, created];
      this.store.commit();
      return new Reply(201, created);
    }
    const target = list.find((r) => r.id === id);
    if (!target) return fail(404, { error: 'not_found' });
    if (method === 'PUT') {
      const f = invalid();
      if (f) return fail(400, { error: 'validation_failed', fields: f });
      Object.assign(target, { name, spec, updated_at: now });
      this.store.commit();
      return ok(target);
    }
    if (method === 'PATCH') {
      if (typeof b['favorite'] !== 'boolean') return fail(400, { error: 'validation_failed', fields: { favorite: 'invalid_type' } });
      target.favorite = b['favorite'];
      this.store.commit();
      return ok(target);
    }
    if (method === 'DELETE') {
      this.store.routeFilters = list.filter((r) => r.id !== id);
      this.store.commit();
      return new Reply(204);
    }
    return fail(404, { error: 'not_found' });
  }

  private updateBatch(workshop: WorkshopWithSubmarines, b: Record<string, unknown>): Reply {
    const list = b['submarines'];
    if (!Array.isArray(list) || list.length === 0 || list.length > LIMITS.maxSubmarinesPerWorkshop) {
      return fail(400, { error: 'validation_failed', fields: { submarines: Array.isArray(list) ? 'invalid_value' : 'required' } });
    }
    const items: { index: number; fields: Fields }[] = [];
    const values: SubmarineInput[] = [];
    list.forEach((raw, index) => {
      const { fields, value } = validateSubmarine((raw && typeof raw === 'object' ? raw : {}) as Record<string, unknown>);
      if (value) values.push(value);
      else items.push({ index, fields });
    });
    if (items.length > 0) return fail(400, { error: 'validation_failed', fields: {}, items });
    if (new Set(values.map((v) => v.position)).size !== values.length) return fail(400, { error: 'validation_failed', fields: { submarines: 'invalid_value' } });
    const r = this.apply(workshop, values);
    if (r instanceof DemoRejected) {
      const index = values.findIndex((v) => v.position === r.position);
      return fail(400, { error: 'validation_failed', fields: {}, items: [{ index, fields: { [r.field]: 'invalid_value' } }], [`${r.field}_reason`]: r.reason });
    }
    return ok(r);
  }

  private updateOne(workshop: WorkshopWithSubmarines, position: number, b: Record<string, unknown>): Reply {
    const { fields, value } = validateSubmarine({ ...b, position });
    if (!value) return fail(400, { error: 'validation_failed', fields });
    const r = this.apply(workshop, [value]);
    if (r instanceof DemoRejected) return fail(400, { error: 'validation_failed', fields: { [r.field]: 'invalid_value' }, [`${r.field}_reason`]: r.reason });
    return ok(r);
  }
}
