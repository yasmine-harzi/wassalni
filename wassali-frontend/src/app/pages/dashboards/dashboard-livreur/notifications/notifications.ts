import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../../services/notification.service';
import { getLoggedId } from '../dashboard-livreur';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notifications.html',
  styleUrl: './notifications.css'
})
export class NotificationsComponent implements OnInit {
  notifs: any[] = [];
  loading = true;
  constructor(private svc: NotificationService) {}
  ngOnInit() { this.load(); }
  load() {
    this.svc.getNotifications(getLoggedId()).subscribe({
      next: (d) => { this.notifs = d; this.loading = false; },
      error: () => { this.loading = false; }
    });
  }
  marquerLu(id: number) {
    this.svc.marquerLu(id).subscribe({
      next: () => { const n = this.notifs.find(x => x.id_notification === id); if (n) n.lu = 1; }
    });
  }
  toutLire() { this.svc.marquerTousLus(getLoggedId()).subscribe({ next: () => this.notifs.forEach(n => n.lu = 1) }); }
  get nonLus() { return this.notifs.filter(n => !n.lu).length; }
}
