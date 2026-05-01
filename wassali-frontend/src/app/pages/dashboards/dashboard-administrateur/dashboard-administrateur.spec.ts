import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardAdministrateur } from './dashboard-administrateur';

describe('DashboardAdministrateur', () => {
  let component: DashboardAdministrateur;
  let fixture: ComponentFixture<DashboardAdministrateur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardAdministrateur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardAdministrateur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
