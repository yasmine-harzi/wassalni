import { Component } from '@angular/core';
import { AuthService } from '../../services/auth'; 
import { FormGroup, FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register-livreur',
  standalone: true,
  imports: [ReactiveFormsModule,CommonModule],
  templateUrl: './register-livreur.html',
  styleUrl: './register-livreur.css'
})
export class RegisterLivreur {

  coursierForm = new FormGroup({
  // Champs pour la table 'users'
  nom: new FormControl(''),// Validators.required),
  prenom: new FormControl(''),
  email: new FormControl(''),
  password: new FormControl(''),
  telephone: new FormControl(''),
  adresse: new FormControl(''),// Domicile
  
  // Champs pour la table 'coursier' (liés par id_user au backend)
 
  vehicule: new FormControl(''),
  permis: new FormControl(''),
  zone_livraison: new FormControl(''), // Travail
  disponibilite: new FormControl(true),
  latitude_actuelle: new FormControl(0),
  longitude_actuelle: new FormControl(0)
});

  constructor(private monOutilAuth: AuthService) {}

  onSubmit() {
    if (this.coursierForm.valid) {
      // On appelle la fonction RegisterLivreur du service
      this.monOutilAuth.RegisterLivreur(this.coursierForm.value).subscribe({
        next: (reponse) => {
          console.log('Coursier enregistré !', reponse);
          alert('Compte coursier activé !');
        },
        error: (err) => console.error('Erreur Coursier:', err)
      });
    }
  }
}
