import { Routes } from '@angular/router';
import { OverviewPage } from './overview/overview-page';

// 總覽是首頁、留在主 bundle;其餘頁面按需載入,縮小初始下載量(工坊頁的拖曳套件與表單、更新頁、設定頁都不必在首屏載入)
export const routes: Routes = [
  { path: '', component: OverviewPage, pathMatch: 'full' },
  { path: 'workshops', loadComponent: () => import('./workshops/workshops-page').then((m) => m.WorkshopsPage) },
  { path: 'update', loadComponent: () => import('./update/update-page').then((m) => m.UpdatePage) },
  { path: 'settings', loadComponent: () => import('./settings/settings-page').then((m) => m.SettingsPage) },
  { path: '**', redirectTo: '' },
];
