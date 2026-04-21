import { Component } from '@angular/core';
import { HeroPackageComponent } from '../../components/hero-package/hero-package';
import { ScrollPackageStoryComponent } from '../../components/scroll-package-story/scroll-package-story';
import { RoleSelectorComponent } from '../../components/role-selector/role-selector';
import { TeamCarouselComponent } from '../../components/team-carousel/team-carousel';

@Component({
  selector: 'app-landing',
  standalone: true,
  imports: [
    HeroPackageComponent,
    ScrollPackageStoryComponent,
    RoleSelectorComponent,
    TeamCarouselComponent
  ],
  templateUrl: './landing.html',
  styleUrls: ['./landing.css']
})
export class LandingComponent {}
