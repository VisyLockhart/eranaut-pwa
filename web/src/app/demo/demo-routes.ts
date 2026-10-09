import type { Routes } from '@angular/router';

// 展示專用頁面的掛載點(同 demo-providers.ts 的做法)。正式版建置用這個空檔;`--configuration demo`
// 會把它換成 `demo-routes.demo.ts`,所以正式版的 bundle 不含「海域介紹」。
export const demoRoutes: Routes = [];

/** 側欄與底部導覽是否顯示「海域介紹」 */
export const INTRO_ENABLED = false;
