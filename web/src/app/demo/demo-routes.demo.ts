import type { Routes } from '@angular/router';

// 展示建置專用:社群「海域介紹」宣傳頁(只存在於公開展示版,不同步回私有 repo)
export const demoRoutes: Routes = [
  { path: 'intro', title: '靜謐海域交換所 Aequor Eranos・FF14 潛水艇同好會', loadComponent: () => import('../intro/intro-page').then((m) => m.IntroPage) },
  // 同一個頁面元件,開啟時預設選到「潛艇玩法」分頁(靜態頁 submarine.html 由 tools/make-intro-html.mjs 產生)
  { path: 'submarine', title: 'FF14 潛水艇玩法介紹・靜謐海域交換所 Aequor Eranos', data: { introTab: 'play' }, loadComponent: () => import('../intro/intro-page').then((m) => m.IntroPage) },
];

export const INTRO_ENABLED = true;
