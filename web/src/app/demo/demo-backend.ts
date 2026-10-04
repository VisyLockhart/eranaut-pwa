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
  type OcrResultDto,
  type SubmarineDto,
  type SubmarineInput,
  type SubmarinesUpdateResult,
  type WorkshopDto,
  type WorkshopWithSubmarines,
} from '@eranaut/shared';
import { Observable, delay, of, throwError } from 'rxjs';
import { DemoStore } from './demo-store';

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

  if (Object.keys(fields).length > 0) return { fields, value: null };
  return { fields, value: { position: b['position'] as number, name, status: status as SubmarineInput['status'], remaining_minutes: minutes } };
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
    suspect: { name: false, time: suspect },
    reasons: suspect ? ['low_confidence'] : [],
  });
  return { format: 'menu', submarines: [row(1, 0, 3, 20), row(2, 0, 7, 5, true), row(3, 1, 2, 48), row(4, 0, 0, 55)], warnings: [] };
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

    if (path === '/api/overview' && method === 'GET') return ok({ workshops: this.store.workshops });

    if (path === '/api/workshops' && method === 'POST') {
      const { fields, value } = validateWorkshop(b);
      if (!value) return fail(400, { error: 'validation_failed', fields });
      const created: WorkshopWithSubmarines = { ...value, id: crypto.randomUUID(), created_at: new Date().toISOString(), submarines: [] };
      this.store.workshops.push(created);
      this.store.commit();
      const { submarines: _omit, ...dto } = created;
      void _omit;
      return new Reply(201, dto);
    }

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

  private apply(workshop: WorkshopWithSubmarines, inputs: SubmarineInput[]): SubmarinesUpdateResult {
    const now = Date.now();
    const lead = workshop.notify_lead_minutes;
    const updated: SubmarineDto[] = [];
    for (const input of inputs) {
      const existing = workshop.submarines.find((s) => s.position === input.position);
      const dto: SubmarineDto = {
        id: existing?.id ?? crypto.randomUUID(),
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
    return { submarines: updated, reminder_skipped_positions: skipped };
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
    return ok(this.apply(workshop, values));
  }

  private updateOne(workshop: WorkshopWithSubmarines, position: number, b: Record<string, unknown>): Reply {
    const { fields, value } = validateSubmarine({ ...b, position });
    if (!value) return fail(400, { error: 'validation_failed', fields });
    return ok(this.apply(workshop, [value]));
  }
}
