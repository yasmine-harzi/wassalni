import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AdminService {
  private API_URL = 'http://127.0.0.1:8000/api/admin';

  constructor(private http: HttpClient) {}

  // Exemple : Récupérer tous les comptes
  getAllAccounts() {
    return this.http.get(`${this.API_URL}/accounts`);
  }
}