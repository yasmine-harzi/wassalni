import { Component } from '@angular/core';
import { AuthService } from '../../services/auth'; 
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';

@Component({
  selector: 'app-register-livreur',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
  templateUrl: './register-livreur.html',
  styleUrl: './register-livreur.css'
})
export class RegisterLivreur {

  coursierForm = new FormGroup({
    nom: new FormControl('', Validators.required),
    prenom: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
    vehicule: new FormControl('moto'), // Valeur par défaut
    permis: new FormControl('', Validators.required), // Champ spécifique
    adresse: new FormControl('')
  });

  constructor(private monOutilAuth: AuthService, private router: Router) {}

  onSubmit() {
    if (this.coursierForm.valid) {
      // On appelle la fonction registerCoursier du service
      this.monOutilAuth.registerCoursier(this.coursierForm.value).subscribe({
        next: (reponse) => {
          console.log('Coursier enregistré !', reponse);
          // On sauvegarde la session pour être "connecté"
          localStorage.setItem('token', 'fake-jwt-token');
          localStorage.setItem('user', JSON.stringify(reponse));
          
          alert('Compte coursier activé !');
          this.router.navigate(['/dashboard-livreur']);
        },
        error: (err) => console.error('Erreur Coursier:', err)
      });
    }
  }
}
