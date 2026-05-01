import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common'; // Pour pouvoir utiliser ngFor dans le HTML
import { AdminService } from '../../../services/admin'; // Correction du chemin

@Component({
  selector: 'app-dashboard-administrateur',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-administrateur.html',
  styleUrl: './dashboard-administrateur.css'
})
export class DashboardAdministrateur implements OnInit {
  comptes: any[] = [];

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.adminService.getAllAccounts().subscribe({
      next: (data: any) => {
        this.comptes = data;
      },
      error: (err) => {
        console.error('Erreur lors de la récupération des comptes', err);
      }
    });
  }
}