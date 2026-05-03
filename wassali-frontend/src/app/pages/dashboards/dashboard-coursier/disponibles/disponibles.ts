import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ColisService } from '../../../../services/colis.service';
import { getLoggedId } from '../dashboard-coursier';

@Component({
  selector: 'app-disponibles',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './disponibles.html',
  styleUrl: './disponibles.css'
})
export class DisponiblesComponent implements OnInit {
  colis: any[] = [];
  loading = true;
  accepting: number | null = null;
  message = '';

  constructor(private svc: ColisService) {}

  ngOnInit() {
    this.load();
  }

  load() {
    this.loading = true;
    this.svc.getColisDisponibles().subscribe({
      next: (data) => { this.colis = data; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }

  accepter(id: number) {
    this.accepting = id;
    this.svc.accepterColis(id, getLoggedId()).subscribe({
      next: () => {
        this.message = `✅ Colis #${id} accepté !`;
        this.colis = this.colis.filter(c => c.id_colis !== id);
        this.accepting = null;
        setTimeout(() => this.message = '', 3000);
      },
      error: () => { this.accepting = null; }
    });
  }
}

