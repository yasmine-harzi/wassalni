import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { ColisService } from '../../../../services/colis.service';
import { CoursierService } from '../../../../services/coursier.service';
import { getLoggedId } from '../dashboard-livreur';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-suivi',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './suivi.html',
  styleUrl: './suivi.css'
})
export class SuiviComponent implements OnInit {
  idColis!: number;
  positions: any[] = [];
  loading = true;
  lat = '';
  lon = '';
  saving = false;
  message = '';

  constructor(
    private route: ActivatedRoute,
    private colisSvc: ColisService,
    private coursierSvc: CoursierService
  ) {}

  ngOnInit() {
    this.idColis = Number(this.route.snapshot.paramMap.get('id'));
    this.loadSuivi();
    // Essai géoloc auto
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(pos => {
        this.lat = pos.coords.latitude.toFixed(6);
        this.lon = pos.coords.longitude.toFixed(6);
      });
    }
  }

  loadSuivi() {
    this.loading = true;
    this.colisSvc.getSuivi(this.idColis).subscribe({
      next: (d) => { this.positions = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  enregistrer() {
    if (!this.lat || !this.lon) return;
    this.saving = true;
    const latF = parseFloat(this.lat);
    const lonF = parseFloat(this.lon);
    // Enregistrer dans suivi_colis ET mettre à jour la position du coursier
    this.colisSvc.addPosition(this.idColis, latF, lonF).subscribe({
      next: () => {
        this.coursierSvc.updatePosition(getLoggedId(), latF, lonF).subscribe();
        this.message = '✅ Position enregistrée';
        this.loadSuivi();
        this.saving = false;
        setTimeout(() => this.message = '', 3000);
      },
      error: () => { this.saving = false; }
    });
  }
}
