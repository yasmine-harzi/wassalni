import { Component } from '@angular/core';
import { AuthService } from '../../services/auth'; 
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register-livreur',
  standalone: true,
  imports: [ReactiveFormsModule],
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

  constructor(private monOutilAuth: AuthService) {}

  onSubmit() {
    if (this.coursierForm.valid) {
      // On appelle la fonction registerCoursier du service
      this.monOutilAuth.registerCoursier(this.coursierForm.value).subscribe({
        next: (reponse) => {
          console.log('Coursier enregistré !', reponse);
          alert('Compte coursier activé !');
        },
        error: (err) => console.error('Erreur Coursier:', err)
      });
    }
  }
}
