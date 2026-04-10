import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardLivreur } from './dashboard-livreur';

describe('DashboardLivreur', () => {
  let component: DashboardLivreur;
  let fixture: ComponentFixture<DashboardLivreur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardLivreur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardLivreur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
