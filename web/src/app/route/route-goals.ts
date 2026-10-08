/** 推薦頁的目標(ROUTE-SIM-DESIGN D-212):前四個是「找路線」(用目前配置),後三個是「找配置」(先選航點) */
export type GoalId = 'exp' | 'explore' | 'range' | 'loot' | 'advanced' | 'collect' | 'favor' | 'speed';
/** 推薦頁目前停在哪:某個目標(含「進階」= 原本的數字搜尋),或 null = 目標選擇頁 */
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
  { id: 'exp', name: '練級', tag: '經驗', desc: '每分鐘經驗最高的路線', family: 'route', ready: true },
  { id: 'explore', name: '探索', tag: '開點', desc: '優先開出還沒去過的航點', family: 'route', ready: true },
  { id: 'range', name: '距離', tag: '多樣', desc: '一趟走多個地點,撈最多種物品', family: 'route', ready: true },
  { id: 'loot', name: '掉落', tag: '指定物', desc: '想要某樣物品,找出撈得到它的路線', family: 'route', ready: true },
  { id: 'collect', name: '收集', tag: '最多量', desc: '同一個地點撈到最大量', family: 'build', ready: true },
  { id: 'favor', name: '恩惠', tag: '二次', desc: '同一個地點有機會再撈一次', family: 'build', ready: true },
  { id: 'speed', name: '速度', tag: '最快', desc: '用最短時間收艇', family: 'build', ready: true },
  { id: 'advanced', name: '進階', tag: '自訂', desc: '自己填最低性能,找出符合的零件組合', family: 'build', ready: true },
];
