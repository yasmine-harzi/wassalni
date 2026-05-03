import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CoursierService } from '../../../services/coursier.service';
import { NotificationService } from '../../../services/notification.service';
import { filter } from 'rxjs/operators';
import { ColisService } from '../../../services/colis.service';

// On récupère l'ID dynamiquement depuis le localStorage
export function getLoggedId(): number {
  const user = localStorage.getItem('user');
  if (user) {
    const u = JSON.parse(user);
    return u.id_user || 1;
  }
  return 1;
}

@Component({
  selector: 'app-dashboard-coursier',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dashboard-coursier.html',
  styleUrl: './dashboard-coursier.css'
})
export class DashboardCoursier implements OnInit {
  profil: any = null;
  nbNotifs = 0;
  menuOuvert = false;
  idCoursier = getLoggedId();
  currentUrl = '';
  
  stats = {
    ramasse: 0,
    enRoute: 0,
    livre: 0
  };

  periode = 'tous';

  constructor(
    private coursierSvc: CoursierService,
    private notifSvc: NotificationService,
    private colisSvc: ColisService,
    private router: Router
  ) {}

  ngOnInit() {
    this.currentUrl = this.router.url;
    this.router.events.pipe(filter(e => e instanceof NavigationEnd))
      .subscribe((e: any) => this.currentUrl = e.urlAfterRedirects);

    this.coursierSvc.getProfil(this.idCoursier).subscribe({
      next: (p) => (this.profil = p),
      error: () => (this.profil = { nom: 'Coursier', prenom: '', disponibilite: true })
    });
    this.notifSvc.getNotifications(this.idCoursier).subscribe({
      next: (list) => (this.nbNotifs = list.filter((n: any) => !n.lu).length),
      error: () => {}
    });

    this.loadStats();
  }

  setPeriode(p: string) {
    this.periode = p;
    this.loadStats();
  }

  loadStats() {
    this.colisSvc.getMesColis(this.idCoursier).subscribe({
      next: (list: any[]) => {
        let filtered = list;
        const now = new Date();

        if (this.periode === 'jour') {
          filtered = list.filter(c => {
            const d = new Date(c.date_creation);
            return d.toDateString() === now.toDateString();
          });
        } else if (this.periode === 'semaine') {
          const oneWeekAgo = new Date();
          oneWeekAgo.setDate(now.getDate() - 7);
          filtered = list.filter(c => new Date(c.date_creation) >= oneWeekAgo);
        } else if (this.periode === 'mois') {
          const oneMonthAgo = new Date();
          oneMonthAgo.setMonth(now.getMonth() - 1);
          filtered = list.filter(c => new Date(c.date_creation) >= oneMonthAgo);
        }

        this.stats.ramasse = filtered.filter(c => c.statut === 'ramassé').length;
        this.stats.enRoute = filtered.filter(c => c.statut === 'en_route').length;
        this.stats.livre = filtered.filter(c => c.statut === 'livré').length;
      }
    });
  }

  isSubPage(): boolean {
    return this.currentUrl !== '/dashboard-coursier' && this.currentUrl !== '/dashboard-coursier/';
  }

  toggleMenu() { this.menuOuvert = !this.menuOuvert; }

  toggleDispo() {
    if (!this.profil) return;
    const newVal = !this.profil.disponibilite;
    this.coursierSvc.toggleDisponibilite(this.idCoursier, newVal).subscribe({
      next: () => (this.profil.disponibilite = newVal)
    });
  }

  logout() {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    this.router.navigate(['/login']);
  }
}

