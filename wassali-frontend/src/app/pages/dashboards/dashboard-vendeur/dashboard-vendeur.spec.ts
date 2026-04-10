import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardVendeur } from './dashboard-vendeur';

describe('DashboardVendeur', () => {
  let component: DashboardVendeur;
  let fixture: ComponentFixture<DashboardVendeur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardVendeur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardVendeur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
