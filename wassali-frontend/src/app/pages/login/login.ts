import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {
  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

  // Identifiants admin
  ADMIN_EMAIL = 'wassali@gmail.com';
  ADMIN_PASSWORD = 'admin123';

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

    // 🛡️ Vérification des identifiants admin
    if (this.email === this.ADMIN_EMAIL && this.password === this.ADMIN_PASSWORD) {
      localStorage.setItem('admin', 'true');
      localStorage.setItem('adminName', 'Administrateur WASSALI');
      this.router.navigate(['/dashboard-admin']);
      this.loading.set(false);
      return;
    }

    this.auth.login({ email: this.email, password: this.password }).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        
        // On récupère le rôle depuis la réponse 'res' renvoyée par ton API
        const userRole = res.role; 
        
        // Redirection basée sur le rôle reçu
        if (userRole === 'coursier' || userRole === 'livreur') {
          this.router.navigate(['/dashboard-coursier']);
        } else if (userRole === 'client') {
          this.router.navigate(['/dashboard-client']);
        } else if (userRole === 'vendeur') {
          this.router.navigate(['/dashboard-vendeur']);
        } else if (userRole === 'admin') {
          localStorage.setItem('admin', 'true');
          localStorage.setItem('adminName', res.nom || 'Admin');
          this.router.navigate(['/dashboard-admin']);
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


