import { Routes } from '@angular/router';
import { Home } from './pages/home/home';
import { LandingComponent } from './pages/landing/landing';
import { Login } from './pages/login/login';
import { RegisterClient } from './pages/register-client/register-client';
import { RegisterLivreur } from './pages/register-livreur/register-livreur';
import { RegisterVendeur} from './pages/register-vendeur/register-vendeur';

export const routes: Routes = [
  { path: '', component: LandingComponent }, 
  { path: 'home-old', component: Home }, // Page d'accueil (vide)
  { path: 'login', component: Login },
  { path: 'register-client', component: RegisterClient },
  { path: 'register-livreur', component: RegisterLivreur},
  { path: 'register-vendeur', component: RegisterVendeur},
  
  // Redirection si l'utilisateur tape n'importe quoi
  { path: '**', redirectTo: '' }
];