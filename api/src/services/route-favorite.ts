// 切換常用(D-237)的請求驗證:body 必須是 { favorite: boolean }(兩個資源共用)。

export function parseFavoriteInput(input: unknown): boolean | null {
  if (typeof input !== 'object' || input === null || Array.isArray(input)) return null;
  const v = (input as Record<string, unknown>).favorite;
  return typeof v === 'boolean' ? v : null;
}
