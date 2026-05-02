import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://127.0.0.1:8000';

@Injectable({ providedIn: 'root' })
export class ColisService {
  constructor(private http: HttpClient) {}

  // Colis assignés au coursier (id_coursier=X)
  getMesColis(id_coursier: number): Observable<any[]> {
    return this.http.get<any[]>(`${API}/api/coursier/${id_coursier}/colis`);
  }

  // Colis disponibles (statut='attente', pas encore assignés)
  getColisDisponibles(): Observable<any[]> {
    return this.http.get<any[]>(`${API}/api/colis/disponibles`);
  }

  // Accepter un colis
  accepterColis(id_colis: number, id_coursier: number): Observable<any> {
    return this.http.patch(`${API}/api/colis/${id_colis}/accepter`, { id_coursier });
  }

  // Mettre à jour le statut
  updateStatut(id_colis: number, statut: string): Observable<any> {
    return this.http.patch(`${API}/api/colis/${id_colis}/statut`, { statut });
  }

  // Suivi GPS d'un colis
  getSuivi(id_colis: number): Observable<any[]> {
    return this.http.get<any[]>(`${API}/api/colis/${id_colis}/suivi`);
  }

  // Ajouter une position GPS
  addPosition(id_colis: number, lat: number, lon: number): Observable<any> {
    return this.http.post(`${API}/api/colis/${id_colis}/suivi`, { latitude: lat, longitude: lon });
  }
}
