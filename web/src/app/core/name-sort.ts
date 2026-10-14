const NAME_COLLATOR = new Intl.Collator('zh-Hant-u-co-stroke');
/** 名稱排序時,前幾個字相同的視為同一群(白鋼錠、白鋼鉚釘、白鋼連接板) */
const NAME_PREFIX = 2;

/**
 * 名稱排序:① 前兩個字相同的聚成一群,群之間依筆畫;② 同群內字數少的先;③ 字數相同再依筆畫。
 * 例:白鋼板、白鋼釘、白鋼錠、白鋼鉚釘、白鋼連接板、鈷鐵板……
 * 配件製作(D-259)與航線的打撈物清單(D-263)共用;放在 `core/` 讓航線 chunk 不必依賴製作資料。
 */
export function compareNames(a: string, b: string): number {
  const ca = [...a];
  const cb = [...b];
  const k = NAME_COLLATOR.compare(ca.slice(0, NAME_PREFIX).join(''), cb.slice(0, NAME_PREFIX).join(''));
  if (k !== 0) return k;
  if (ca.length !== cb.length) return ca.length - cb.length;
  return NAME_COLLATOR.compare(a, b);
}
