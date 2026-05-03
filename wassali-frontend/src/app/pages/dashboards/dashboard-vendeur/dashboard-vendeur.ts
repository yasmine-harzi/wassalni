import { AfterViewChecked, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendeurService } from '../../../services/vendeur';
import { Chart, registerables } from 'chart.js';
Chart.register(...registerables);

@Component({
  selector: 'app-dashboard-vendeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [VendeurService],
  templateUrl: './dashboard-vendeur.html',
  styleUrls: ['./dashboard-vendeur.css']
})
export class DashboardVendeurComponent implements OnInit, AfterViewChecked {

  activeMenu: string = 'dashboard';

  // ── Colis ──────────────────────────────────────────────
  colis: any[] = [];
  colisFiltres: any[] = [];
  showModal: boolean = false;
  newColis = { description: '', poids: 0, id_vendeur: 1, id_client: null as number | null };

  // ── Détails colis ──────────────────────────────────────
  showDetailsModal: boolean = false;
  colisSelectionne: any = null;

  // ── Clients ────────────────────────────────────────────
  clients: any[] = [];
  clientsFiltres: any[] = [];
  showClientModal: boolean = false;
  newClient = { nom: '', email: '', telephone: '', adresse: '' };
  searchClientQuery: string = '';

  // ── Recherche colis ────────────────────────────────────
  searchQuery: string = '';

  // ── Stats ──────────────────────────────────────────────
  stats = { attente: 0, ramasse: 0, en_route: 0, livre: 0 };


  // ── Notifications ──────────────────────────────────────
  notifications: any[] = [];
  unreadNotifCount: number = 0;

  // ── Support ───────────────────────────────────────────
  showSupportModal: boolean = false;
  supportTicket = { email: '', message: '' };

  // ── Charts ─────────────────────────────────────────────
  private lineChart: Chart | null = null;
  private pieChart: Chart | null = null;
  private chartsNeedRender: boolean = false;

  constructor(private vendeurService: VendeurService) { }

  // ── Navigation ─────────────────────────────────────────
  setMenu(menu: string): void {
    this.activeMenu = menu;
    if (menu === 'dashboard') {
      this.destroyCharts();
      this.chartsNeedRender = true;
    }
    if (menu === 'notifications') {
      this.chargerNotifications();
    }
  }

  // ── Lifecycle ──────────────────────────────────────────
  ngOnInit(): void {
    this.chargerColis();
    this.chargerClients();
    this.chargerNotifications(); // Charger initialement pour le badge
    this.chartsNeedRender = true;
  }

  // AfterViewChecked se déclenche après chaque cycle de rendu Angular.
  // On l'utilise pour créer les charts uniquement quand les canvas sont dans le DOM.
  ngAfterViewChecked(): void {
    if (this.chartsNeedRender && this.activeMenu === 'dashboard') {
      const lineCanvas = document.getElementById('lineChart') as HTMLCanvasElement;
      const pieCanvas = document.getElementById('pieChart') as HTMLCanvasElement;
      if (lineCanvas && pieCanvas) {
        this.chartsNeedRender = false;
        setTimeout(() => {
          this.createLineChart();
          this.createPieChart();
        }, 0);
      }
    }
  }

  // ── Charts ─────────────────────────────────────────────
  private destroyCharts(): void {
    if (this.lineChart) {
      this.lineChart.destroy();
      this.lineChart = null;
    }
    if (this.pieChart) {
      this.pieChart.destroy();
      this.pieChart = null;
    }
  }

