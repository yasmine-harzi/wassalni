import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ColisService } from '../../../../services/colis.service';
import { getLoggedId } from '../dashboard-livreur';

@Component({
  selector: 'app-colis',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './colis.html',
  styleUrl: './colis.css'
})
export class ColisComponent implements OnInit {
  colis: any[] = [];
  loading = true;
  filtre = 'tous';

  readonly statuts = ['attente', 'ramassé', 'en_route', 'livré', 'annulé'];

  constructor(private svc: ColisService) { }

  ngOnInit() {
    this.svc.getMesColis(getLoggedId()).subscribe({
      next: (data) => { this.colis = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  get colisFiltres() {
    if (this.filtre === 'Tous' || this.filtre === 'tous') return this.colis;

    const map: Record<string, string> = {
      'Ramassé': 'ramassé',
      'En route': 'en_route',
      'Livré': 'livré',
      'Annulé': 'annulé'
    };
    const targetStatut = map[this.filtre] || this.filtre.toLowerCase();
    return this.colis.filter(c => c.statut === targetStatut);
  }

  updateStatut(id: number, statut: string) {
    this.svc.updateStatut(id, statut).subscribe({
      next: (res: any) => {
        if (statut === 'annulé') {
          // Si annulé, il n'est plus à nous, on le retire de la liste
          this.colis = this.colis.filter(x => x.id_colis !== id);
        } else {
          const c = this.colis.find(x => x.id_colis === id);
          if (c) c.statut = res.statut || statut;
        }
      }
    });
  }

  prochainStatut(statut: string): string | null {
    const map: Record<string, string> = {
      'ramassé': 'en_route',
      'en_route': 'livré'
    };
    return map[statut] ?? null;
  }

  labelStatut(s: string | null): string {
    const labels: Record<string, string> = {
      'en_route': '🚚 Marquer en route',
      'livré': '✅ Marquer livré'
    };
    return s ? (labels[s] ?? s) : '';
  }

  badgeClass(s: string): string {
    const map: Record<string, string> = {
      'attente': 'badge-attente',
      'ramassé': 'badge-ramasse',
      'en_route': 'badge-route',
      'livré': 'badge-livre',
      'annulé': 'badge-annule'
    };
    return map[s] ?? '';
  }
}
