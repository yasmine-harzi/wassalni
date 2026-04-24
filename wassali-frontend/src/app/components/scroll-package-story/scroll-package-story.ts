import {
  Component,
  ElementRef,
  AfterViewInit,
  OnDestroy,
  Renderer2,
  NgZone,
  HostListener
} from '@angular/core';

type Stop = {
  rx: number;
  ry: number;
};

@Component({
  selector: 'app-scroll-package-story',
  standalone: true,
  imports: [],
  templateUrl: './scroll-package-story.html',
  styleUrl: './scroll-package-story.css',
})
export class ScrollPackageStoryComponent implements AfterViewInit, OnDestroy {
  // ----------------------
  // DATA & CONFIG
  // ----------------------
  private IMAGE_SRCS: string[] = [
    "LeftBox3.png", 
    "upBox3.jpeg",      // Image 0 -> TOP

    "RightBox2.jpeg"   // Image 2 -> RIGHT
  ];

  private FACE_NAMES: string[] = ["TOP", "FRONT", "RIGHT"];

  private cube!: HTMLElement;
  private faces!: HTMLElement[];
  private hud!: HTMLElement;
  private stops: Stop[] = [];
  private smooth = 0;
  private target = 0;
  private animationId: number | null = null;

  constructor(
    private el: ElementRef,
    private renderer: Renderer2,
    private ngZone: NgZone
  ) {}

  ngAfterViewInit(): void {
    this.cube = this.el.nativeElement.querySelector("#cube");
    this.faces = Array.from(this.el.nativeElement.querySelectorAll(".face"));
    this.hud = this.el.nativeElement.querySelector("#hud_pct");

    this.buildStops();
    this.initFaces();
    this.initRevealObserver();

    this.ngZone.runOutsideAngular(() => {
      this.animate();
    });
  }

  ngOnDestroy(): void {
    if (this.animationId) cancelAnimationFrame(this.animationId);
  }

  private buildStops(): void {
    this.stops = [
      { rx: 90, ry: 0 },   // Section 0: TOP Face
      { rx: 0, ry: 0 },    // Section 1: FRONT Face
      { rx: 0, ry: -90 }   // Section 2: RIGHT Face
    ];
  }

  private initFaces(): void {
    const faceAssignment: { [key: string]: number } = {
      "top": 0,
      "front": 1,
      "right": 2
    };

    this.faces.forEach((face) => {
      const type = face.getAttribute('data-face');
      if (type && faceAssignment[type] !== undefined) {
        this.setFaceImage(face, faceAssignment[type]);
      }
    });
  }

  private setFaceImage(face: HTMLElement, imgIdx: number) {
    const src = this.IMAGE_SRCS[imgIdx];
    let img = face.querySelector("img") as HTMLImageElement;

    if (!img) {
      img = this.renderer.createElement('img');
      this.renderer.appendChild(face, img);
    }

    img.src = src;
    img.style.display = 'block';
    img.style.position = 'absolute';
    img.style.inset = '0';
    img.style.zIndex = '5';
  }

  @HostListener('window:scroll', [])
  onScroll(): void {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const raw = scrollHeight > 0 ? window.scrollY / scrollHeight : 0;
    this.target = Math.max(0, Math.min(1, raw));
  }

  private animate = (): void => {
    this.smooth += (this.target - this.smooth) * 0.08;
    if (this.hud) this.hud.textContent = `${Math.round(this.smooth * 100)}%`;
    this.setCubeTransform(this.smooth);
    this.animationId = requestAnimationFrame(this.animate);
  };

  private setCubeTransform(s: number): void {
    if (!this.cube || this.stops.length < 2) return;
    const n = this.stops.length;
    const t = s * (n - 1);
    const i = Math.min(Math.floor(t), n - 2);
    const f = this.easeInOut(t - i);
    const a = this.stops[i];
    const b = this.stops[i+1];
    const rx = a.rx + (b.rx - a.rx) * f;
    const ry = a.ry + (b.ry - a.ry) * f;
    this.renderer.setStyle(this.cube, 'transform', `rotateX(${rx}deg) rotateY(${ry}deg)`);
  }

  private easeInOut(t: number): number {
    return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
  }

  private initRevealObserver() {
    const revealEls = this.el.nativeElement.querySelectorAll(".tag, h1, h2, .body-text, .cta, .cta-back, .h-line");
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          this.renderer.addClass(entry.target, 'visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.1 });
    revealEls.forEach((el: HTMLElement) => observer.observe(el));
  }
}