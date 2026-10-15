import { Routes } from '@angular/router';
import { demoRoutes } from './demo/demo-routes';
import { OverviewPage } from './overview/overview-page';

// 總覽是首頁、留在主 bundle;其餘頁面按需載入,縮小初始下載量(工坊頁的拖曳套件與表單、更新頁、設定頁都不必在首屏載入)
export const routes: Routes = [
  { path: '', component: OverviewPage, pathMatch: 'full', title: 'Aequor Eranos ・ Eranaut 潛水艇返航追蹤(靜謐海域交換所)' },
  { path: 'workshops', title: '工坊管理 ・ Aequor Eranos', loadComponent: () => import('./workshops/workshops-page').then((m) => m.WorkshopsPage) },
  { path: 'update', title: '更新潛水艇 ・ Aequor Eranos', loadComponent: () => import('./update/update-page').then((m) => m.UpdatePage) },
  { path: 'route', title: '潛水艇航線模擬器 + 配件製作 ・ Aequor Eranos', loadComponent: () => import('./route/route-page').then((m) => m.RoutePage) },
  { path: 'craft', title: '配件製作 ・ Aequor Eranos', loadComponent: () => import('./craft/craft-page').then((m) => m.CraftPage) },
  { path: 'settings', title: '設定 ・ Aequor Eranos', loadComponent: () => import('./settings/settings-page').then((m) => m.SettingsPage) },
  ...demoRoutes,
  { path: '**', redirectTo: '' },
];
