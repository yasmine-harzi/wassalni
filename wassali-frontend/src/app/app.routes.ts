import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { LoginComponent } from './pages/login/login';
import { RegisterClient } from './pages/register-client/register-client';
import { RegisterLivreur } from './pages/register-livreur/register-livreur';
import { RegisterVendeur} from './pages/register-vendeur/register-vendeur';
import { DashboardClientComponent } from './pages/dashboards/dashboard-client/dashboard-client';
import { DashboardAdminComponent } from './pages/dashboards/dashboard-admin/dashboard-admin';

export const routes: Routes = [
  { path: '', component: LoginComponent  }, // Page d'accueil (vide)
  { path: 'login', component: LoginComponent },
  { path: 'register-client', component: RegisterClient },
  { path: 'register-livreur', component: RegisterLivreur},
  { path: 'register-vendeur', component: RegisterVendeur},
  { path: 'dashboard-client', component: DashboardClientComponent },
  { path: 'dashboard-admin', component: DashboardAdminComponent },
  { path: 'dashboard', redirectTo: 'login' },
  
  // Redirection si l'utilisateur tape n'importe quoi
  { path: '**', redirectTo: '' }
];