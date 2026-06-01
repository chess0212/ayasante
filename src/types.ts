export interface CpnVisite {
  id: string;
  date: string;
  trimestre: number;
  poids_maman: number; // kg
  tension: string; // e.g. 11/7
  notes: string;
  est_realise?: boolean; // true if consultation has been performed, false if scheduled / planned
}

export interface Maman {
  id: string; // Resilient local UUID
  matricule: string; // Unique patient registration ID, e.g. AYA-M-1234
  nom: string;
  contact: string;
  village: string;
  region: string; // e.g. "Hambol", "Poro", "Gbêkê", "Cavally"
  date_inscription: string;
  code_pin_hash: string; // Access security
  cpn_visites: CpnVisite[];
  est_enceinte?: boolean; // True if mother is currently pregnant
  date_accouchement_prevue?: string; // Target due date
  status: 'synced' | 'pending_creation' | 'pending_update';
  last_updated: string;
}

export interface Enfant {
  id: string; // Local UUID
  maman_id: string;
  matricule: string; // Unique baby registration ID, e.g. AYA-E-5678
  nom: string;
  genre: 'M' | 'F';
  date_naissance: string;
  poids_naissance: number; // kg
  taille_naissance: number; // cm
  historique_poids: Array<{ date: string; valeur: number }>; // For growth progression curves
  historique_taille: Array<{ date: string; valeur: number }>;
  status: 'synced' | 'pending_creation' | 'pending_update';
  last_updated: string;
}

export interface VaccinEffectue {
  id: string;
  enfant_id: string;
  vaccin_code: string; // e.g. BCG, VPO_0, PENTA_1, ROTA_1, anti-Rougeole
  nom: string;
  description: string;
  age_recommande_mois: number;
  date_prevue: string;
  date_administration: string | null;
  est_fait: boolean;
  lot_number?: string;
  agent_nom_charge?: string;
  status: 'synced' | 'pending_creation' | 'pending_update';
  last_updated: string;
}

export interface Alerte {
  id: string;
  maman_id: string;
  maman_nom: string;
  enfant_id?: string;
  enfant_nom?: string;
  type: 'SMS' | 'VOCAL' | 'PUSH' | 'LOCAL';
  langue: 'dioula' | 'baoule' | 'bete' | 'francais';
  date_prevue: string;
  message_texte: string; // SMS text body
  script_vocal: string; // Local language audio text transcript for the simulator
  statut_envoi: 'planifie' | 'envoye' | 'echec';
  status: 'synced' | 'pending_creation' | 'pending_update';
  last_updated: string;
}

export interface MedecinPediatre {
  id: string;
  nom: string;
  specialite: string;
  telephone: string;
  email?: string;
  ville: string; // Abidjan, Bouaké, Yamoussoukro, Korhogo, Daloa
  adresse: string;
  est_disponible: boolean;
  coordonnees_gps?: { lat: number; lng: number };
}

export interface SyncLog {
  id: string;
  timestamp: string;
  direction: 'push' | 'pull' | 'both';
  records_sent: number;
  records_received: number;
  status: 'success' | 'failure' | 'conflicts';
  details: string;
}

// Vaccine standards catalog in Côte d'Ivoire (PEV - Programme Élargi de Vaccination)
export interface VaccinDefinition {
  code: string;
  nom: string;
  maladie_cible: string;
  age_recommande_mois: number; // 0 = Naissance, 1.5 = 6 semaines, 2.5 = 10 semaines, 3.5 = 14 semaines, 9 = 9 mois, 15 = 15 mois
}

export const PROGRAMME_PEV_CI: VaccinDefinition[] = [
  { code: 'BCG', nom: 'BCG (Tuberculose)', maladie_cible: 'Tuberculose', age_recommande_mois: 0 },
  { code: 'VPO_0', nom: 'VPO 0 (Poliomyélite 0)', maladie_cible: 'Poliomyélite', age_recommande_mois: 0 },
  { code: 'ROTA_1', nom: 'Rotavirus 1 (Diarhées)', maladie_cible: 'Gastro-entérite à Rotavirus', age_recommande_mois: 1.5 },
  { code: 'PENTA_1', nom: 'Penta 1 (Diphtérie/Tétanos/Coqueluche/HebB/Hib)', maladie_cible: 'Diphtérie, Tétanos, Coqueluche, Hépatite B, Méningite', age_recommande_mois: 1.5 },
  { code: 'VPO_1', nom: 'VPO 1 (Polio Oral 1)', maladie_cible: 'Poliomyélite', age_recommande_mois: 1.5 },
  { code: 'ROTA_2', nom: 'Rotavirus 2', maladie_cible: 'Gastro-entérite à Rotavirus', age_recommande_mois: 2.5 },
  { code: 'PENTA_2', nom: 'Penta 2', maladie_cible: 'DTC, HebB, Hib', age_recommande_mois: 2.5 },
  { code: 'VPO_2', nom: 'VPO 2', maladie_cible: 'Poliomyélite', age_recommande_mois: 2.5 },
  { code: 'PENTA_3', nom: 'Penta 3', maladie_cible: 'DTC, HebB, Hib', age_recommande_mois: 3.5 },
  { code: 'VPO_3', nom: 'VPO 3', maladie_cible: 'Poliomyélite', age_recommande_mois: 3.5 },
  { code: 'VAR_1', nom: 'Rougeole & Rubéole (RR 1)', maladie_cible: 'Rougeole, Rubéole', age_recommande_mois: 9 },
  { code: 'VAA', nom: 'VAA (Fièvre Jaune)', maladie_cible: 'Fièvre Jaune', age_recommande_mois: 9 },
  { code: 'VAR_2', nom: 'Rougeole & Rubéole 2 (RR 2)', maladie_cible: 'Rougeole, Rubéole', age_recommande_mois: 15 },
];
