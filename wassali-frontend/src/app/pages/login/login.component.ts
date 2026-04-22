import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss']
})
export class LoginComponent {
  email    = '';
  password = '';
  loading  = signal(false);
  error    = signal('');

  constructor(private auth: AuthService, private router: Router) {
    if (this.auth.isLoggedIn()) this.router.navigate(['/dashboard-livreur']);
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
        if (res.role === 'coursier') this.router.navigate(['/dashboard-livreur']);
        else this.error.set('Accès réservé aux coursiers');
      },
      error: (err: any) => {
        this.loading.set(false);
        this.error.set(err.error?.detail || 'Erreur de connexion');
      }
    });
  }
}


