import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://127.0.0.1:8000';

@Injectable({ providedIn: 'root' })
export class CoursierService {
  constructor(private http: HttpClient) {}

  getProfil(id_coursier: number): Observable<any> {
    return this.http.get<any>(`${API}/api/coursier/${id_coursier}`);
  }

  toggleDisponibilite(id_coursier: number, disponibilite: boolean): Observable<any> {
    return this.http.patch(`${API}/api/coursier/${id_coursier}/disponibilite`, { disponibilite });
  }

  updatePosition(id_coursier: number, lat: number, lon: number): Observable<any> {
    return this.http.patch(`${API}/api/coursier/${id_coursier}/position`, {
      latitude_actuelle: lat,
      longitude_actuelle: lon
    });
  }
}
