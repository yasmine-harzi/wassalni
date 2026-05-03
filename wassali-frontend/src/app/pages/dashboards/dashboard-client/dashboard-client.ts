import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';

declare let L: any;

@Component({
  selector: 'app-dashboard-client',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './dashboard-client.html',
  styleUrls: ['./dashboard-client.css']
})
export class DashboardClientComponent implements OnInit {
  @ViewChild('mapContainer', { static: false }) mapContainer!: ElementRef;

  user: any = null;
  activeMenu: string = 'colis';
  showReprogrammerModal: boolean = false;
  selectedColis: any = null;
  newDateReprogrammation: string = '';
  map: any = null;
  markers: any[] = [];

  // URL de l'API
  private apiUrl = 'http://localhost:8000/api';

  // Account management properties
  editNom: string = '';
  editPrenom: string = '';
  editEmail: string = '';
  editPhone: string = '';
  editAdresse: string = '';
  isEditing: boolean = false;

  // 📦 Listes chargées depuis la base de données
  colisListe: any[] = [];

  constructor(private http: HttpClient, private router: Router) {}

  ngOnInit(): void {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      this.user = JSON.parse(savedUser);
    } else {
      this.user = { id: 1, name: 'Client', email: 'client@example.com', phone: '+216 12 345 678', prenom: '', adresse: '' };
    }
    
    // 📥 Charger le profil complet depuis la base de données
    this.chargerProfil();

