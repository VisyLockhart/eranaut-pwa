import { newId } from './demo-id';
import type { SubmarineDto, WorkshopWithSubmarines } from '@eranaut/shared';

// 展示用的假資料。時間以「載入當下」為基準,所以每次重設都像剛更新過。
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

export function seedWorkshops(now: number): WorkshopWithSubmarines[] {
  const a = newId();
  const b = newId();
  const c = newId();
  return [
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
      submarines: [sub(a, 1, '潛水艇-1', 95, now), sub(a, 2, '潛水艇-2', null, now)],
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
      submarines: [sub(b, 1, '潛水艇-1', 190, now), sub(b, 2, '黑潮號', 300, now), sub(b, 3, '潛水艇-3', 1500, now)],
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
      submarines: [sub(c, 1, '潛水艇-1', 45, now), sub(c, 2, '潛水艇-2', 410, now), sub(c, 3, '潛水艇-3', 2900, now), sub(c, 4, '潛水艇-4', null, now)],
    },
  ];
}
