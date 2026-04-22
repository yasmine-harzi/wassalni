import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

const API = 'http://127.0.0.1:8000';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  constructor(private http: HttpClient) {}

  getNotifications(id_user: number): Observable<any[]> {
    return this.http.get<any[]>(`${API}/api/notifications/${id_user}`);
  }

  marquerLu(id_notification: number): Observable<any> {
    return this.http.patch(`${API}/api/notifications/${id_notification}/lire`, {});
  }

  marquerTousLus(id_user: number): Observable<any> {
    return this.http.patch(`${API}/api/notifications/${id_user}/tout-lire`, {});
  }
}
