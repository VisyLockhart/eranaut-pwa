import type { Routes } from '@angular/router';

// 展示建置專用:社群「海域介紹」宣傳頁(只存在於公開展示版,不同步回私有 repo)
export const demoRoutes: Routes = [
  { path: 'intro', loadComponent: () => import('../intro/intro-page').then((m) => m.IntroPage) },
];

export const INTRO_ENABLED = true;
