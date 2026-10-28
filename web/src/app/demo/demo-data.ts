import { newId } from './demo-id';
import { routeExp, type RouteSubDto, type SubmarineDto, type WorkshopWithSubmarines } from '@eranaut/shared';
import type { ProgressRow, UpkeepRow } from './demo-levels';

// 展示用的假資料。時間以「載入當下」為基準,所以每次重設都像剛更新過。
// 也放了配件維修提醒(D-288)、等級與練級輔助(D-289、D-291)、儲存配置與綁定,讓這些功能一打開就能體驗(D-292)。
const MIN = 60_000;

function sub(workshopId: string, position: number, name: string | null, minutesLeft: number | null, now: number): SubmarineDto {
  const exploring = minutesLeft !== null;
  return {
    id: newId(),
    workshop_id: workshopId,
    position,
    name,
    status: exploring ? 'exploring' : 'complete',
    expected_return_at: exploring ? new Date(now + minutesLeft * MIN).toISOString() : null,
    last_synced_at: new Date(now).toISOString(),
  };
}

/** 練級輔助開著的艇:目前等級、這一級的經驗、偏好流派,以及剛派出(還沒結算)的路線 */
function leveling(level: number, exp: number, school: ProgressRow['school'], sea: number, points: string[], now: number): ProgressRow {
  return {
    level,
    exp_in_level: exp,
    source: 'manual',
    sim_on: true,
    school,
    pending: { sea, points, exp: routeExp(sea, points) ?? 0 },
    last: { sea, points },
    updated_at: new Date(now).toISOString(),
  };
}

/** 只有等級(截圖辨識到的,沒開練級輔助) */
function levelOnly(level: number, now: number): ProgressRow {
  return { level, exp_in_level: 0, source: 'ocr', sim_on: false, school: null, pending: null, last: null, updated_at: new Date(now).toISOString() };
}

/** 溺沒海 O→J 的維修提醒(配置 3124:可跑 6 趟) */
function upkeepOJ(done: number, now: number): UpkeepRow {
  const t = new Date(now).toISOString();
  return { route_key: '1:OJ', route_sea: 1, route_points: ['O', 'J'], voyages_done: done, limit_voyages: 6, parts_sig: '3,1,2,4', repaired_at: null, updated_at: t };
}

function config(name: string, level: number, parts: [number, number, number, number], bound: string[], now: number, favorite = false): RouteSubDto {
  const t = new Date(now).toISOString();
  return { id: newId(), name, level, hull: parts[0], stern: parts[1], bow: parts[2], bridge: parts[3], bound_submarine_ids: bound, favorite, created_at: t, updated_at: t };
}

export interface DemoSeed {
  workshops: WorkshopWithSubmarines[];
  upkeep: Record<string, UpkeepRow>;
  progress: Record<string, ProgressRow>;
  routeSubs: RouteSubDto[];
}

export function seedDemo(now: number): DemoSeed {
  const a = newId();
  const b = newId();
  const c = newId();
  // 貝殼工坊:還在練級的新工坊,只有 2 艘(第 3 艘的欄位還沒解鎖 → 潛艇-1 的建議會優先含解鎖點 O)
  const a1 = sub(a, 1, '潛水艇-1', 95, now);
  const a2 = sub(a, 2, '潛水艇-2', null, now);
  // 鋼鐵之心:灰海練級中 + 撈寶艇開著維修提醒(其中一艘已用滿趟數、需要維修)
  const b1 = sub(b, 1, '潛水艇-1', 190, now);
  const b2 = sub(b, 2, '黑潮號', 300, now);
  const b3 = sub(b, 3, '潛水艇-3', null, now);
  const b4 = sub(b, 4, '潛水艇-4', 1500, now);
  // 珊瑚礁工坊:沒開任何輔助功能,畫面和一般使用相同
  const c1 = sub(c, 1, '潛水艇-1', 45, now);

  const workshops: WorkshopWithSubmarines[] = [
    {
      id: a,
      name: '貝殼工坊',
      server: '伊弗利特',
      captain: '芙寧娜',
      address_district: '海霧村',
      address_ward: 7,
      address_detail: '第 12 號',
      notify_batched: false,
      notify_lead_minutes: 10,
      created_at: new Date(now - 3 * 86_400_000).toISOString(),
      submarines: [a1, a2],
    },
    {
      id: b,
      name: '鋼鐵之心',
      server: '泰坦',
      captain: '克蘭恩',
      address_district: '薰衣草苗圃',
      address_ward: 15,
      address_detail: null,
      notify_batched: true,
      notify_lead_minutes: 15,
      created_at: new Date(now - 2 * 86_400_000).toISOString(),
      submarines: [b1, b2, b3, b4],
    },
    {
      id: c,
      name: '珊瑚礁工坊',
      server: '巴哈姆特',
      captain: null,
      address_district: null,
      address_ward: null,
      address_detail: null,
      notify_batched: false,
      notify_lead_minutes: 0,
      created_at: new Date(now - 86_400_000).toISOString(),
      submarines: [c1, sub(c, 2, '潛水艇-2', 410, now), sub(c, 3, '潛水艇-3', 2900, now), sub(c, 4, '潛水艇-4', null, now)],
    },
  ];

  return {
    workshops,
    progress: {
      [a1.id]: leveling(34, 120_000, 'snap', 1, ['I', 'M', 'P'], now),
      [a2.id]: leveling(22, 60_000, 'half', 1, ['G', 'I', 'K'], now),
      [b1.id]: leveling(61, 900_000, 'day', 2, ['D', 'G', 'F', 'K'], now),
      [b2.id]: levelOnly(95, now),
      [b3.id]: levelOnly(96, now),
      [c1.id]: levelOnly(12, now),
    },
    upkeep: {
      [b2.id]: upkeepOJ(4, now),
      [b3.id]: upkeepOJ(6, now),
    },
    routeSubs: [
      config('練級主力', 34, [3, 1, 1, 3], [a1.id], now, true),
      config('練級二號', 22, [1, 1, 2, 2], [a2.id], now),
      config('灰海練級', 61, [1, 1, 2, 3], [b1.id], now),
      config('O→J 撈寶', 95, [3, 1, 2, 4], [b2.id, b3.id], now, true),
    ],
  };
}
