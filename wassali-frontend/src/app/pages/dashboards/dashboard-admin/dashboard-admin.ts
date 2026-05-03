import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-dashboard-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-admin.html',
  styleUrls: ['./dashboard-admin.css']
})
export class DashboardAdminComponent implements OnInit {
  admin: any = null;
  activeMenu: string = 'vendeurs';
  
  // URL de l'API
  private apiUrl = 'http://localhost:8000/api';

  // Listes chargées depuis la base de données
  vendeurs: any[] = [];
  coursiers: any[] = [];
  zonesDisponibles: any[] = [];

  // Modales
  showVendeurModal: boolean = false;
  showCoursierModal: boolean = false;
  showZoneModal: boolean = false;
  
  selectedVendeur: any = null;
  selectedCoursier: any = null;
  
  // Formulaires
  newVendeur = { nom: '', email: '', phone: '' };
  newCoursier = { nom: '', email: '', phone: '', zone: '' };
  newZone = { nom: '' };
  editZoneCoursier = { coursier: null as any, zone: '' };

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit(): void {
    // 🛡️ Vérification d'authentification admin
    const isAdmin = localStorage.getItem('admin');
    if (!isAdmin) {
      alert('Accès refusé. Vous devez vous connecter en tant qu\'administrateur.');
      this.router.navigate(['/login']);
      return;
    }

    const savedName = localStorage.getItem('adminName');
    this.admin = { name: savedName || 'Administrateur' };

    // 📥 Charger les données depuis la base de données
    this.chargerVendeurs();
    this.chargerCoursiers();
    this.chargerZones();
  }

  // 📥 CHARGEMENT DES DONNÉES DEPUIS L'API
  chargerVendeurs(): void {
    this.http.get<any[]>(`${this.apiUrl}/vendeurs`).subscribe({
      next: (data) => {
        this.vendeurs = data;
        console.log('✅ Vendeurs chargés :', this.vendeurs);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des vendeurs :', error);
        alert('Erreur : Impossible de charger les vendeurs');
      }
    });
  }

  chargerCoursiers(): void {
    this.http.get<any[]>(`${this.apiUrl}/coursiers`).subscribe({
      next: (data) => {
        this.coursiers = data;
        console.log('✅ Coursiers chargés :', this.coursiers);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des coursiers :', error);
        alert('Erreur : Impossible de charger les coursiers');
      }
    });
  }

  chargerZones(): void {
    this.http.get<any[]>(`${this.apiUrl}/zones`).subscribe({
      next: (data) => {
        this.zonesDisponibles = data;
        console.log('✅ Zones chargées :', this.zonesDisponibles);
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des zones :', error);
        alert('Erreur : Impossible de charger les zones');
      }
    });
  }

  // ========== VENDEURS ==========
  openAddVendeurModal(): void {
    this.newVendeur = { nom: '', email: '', phone: '' };
    this.showVendeurModal = true;
  }

  addVendeur(): void {
    if (!this.newVendeur.nom.trim()) {
      alert('Veuillez entrer le nom du vendeur');
      return;
    }
    
    // 📤 Envoyer les données au backend
    const payload = {
      nom: this.newVendeur.nom,
      email: this.newVendeur.email,
      telephone: this.newVendeur.phone,
      status: 'actif'
    };

    this.http.post(`${this.apiUrl}/vendeurs`, payload).subscribe({
      next: (response) => {
        console.log('✅ Vendeur créé :', response);
        alert('✅ Vendeur ajouté avec succès !');
        this.chargerVendeurs(); // Recharger la liste
        this.closeVendeurModal();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création du vendeur :', error);
        alert('❌ Erreur : ' + (error.error?.detail || 'Impossible d\'ajouter le vendeur'));
      }
    });
  }

