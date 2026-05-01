import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { Livraison } from '../models/models';

@Injectable({
  providedIn: 'root'
})
export class LivraisonService {
  private apiUrl = 'http://127.0.0.1:8000/api';

  constructor(private http: HttpClient) {}

  getMesLivraisons(): Observable<Livraison[]> {
    // return this.http.get<Livraison[]>(`${this.apiUrl}/livraisons/mes-livraisons`);
    return of([
      { id: 1, adresse_depart: 'A', adresse_arrivee: 'B', statut: 'ramassé' }
    ]);
  }

  getDisponibles(): Observable<Livraison[]> {
    // return this.http.get<Livraison[]>(`${this.apiUrl}/livraisons/disponibles`);
    return of([
      { id: 2, adresse_depart: 'C', adresse_arrivee: 'D', statut: 'attente' }
    ]);
  }

  acceptLivraison(id: number): Observable<any> {
    return of({ success: true });
  }

  accepter(id: string | number | undefined): Observable<any> {
    if (id === undefined) return of({ success: false });
    return of({ success: true });
  }

  getSuivi(id: number): Observable<Livraison> {
    // return this.http.get<Livraison>(`${this.apiUrl}/livraisons/${id}/suivi`);
    return of({
      id,
      adresse_depart: 'A',
      adresse_arrivee: 'B',
      statut: 'en_route',
      adresse_pickup: 'A',
      adresse_depot: 'B',
      lon_pickup: 10.18,
      lat_pickup: 36.8,
      lon_depot: 10.19,
      lat_depot: 36.81
    });
  }

  updateStatut(id: number, statut: string): Observable<Livraison> {
    // return this.http.post<Livraison>(`${this.apiUrl}/livraisons/${id}/statut`, { statut });
    return of({
      id,
      adresse_depart: 'A',
      adresse_arrivee: 'B',
      statut: statut as any
    });
  }
}
