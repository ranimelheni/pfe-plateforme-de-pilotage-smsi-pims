import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: '/login', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./components/login/login.component').then(m => m.LoginComponent)
  },
  {
    path: 'change-password',
    loadComponent: () =>
      import('./components/change-password/change-password.component')
        .then(m => m.ChangePasswordComponent),
    canActivate: [AuthGuard]
  },
  {
    path: 'dashboard',
    loadComponent: () =>
      import('./components/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [AuthGuard],
    children: [
      { path: '', redirectTo: 'organisms', pathMatch: 'full' },
      {
        path: 'organisms',
        loadComponent: () =>
          import('./components/organisms/organisms.component').then(m => m.OrganismsComponent)
      },
      {
        path: 'organisms/:id/actors',
        loadComponent: () =>
          import('./components/actors/actors.component').then(m => m.ActorsComponent)
      },
   
      {
        path: 'processus',   // ← était absent et hors dashboard
        loadComponent: () =>
          import('./components/fiche-processus/fiche-processus.component')
            .then(m => m.FicheProcessusComponent)
      }
    ]
  },
  { path: '**', redirectTo: '/login' }
];