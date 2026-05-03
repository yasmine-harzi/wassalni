import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { CoursierService } from '../../../../services/coursier.service';
import { getLoggedId } from '../dashboard-coursier';

@Component({
  selector: 'app-profil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profil.html',
  styleUrl: './profil.css'
})
export class ProfilComponent implements OnInit {
  profil: any = null;
  loading = true;
  constructor(private svc: CoursierService) {}
  ngOnInit() {
    this.svc.getProfil(getLoggedId()).subscribe({
      next: (p) => { this.profil = p; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
  toggleDispo() {
    if (!this.profil) return;
    const newVal = !this.profil.disponibilite;
    this.svc.toggleDisponibilite(getLoggedId(), newVal).subscribe({ next: () => (this.profil.disponibilite = newVal) });
  }
}

