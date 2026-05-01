import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, RouterOutlet, Router, NavigationEnd } from '@angular/router';
import { CoursierService } from '../../../services/coursier.service';
import { NotificationService } from '../../../services/notification.service';
import { ColisService } from '../../../services/colis.service';
import { filter } from 'rxjs/operators';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

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
export class DashboardLivreur implements OnInit, AfterViewInit {
  @ViewChild('weeklyChart') weeklyChartRef!: ElementRef;
  @ViewChild('earningsChart') earningsChartRef!: ElementRef;

  profil: any = null;
  nbNotifs = 0;
  menuOuvert = false;
  idCoursier = getLoggedId();
  currentUrl = '';
  allColis: any[] = [];
  stats = { total: 0, enCours: 0, livres: 0, revenus: 0 };

  constructor(
    private coursierSvc: CoursierService,
    private notifSvc: NotificationService,
    private colisSvc: ColisService,
    private router: Router
  ) { }

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
      error: () => { }
    });

    this.colisSvc.getMesColis(this.idCoursier).subscribe({
      next: (list) => {
        this.allColis = list;
        this.stats.total = list.length;
        this.stats.enCours = list.filter(c => ['ramassé', 'en_route'].includes(c.statut)).length;
        this.stats.livres = list.filter(c => c.statut === 'livré').length;
        this.stats.revenus = list
          .filter(c => c.statut === 'livré')
          .reduce((sum, c) => sum + (Number(c.prix) || 0), 0);

        // Initialize charts after data is loaded
        setTimeout(() => this.initCharts(), 100);
      }
    });
  }

  ngAfterViewInit() { }

  initCharts() {
    if (!this.weeklyChartRef || !this.earningsChartRef) return;

    const weeklyData = this.processWeeklyData();
    const earningsData = this.processEarningsData();

    // Weekly Activity Chart
    new Chart(this.weeklyChartRef.nativeElement, {
      type: 'bar',
      data: {
        labels: weeklyData.labels,
        datasets: [{
          label: 'Livraisons',
          data: weeklyData.counts,
          backgroundColor: '#3C3489',
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { display: false } }, x: { grid: { display: false } } }
      }
    });

    // Earnings Chart
    new Chart(this.earningsChartRef.nativeElement, {
      type: 'line',
      data: {
        labels: earningsData.labels,
        datasets: [{
          label: 'Gains (DT)',
          data: earningsData.values,
          borderColor: '#10b981',
          backgroundColor: 'rgba(16, 185, 129, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: { legend: { display: false } },
        scales: { y: { beginAtZero: true }, x: { grid: { display: false } } }
      }
    });
  }

  private processWeeklyData() {
    const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
    const now = new Date();
    const labels: string[] = [];
    const counts: number[] = [];

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(now.getDate() - i);
      const dayLabel = days[d.getDay()];
      labels.push(dayLabel);

      const count = this.allColis.filter(c => {
        const cDate = new Date(c.date_creation);
        return cDate.toDateString() === d.toDateString();
      }).length;
      counts.push(count);
    }

    return { labels, counts };
  }

  private processEarningsData() {
    const labels: string[] = [];
    const values: number[] = [];
    
    // Group earnings by month for the last 6 months
    const now = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('fr-FR', { month: 'short' });
      labels.push(monthLabel);

      const monthlyTotal = this.allColis
        .filter(c => {
          const cDate = new Date(c.date_creation);
          return cDate.getMonth() === d.getMonth() && cDate.getFullYear() === d.getFullYear() && c.statut === 'livré';
        })
        .reduce((sum, c) => sum + (Number(c.prix) || 0), 0);
      values.push(monthlyTotal);
    }

    return { labels, values };
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
