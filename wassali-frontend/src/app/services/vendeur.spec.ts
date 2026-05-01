import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VendeurService } from './vendeur';

describe('VendeurService', () => {
  let service: VendeurService;
  let httpMock: HttpTestingController;

  const API = 'http://127.0.0.1:8000/api';

  // ── Données mock ───────────────────────────────────────
  const mockColis = [
    { id: 1, description: 'Téléphone',  poids: 0.5, statut: 'attente',    id_vendeur: 1, id_client: 2 },
    { id: 2, description: 'Ordinateur', poids: 2.0, statut: 'en_transit', id_vendeur: 1, id_client: 3 },
  ];

  const mockClients = [
    { id: 1, nom: 'Ali Ben Salah', email: 'ali@mail.com',  telephone: '+216 20 111 111', adresse: 'Tunis' },
    { id: 2, nom: 'Sana Trabelsi', email: 'sana@mail.com', telephone: '+216 20 222 222', adresse: 'Sfax'  },
    { id: 3, nom: 'Rim Hamdi',     email: 'rim@mail.com',  telephone: '+216 20 333 333', adresse: 'Sousse' },
  ];

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VendeurService]
    });
    service  = TestBed.inject(VendeurService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    // Vérifie qu'aucune requête HTTP non attendue n'est en suspens
    httpMock.verify();
  });

  // ─────────────────────────────────────────────
  // 1. CRÉATION DU SERVICE
  // ─────────────────────────────────────────────
  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  // ─────────────────────────────────────────────
  // 2. getMesColis()
  // ─────────────────────────────────────────────
  describe('getMesColis()', () => {
    it('devrait envoyer une requête GET vers /vendeur/:id/colis', () => {
      service.getMesColis(1).subscribe();

      const req = httpMock.expectOne(`${API}/vendeur/1/colis`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('devrait retourner la liste des colis du vendeur', () => {
      service.getMesColis(1).subscribe(data => {
        expect(data.length).toBe(2);
        expect(data[0].description).toBe('Téléphone');
        expect(data[1].statut).toBe('en_transit');
      });

      const req = httpMock.expectOne(`${API}/vendeur/1/colis`);
      req.flush(mockColis);
    });

    it('devrait utiliser le bon id vendeur dans l\'URL', () => {
      service.getMesColis(42).subscribe();

      const req = httpMock.expectOne(`${API}/vendeur/42/colis`);
      expect(req.request.url).toContain('/vendeur/42/colis');
      req.flush([]);
    });

    it('devrait retourner un tableau vide si aucun colis', () => {
      service.getMesColis(1).subscribe(data => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${API}/vendeur/1/colis`);
      req.flush([]);
    });

    it('devrait propager l\'erreur HTTP 404', () => {
      service.getMesColis(999).subscribe({
        next: () => fail('Devait échouer'),
        error: (err) => expect(err.status).toBe(404)
      });

      const req = httpMock.expectOne(`${API}/vendeur/999/colis`);
      req.flush('Not found', { status: 404, statusText: 'Not Found' });
    });
  });

  // ─────────────────────────────────────────────
  // 3. ajouterColis()
  // ─────────────────────────────────────────────
  describe('ajouterColis()', () => {
    const newColisPayload = { description: 'Clavier', poids: 1.2, id_vendeur: 1, id_client: 2 };
    const colisResponse   = { id: 10, ...newColisPayload, statut: 'attente' };

    it('devrait envoyer une requête POST vers /colis/ajouter', () => {
      service.ajouterColis(newColisPayload).subscribe();

      const req = httpMock.expectOne(`${API}/colis/ajouter`);
      expect(req.request.method).toBe('POST');
      req.flush(colisResponse);
    });

    it('devrait envoyer le bon body dans la requête', () => {
      service.ajouterColis(newColisPayload).subscribe();

      const req = httpMock.expectOne(`${API}/colis/ajouter`);
      expect(req.request.body).toEqual(newColisPayload);
      req.flush(colisResponse);
    });

    it('devrait retourner le colis créé avec son id', () => {
      service.ajouterColis(newColisPayload).subscribe(data => {
        expect(data.id).toBe(10);
        expect(data.statut).toBe('attente');
      });

      const req = httpMock.expectOne(`${API}/colis/ajouter`);
      req.flush(colisResponse);
    });

    it('devrait inclure id_client dans le body', () => {
      service.ajouterColis(newColisPayload).subscribe();

      const req = httpMock.expectOne(`${API}/colis/ajouter`);
      expect(req.request.body.id_client).toBe(2);
      req.flush(colisResponse);
    });

    it('devrait propager l\'erreur HTTP 400', () => {
      service.ajouterColis({}).subscribe({
        next: () => fail('Devait échouer'),
        error: (err) => expect(err.status).toBe(400)
      });

      const req = httpMock.expectOne(`${API}/colis/ajouter`);
      req.flush('Bad request', { status: 400, statusText: 'Bad Request' });
    });
  });

  // ─────────────────────────────────────────────
  // 4. getClients()
  // ─────────────────────────────────────────────
  describe('getClients()', () => {
    it('devrait envoyer une requête GET vers /clients', () => {
      service.getClients().subscribe();

      const req = httpMock.expectOne(`${API}/clients`);
      expect(req.request.method).toBe('GET');
      req.flush([]);
    });

    it('devrait retourner la liste complète des clients', () => {
      service.getClients().subscribe(data => {
        expect(data.length).toBe(3);
        expect(data[0].nom).toBe('Ali Ben Salah');
        expect(data[2].adresse).toBe('Sousse');
      });

      const req = httpMock.expectOne(`${API}/clients`);
      req.flush(mockClients);
    });

    it('devrait retourner un tableau vide si aucun client', () => {
      service.getClients().subscribe(data => {
        expect(data).toEqual([]);
      });

      const req = httpMock.expectOne(`${API}/clients`);
      req.flush([]);
    });

    it('devrait propager l\'erreur HTTP 500', () => {
      service.getClients().subscribe({
        next: () => fail('Devait échouer'),
        error: (err) => expect(err.status).toBe(500)
      });

      const req = httpMock.expectOne(`${API}/clients`);
      req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
    });
  });

  // ─────────────────────────────────────────────
  // 5. ajouterClient()
  // ─────────────────────────────────────────────
  describe('ajouterClient()', () => {
    const newClientPayload = { nom: 'Youssef Mrad', email: 'youssef@mail.com', telephone: '+216 20 444 444', adresse: 'Bizerte' };
    const clientResponse   = { id: 4, ...newClientPayload };

    it('devrait envoyer une requête POST vers /clients/ajouter', () => {
      service.ajouterClient(newClientPayload).subscribe();

      const req = httpMock.expectOne(`${API}/clients/ajouter`);
      expect(req.request.method).toBe('POST');
      req.flush(clientResponse);
    });

    it('devrait envoyer le bon body dans la requête', () => {
      service.ajouterClient(newClientPayload).subscribe();

      const req = httpMock.expectOne(`${API}/clients/ajouter`);
      expect(req.request.body).toEqual(newClientPayload);
      req.flush(clientResponse);
    });

    it('devrait retourner le client créé avec son id', () => {
      service.ajouterClient(newClientPayload).subscribe(data => {
        expect(data.id).toBe(4);
        expect(data.nom).toBe('Youssef Mrad');
      });

      const req = httpMock.expectOne(`${API}/clients/ajouter`);
      req.flush(clientResponse);
    });

    it('devrait inclure tous les champs dans le body', () => {
      service.ajouterClient(newClientPayload).subscribe();

      const req = httpMock.expectOne(`${API}/clients/ajouter`);
      expect(req.request.body.nom).toBe('Youssef Mrad');
      expect(req.request.body.email).toBe('youssef@mail.com');
      expect(req.request.body.telephone).toBeDefined();
      expect(req.request.body.adresse).toBeDefined();
      req.flush(clientResponse);
    });

    it('devrait propager l\'erreur HTTP 422 (données invalides)', () => {
      service.ajouterClient({}).subscribe({
        next: () => fail('Devait échouer'),
        error: (err) => expect(err.status).toBe(422)
      });

      const req = httpMock.expectOne(`${API}/clients/ajouter`);
      req.flush('Unprocessable', { status: 422, statusText: 'Unprocessable Entity' });
    });
  });
});