    // 📥 Charger les colis depuis la base de données
    this.chargerColis();
  }

  chargerProfil(): void {
    if (!this.user || !this.user.id) return;
    this.http.get<any>(`${this.apiUrl}/profil/${this.user.id}`).subscribe({
      next: (data) => {
        console.log('✅ Loaded user data from DB:', data);
        this.user = { ...this.user, ...data };
        localStorage.setItem('user', JSON.stringify(this.user)); // Update localStorage
        
        // Update edit fields
        this.editNom = this.user.nom || '';
        this.editPrenom = this.user.prenom || '';
        this.editEmail = this.user.email || '';
        this.editPhone = this.user.phone || '';
        this.editAdresse = this.user.adresse || '';
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement du profil :', error);
        // Fallback to localStorage data
        this.editNom = this.user.nom || '';
        this.editPrenom = this.user.prenom || '';
        this.editEmail = this.user.email || '';
        this.editPhone = this.user.phone || '';
        this.editAdresse = this.user.adresse || '';
      }
    });
  }

  // 📥 CHARGEMENT DES COLIS DEPUIS L'API
  chargerColis(): void {
    this.http.get<any[]>(`${this.apiUrl}/colis/client/${this.user.id}`).subscribe({
      next: (data) => {
        // Map backend fields to frontend expectations and add dummy coordinates for tracking
        this.colisListe = data.map((colis: any) => ({
          ...colis,
          dateEstimation: colis.date_estimation,
          heureEstimation: colis.heure_estimation,
          // Tunis coordinates base for dummy tracking points
          lat: 36.8065 + (Math.random() - 0.5) * 0.05,
          lng: 10.1815 + (Math.random() - 0.5) * 0.05,
          courierLat: (colis.statut === 'en_livraison' || colis.statut === 'en_cours') 
                        ? 36.8065 + (Math.random() - 0.5) * 0.05 : null,
          courierLng: (colis.statut === 'en_livraison' || colis.statut === 'en_cours') 
                        ? 10.1815 + (Math.random() - 0.5) * 0.05 : null
        }));
        
        console.log('✅ Colis chargés depuis la BD :', this.colisListe);
        // Mettre à jour la carte après le chargement
        if (this.map) {
          this.updateMapMarkers();
        }
      },
      error: (error) => {
        console.error('❌ Erreur lors du chargement des colis :', error);
        alert('⚠️ Impossible de charger vos colis. Vérifiez la connexion au serveur.');
      }
    });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  initializeMap(): void {
    setTimeout(() => {
      const mapElement = document.getElementById('map');
      if (!mapElement) return;

      // Initialiser la carte centrée sur Tunis
      this.map = L.map('map').setView([36.8065, 10.1815], 13);

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap',
        maxZoom: 19
      }).addTo(this.map);

      this.updateMapMarkers();
    }, 100);
  }

  updateMapMarkers(): void {
    if (!this.map) return;

    // Supprimer les anciens marqueurs
    this.markers.forEach(marker => this.map.removeLayer(marker));
    this.markers = [];

    // Ajouter les marqueurs pour les clients (destination)
    this.colisListe.forEach((colis, index) => {
      if (colis.lat && colis.lng) {
        const color = this.getMarkerColor(colis.statut);
        const marker = L.circleMarker([colis.lat, colis.lng], {
          radius: 12,
          fillColor: color,
          color: '#fff',
          weight: 3,
          opacity: 1,
          fillOpacity: 0.8
        }).addTo(this.map);

        marker.bindPopup(`
          <div style="padding: 8px;">
            <strong>${colis.id}</strong><br/>
            Destination: ${colis.vendeur}<br/>
            Statut: ${this.getStatusLabel(colis.statut)}<br/>
            <small>${colis.dateEstimation}</small>
          </div>
        `);

        this.markers.push(marker);
      }

      // Ajouter les marqueurs pour les coursiers (si en livraison ou en cours)
      if ((colis.statut === 'en_livraison' || colis.statut === 'en_cours') && colis.courierLat) {
        const courierMarker = L.icon({
          iconUrl: 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 24 24%22 fill=%22%234f46e5%22%3E%3Cpath d=%22M12 2C8 2 5 5 5 9c0 5 7 13 7 13s7-8 7-13c0-4-3-7-7-7z%22%3E%3C/path%3E%3C/svg%3E',
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32]
        });

        const courierMarkerObject = L.marker([colis.courierLat, colis.courierLng], {
          icon: courierMarker
        }).addTo(this.map);

        courierMarkerObject.bindPopup(`
          <div style="padding: 8px;">
            <strong>📍 Coursier en livraison</strong><br/>
            Colis: ${colis.id}<br/>
            Destination prochaine: ${colis.dateEstimation}
          </div>
        `);

        this.markers.push(courierMarkerObject);
      }
    });
  }

  getMarkerColor(statut: string): string {
    switch(statut) {
      case 'en_livraison': return '#4f46e5'; /* Indigo 600 */
      case 'en_cours': return '#9333ea';     /* Purple 600 */
      case 'en_attente': return '#d97706';   /* Amber 600 */
      case 'livré': return '#16a34a';        /* Green 600 */
      default: return '#94a3b8';             /* Slate 400 */
    }
  }

  getStatusLabel(statut: string): string {
    const labels: { [key: string]: string } = {
      'en_livraison': '🚚 En livraison',
      'en_cours': '📦 En cours',
      'en_attente': '⏳ En attente',
      'livré': '✅ Livré'
    };
    return labels[statut] || statut;
  }

  changerMenu(menu: string): void {
    this.activeMenu = menu;
    if (menu === 'compte') {
      // Initialize edit fields
      this.editNom = this.user.nom || '';
      this.editPrenom = this.user.prenom || '';
      this.editEmail = this.user.email;
      this.editPhone = this.user.phone;
      this.editAdresse = this.user.adresse || '';
      this.isEditing = false;
    }
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (!this.isEditing) {
      // Reset to original values if canceling
      this.editNom = this.user.nom || '';
      this.editPrenom = this.user.prenom || '';
      this.editEmail = this.user.email;
      this.editPhone = this.user.phone;
      this.editAdresse = this.user.adresse || '';
    }
  }

  saveAccount(): void {
    if (!this.editNom.trim()) {
      alert('Le nom ne peut pas être vide');
      return;
    }

    // 📤 Envoyer les modifications au backend
    const updateData = {
      nom: this.editNom.trim(),
      prenom: this.editPrenom.trim(),
      email: this.editEmail.trim(),
      phone: this.editPhone.trim(),
      adresse: this.editAdresse.trim()
    };

    this.http.put(`${this.apiUrl}/profil/${this.user.id}`, updateData).subscribe({
      next: (res: any) => {
        // ✅ Mettre à jour les données locales
        this.user.nom = this.editNom.trim();
        this.user.prenom = this.editPrenom.trim();
        this.user.name = `${this.user.prenom} ${this.user.nom}`.trim();
        this.user.email = this.editEmail.trim();
        this.user.phone = this.editPhone.trim();
        this.user.adresse = this.editAdresse.trim();
        
        // Sauvegarder dans le localStorage
        localStorage.setItem('userName', this.user.name);
        localStorage.setItem('user', JSON.stringify(this.user));
        
        this.isEditing = false;
        alert('✅ Informations mises à jour avec succès !');
      },
      error: (err) => {
        console.error('❌ Erreur lors de la mise à jour:', err);
        alert('❌ Erreur : ' + (err.error?.detail || err.message || 'Veuillez réessayer.'));
      }
    });
  }


  deconnexion(): void {
    localStorage.removeItem('user');
    localStorage.removeItem('userName');
    this.router.navigate(['/login']);
  }

  reprogrammer(colis: any): void {
    this.selectedColis = colis;
    this.newDateReprogrammation = '';
    this.showReprogrammerModal = true;
  }

  confirmReprogrammation(): void {
    if (!this.newDateReprogrammation) {
      alert('Veuillez sélectionner une date');
      return;
    }
    
    // 📤 Envoyer la modification au backend
    const updateData = {
      date_estimation: this.newDateReprogrammation
    };

    this.http.put(`${this.apiUrl}/colis/${this.selectedColis.id}`, updateData).subscribe({
      next: (response) => {
        console.log('✅ Colis reprogrammé :', response);
        alert(`✅ Colis ${this.selectedColis.id} reprogrammé pour le ${this.newDateReprogrammation}`);
        this.chargerColis(); // Recharger les colis
        this.closeModal();
      },
      error: (error) => {
        console.error('❌ Erreur lors de la reprogrammation :', error);
        alert('❌ Erreur : ' + (error.error?.detail || 'Impossible de reprogrammer le colis'));
      }
    });
  }

  closeModal(): void {
    this.showReprogrammerModal = false;
    this.selectedColis = null;
  }

  suivreSurCarte(colis: any): void {
    if (colis.courierLat && colis.courierLng) {
      // Centrer la carte sur le coursier
      this.map.setView([colis.courierLat, colis.courierLng], 15);
    }
  }
}
