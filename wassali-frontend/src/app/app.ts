import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.html', // Il va chercher ton fichier app.html
  styleUrl: './app.css'      // Il va chercher ton fichier app.css
})
export class App implements OnInit {
  data: any[] = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    // Remplace par ton URL Python (ex: http://127.0.0.1:8000/tasks)
    this.http.get<any[]>('http://127.0.0.1:8000/client').subscribe({
      next: (res) => {
        this.data = res;
        console.log("Données reçues !", res);
      },
      error: (err) => console.error("Erreur :", err)
    });
  }
}