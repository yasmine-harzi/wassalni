import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DashboardVendeurComponent } from './dashboard-vendeur';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { VendeurService } from '../../../services/vendeur';
import { of, throwError } from 'rxjs';

describe('DashboardVendeurComponent', () => {
  let component: DashboardVendeurComponent;
  let fixture: ComponentFixture<DashboardVendeurComponent>;
  let vendeurServiceSpy: jasmine.SpyObj<VendeurService>;

  const mockColis = [
    { id: 1,  description: 'Téléphone',  poids: 0.5, statut: 'attente',      nomClient: 'Ali Ben Salah' },
    { id: 2,  description: 'Ordinateur', poids: 2.0, statut: 'en_transit',   nomClient: 'Sana Trabelsi' },
    { id: 3,  description: 'Tablette',   poids: 1.0, statut: 'en_livraison', nomClient: 'Ali Ben Salah' },
    { id: 4,  description: 'Écran',      poids: 3.5, statut: 'livre',        nomClient: 'Rim Hamdi' },
    { id: 5,  description: 'Clavier',    poids: 0.8, statut: 'livre',        nomClient: 'Sana Trabelsi' },
    { id: 12, description: 'Souris',     poids: 0.3, statut: 'attente',      nomClient: 'Youssef Mrad' },
  ];

  const mockClients = [
    { id: 1, nom: 'Ali Ben Salah',  email: 'ali@mail.com',  telephone: '+216 20 111 111', adresse: 'Tunis' },
    { id: 2, nom: 'Sana Trabelsi',  email: 'sana@mail.com', telephone: '+216 20 222 222', adresse: 'Sfax' },
    { id: 3, nom: 'Rim Hamdi',      email: 'rim@mail.com',  telephone: '+216 20 333 333', adresse: 'Sousse' },
  ];

  beforeEach(async () => {
    const spy = jasmine.createSpyObj('VendeurService', [
      'getMesColis', 'ajouterColis', 'getClients', 'ajouterClient'
    ]);
    spy.getMesColis.and.returnValue(of(mockColis));
    spy.ajouterColis.and.returnValue(of({}));
    spy.getClients.and.returnValue(of(mockClients));
    spy.ajouterClient.and.returnValue(of({}));

    await TestBed.configureTestingModule({
      imports: [DashboardVendeurComponent],
      providers: [
        { provide: VendeurService, useValue: spy },
        provideHttpClient(),
        provideHttpClientTesting()
      ]
    }).compileComponents();

    vendeurServiceSpy = TestBed.inject(VendeurService) as jasmine.SpyObj<VendeurService>;
    fixture = TestBed.createComponent(DashboardVendeurComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  // ─────────────────────────────────────────────
  // 1. CRÉATION DU COMPOSANT
  // ─────────────────────────────────────────────
  describe('Initialisation', () => {
    it('devrait créer le composant', () => {
      expect(component).toBeTruthy();
    });

    it('devrait avoir "dashboard" comme menu actif par défaut', () => {
      expect(component.activeMenu).toBe('dashboard');
    });

    it('devrait initialiser showModal à false', () => {
      expect(component.showModal).toBeFalse();
    });

    it('devrait initialiser showClientModal à false', () => {
      expect(component.showClientModal).toBeFalse();
    });

    it('devrait initialiser searchQuery à chaîne vide', () => {
      expect(component.searchQuery).toBe('');
    });

    it('devrait initialiser newColis avec id_client null', () => {
      expect(component.newColis.description).toBe('');
      expect(component.newColis.poids).toBe(0);
      expect(component.newColis.id_client).toBeNull();
    });

    it('devrait initialiser newClient avec des champs vides', () => {
      expect(component.newClient.nom).toBe('');
      expect(component.newClient.email).toBe('');
      expect(component.newClient.telephone).toBe('');
      expect(component.newClient.adresse).toBe('');
    });

    it('devrait charger les clients au démarrage', () => {
      expect(vendeurServiceSpy.getClients).toHaveBeenCalled();
      expect(component.clients.length).toBe(3);
    });

    it('devrait synchroniser colisFiltres avec colis après chargement', () => {
      expect(component.colisFiltres.length).toBe(component.colis.length);
    });
  });

  // ─────────────────────────────────────────────
  // 2. NAVIGATION
  // ─────────────────────────────────────────────
  describe('setMenu()', () => {
    ['colis', 'historique', 'parametres', 'support', 'dashboard'].forEach(menu => {
      it(`devrait naviguer vers "${menu}"`, () => {
        component.setMenu(menu);
        expect(component.activeMenu).toBe(menu);
      });
    });
  });

  // ─────────────────────────────────────────────
  // 3. CHARGEMENT DES COLIS
  // ─────────────────────────────────────────────
  describe('chargerColis()', () => {
    it('devrait appeler getMesColis avec id_vendeur = 1', () => {
      expect(vendeurServiceSpy.getMesColis).toHaveBeenCalledWith(1);
    });

    it('devrait remplir colis et colisFiltres', () => {
      expect(component.colis.length).toBe(6);
      expect(component.colisFiltres.length).toBe(6);
    });

    it('devrait calculer les stats après chargement', () => {
      expect(component.stats.attente).toBe(2);
      expect(component.stats.en_transit).toBe(1);
      expect(component.stats.en_livraison).toBe(1);
      expect(component.stats.livre).toBe(2);
    });

    it('devrait logger l\'erreur si l\'API échoue', () => {
      vendeurServiceSpy.getMesColis.and.returnValue(throwError(() => new Error('API Error')));
      spyOn(console, 'error');
      component.chargerColis();
      expect(console.error).toHaveBeenCalledWith('Erreur API colis:', jasmine.any(Error));
    });
  });

  // ─────────────────────────────────────────────
  // 4. CALCUL DES STATS
  // ─────────────────────────────────────────────
  describe('calculerStats()', () => {
    it('devrait retourner 0 pour tous les statuts si colis est vide', () => {
      component.colis = [];
      component.calculerStats();
      expect(component.stats.attente).toBe(0);
      expect(component.stats.en_transit).toBe(0);
      expect(component.stats.en_livraison).toBe(0);
      expect(component.stats.livre).toBe(0);
    });

    it('ne doit pas compter "livré" avec accent comme "livre"', () => {
      component.colis = [{ id: 99, statut: 'livré' }];
      component.calculerStats();
      expect(component.stats.livre).toBe(0);
    });
  });

  // ─────────────────────────────────────────────
  // 5. RECHERCHE / FILTRE
  // ─────────────────────────────────────────────
  describe('filtrerColis()', () => {
    beforeEach(() => {
      component.colis = mockColis;
      component.colisFiltres = [...mockColis];
    });

    it('devrait retourner tous les colis si la recherche est vide', () => {
      component.searchQuery = '';
      component.filtrerColis();
      expect(component.colisFiltres.length).toBe(6);
    });

    it('devrait filtrer par ID (correspondance partielle)', () => {
      component.searchQuery = '12';
      component.filtrerColis();
      expect(component.colisFiltres.length).toBe(1);
      expect(component.colisFiltres[0].id).toBe(12);
    });

    it('devrait filtrer par nom de client (insensible à la casse)', () => {
      component.searchQuery = 'ali';
      component.filtrerColis();
      expect(component.colisFiltres.length).toBe(2);
      component.colisFiltres.forEach(c => {
        expect(c.nomClient.toLowerCase()).toContain('ali');
      });
    });

    it('devrait filtrer par nom de client partiel', () => {
      component.searchQuery = 'sana';
      component.filtrerColis();
      expect(component.colisFiltres.length).toBe(2);
    });

    it('devrait retourner tableau vide si aucun résultat', () => {
      component.searchQuery = 'zzz_inexistant';
      component.filtrerColis();
      expect(component.colisFiltres.length).toBe(0);
    });

    it('devrait ignorer les espaces en début/fin de recherche', () => {
      component.searchQuery = '  sana  ';
      component.filtrerColis();
      expect(component.colisFiltres.length).toBe(2);
    });
  });

  describe('clearSearch()', () => {
    it('devrait réinitialiser searchQuery à vide', () => {
      component.searchQuery = 'ali';
      component.clearSearch();
      expect(component.searchQuery).toBe('');
    });

    it('devrait restaurer tous les colis après clearSearch', () => {
      component.colis = mockColis;
      component.searchQuery = 'ali';
      component.filtrerColis();
      component.clearSearch();
      expect(component.colisFiltres.length).toBe(6);
    });
  });

  // ─────────────────────────────────────────────
  // 6. MODAL NOUVEAU COLIS
  // ─────────────────────────────────────────────
  describe('openAddColisModal()', () => {
    it('devrait mettre showModal à true', () => {
      component.showModal = false;
      component.openAddColisModal();
      expect(component.showModal).toBeTrue();
    });
  });

  describe('ajouterColis()', () => {
    beforeEach(() => {
      component.newColis = { description: 'Montre', poids: 0.3, id_vendeur: 1, id_client: 2 };
      component.showModal = true;
    });

    it('devrait appeler ajouterColis du service avec le bon objet', () => {
      component.ajouterColis();
      expect(vendeurServiceSpy.ajouterColis).toHaveBeenCalledWith({
        description: 'Montre', poids: 0.3, id_vendeur: 1, id_client: 2
      });
    });

    it('devrait fermer le modal après ajout', () => {
      component.ajouterColis();
      expect(component.showModal).toBeFalse();
    });

    it('devrait réinitialiser newColis avec id_client null', () => {
      component.ajouterColis();
      expect(component.newColis.description).toBe('');
      expect(component.newColis.poids).toBe(0);
      expect(component.newColis.id_client).toBeNull();
    });

    it('devrait recharger les colis après ajout', () => {
      vendeurServiceSpy.getMesColis.calls.reset();
      component.ajouterColis();
      expect(vendeurServiceSpy.getMesColis).toHaveBeenCalledWith(1);
    });
  });

  // ─────────────────────────────────────────────
  // 7. MODAL AJOUTER CLIENT
  // ─────────────────────────────────────────────
  describe('openAddClientModal()', () => {
    it('devrait mettre showClientModal à true', () => {
      component.showClientModal = false;
      component.openAddClientModal();
      expect(component.showClientModal).toBeTrue();
    });
  });

  describe('ajouterClient()', () => {
    beforeEach(() => {
      component.newClient = { nom: 'Test Client', email: 'test@mail.com', telephone: '+216 20 000 000', adresse: 'Tunis' };
      component.showClientModal = true;
    });

    it('devrait appeler ajouterClient du service avec le bon objet', () => {
      component.ajouterClient();
      expect(vendeurServiceSpy.ajouterClient).toHaveBeenCalledWith({
        nom: 'Test Client', email: 'test@mail.com', telephone: '+216 20 000 000', adresse: 'Tunis'
      });
    });

    it('devrait fermer le modal client après ajout', () => {
      component.ajouterClient();
      expect(component.showClientModal).toBeFalse();
    });

    it('devrait réinitialiser newClient après ajout', () => {
      component.ajouterClient();
      expect(component.newClient.nom).toBe('');
      expect(component.newClient.email).toBe('');
      expect(component.newClient.telephone).toBe('');
      expect(component.newClient.adresse).toBe('');
    });

    it('devrait recharger la liste des clients après ajout', () => {
      vendeurServiceSpy.getClients.calls.reset();
      component.ajouterClient();
      expect(vendeurServiceSpy.getClients).toHaveBeenCalled();
    });

    it('devrait logger l\'erreur si l\'API échoue', () => {
      vendeurServiceSpy.ajouterClient.and.returnValue(throwError(() => new Error('Erreur')));
      spyOn(console, 'error');
      component.ajouterClient();
      expect(console.error).toHaveBeenCalledWith('Erreur ajout client:', jasmine.any(Error));
    });
  });

  describe('chargerClients()', () => {
    it('devrait remplir le tableau clients', () => {
      expect(component.clients.length).toBe(3);
    });

    it('devrait logger l\'erreur si l\'API clients échoue', () => {
      vendeurServiceSpy.getClients.and.returnValue(throwError(() => new Error('Erreur clients')));
      spyOn(console, 'error');
      component.chargerClients();
      expect(console.error).toHaveBeenCalledWith('Erreur API clients:', jasmine.any(Error));
    });
  });

  // ─────────────────────────────────────────────
  // 8. PARAMÈTRES
  // ─────────────────────────────────────────────
  describe('enregistrerModifications()', () => {
    it('devrait logguer les modifications sans erreur', () => {
      spyOn(console, 'log');
      component.enregistrerModifications();
      expect(console.log).toHaveBeenCalledWith('Modifications enregistrées', component.profil);
    });
  });

  describe('supprimerCompte()', () => {
    it('devrait appeler confirm avant de supprimer', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      component.supprimerCompte();
      expect(window.confirm).toHaveBeenCalled();
    });

    it('devrait logguer "Compte supprimé" si confirmation acceptée', () => {
      spyOn(window, 'confirm').and.returnValue(true);
      spyOn(console, 'log');
      component.supprimerCompte();
      expect(console.log).toHaveBeenCalledWith('Compte supprimé');
    });

    it('ne devrait pas logguer si confirmation refusée', () => {
      spyOn(window, 'confirm').and.returnValue(false);
      spyOn(console, 'log');
      component.supprimerCompte();
      expect(console.log).not.toHaveBeenCalled();
    });
  });

  // ─────────────────────────────────────────────
  // 9. HISTORIQUE
  // ─────────────────────────────────────────────
  describe('historiqueColis', () => {
    it('devrait avoir 3 entrées', () => {
      expect(component.historiqueColis.length).toBe(3);
    });

    it('devrait contenir une entrée avec statut "annule"', () => {
      expect(component.historiqueColis.filter(h => h.statut === 'annule').length).toBe(1);
    });

    it('chaque entrée doit avoir les champs requis', () => {
      component.historiqueColis.forEach(h => {
        expect(h.id).toBeDefined();
        expect(h.description).toBeDefined();
        expect(h.poids).toBeDefined();
        expect(h.date).toBeDefined();
        expect(h.statut).toBeDefined();
      });
    });
  });
});