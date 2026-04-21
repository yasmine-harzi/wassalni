import { ComponentFixture, TestBed } from '@angular/core/testing';

import { HeroPackage } from './hero-package';

describe('HeroPackage', () => {
  let component: HeroPackage;
  let fixture: ComponentFixture<HeroPackage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeroPackage]
    })
    .compileComponents();

    fixture = TestBed.createComponent(HeroPackage);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
