import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 

@Component({
  selector: 'app-hero-package',
  imports: [CommonModule],
  templateUrl: './hero-package.html',
  styleUrl: './hero-package.css',
})
export class HeroPackageComponent {

  opened = false;
  particles = Array(12);

  openPackage() {
    this.opened = true;

    setTimeout(() => {
      this.opened = false;
    }, 1200);
  }
}
