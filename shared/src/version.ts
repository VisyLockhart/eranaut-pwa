/**
 * Eranaut 的版本號(SemVer,D-303)。與根目錄 `package.json` 的 `version`、git tag(`v2.0.0`)必須一致,
 * `shared/test/version.test.ts` 會檢查;升版時兩處一起改。
 * 前端設定頁「關於」與 API `/api/healthz` 都讀這個常數。
 */
export const APP_VERSION = '2.0.0';
