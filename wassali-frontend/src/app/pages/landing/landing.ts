import { Component } from '@angular/core';
import { HeroPackageComponent } from '../../components/hero-package/hero-package';
import { ScrollPackageStoryComponent } from '../../components/scroll-package-story/scroll-package-story';
import { RoleSelectorComponent } from '../../components/role-selector/role-selector';
import { TeamCarouselComponent } from '../../components/team-carousel/team-carousel';
import { Router,  RouterLink  } from '@angular/router';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroPackageComponent,
    ScrollPackageStoryComponent,
    RoleSelectorComponent,
    TeamCarouselComponent,
    RouterLink
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingComponent {
  scrollToSection(sectionId: string) {
  const element = document.getElementById(sectionId);
  if (element) {
    element.scrollIntoView({ 
      behavior: 'smooth', 
      block: 'start',
      inline: 'nearest' 
    });
  }
}
}
