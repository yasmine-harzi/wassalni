import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

 constructor(private auth: AuthService, private router: Router) {
    // Si déjà connecté, on peut soit rester sur le login, soit tenter 
    // de rediriger si on a l'info en local. Pour l'instant, on laisse 
    // l'utilisateur sur la page s'il veut changer de compte.
  }

  onSubmit() {
    if (!this.email || !this.password) {
      this.error.set('Veuillez remplir tous les champs');
      return;
    }
    this.loading.set(true);
    this.error.set('');

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        
        // On récupère le rôle depuis la réponse 'res' renvoyée par ton API
        const userRole = res.role; 
        
        // Redirection basée sur le rôle reçu
        if (userRole === 'coursier' || userRole === 'livreur') {
          this.router.navigate(['/dashboard-livreur']);
        } else if (userRole === 'client') {
          this.router.navigate(['/dashboard-client']);
        } else if (userRole === 'vendeur') {
          this.router.navigate(['/dashboard-vendeur']);
        } else {
          this.error.set('Rôle inconnu : ' + userRole);
        }
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Identifiants incorrects');
      }
    });
  }
}


