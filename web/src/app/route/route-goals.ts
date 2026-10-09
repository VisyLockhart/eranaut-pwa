/** 推薦頁的目標(D-212、D-222):`find` = 找路線(練級、探索、最多物品、掉落整併成同一頁);其餘四個是「找配置」 */
export type GoalId = 'find' | 'advanced' | 'collect' | 'favor' | 'speed';
/** 推薦頁目前停在哪:`find`(找路線)、某個找配置的目標(含「進階」= 原本的數字搜尋),或 null = 找配置的目標選擇頁 */
export type RecGoal = GoalId;

export interface GoalDef {
  id: GoalId;
  name: string;
  tag: string;
  desc: string;
  family: 'route' | 'build';
  /** 做好了才能點;其餘顯示「即將推出」 */
  ready: boolean;
}

export const GOALS: readonly GoalDef[] = [
  { id: 'find', name: '找路線', tag: '', desc: '用目前配置,依經驗、解鎖、物品篩選與排序', family: 'route', ready: true },
  { id: 'collect', name: '收集', tag: '最多量', desc: '同一個地點撈到最大量', family: 'build', ready: true },
  { id: 'favor', name: '恩惠', tag: '二次', desc: '同一個地點有機會再撈一次', family: 'build', ready: true },
  { id: 'speed', name: '速度', tag: '最快', desc: '用最短時間收艇', family: 'build', ready: true },
  { id: 'advanced', name: '進階', tag: '自訂', desc: '自己填最低性能,找出符合的零件組合', family: 'build', ready: true },
];
