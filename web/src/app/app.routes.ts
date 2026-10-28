import { Routes } from '@angular/router';
import { demoRoutes } from './demo/demo-routes';
import { OverviewPage } from './overview/overview-page';

// 總覽是首頁、留在主 bundle;其餘頁面按需載入,縮小初始下載量(工坊頁的拖曳套件與表單、更新頁、設定頁都不必在首屏載入)
export const routes: Routes = [
  { path: '', component: OverviewPage, pathMatch: 'full', title: '靜謐海域交換所 Aequor Eranos' },
  // 工坊管理已搬進總覽(D-294);舊網址導回總覽
  { path: 'workshops', redirectTo: '', pathMatch: 'full' },
  { path: 'update', title: '更新潛水艇 ・ Aequor Eranos', loadComponent: () => import('./update/update-page').then((m) => m.UpdatePage) },
  { path: 'charts', title: '更新海圖 ・ Aequor Eranos', loadComponent: () => import('./charts/chart-page').then((m) => m.ChartPage) },
  { path: 'route', title: 'FFXIV 潛水艇航線模擬器・靜謐海域交換所 Aequor Eranos', loadComponent: () => import('./route/route-page').then((m) => m.RoutePage) },
  { path: 'craft', title: 'FFXIV 潛水艇配件製作・靜謐海域交換所 Aequor Eranos', loadComponent: () => import('./craft/craft-page').then((m) => m.CraftPage) },
  { path: 'settings', title: '設定 ・ Aequor Eranos', loadComponent: () => import('./settings/settings-page').then((m) => m.SettingsPage) },
  ...demoRoutes,
  { path: '**', redirectTo: '' },
];
