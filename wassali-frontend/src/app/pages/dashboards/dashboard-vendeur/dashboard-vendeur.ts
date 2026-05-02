import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { VendeurService } from '../../../services/vendeur.service';
import { AuthService } from '../../../services/auth';

@Component({
  selector: 'app-dashboard-vendeur',
  standalone: true,
  imports: [CommonModule, FormsModule],
  providers: [VendeurService, AuthService],
  templateUrl: './dashboard-vendeur.html',
  styleUrls: ['./dashboard-vendeur.css']
})
export class DashboardVendeurComponent implements OnInit {

  activeMenu: string = 'dashboard';

  // ── Colis ──────────────────────────────────────────────
  colis: any[] = [];
  colisFiltres: any[] = [];
  showModal: boolean = false;
  idVendeur: number = 1; // Sera mis à jour via AuthService
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
  stats = { attente: 0, ramasse: 0, en_route: 0, livre: 0 };

  // ── Profil ─────────────────────────────────────────────
  profil = { nom: '', email: '', telephone: '' };

  // ── Paramètres généraux ────────────────────────────────
  parametres = {
    notifEmail: true,
    notifSms: true,
    notifPush: true,
    langue: 'fr',
    auth2fa: false
  };

  // ── Historique ─────────────────────────────────────────
  // Contient TOUTES les expéditions (y compris annulées) — jamais vidé
  historiqueColis: any[] = [];

  constructor(
    private vendeurService: VendeurService,
    private authService: AuthService,
    private router: Router
  ) { }

  // ── Navigation ─────────────────────────────────────────
  setMenu(menu: string): void {
    this.activeMenu = menu;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  // ── Lifecycle ──────────────────────────────────────────
  ngOnInit(): void {
    const user = this.authService.currentUser;
    if (user && user.id_user) {
      this.idVendeur = user.id_user;
      this.newColis.id_vendeur = this.idVendeur;
    }
    
    this.chargerColis();
    this.chargerClients();
    this.chargerProfil();
  }


  // ── Chargement colis ───────────────────────────────────
  chargerColis(): void {
    this.vendeurService.getMesColis(this.idVendeur).subscribe({
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
        // Ajouter dans l'historique
        this.historiqueColis.unshift({
          id: colisAjoute.id,
          description: colisAjoute.description,
          poids: colisAjoute.poids,
          date: new Date().toISOString().split('T')[0],
          statut: colisAjoute.statut
        });
        this.calculerStats();
        alert("Colis ajouté avec succès !");
        this.showModal = false;
        this.newColis = { description: '', poids: 0, id_vendeur: this.idVendeur, id_client: null };
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
        // Retirer également de l'historique local pour la cohérence
        this.historiqueColis = this.historiqueColis.filter(x => x.id !== c.id);

        this.filtrerColis();
        this.calculerStats();
      },
      error: (err) => console.error('Erreur suppression:', err)
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

  // ── Profil ─────────────────────────────────────────────
  chargerProfil(): void {
    this.vendeurService.getProfilVendeur(this.idVendeur).subscribe({
      next: (data) => {
        this.profil = {
          nom: `${data.prenom} ${data.nom}`,
          email: data.email,
          telephone: data.telephone || ''
        };
      },
      error: (err) => console.error('Erreur profil vendeur:', err)
    });
  }
}