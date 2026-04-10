import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RegisterVendeur } from './register-vendeur';

describe('RegisterVendeur', () => {
  let component: RegisterVendeur;
  let fixture: ComponentFixture<RegisterVendeur>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RegisterVendeur]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RegisterVendeur);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
