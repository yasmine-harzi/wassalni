import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class VendeurService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) { }

  // ── Colis ──────────────────────────────────────────────

  // Récupérer les colis d'un vendeur (avec nomClient via JOIN)
  getMesColis(idVendeur: number): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/vendeur/${idVendeur}/colis`);
  }

  // Ajouter un colis
  ajouterColis(colisData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/colis/ajouter`, colisData);
  }

  // Supprimer un colis définitivement
  supprimerColis(idColis: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/colis/${idColis}`);
  }

  // Changer le statut d'un colis (depuis le modal Détails)
  changerStatutColis(idColis: number, statut: string): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/colis/${idColis}/statut`, { statut });
  }

  // Détails complets d'un colis
  getColisDetails(idColis: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/colis/${idColis}`);
  }

  // ── Clients ────────────────────────────────────────────

  // Récupérer tous les clients
  getClients(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/clients`);
  }

  // Ajouter un client
  ajouterClient(clientData: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/clients/ajouter`, clientData);
  }

  // Supprimer un client
  supprimerClient(idClient: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/clients/${idClient}`);
  }

  // ── Profil vendeur ─────────────────────────────────────

  // Récupérer le profil du vendeur
  getProfilVendeur(idVendeur: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/vendeur/${idVendeur}/profil`);
  }

  // Mettre à jour le profil
  updateProfilVendeur(idVendeur: number, data: { nom: string; email: string }): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/vendeur/${idVendeur}/profil`, data);
  }
}