import { Component } from '@angular/core';
import { CommonModule } from '@angular/common'; 
import { RouterModule } from '@angular/router';

@Component({
  selector: 'app-hero-package',
  imports: [CommonModule, RouterModule],
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
  scrollToRoles() {
    // We look for the component tag directly in the DOM
    const element = document.querySelector('app-role-selector');
    
    if (element) {
      element.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'start' 
      });
    }
  }
  
}
