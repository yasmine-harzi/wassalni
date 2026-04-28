import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  // L'adresse de ton serveur Python (celui que tu viens d'installer)
  private apiUrl = 'http://127.0.0.1:8000/api'; 

  constructor(private http: HttpClient) { }

  // La fonction pour envoyer les données du nouveau client
  registerClient(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-client`, userData);
  }
  // 2. Inscription Vendeur
  registerVendeur(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-vendeur`, userData);
  }

  // 3. Inscription Coursier / Livreur
  RegisterLivreur(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-livreur`, userData);
  }

  // 4. Connexion (Login commun à tous)
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }
}