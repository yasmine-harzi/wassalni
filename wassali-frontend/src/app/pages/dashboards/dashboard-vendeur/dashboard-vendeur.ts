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
  nouveauStatut: string = '';

  // ── Clients ────────────────────────────────────────────
  clients: any[] = [];
  clientsFiltres: any[] = [];
  showClientModal: boolean = false;
  newClient = { nom: '', email: '', telephone: '', adresse: '' };
  searchClientQuery: string = '';

  // ── Recherche colis ────────────────────────────────────
  searchQuery: string = '';

  // ── Stats ──────────────────────────────────────────────
  stats = { attente: 0, en_transit: 0, en_livraison: 0, livre: 0 };

  // ── Profil ─────────────────────────────────────────────
  profil = { nom: 'yosra boughattas', email: 'user@example.com', telephone: '+216 20 123 456' };

  // ── Paramètres généraux ────────────────────────────────
  parametres = {
    notifEmail: true,
    notifSms:   true,
    notifPush:  true,
    langue:     'fr',
    auth2fa:    false
  };

  // ── Historique ─────────────────────────────────────────
  // Contient TOUTES les expéditions (y compris annulées) — jamais vidé
  historiqueColis: any[] = [];

  // ── Charts ─────────────────────────────────────────────
  private lineChart: Chart | null = null;
  private pieChart: Chart | null = null;
  private chartsNeedRender: boolean = false;

  constructor(private vendeurService: VendeurService) {}

  // ── Navigation ─────────────────────────────────────────
  setMenu(menu: string): void {
    this.activeMenu = menu;
    if (menu === 'dashboard') {
      // Détruire les anciens charts et programmer leur recréation
      // après que Angular ait rendu le DOM avec les canvas
      this.destroyCharts();
      this.chartsNeedRender = true;
    }
  }

  // ── Lifecycle ──────────────────────────────────────────
  ngOnInit(): void {
    this.chargerColis();
    this.chargerClients();
    // Programmer la création initiale des charts
    this.chartsNeedRender = true;
  }

  // AfterViewChecked se déclenche après chaque cycle de rendu Angular.
  // On l'utilise pour créer les charts uniquement quand les canvas sont dans le DOM.
  ngAfterViewChecked(): void {
    if (this.chartsNeedRender && this.activeMenu === 'dashboard') {
      const lineCanvas = document.getElementById('lineChart') as HTMLCanvasElement;
      const pieCanvas  = document.getElementById('pieChart')  as HTMLCanvasElement;
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
    const base  = Math.max(1, Math.round(total / 7));
    const weekData = [0,1,2,3,4,5,6].map(i => {
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
        labels: ['En attente', 'En transit', 'En livraison', 'Livré'],
        datasets: [{
          data: [
            this.stats.attente,
            this.stats.en_transit,
            this.stats.en_livraison,
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
        // Initialiser l'historique avec les données du serveur
        // On ajoute les colis qui ne sont pas encore dans l'historique
        data.forEach(c => {
          if (!this.historiqueColis.find(h => h.id === c.id)) {
            this.historiqueColis.push({
              id: c.id,
              description: c.description,
              poids: c.poids,
              date: c.date_creation ? c.date_creation.split('T')[0] : new Date().toISOString().split('T')[0],
              statut: c.statut
            });
          }
        });
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
    this.stats.attente      = this.colis.filter(c => c.statut === 'attente').length;
    this.stats.en_transit   = this.colis.filter(c => c.statut === 'en_transit').length;
    this.stats.en_livraison = this.colis.filter(c => c.statut === 'en_livraison').length;
    this.stats.livre        = this.colis.filter(c => c.statut === 'livré').length;
  }

  openAddColisModal(): void {
    this.showModal = true;
  }

  ajouterColis(): void {
    this.vendeurService.ajouterColis(this.newColis).subscribe({
      next: (colisAjoute) => {
        // Ajouter en tête de liste active
        this.colis.unshift(colisAjoute);
        this.filtrerColis();
        // Ajouter dans l'historique
        this.historiqueColis.unshift({
          id: colisAjoute.id,
          description: colisAjoute.description,
          poids: colisAjoute.poids,
          date: new Date().toISOString().split('T')[0],
          statut: colisAjoute.statut
        });
        this.calculerStats();
        this.showModal = false;
        this.newColis = { description: '', poids: 0, id_vendeur: 1, id_client: null };
      },
      error: (err) => console.error('Erreur ajout colis:', err)
    });
  }

  // ── Annulation ─────────────────────────────────────────
  annulerColis(c: any): void {
    if (!confirm(`Annuler le colis #${c.id} — "${c.description}" ?`)) return;

    this.vendeurService.annulerColis(c.id).subscribe({
      next: () => {
        // Mettre à jour dans l'historique (reste visible avec statut annulé)
        const inHisto = this.historiqueColis.find(h => h.id === c.id);
        if (inHisto) {
          inHisto.statut = 'annulé';
        } else {
          this.historiqueColis.unshift({
            id: c.id,
            description: c.description,
            poids: c.poids,
            date: new Date().toISOString().split('T')[0],
            statut: 'annulé'
          });
        }
        // Retirer de la liste active
        this.colis = this.colis.filter(x => x.id !== c.id);
        this.filtrerColis();
        this.calculerStats();
      },
      error: (err) => console.error('Erreur annulation:', err)
    });
  }

  // ── Détails & changement de statut ────────────────────
  ouvrirDetailsModal(c: any): void {
    this.colisSelectionne = { ...c };
    this.nouveauStatut = c.statut;
    this.showDetailsModal = true;
  }

  changerStatut(): void {
    if (!this.colisSelectionne || !this.nouveauStatut) return;

    this.vendeurService.changerStatutColis(this.colisSelectionne.id, this.nouveauStatut).subscribe({
      next: () => {
        // Mettre à jour dans la liste active
        const colisLocal = this.colis.find(c => c.id === this.colisSelectionne.id);
        if (colisLocal) colisLocal.statut = this.nouveauStatut;
        // Mettre à jour dans l'historique
        const inHisto = this.historiqueColis.find(h => h.id === this.colisSelectionne.id);
        if (inHisto) inHisto.statut = this.nouveauStatut;

        this.filtrerColis();
        this.calculerStats();
        this.showDetailsModal = false;
        this.colisSelectionne = null;
      },
      error: (err) => console.error('Erreur changement statut:', err)
    });
  }

  // ── Clients ────────────────────────────────────────────
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
    this.vendeurService.ajouterClient(this.newClient).subscribe({
      next: (clientAjoute) => {
        this.clients.push(clientAjoute);
        this.filtrerClients();
        this.showClientModal = false;
        this.newClient = { nom: '', email: '', telephone: '', adresse: '' };
      },
      error: (err) => console.error('Erreur ajout client:', err)
    });
  }

  filtrerClients(): void {
    const q = this.searchClientQuery.trim().toLowerCase();
    if (!q) {
      this.clientsFiltres = [...this.clients];
      return;
    }
    this.clientsFiltres = this.clients.filter(cl =>
      (cl.nom    && cl.nom.toLowerCase().includes(q))    ||
      (cl.email  && cl.email.toLowerCase().includes(q))  ||
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

  // ── Paramètres ─────────────────────────────────────────
  enregistrerModifications(): void {
    console.log('Modifications enregistrées', this.profil);
  }

  ouvrirChangerMotDePasse(): void {
    // TODO: brancher sur un vrai modal ou route dédiée
    alert('Fonctionnalité à implémenter : changement de mot de passe.');
  }

  supprimerCompte(): void {
    if (confirm('Êtes-vous sûr de vouloir supprimer votre compte ?')) {
      console.log('Compte supprimé');
    }
  }
}