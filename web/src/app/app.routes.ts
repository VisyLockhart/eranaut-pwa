import { Routes } from '@angular/router';
import { OverviewPage } from './overview/overview-page';
import { ComingSoon } from './pages/coming-soon';
import { WorkshopsPage } from './workshops/workshops-page';

export const routes: Routes = [
  { path: '', component: OverviewPage, pathMatch: 'full' },
  { path: 'workshops', component: WorkshopsPage },
  { path: 'update', component: ComingSoon },
  { path: '**', redirectTo: '' },
];
