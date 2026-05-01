import { Component } from '@angular/core';
import { AuthService } from '../../services/auth'; 
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
@Component({
  selector: 'app-register-vendeur',
  standalone: true,
  imports: [ReactiveFormsModule,ReactiveFormsModule,CommonModule],
  templateUrl: './register-vendeur.html',
  styleUrl: './register-vendeur.css'
})
export class RegisterVendeur {

  vendeurForm = new FormGroup({
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
    nom_entreprise: new FormControl('', Validators.required), // Correspond à ta DB
    adresse_entreprise: new FormControl('', Validators.required) // Correspond à ta DB
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