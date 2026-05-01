import { Component } from '@angular/core';
import { AuthService } from '../../services/auth'; 
// Ajout de Validators ici
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common'; // Important pour les *ngIf dans le HTML
import { Router,RouterLink } from '@angular/router';

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule,RouterLink ], // Ajoute CommonModule pour les directives Angular
  templateUrl: './register-client.html',
  styleUrl: './register-client.css'
})
export class RegisterClient {

  registerForm = new FormGroup({
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
    type_client: new FormControl('particulier')
  });
  
  constructor(
  private monOutilAuth: AuthService, 
  private router: Router // 2. Inject the Router here
) {}
  

  onSubmit() {
    if (this.registerForm.valid) {
      this.monOutilAuth.registerClient(this.registerForm.value).subscribe({
        next: (reponse) => {
          console.log('Réussi !', reponse);
          alert('Client enregistré avec succès !');
          this.router.navigate(['/login']); // Redirige vers la page de connexion après l'inscription
        },
        error: (err) => {
          console.error('Erreur !', err);
          // Gestion de l'email déjà utilisé (Erreur 409 ou message spécifique)
          if (err.status === 409 || err.error?.message?.includes('email')) {
            alert("Cet email est déjà utilisé ! Veuillez en choisir un autre.");
          } else {
            alert("Une erreur est survenue lors de l'inscription.");
          }
        }
      });
    } else {
      // Si le formulaire est invalide, on "touche" tous les champs
      // pour que le CSS les affiche en ROUGE immédiatement
      this.registerForm.markAllAsTouched();
    }
  }
}