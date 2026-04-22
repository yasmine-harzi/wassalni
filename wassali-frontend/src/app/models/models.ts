export interface User {
  nom?: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  is_active?: boolean;
  date_creation?: Date;
}

export interface CoursierProfile {
  id?: number;
  user?: User;
  nom: string;
  prenom: string;
  email: string;
  telephone: string;
  vehicule?: string;
  vehicule_type: string;
  disponibilite: boolean;
  photo?: string;
  rating?: number;
  vehicule_immatriculation?: string;
  latitude_actuelle?: number;
  longitude_actuelle?: number;
}

export interface CoursierStats {
  livraisons_jour: number;
  gains_jour: number;
  taux_acceptation: number;
  taux_succes?: number;
  distance_parcourue?: number;
  temps_moyen_minutes?: number;
}

export type StatutLivraison = 'attente' | 'ramassé' | 'en_route' | 'livré' | 'annulé';

export interface Livraison {
  id: number;
  id_livraison?: string | number;
  client_nom?: string;
  client_tel?: string;
  vendeur_nom?: string;
  adresse_depart: string;
  adresse_arrivee: string;
  adresse_pickup?: string;
  adresse_depot?: string;
  statut: StatutLivraison;
  prix?: number;
  distance?: string;
  temps_estime?: string;
  date_creation?: Date;
  date_livraison?: Date;
  notes?: string;
  lon_pickup?: number;
  lat_pickup?: number;
  lon_depot?: number;
  lat_depot?: number;
}
