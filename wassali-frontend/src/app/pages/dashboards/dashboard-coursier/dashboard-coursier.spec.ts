import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DashboardCoursier } from './dashboard-coursier';

describe('DashboardCoursier', () => {
  let component: DashboardCoursier;
  let fixture: ComponentFixture<DashboardCoursier>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardCoursier]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DashboardCoursier);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

