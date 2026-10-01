// 工坊顯示排序(D-55、SCHEMA §7):只存 localStorage、不進 API/DB,裝置間不同步。

export const ORDER_KEY = 'eranaut.workshop-order';

/**
 * 合併邏輯(SCHEMA §7):先套用存的順序,過濾掉 API 清單裡已不存在的 id,
 * 再把 API 有但沒記錄過的工坊(剛新增的,或在其他裝置新增的)依 API 順序附加到最後。
 */
export function applyOrder<T extends { id: string }>(items: readonly T[], order: readonly string[]): T[] {
  const byId = new Map(items.map((item) => [item.id, item] as const));
  const seen = new Set<string>();
  const result: T[] = [];
  for (const id of order) {
    const item = byId.get(id);
    if (item && !seen.has(id)) {
      result.push(item);
      seen.add(id);
    }
  }
  for (const item of items) if (!seen.has(item.id)) result.push(item);
  return result;
}

/** 把 `from` 位置的項目移到 `to` 位置,回傳新陣列;索引超出範圍時回傳原樣的複本 */
export function moveItem<T>(list: readonly T[], from: number, to: number): T[] {
  const copy = [...list];
  if (from === to || from < 0 || to < 0 || from >= copy.length || to >= copy.length) return copy;
  const [item] = copy.splice(from, 1);
  copy.splice(to, 0, item);
  return copy;
}
