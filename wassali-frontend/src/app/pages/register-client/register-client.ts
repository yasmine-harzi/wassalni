import { Component } from '@angular/core';
// 1. IMPORT DU SERVICE (L'adresse du fichier auth.ts)
import { AuthService } from '../../services/auth'; 
import { FormGroup, FormControl, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-register-client',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './register-client.html',
  styleUrl: './register-client.css'
})
export class RegisterClient{

  registerForm = new FormGroup({
    nom: new FormControl(''),
    prenom: new FormControl(''),
    email: new FormControl(''),
    password: new FormControl(''),
    telephone: new FormControl(''),
    adresse: new FormControl(''),
    type_client: new FormControl('particulier')
  });

  // 2. INJECTION DANS LE CONSTRUCTEUR (C'est ça qui crée le lien)
  // On dit à Angular : "Donne-moi l'outil AuthService et appelle-le 'monOutilAuth'"
  constructor(private monOutilAuth: AuthService) {}

  onSubmit() {
    if (this.registerForm.valid) {
      // 3. UTILISATION DE L'OUTIL
      // On appelle la fonction qui est dans auth.ts
      this.monOutilAuth.registerClient(this.registerForm.value).subscribe({
        next: (reponse) => {
          console.log('Réussi !', reponse);
          alert('Client enregistré !');
        },
        error: (err) => {
          console.error('Erreur !', err);
        }
      });
    }
  }
}