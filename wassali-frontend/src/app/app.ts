import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule, FormGroup, FormControl, Validators } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule,RouterModule,ReactiveFormsModule,HttpClientModule],
  templateUrl: './app.html', // Il va chercher ton fichier app.html
  styleUrl: './app.css'      // Il va chercher ton fichier app.css
})
export class AppComponent implements OnInit {
  clients: any[] = [];
  vendeurs: any[] = [];
  coursiers: any[] = [];

  private apiUrl = 'http://127.0.0.1:8000';

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.getAllData();
  }

  getAllData() {
    // Récupération des Clients
    this.http.get<any[]>(`${this.apiUrl}/client`).subscribe({
      next: (data) => {
        this.clients = data;
        console.log('Clients récupérés avec succès');
      },
      error: (err) => console.error('Erreur lors de la récupération des clients', err)
    });

    // Récupération des Vendeurs
    this.http.get<any[]>(`${this.apiUrl}/vendeur`).subscribe({
      next: (data) => this.vendeurs = data,
      error: (err) => console.error('Erreur vendeurs', err)
    });

    // Récupération des Coursiers
    this.http.get<any[]>(`${this.apiUrl}/coursier`).subscribe({
      next: (data) => this.coursiers = data,
      error: (err) => console.error('Erreur coursiers', err)
    });
  }
}