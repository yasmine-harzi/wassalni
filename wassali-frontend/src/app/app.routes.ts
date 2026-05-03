import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { LandingComponent } from './pages/landing/landing';
//import { Login } from './pages/login/login';
import { LoginComponent } from './pages/login/login';
import { RegisterClient } from './pages/register-client/register-client';
import { RegisterLivreur } from './pages/register-livreur/register-livreur';
import { RegisterVendeur } from './pages/register-vendeur/register-vendeur';
import { DashboardVendeurComponent } from './pages/dashboards/dashboard-vendeur/dashboard-vendeur';
import { DashboardClientComponent } from './pages/dashboards/dashboard-client/dashboard-client';
import { DashboardAdminComponent } from './pages/dashboards/dashboard-admin/dashboard-admin';

export const routes: Routes = [
  { path: '', component: LandingComponent }, 
  { path: 'home-old', component: Home }, // Page d'accueil (vide)
  //{ path: 'login', component: Login },
  //{ path: '', component: Home },
  { path: 'login', component: LoginComponent },
  { path: 'register-client', component: RegisterClient },
  { path: 'register-livreur', component: RegisterLivreur },
  { path: 'register-vendeur', component: RegisterVendeur },

  // ─── Dashboards ───────────────────────────────
  { path: 'dashboard-client', component: DashboardClientComponent },
  { path: 'dashboard-admin', component: DashboardAdminComponent },
  { path: 'dashboard-vendeur', component: DashboardVendeurComponent },

  // ─── Dashboard Coursier ───────────────────────────────
  {
    path: 'dashboard-coursier',
    loadComponent: () =>
      import('./pages/dashboards/dashboard-coursier/dashboard-coursier')
        .then(m => m.DashboardCoursier),
    children: [
      {
        path: 'colis',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-coursier/colis/colis')
            .then(m => m.ColisComponent)
      },
      {
        path: 'disponibles',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-coursier/disponibles/disponibles')
            .then(m => m.DisponiblesComponent)
      },
      {
        path: 'suivi/:id',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-coursier/suivi/suivi')
            .then(m => m.SuiviComponent)
      },
      {
        path: 'notifications',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-coursier/notifications/notifications')
            .then(m => m.NotificationsComponent)
      },
      {
        path: 'profil',
        loadComponent: () =>
          import('./pages/dashboards/dashboard-coursier/profil/profil')
            .then(m => m.ProfilComponent)
      }
    ]
  },

  { path: 'dashboard-vendeur', component: DashboardVendeurComponent },

  { path: '**', redirectTo: '' }
];
