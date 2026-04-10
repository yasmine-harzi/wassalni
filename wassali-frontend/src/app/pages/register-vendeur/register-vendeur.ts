import { Component } from '@angular/core';
import { AuthService } from '../../services/auth'; 
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';

@Component({
  selector: 'app-register-vendeur',
  standalone: true,
  imports: [ReactiveFormsModule,ReactiveFormsModule],
  templateUrl: './register-vendeur.html',
  styleUrl: './register-vendeur.css'
})
export class RegisterVendeur {

  vendeurForm = new FormGroup({
    nom: new FormControl('', Validators.required),
    prenom: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    password: new FormControl('', Validators.required),
    telephone: new FormControl(''),
    adresse: new FormControl(''),
    nom_boutique: new FormControl('', Validators.required) // Champ spécifique
  });

  constructor(private monOutilAuth: AuthService) {}

  onSubmit() {
    if (this.vendeurForm.valid) {
      // On appelle la fonction registerVendeur du service
      this.monOutilAuth.registerVendeur(this.vendeurForm.value).subscribe({
        next: (reponse) => {
          console.log('Vendeur enregistré !', reponse);
          alert('Boutique créée avec succès !');
        },
        error: (err) => console.error('Erreur Vendeur:', err)
      });
    }
  }
}