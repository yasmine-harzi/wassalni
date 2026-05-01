import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8000/api'; 

  constructor(private http: HttpClient) { }

  registerClient(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-client`, userData);
  }
  // Vendeur
  registerVendeur(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-vendeur`, userData);
  }

  //Coursier / Livreur
  registerCoursier(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register-coursier`, userData);
  }

  // Login
  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (res.status === 'success') {
          localStorage.setItem('token', 'fake-jwt-token'); 
          localStorage.setItem('user', JSON.stringify(res));
        }
      })
    );
  }

  isLoggedIn(): boolean {
    // Basic check for token or user
    return !!localStorage.getItem('token');
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // redirect to login can be done here or in components
  }

  get currentUser(): any {
    const user = localStorage.getItem('user');
    return user ? JSON.parse(user) : null;
  }
}