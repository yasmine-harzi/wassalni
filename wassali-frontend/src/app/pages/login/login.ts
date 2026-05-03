import { Component } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent {

  email = '';
  password = '';
  error = '';
  isLoading = false;

  // Identifiants admin
  ADMIN_EMAIL = 'wassali@gmail.com';
  ADMIN_PASSWORD = 'admin123';

  constructor(private http: HttpClient, private router: Router) {}

  login() {
    this.error = '';
    this.isLoading = true;

    // 🛡️ Vérification des identifiants admin
    if (this.email === this.ADMIN_EMAIL && this.password === this.ADMIN_PASSWORD) {
      localStorage.setItem('admin', 'true');
      localStorage.setItem('adminName', 'Administrateur WASSALI');
      this.router.navigate(['/dashboard-admin']);
      this.isLoading = false;
      return;
    }

    // 👤 Authentification client normale (via backend)
    this.http.post('http://127.0.0.1:8000/api/login', {
      email: this.email,
      password: this.password
    }).subscribe({
      next: (res: any) => {
        // 🔐 Mapper les données utilisateur
        res.name = (res.nom + ' ' + res.prenom).trim();
        res.phone = res.telephone;
        // 🔐 Stocker user
        localStorage.setItem('user', JSON.stringify(res));
        localStorage.setItem('userName', res.name || 'Client');

        // 🚀 Redirection
        this.router.navigate(['/dashboard-client']);
        this.isLoading = false;
      },
      error: () => {
        this.error = "Email ou mot de passe incorrect";
        this.isLoading = false;
      }
    });
  }
}
