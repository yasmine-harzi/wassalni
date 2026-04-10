import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardClient } from './dashboard-client';

describe('DashboardClient', () => {
  let component: DashboardClient;
  let fixture: ComponentFixture<DashboardClient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardClient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardClient);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
