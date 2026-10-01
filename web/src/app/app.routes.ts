import { Routes } from '@angular/router';
import { OverviewPage } from './overview/overview-page';
import { UpdatePage } from './update/update-page';
import { WorkshopsPage } from './workshops/workshops-page';

export const routes: Routes = [
  { path: '', component: OverviewPage, pathMatch: 'full' },
  { path: 'workshops', component: WorkshopsPage },
  { path: 'update', component: UpdatePage },
  { path: '**', redirectTo: '' },
];
