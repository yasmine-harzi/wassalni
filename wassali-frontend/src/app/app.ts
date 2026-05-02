import { Component, OnInit } from '@angular/core';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    HttpClientModule
  ],
  templateUrl: './app.html',
  styleUrl: './app.css'
})

export class AppComponent implements OnInit {

  clients:any[]=[];
  vendeurs:any[]=[];
  coursiers:any[]=[];

  private apiUrl='http://127.0.0.1:8000';

  constructor(private http:HttpClient){}

  ngOnInit(): void{
    this.getAllData();
  }

  getAllData(){

    this.http.get<any[]>(`${this.apiUrl}/client`)
    .subscribe(data=>this.clients=data);

    this.http.get<any[]>(`${this.apiUrl}/vendeur`)
    .subscribe(data=>this.vendeurs=data);

    this.http.get<any[]>(`${this.apiUrl}/coursier`)
    .subscribe(data=>this.coursiers=data);

  }

}