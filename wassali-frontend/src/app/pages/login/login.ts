import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Pour la redirection
import { AuthService } from '../../services/auth'; // Assure-toi du chemin correct
import { FormsModule } from '@angular/forms'; // Pour le ngModel dans le HTML

@Component({
  selector: 'app-login',
  standalone: true, // Angular 17+ utilise souvent le standalone
  imports: [FormsModule], // Obligatoire pour utiliser [(ngModel)] dans ton login.html
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login {
  // Objet pour stocker les identifiants saisis dans le formulaire
  credentials = {
    email: '',
    password: ''
  };

  // On injecte le service d'authentification et le routeur
  constructor(
    private authService: AuthService, 
    private router: Router
  ) {}

  onLogin() {
    this.authService.login(this.credentials).subscribe({
      next: (user: any) => {
        console.log('Connexion réussie, rôle :', user.role);

        // --- LOGIQUE DE REDIRECTION ---
        if (user.role === 'admin') {
          this.router.navigate(['/pages/dashboards/dashboard-administrateur']); 
        } else if (user.role === 'vendeur') {
          this.router.navigate(['/pages/dashboards/dashboard-vendeur']);
        } else if (user.role === 'client') {
          this.router.navigate(['/pages/dashboards/dashboard-client']);
        } else {
          // Si le rôle n'est pas reconnu, retour à l'accueil
          this.router.navigate(['/home']);
        }
      },
      error: (err) => {
        console.error('Erreur de connexion', err);
        alert('Email ou mot de passe incorrect');
      }
    });
  }
}