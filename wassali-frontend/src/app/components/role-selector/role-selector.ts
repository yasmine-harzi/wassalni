import { Component } from '@angular/core';
import { Router } from '@angular/router'; // Import the Router

@Component({
  selector: 'app-role-selector',
  standalone: true, // If you are using Standalone components
  templateUrl: './role-selector.html',
  styleUrls: ['./role-selector.css']
})
export class RoleSelectorComponent {

  constructor(private router: Router) {}

  goToRegister(role: string) {
    switch (role) {
      case 'client':
        this.router.navigate(['/register-client']);
        break;
      case 'vendeur':
        this.router.navigate(['/register-vendeur']); // Assuming vendeur folder handles vendeur
        break;
      case 'coursier':
        this.router.navigate(['/register-livreur']);
        break;
      default:
        console.error('Role unknown');
    }
  }
}