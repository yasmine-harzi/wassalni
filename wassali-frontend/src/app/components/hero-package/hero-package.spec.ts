import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroPackageComponent } from './hero-package';

describe('HeroPackage', () => {
  let component: HeroPackageComponent;
  let fixture: ComponentFixture<HeroPackageComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroPackageComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroPackageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