  deleteVendeur(vendeur: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${vendeur.nom} ?`)) {
      // 🗑️ Appeler l'API pour supprimer
      this.http.delete(`${this.apiUrl}/vendeurs/${vendeur.id}`).subscribe({
        next: (response) => {
          console.log('✅ Vendeur supprimé :', response);
          alert('✅ Vendeur supprimé avec succès !');
          this.chargerVendeurs(); // Recharger la liste
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression :', error);
          alert('❌ Erreur : ' + (error.error?.detail || 'Impossible de supprimer le vendeur'));
        }
      });
    }
  }

  toggleVendeurStatus(vendeur: any): void {
    const newStatus = vendeur.status === 'actif' ? 'suspendu' : 'actif';
    
    // ✏️ Envoyer la modification au backend
    const payload = { status: newStatus };
    
    this.http.put(`${this.apiUrl}/vendeurs/${vendeur.id}`, payload).subscribe({
      next: (response) => {
        console.log('✅ Statut modifié :', response);
        vendeur.status = newStatus; // Mettre à jour localement
        alert(`✅ Statut changé en "${newStatus}" !`);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la modification :', error);
        alert('❌ Erreur : Impossible de modifier le statut');
      }
    });
  }

  closeVendeurModal(): void {
    this.showVendeurModal = false;
    this.newVendeur = { nom: '', email: '', phone: '' };
  }

  // ========== COURSIERS ==========
  openAddCoursierModal(): void {
    this.newCoursier = { nom: '', email: '', phone: '', zone: '' };
    this.showCoursierModal = true;
  }

  addCoursier(): void {
    if (!this.newCoursier.nom.trim()) {
      alert('Veuillez entrer le nom du coursier');
      return;
    }
    if (!this.newCoursier.zone.trim()) {
      alert('Veuillez sélectionner une zone de livraison');
      return;
    }
    
    // 📤 Envoyer les données au backend
    const payload = {
      nom: this.newCoursier.nom,
      email: this.newCoursier.email,
      telephone: this.newCoursier.phone,
      zone: this.newCoursier.zone,
      status: 'actif'
    };

    this.http.post(`${this.apiUrl}/coursiers`, payload).subscribe({
      next: (response) => {
        console.log('✅ Coursier créé :', response);
        alert('✅ Coursier ajouté avec succès !');
        this.chargerCoursiers(); // Recharger la liste
        this.closeCoursierModal();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création du coursier :', error);
        alert('❌ Erreur : ' + (error.error?.detail || 'Impossible d\'ajouter le coursier'));
      }
    });
  }

  deleteCoursier(coursier: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer ${coursier.nom} ?`)) {
      // 🗑️ Appeler l'API pour supprimer
      this.http.delete(`${this.apiUrl}/coursiers/${coursier.id}`).subscribe({
        next: (response) => {
          console.log('✅ Coursier supprimé :', response);
          alert('✅ Coursier supprimé avec succès !');
          this.chargerCoursiers(); // Recharger la liste
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression :', error);
          alert('❌ Erreur : ' + (error.error?.detail || 'Impossible de supprimer le coursier'));
        }
      });
    }
  }

  openEditZoneModal(coursier: any): void {
    this.editZoneCoursier.coursier = coursier;
    this.editZoneCoursier.zone = coursier.zone;
    this.showZoneModal = true;
  }

  updateZone(): void {
    if (!this.editZoneCoursier.zone.trim()) {
      alert('Veuillez sélectionner une zone');
      return;
    }
    
    // ✏️ Envoyer la modification au backend
    const payload = { zone: this.editZoneCoursier.zone };
    
    this.http.put(`${this.apiUrl}/coursiers/${this.editZoneCoursier.coursier.id}`, payload).subscribe({
      next: (response) => {
        console.log('✅ Zone modifiée :', response);
        this.editZoneCoursier.coursier.zone = this.editZoneCoursier.zone;
        alert('✅ Zone de livraison mise à jour avec succès !');
        this.closeZoneModal();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la modification :', error);
        alert('❌ Erreur : Impossible de modifier la zone');
      }
    });
  }

  toggleCoursierStatus(coursier: any): void {
    const newStatus = coursier.status === 'actif' ? 'inactif' : 'actif';
    
    // ✏️ Envoyer la modification au backend
    const payload = { status: newStatus };
    
    this.http.put(`${this.apiUrl}/coursiers/${coursier.id}`, payload).subscribe({
      next: (response) => {
        console.log('✅ Statut modifié :', response);
        coursier.status = newStatus;
        alert(`✅ Statut changé en "${newStatus}" !`);
      },
      error: (error) => {
        console.error('❌ Erreur lors de la modification :', error);
        alert('❌ Erreur : Impossible de modifier le statut');
      }
    });
  }

  closeCoursierModal(): void {
    this.showCoursierModal = false;
    this.newCoursier = { nom: '', email: '', phone: '', zone: '' };
  }

  closeZoneModal(): void {
    this.showZoneModal = false;
    this.editZoneCoursier = { coursier: null, zone: '' };
  }

  // ========== ZONES ==========
  openAddZoneModal(): void {
    this.newZone = { nom: '' };
    this.showZoneModal = true;
  }

  addNewZone(): void {
    if (!this.newZone.nom.trim()) {
      alert('Veuillez entrer le nom de la zone');
      return;
    }
    
    // 📤 Envoyer les données au backend
    const payload = { nom: this.newZone.nom };

    this.http.post(`${this.apiUrl}/zones`, payload).subscribe({
      next: (response) => {
        console.log('✅ Zone créée :', response);
        alert('✅ Zone ajoutée avec succès !');
        this.chargerZones(); // Recharger la liste
        this.newZone = { nom: '' };
      },
      error: (error) => {
        console.error('❌ Erreur lors de la création de la zone :', error);
        alert('❌ Erreur : ' + (error.error?.detail || 'Impossible d\'ajouter la zone'));
      }
    });
  }

  deleteZone(zone: any): void {
    if (confirm(`Êtes-vous sûr de vouloir supprimer la zone "${zone.nom}" ?`)) {
      // 🗑️ Appeler l'API pour supprimer
      this.http.delete(`${this.apiUrl}/zones/${zone.id}`).subscribe({
        next: (response) => {
          console.log('✅ Zone supprimée :', response);
          alert('✅ Zone supprimée avec succès !');
          this.chargerZones(); // Recharger la liste
        },
        error: (error) => {
          console.error('❌ Erreur lors de la suppression :', error);
          alert('❌ Erreur : ' + (error.error?.detail || 'Impossible de supprimer la zone'));
        }
      });
    }
  }

  getCoursierCountByZone(zone: any): number {
    return zone.coursiers_assignes || 0;
  }

  changerMenu(menu: string): void {
    this.activeMenu = menu;
  }

  deconnexion(): void {
    localStorage.removeItem('admin');
    localStorage.removeItem('adminName');
    this.router.navigate(['/login']);
  }
}