  createLineChart(): void {
    const canvas = document.getElementById('lineChart') as HTMLCanvasElement;
    if (!canvas) return;
    // Répartit le total des colis actifs sur 7 jours avec une légère variation
    const total = this.colis.length;
    const base = Math.max(1, Math.round(total / 7));
    const weekData = [0, 1, 2, 3, 4, 5, 6].map(i => {
      const variation = Math.round((Math.sin(i) + 1) * base * 0.4);
      return base + variation;
    });
    this.lineChart = new Chart(canvas, {
      type: 'line',
      data: {
        labels: ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'],
        datasets: [{
          label: 'Livraisons',
          data: weekData,
          borderColor: '#3498DB',
          backgroundColor: 'rgba(52, 152, 219, 0.1)',
          fill: true,
          tension: 0.4
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  createPieChart(): void {
    const canvas = document.getElementById('pieChart') as HTMLCanvasElement;
    if (!canvas) return;
    // Données synchronisées avec les stats réelles
    this.pieChart = new Chart(canvas, {
      type: 'pie',
      data: {
        labels: ['En attente', 'Ramassé', 'En route', 'Livré'],
        datasets: [{
          data: [
            this.stats.attente,
            this.stats.ramasse,
            this.stats.en_route,
            this.stats.livre
          ],
          backgroundColor: ['#3498DB', '#9B59B6', '#F39C12', '#27AE60']
        }]
      },
      options: { responsive: true, maintainAspectRatio: false }
    });
  }

  // ── Chargement colis ───────────────────────────────────
  chargerColis(): void {
    this.vendeurService.getMesColis(1).subscribe({
      next: (data) => {
        this.colis = data;
        this.colisFiltres = [...data];
        this.calculerStats();
        // Si on est sur le dashboard, rafraîchir les charts
        if (this.activeMenu === 'dashboard') {
          this.destroyCharts();
          this.chartsNeedRender = true;
        }
      },
      error: (err) => console.error('Erreur API colis:', err)
    });
  }

  calculerStats(): void {
    this.stats.attente = this.colis.filter(c => c.statut === 'attente').length;
    this.stats.ramasse = this.colis.filter(c => c.statut === 'ramassé').length;
    this.stats.en_route = this.colis.filter(c => c.statut === 'en_route').length;
    this.stats.livre = this.colis.filter(c => c.statut === 'livré').length;
  }

  openAddColisModal(): void {
    this.showModal = true;
  }

  ajouterColis(): void {
    if (!this.newColis.description || !this.newColis.poids || !this.newColis.id_client) {
      alert("Veuillez remplir tous les champs obligatoires (Description, Poids et Client).");
      return;
    }

    if (this.newColis.poids <= 0) {
      alert("Le poids doit être supérieur à 0.");
      return;
    }

    this.vendeurService.ajouterColis(this.newColis).subscribe({
      next: (colisAjoute) => {
        // Ajouter en tête de liste active
        this.colis.unshift(colisAjoute);
        this.filtrerColis();
        this.calculerStats();
        alert("Colis ajouté avec succès !");
        this.showModal = false;
        this.chargerNotifications(); // Rafraîchir pour voir la nouvelle notification
        this.newClient = { nom: '', email: '', telephone: '', adresse: '' }; // Reset
        this.newColis = { description: '', poids: 0, id_vendeur: 1, id_client: null };
      },
      error: (err) => console.error('Erreur ajout colis:', err)
    });
  }

  // ── Suppression ─────────────────────────────────────────
  supprimerColis(c: any): void {
    if (!confirm(`Supprimer définitivement le colis #${c.id} — "${c.description}" ?`)) return;

    this.vendeurService.supprimerColis(c.id).subscribe({
      next: () => {
        // Retirer de la liste active
        this.colis = this.colis.filter(x => x.id !== c.id);

        this.filtrerColis();
        this.calculerStats();
        this.chargerNotifications();
      },
      error: (err) => console.error('Erreur suppression:', err)
    });
  }

  // ── Détails ───────────────────────────────────────────
  ouvrirDetailsModal(c: any): void {
    this.colisSelectionne = { ...c };
    this.showDetailsModal = true;
  }


  // ── Clients ────────────────────────────────────────────
  // ── Notifications ──────────────────────────────────────
  chargerNotifications(): void {
    // Utilise l'id_user 2 qui correspond au vendeur id_vendeur 1 dans la DB
    this.vendeurService.getNotifications(2).subscribe({
      next: (data) => {
        this.notifications = data;
        this.unreadNotifCount = data.filter(n => !n.lu).length;
      },
      error: (err) => console.error('Erreur notifications:', err)
    });
  }

  marquerCommeLue(n: any): void {
    if (n.lu) return;
    this.vendeurService.marquerNotificationLue(n.id_notification).subscribe({
      next: () => {
        n.lu = 1;
        this.unreadNotifCount = this.notifications.filter(x => !x.lu).length;
      }
    });
  }

  chargerClients(): void {
    this.vendeurService.getClients().subscribe({
      next: (data) => {
        this.clients = data;
        this.clientsFiltres = [...data];
      },
      error: (err) => console.error('Erreur API clients:', err)
    });
  }

  openAddClientModal(): void {
    this.showClientModal = true;
  }

  ajouterClient(): void {
    // Validation manuelle avant envoi
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{8,}$/;

    if (!this.newClient.nom || !this.newClient.email || !this.newClient.telephone || !this.newClient.adresse) {
      alert("Veuillez remplir tous les champs obligatoires.");
      return;
    }

    if (!emailRegex.test(this.newClient.email)) {
      alert("L'adresse email n'est pas valide.");
      return;
    }

    if (!phoneRegex.test(this.newClient.telephone)) {
      alert("Le numéro de téléphone doit contenir au moins 8 chiffres (chiffres uniquement).");
      return;
    }

    this.vendeurService.ajouterClient(this.newClient).subscribe({
      next: (clientAjoute) => {
        this.clients.push(clientAjoute);
        this.filtrerClients();
        alert("Client enregistré avec succès !");
        this.showClientModal = false;
        this.newClient = { nom: '', email: '', telephone: '', adresse: '' };
      },
      error: (err) => console.error('Erreur ajout client:', err)
    });
  }

  supprimerClient(cl: any): void {
    if (!confirm(`Supprimer le client "${cl.nom}" et ses colis ?`)) return;

    this.vendeurService.supprimerClient(cl.id).subscribe({
      next: () => {
        // Retirer de la liste locale des clients
        this.clients = this.clients.filter(x => x.id !== cl.id);
        this.filtrerClients();
        // Rafraîchir la liste des colis car ils ont été supprimés en cascade
        this.chargerColis();
      },
      error: (err) => {
        console.error('Erreur suppression client:', err);
        if (err.status === 400) {
          alert(err.error.detail || 'Impossible de supprimer ce client.');
        } else {
          alert('Une erreur est survenue lors de la suppression.');
        }
      }
    });
  }

  filtrerClients(): void {
    const q = this.searchClientQuery.trim().toLowerCase();
    if (!q) {
      this.clientsFiltres = [...this.clients];
      return;
    }
    this.clientsFiltres = this.clients.filter(cl =>
      (cl.nom && cl.nom.toLowerCase().includes(q)) ||
      (cl.email && cl.email.toLowerCase().includes(q)) ||
      (cl.adresse && cl.adresse.toLowerCase().includes(q))
    );
  }

  clearSearchClient(): void {
    this.searchClientQuery = '';
    this.filtrerClients();
  }

  // ── Recherche colis ────────────────────────────────────
  filtrerColis(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.colisFiltres = [...this.colis];
      return;
    }
    this.colisFiltres = this.colis.filter(c =>
      String(c.id).includes(q) ||
      (c.nomClient && c.nomClient.toLowerCase().includes(q))
    );
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filtrerColis();
  }


  // ── Support ────────────────────────────────────────────
  ouvrirSupportModal(): void {
    this.supportTicket = { email: '', message: '' };
    this.showSupportModal = true;
  }

  envoyerSupportTicket(): void {
    if (!this.supportTicket.message.trim() || !this.supportTicket.email.trim()) {
      alert("Veuillez remplir votre email et votre message.");
      return;
    }

    const data = {
      id_vendeur: 1, // Id statique pour le moment
      email: this.supportTicket.email,
      message: this.supportTicket.message
    };

    this.vendeurService.envoyerTicketSupport(data).subscribe({
      next: (res) => {
        alert(res.message);
        this.showSupportModal = false;
        this.chargerNotifications(); // Notifier l'envoi ? (Optionnel)
      },
      error: (err) => {
        console.error('Erreur support:', err);
        alert("Une erreur est survenue lors de l'envoi.");
      }
    });
  }
}