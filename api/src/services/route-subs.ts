import {
  LIMITS,
  ROUTE_PART_KEYS,
  ROUTE_PART_MAX,
  type FieldErrorCode,
  type RouteSubInput,
} from '@eranaut/shared';

// 儲存潛艇的欄位驗證(RS-26 ⑥):範圍是程式常數、DB 不加 CHECK。

export interface ValidRouteSub {
  name: string;
  level: number;
  hull: number;
  stern: number;
  bow: number;
  bridge: number;
  bound_submarine_ids: string[];
}

type Errors = Partial<Record<keyof RouteSubInput, FieldErrorCode>>;
export type RouteSubValidation = { ok: true; value: ValidRouteSub } | { ok: false; fields: Errors };

const len = (s: string) => [...s].length;

function intIn(body: Record<string, unknown>, key: keyof RouteSubInput, min: number, max: number, errors: Errors): number {
  const v = body[key];
  if (v === undefined || v === null) {
    errors[key] = 'required';
    return 0;
  }
  if (typeof v !== 'number') {
    errors[key] = 'invalid_type';
    return 0;
  }
  if (!Number.isSafeInteger(v) || v < min || v > max) {
    errors[key] = 'invalid_value';
    return 0;
  }
  return v;
}

export function validateRouteSubInput(input: unknown): RouteSubValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, fields: { name: 'required', level: 'required' } };
  }
  const body = input as Record<string, unknown>;
  const errors: Errors = {};

  let name = '';
  if (body.name === undefined || body.name === null) errors.name = 'required';
  else if (typeof body.name !== 'string') errors.name = 'invalid_type';
  else {
    name = body.name.trim();
    if (name === '') errors.name = 'required';
    else if (len(name) > LIMITS.routeSubName) errors.name = 'too_long';
  }

  const level = intIn(body, 'level', 1, LIMITS.maxRouteSubLevel, errors);
  const parts = {} as Record<(typeof ROUTE_PART_KEYS)[number], number>;
  for (const k of ROUTE_PART_KEYS) parts[k] = intIn(body, k, 1, ROUTE_PART_MAX, errors);

  let bound: string[] = [];
  const b = body.bound_submarine_ids;
  if (b !== undefined && b !== null) {
    if (!Array.isArray(b) || b.some((x) => typeof x !== 'string')) errors.bound_submarine_ids = 'invalid_type';
    else {
      bound = [...new Set((b as string[]).filter((x) => x !== ''))];
      if (bound.length > LIMITS.maxRouteSubBindings) errors.bound_submarine_ids = 'invalid_value';
    }
  }

  if (Object.keys(errors).length > 0) return { ok: false, fields: errors };
  return { ok: true, value: { name, level, ...parts, bound_submarine_ids: bound } };
}
