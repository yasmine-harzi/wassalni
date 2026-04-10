import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterLivreur } from './register-livreur';

describe('RegisterLivreur', () => {
  let component: RegisterLivreur;
  let fixture: ComponentFixture<RegisterLivreur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterLivreur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterLivreur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
