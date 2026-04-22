import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { LoginComponent } from './pages/login/login.component';
import { RegisterClient } from './pages/register-client/register-client';
import { RegisterLivreur } from './pages/register-livreur/register-livreur';
import { RegisterVendeur } from './pages/register-vendeur/register-vendeur';

export const routes: Routes = [
  { path: '', component: Home },
  { path: 'login', component: LoginComponent },
  { path: 'register-client', component: RegisterClient },
  { path: 'register-livreur', component: RegisterLivreur },
  { path: 'register-vendeur', component: RegisterVendeur },

  // ─── Dashboard Livreur ───────────────────────────────
  {
    path: 'dashboard-livreur',
    loadComponent: () =>
      import('./pages/dashboards/dashboard-livreur/dashboard-livreur')
        .then(m => m.DashboardLivreur),
    children: [
      {
        path: 'colis',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-livreur/colis/colis')
            .then(m => m.ColisComponent)
      },
      {
        path: 'disponibles',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-livreur/disponibles/disponibles')
            .then(m => m.DisponiblesComponent)
      },
      {
        path: 'suivi/:id',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-livreur/suivi/suivi')
            .then(m => m.SuiviComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-livreur/notifications/notifications')
            .then(m => m.NotificationsComponent)
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-livreur/profil/profil')
            .then(m => m.ProfilComponent)
      }
    ]
  },

  { path: '**', redirectTo: '' }
];
