import { Routes } from '@angular/router';
import { OverviewPage } from './overview/overview-page';
import { ComingSoon } from './pages/coming-soon';

export const routes: Routes = [
  { path: '', component: OverviewPage, pathMatch: 'full' },
  { path: 'workshops', component: ComingSoon },
  { path: 'update', component: ComingSoon },
  { path: '**', redirectTo: '' },
];
