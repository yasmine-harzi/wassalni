import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CoursierService } from '../../../services/coursier.service';
import { NotificationService } from '../../../services/notification.service';
import { filter } from 'rxjs/operators';

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
  selector: 'app-dashboard-livreur',
  standalone: true,
  imports: [CommonModule, RouterModule, RouterOutlet],
  templateUrl: './dashboard-livreur.html',
  styleUrl: './dashboard-livreur.css'
})
export class DashboardLivreur implements OnInit {
  profil: any = null;
  nbNotifs = 0;
  menuOuvert = false;
  idCoursier = getLoggedId();
  currentUrl = '';

  constructor(
    private coursierSvc: CoursierService,
    private notifSvc: NotificationService,
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
  }

  isSubPage(): boolean {
    return this.currentUrl !== '/dashboard-livreur' && this.currentUrl !== '/dashboard-livreur/';
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
