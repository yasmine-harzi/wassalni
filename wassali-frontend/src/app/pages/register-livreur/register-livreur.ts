import { Component } from '@angular/core';
import { AuthService } from '../../services/auth'; 
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router,RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-livreur',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule,RouterLink],
  templateUrl: './register-livreur.html',
  styleUrl: './register-livreur.css'
})
export class RegisterLivreur {

  coursierForm = new FormGroup({
    nom: new FormControl('', Validators.required),
    prenom: new FormControl('', Validators.required),
    
    // Email : Obligatoire + finit par @gmail.com
    email: new FormControl('', [
      Validators.required, 
      Validators.pattern('^[a-z0-9._%+-]+@gmail\\.com$')
    ]),

    // Password : 8 car. + 1 Maj + 1 Chiffre + 1 Caractère spécial
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.pattern('^(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])[A-Za-z\\d@$!%*?&]{8,}$')
    ]),

    // Téléphone : 8 chiffres commençant par 2, 5 ou 9
    telephone: new FormControl('', [
      Validators.required,
      Validators.pattern('^[259][0-9]{7}$')
    ]),
    adresse: new FormControl('', Validators.required),
  
  // Champs pour la table 'coursier' (liés par id_user au backend)
 
  vehicule: new FormControl('', Validators.required),
  permis: new FormControl(''),
  zone_livraison: new FormControl(''), // Travail
  disponibilite: new FormControl(true),
  latitude_actuelle: new FormControl(0),
  longitude_actuelle: new FormControl(0)
});

  constructor(
  private monOutilAuth: AuthService, 
  private router: Router // 2. Inject the Router here
) {}
  onSubmit() {
  if (this.coursierForm.valid) {
    this.monOutilAuth.RegisterLivreur(this.coursierForm.value).subscribe({
      next: (reponse) => {
        console.log('Coursier registered in DB!', reponse);
        
        // 1. Alert the user they succeeded
        alert('Inscription réussie ! Connectez-vous pour accéder à votre espace.');
        
        // 2. Redirect to the COMMON login page
        // NO localStorage here! We want them to type their credentials.
        this.router.navigate(['/login']); 
      },
      error: (err) => {
        console.error('Erreur Inscription Coursier:', err);
        alert("Erreur lors de l'inscription.");
        }
      });
    }
  }
}
