import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router } from '@angular/router'; // On ajoute Router ici

@Component({
  selector: 'app-home',
  standalone: true,
  templateUrl: './home.html', // Vérifie bien que le fichier s'appelle home.html et non home.component.html
  styleUrl: './home.css',
  imports: [CommonModule, RouterModule]
})
export class Home {

  // On injecte le service Router dans le constructeur
  constructor(private router: Router) {}

  // La fonction qui va gérer le clic
  goToRegister(role: string) {
    if (role === 'client') {
      this.router.navigate(['/register-client']);
    } else if (role === 'vendeur') {
      this.router.navigate(['/register-vendeur']);
    } else if (role === 'coursier') {
      this.router.navigate(['/register-coursier']);
    }
  }
}