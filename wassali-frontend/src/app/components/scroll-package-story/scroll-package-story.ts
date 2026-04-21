import {
  Component,
  AfterViewInit,
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
  styleUrl: './scroll-package-story.css'
})
export class ScrollPackageStoryComponent implements AfterViewInit {

  // ----------------------
  // DATA
  // ----------------------

  IMAGE_SRCS: string[] = [
    "https://assets.codepen.io/573855/demo-raw-01.webp",
    "https://assets.codepen.io/573855/demo-raw-02.webp",
    "https://assets.codepen.io/573855/demo-raw-03.webp",
    "https://assets.codepen.io/573855/demo-raw-04.webp"
  ];

  FACE_NAMES: string[] = [
    "DESCENT",
    "REBELLION",
    "MOO WALK",
    "BAD ART"
  ];

  cube!: HTMLElement;
  faces!: HTMLElement[];
  hud!: HTMLElement;

  stops: Stop[] = [];

  smooth = 0;
  target = 0;

  imageCache: Map<string, Promise<HTMLImageElement>> = new Map();

  // ----------------------
  // INIT (Angular lifecycle)
  // ----------------------

  ngAfterViewInit(): void {
    this.initDOM();
    this.buildStops();
    this.preloadImages();
    this.initFaces();
    this.animate();
  }

  // ----------------------
  // DOM
  // ----------------------

  private initDOM(): void {
    this.cube = document.getElementById("cube") as HTMLElement;
    this.faces = Array.from(document.querySelectorAll(".face")) as HTMLElement[];
    this.hud = document.getElementById("hud_pct") as HTMLElement;
  }

  // ----------------------
  // STOPS
  // ----------------------

  private buildStops(): void {
    const base: Stop[] = [
      { rx: 90, ry: 0 },
      { rx: 0, ry: 0 },
      { rx: 0, ry: -90 },
      { rx: 0, ry: -180 }
    ];

    this.stops = base.slice(0, this.IMAGE_SRCS.length);
  }

  // ----------------------
  // IMAGES
  // ----------------------

  private preloadImage(src: string): Promise<HTMLImageElement> {
    if (this.imageCache.has(src)) {
      return this.imageCache.get(src)!;
    }

    const promise = new Promise<HTMLImageElement>((resolve) => {
      const img = new Image();
      img.src = src;
      img.onload = () => resolve(img);
    });

    this.imageCache.set(src, promise);
    return promise;
  }

  private preloadImages(): void {
    this.IMAGE_SRCS.forEach(src => this.preloadImage(src));
  }

  private async setFaceImage(faceIdx: number, imgIdx: number) {
    const face = this.faces[faceIdx];
    const src = this.IMAGE_SRCS[imgIdx];

    await this.preloadImage(src);

    let img = face.querySelector("img") as HTMLImageElement | null;

    if (!img) {
      img = new Image();
      face.appendChild(img);
    }

    img.src = src;
    img.alt = this.FACE_NAMES[imgIdx];
  }

  private initFaces(): void {
    this.faces.forEach((_, i) => {
      if (this.IMAGE_SRCS[i]) {
        this.setFaceImage(i, i);
      }
    });
  }

  // ----------------------
  // SCROLL (Angular way)
  // ----------------------

  @HostListener('window:scroll')
  onScroll(): void {
    const maxScroll =
      document.documentElement.scrollHeight - window.innerHeight;

    this.target = this.clamp(window.scrollY / maxScroll, 0, 1);
  }

  private clamp(v: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, v));
  }

  // ----------------------
  // ANIMATION
  // ----------------------

  private easeInOut(t: number): number {
    return t < 0.5
      ? 2 * t * t
      : -1 + (4 - 2 * t) * t;
  }

  private updateHUD(s: number): void {
    if (!this.hud) return;
    const percent = Math.round(s * 100);
    this.hud.textContent = `${percent}%`;
  }

  private setCubeTransform(s: number): void {
    const n = this.stops.length;
    if (n < 2) return;

    const t = s * (n - 1);
    const i = Math.min(Math.floor(t), n - 2);
    const f = this.easeInOut(t - i);

    const a = this.stops[i];
    const b = this.stops[i + 1];

    const rx = a.rx + (b.rx - a.rx) * f;
    const ry = a.ry + (b.ry - a.ry) * f;

    this.cube.style.transform = `rotateX(${rx}deg) rotateY(${ry}deg)`;
  }

  private animate = (): void => {
    requestAnimationFrame(this.animate);

    this.smooth += (this.target - this.smooth) * 0.1;

    this.updateHUD(this.smooth);
    this.setCubeTransform(this.smooth);
  };
}