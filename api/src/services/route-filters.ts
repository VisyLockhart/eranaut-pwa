import {
  LIMITS,
  ROUTE_FILTER_LIMITS,
  ROUTE_FILTER_SORTS,
  type RouteFilterField,
  type RouteFilterSort,
  type RouteFilterSpec,
  type FieldErrorCode,
} from '@eranaut/shared';

// 條件組合的欄位驗證(D-229):範圍是程式常數、DB 不加 CHECK;API 不認識資料集,只檢查形狀與範圍。

export interface ValidRouteFilter {
  name: string;
  spec: RouteFilterSpec;
}

type Errors = Partial<Record<RouteFilterField, FieldErrorCode>>;
export type RouteFilterValidation = { ok: true; value: ValidRouteFilter } | { ok: false; fields: Errors };

const len = (s: string) => [...s].length;
const isInt = (v: unknown, min: number, max: number): v is number => typeof v === 'number' && Number.isSafeInteger(v) && v >= min && v <= max;

/** 回傳去重後的 id 陣列;型別錯 → invalid_type,範圍/數量錯 → invalid_value;省略視為空陣列 */
function idList(v: unknown, max: number, maxLen: number, key: RouteFilterField, errors: Errors): number[] {
  if (v === undefined || v === null) return [];
  if (!Array.isArray(v)) {
    errors[key] = 'invalid_type';
    return [];
  }
  if (v.length > maxLen || !v.every((x) => isInt(x, 1, max))) {
    errors[key] = 'invalid_value';
    return [];
  }
  return [...new Set(v as number[])];
}

export function validateRouteFilterInput(input: unknown): RouteFilterValidation {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) {
    return { ok: false, fields: { name: 'required', spec: 'required' } };
  }
  const body = input as Record<string, unknown>;
  const errors: Errors = {};

  let name = '';
  if (body.name === undefined || body.name === null) errors.name = 'required';
  else if (typeof body.name !== 'string') errors.name = 'invalid_type';
  else {
    name = body.name.trim();
    if (name === '') errors.name = 'required';
    else if (len(name) > LIMITS.routeFilterName) errors.name = 'too_long';
  }

  const spec = {} as RouteFilterSpec;
  const raw = body.spec;
  if (raw === undefined || raw === null) errors.spec = 'required';
  else if (typeof raw !== 'object' || Array.isArray(raw)) errors.spec = 'invalid_type';
  else {
    const s = raw as Record<string, unknown>;
    spec.v = 1;
    if (s.v !== undefined && s.v !== 1) errors.spec = 'invalid_value';

    if (s.sea === undefined || s.sea === 'all') spec.sea = 'all';
    else if (typeof s.sea !== 'number') {
      errors.sea = 'invalid_type';
    } else if (!isInt(s.sea, 1, ROUTE_FILTER_LIMITS.seaMax)) errors.sea = 'invalid_value';
    else spec.sea = s.sea;

    if (s.max_hours === undefined || s.max_hours === null) spec.max_hours = null;
    else if (typeof s.max_hours !== 'number') errors.max_hours = 'invalid_type';
    else if (!isInt(s.max_hours, 1, ROUTE_FILTER_LIMITS.maxHoursMax)) errors.max_hours = 'invalid_value';
    else spec.max_hours = s.max_hours;

    if (s.sort === undefined) spec.sort = 'perMin';
    else if (typeof s.sort !== 'string') errors.sort = 'invalid_type';
    else if (!(ROUTE_FILTER_SORTS as readonly string[]).includes(s.sort)) errors.sort = 'invalid_value';
    else spec.sort = s.sort as RouteFilterSort;

    if (s.match === undefined) spec.match = 'all';
    else if (typeof s.match !== 'string') errors.match = 'invalid_type';
    else if (s.match !== 'all' && s.match !== 'any') errors.match = 'invalid_value';
    else spec.match = s.match;

    spec.required = idList(s.required, ROUTE_FILTER_LIMITS.pointIdMax, ROUTE_FILTER_LIMITS.maxRequired, 'required', errors);
    spec.excluded = idList(s.excluded, ROUTE_FILTER_LIMITS.pointIdMax, ROUTE_FILTER_LIMITS.maxExcluded, 'excluded', errors);
    spec.item_ids = idList(s.item_ids, ROUTE_FILTER_LIMITS.itemIdMax, ROUTE_FILTER_LIMITS.maxItems, 'item_ids', errors);
    if (!errors.required && !errors.excluded && spec.required.some((id) => spec.excluded.includes(id))) errors.excluded = 'invalid_value';
  }

  if (Object.keys(errors).length > 0) return { ok: false, fields: errors };
  return { ok: true, value: { name, spec } };
}
