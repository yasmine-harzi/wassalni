import { Component } from '@angular/core';
import { AuthService } from '../../services/auth';
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-register-vendeur',
  standalone: true,
  imports: [ReactiveFormsModule, RouterModule],
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
    nom_entreprise: new FormControl('', Validators.required),
    adresse_entreprise: new FormControl('', Validators.required)
  });

  constructor(private monOutilAuth: AuthService) {}

  onSubmit() {
    if (this.vendeurForm.valid) {
      // On appelle la fonction registerVendeur du service
      this.monOutilAuth.registerVendeur(this.vendeurForm.value).subscribe({
        next: (reponse: any) => {
          console.log('Vendeur enregistré !', reponse);
          alert('Boutique créée avec succès !');
        },
        error: (err: any) => console.error('Erreur Vendeur:', err)
      });
    }
  }
}