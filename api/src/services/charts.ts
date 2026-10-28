import type { FieldErrorCode } from '@eranaut/shared';
import { CHART_SEAS } from '../ocr/chart-data.js';

// 海圖探索紀錄的輸入驗證(D-293)。航點必須屬於該海域;重複的點去掉,依資料集順序排列。
// 「已發現的點,前一個點一定已發現」由前端的海圖模組維持,這裡不強制(跨海域的解鎖也在前端處理)。

export interface ValidChartSea {
  sea: number;
  points: number[];
}

const pointsBySea = new Map(CHART_SEAS.map((s) => [s.sea, s.points.map((p) => p[0])]));

export function validateChartsInput(body: unknown): { ok: true; value: ValidChartSea[] } | { ok: false; fields: { seas: FieldErrorCode } } {
  const fail = (code: FieldErrorCode) => ({ ok: false as const, fields: { seas: code } });
  const seas = (body as { seas?: unknown } | null)?.seas;
  if (seas === undefined) return fail('required');
  if (!Array.isArray(seas) || seas.length === 0) return fail('invalid_type');
  if (seas.length > pointsBySea.size) return fail('invalid_value');
  const out: ValidChartSea[] = [];
  for (const item of seas) {
    const sea = (item as { sea?: unknown } | null)?.sea;
    const points = (item as { points?: unknown } | null)?.points;
    if (typeof sea !== 'number' || !Array.isArray(points)) return fail('invalid_type');
    const order = pointsBySea.get(sea);
    if (!order || out.some((o) => o.sea === sea)) return fail('invalid_value');
    if (!points.every((p) => typeof p === 'number' && order.includes(p))) return fail('invalid_value');
    out.push({ sea, points: order.filter((id) => points.includes(id)) });
  }
  return { ok: true, value: out };
}
