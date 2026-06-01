import { Maman, Enfant, VaccinEffectue, Alerte, PROGRAMME_PEV_CI } from '../types';

// Simple resilient UUID generator for offline village use
export function generateOfflineUUID(prefix: string): string {
  const chars = 'abcdef0123456789';
  let uuid = prefix + '-';
  for (let i = 0; i < 16; i++) {
    uuid += chars[Math.floor(Math.random() * chars.length)];
  }
  return uuid;
}

// Generate a memorable patient registration number (matricule) e.g. AYA-M-5928
export function generatePatientMatricule(prefix: 'M' | 'E'): string {
  const num = Math.floor(1000 + Math.random() * 9000);
  return `AYA-${prefix}-${num}`;
}

// Calculate due date for vaccine based on DOB
export function calculateVaccineDueDate(dobString: string, ageInMonths: number): string {
  const dob = new Date(dobString);
  if (ageInMonths === 0) return dobString;
  
  // Approximately 30.4 days per month
  const targetDate = new Date(dob.getTime() + ageInMonths * 30.4 * 24 * 60 * 60 * 1000);
  return targetDate.toISOString().split('T')[0];
}

// Helper to calculate exact age in months
export function getAgeInMonths(dobString: string): number {
  const dob = new Date(dobString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - dob.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return Math.round((diffDays / 30.4) * 10) / 10;
}

// Automatically generate a full vaccine calendar scheme for a newborn child based on PEV CI standards
export function generateVaccineCalendarForChild(enfantId: string, dobString: string): VaccinEffectue[] {
  return PROGRAMME_PEV_CI.map(vacDef => {
    return {
      id: generateOfflineUUID(`vac-${vacDef.code.toLowerCase()}`),
      enfant_id: enfantId,
      vaccin_code: vacDef.code,
      nom: vacDef.nom,
      description: vacDef.maladie_cible,
      age_recommande_mois: vacDef.age_recommande_mois,
      date_prevue: calculateVaccineDueDate(dobString, vacDef.age_recommande_mois),
      date_administration: null,
      est_fait: false,
      status: 'pending_creation',
      last_updated: new Date().toISOString(),
    };
  });
}

// Seed Initial Local Offline SQLite Simulated Database content
export const SEEDED_LOCAL_MAMANS: Maman[] = [
  {
    id: "mam-local-1",
    matricule: "AYA-M-1049",
    nom: "Awa Kouassi",
    contact: "+225 0550607080",
    village: "Niakara Centre",
    region: "Hambol",
    date_inscription: "2026-02-15T09:00:00Z",
    code_pin_hash: "1111",
    cpn_visites: [
      { id: "cpn-l1", date: "2026-02-20", trimestre: 1, poids_maman: 58, tension: "12/7", notes: "Suivi mensuel normal, légère fatigue dentaire." },
      { id: "cpn-l2", date: "2026-05-10", trimestre: 2, poids_maman: 61, tension: "11/8", notes: "Prend régulièrement son fer et acide folique." }
    ],
    status: "synced",
    last_updated: "2026-05-10T14:20:00Z"
  },
  {
    id: "mam-local-2",
    matricule: "AYA-M-8371",
    nom: "Téné Coulibaly",
    contact: "+225 0707889900",
    village: "Sinématiali Rurale",
    region: "Poro",
    date_inscription: "2026-05-01T10:15:00Z",
    code_pin_hash: "2222",
    cpn_visites: [],
    status: 'pending_creation', // Added while agent was offline in village
    last_updated: "2026-05-01T10:15:00Z"
  }
];

export const SEEDED_LOCAL_ENFANTS: Enfant[] = [
  {
    id: "enf-local-1",
    maman_id: "mam-local-1",
    matricule: "AYA-E-3928",
    nom: "Koffi Junior",
    genre: "M",
    date_naissance: "2025-06-15", // ~11 months old now
    poids_naissance: 3.0,
    taille_naissance: 48,
    historique_poids: [
      { date: "2025-06-15", valeur: 3.0 },
      { date: "2025-08-01", valeur: 4.1 },
      { date: "2025-10-10", valeur: 6.2 },
      { date: "2026-02-20", valeur: 8.5 },
      { date: "2026-05-10", valeur: 9.8 }
    ],
    historique_taille: [
      { date: "2025-06-15", valeur: 48 },
      { date: "2025-08-01", valeur: 51 },
      { date: "2025-10-10", valeur: 55 },
      { date: "2026-02-20", valeur: 62 },
      { date: "2026-05-10", valeur: 68 }
    ],
    status: "synced",
    last_updated: "2026-05-10T14:30:00Z"
  },
  {
    id: "enf-local-2",
    maman_id: "mam-local-2",
    matricule: "AYA-E-7740",
    nom: "Aminata Koné",
    genre: "F",
    date_naissance: "2026-05-05", // Newborn offline
    poids_naissance: 2.8,
    taille_naissance: 46,
    historique_poids: [
      { date: "2026-05-05", valeur: 2.8 }
    ],
    historique_taille: [
      { date: "2026-05-05", valeur: 46 }
    ],
    status: 'pending_creation',
    last_updated: "2026-05-05T08:00:00Z"
  }
];

// Helper to seed vaccination details for Koffi Junior and Aminata Koné
export function getSeededVaccines(): VaccinEffectue[] {
  // Junior has taken vaccines through 9 months
  const juniorDob = "2025-06-15";
  const juniorVaccines: VaccinEffectue[] = [
    {
      id: "vac-l1", enfant_id: "enf-local-1", vaccin_code: "BCG", nom: "BCG (Tuberculose)", description: "Tuberculose", age_recommande_mois: 0,
      date_prevue: juniorDob, date_administration: juniorDob, est_fait: true, lot_number: "BCG-99A", agent_nom_charge: "Agent Coulibaly", status: "synced", last_updated: "2025-06-15"
    },
    {
      id: "vac-l2", enfant_id: "enf-local-1", vaccin_code: "VPO_0", nom: "VPO 0 (Poliomyélite 0)", description: "Poliomyélite", age_recommande_mois: 0,
      date_prevue: juniorDob, date_administration: juniorDob, est_fait: true, lot_number: "VP-22", agent_nom_charge: "Agent Coulibaly", status: "synced", last_updated: "2025-06-15"
    },
    {
      id: "vac-l3", enfant_id: "enf-local-1", vaccin_code: "ROTA_1", nom: "Rotavirus 1", description: "Rotavirus", age_recommande_mois: 1.5,
      date_prevue: "2025-08-01", date_administration: "2025-08-01", est_fait: true, lot_number: "R-01", agent_nom_charge: "Agent Coulibaly", status: "synced", last_updated: "2025-08-01"
    },
    {
      id: "vac-l4", enfant_id: "enf-local-1", vaccin_code: "PENTA_1", nom: "Penta 1", description: "Diph, Tét, Coq, HepB, Hib", age_recommande_mois: 1.5,
      date_prevue: "2025-08-01", date_administration: "2025-08-01", est_fait: true, lot_number: "P-104", agent_nom_charge: "Agent Coulibaly", status: "synced", last_updated: "2025-08-01"
    },
    {
      id: "vac-l5", enfant_id: "enf-local-1", vaccin_code: "VAR_1", nom: "Rougeole & Rubéole 1 (RR 1)", description: "Rougeole, Rubéole", age_recommande_mois: 9,
      date_prevue: "2026-03-15", date_administration: "2026-03-18", est_fait: true, lot_number: "RR-09X", agent_nom_charge: "Agent Soro", status: "synced", last_updated: "2026-03-18"
    },
    {
      id: "vac-l6", enfant_id: "enf-local-1", vaccin_code: "VAA", nom: "VAA (Fièvre Jaune)", description: "Fièvre Jaune", age_recommande_mois: 9,
      date_prevue: "2026-03-15", date_administration: null, est_fait: false, status: "synced", last_updated: "2026-03-15"
    },
    {
      id: "vac-l7", enfant_id: "enf-local-1", vaccin_code: "VAR_2", nom: "Rougeole & Rubéole 2 (RR 2)", description: "Rougeole, Rubéole", age_recommande_mois: 15,
      date_prevue: "2026-09-15", date_administration: null, est_fait: false, status: "synced", last_updated: "2026-09-15"
    }
  ];

  // Aminata Koné is newborn, vaccines just scheduled, BCG administered offline!
  const aminataDob = "2026-05-05";
  const aminataVaccines: VaccinEffectue[] = [
    {
      id: "vac-l101", enfant_id: "enf-local-2", vaccin_code: "BCG", nom: "BCG (Tuberculose)", description: "Tuberculose", age_recommande_mois: 0,
      date_prevue: aminataDob, date_administration: aminataDob, est_fait: true, lot_number: "BCG-99A", agent_nom_charge: "Agent Coulibaly (Offline)", status: 'pending_update', last_updated: new Date().toISOString()
    },
    {
      id: "vac-l102", enfant_id: "enf-local-2", vaccin_code: "VPO_0", nom: "VPO 0 (Poliomyélite 0)", description: "Poliomyélite", age_recommande_mois: 0,
      date_prevue: aminataDob, date_administration: null, est_fait: false, status: 'pending_creation', last_updated: new Date().toISOString()
    },
    {
      id: "vac-l103", enfant_id: "enf-local-2", vaccin_code: "PENTA_1", nom: "Penta 1", description: "Diph, Tét, Coq, HepB, Hib", age_recommande_mois: 1.5,
      date_prevue: calculateVaccineDueDate(aminataDob, 1.5), date_administration: null, est_fait: false, status: 'pending_creation', last_updated: new Date().toISOString()
    }
  ];

  return [...juniorVaccines, ...aminataVaccines];
}

export const SEEDED_LOCAL_ALERTES: Alerte[] = [
  {
    id: "al-local-1",
    maman_id: "mam-local-1",
    maman_nom: "Awa Kouassi",
    enfant_id: "enf-local-1",
    enfant_nom: "Koffi Junior",
    type: "SMS",
    langue: "baoule",
    date_prevue: "2026-06-15",
    message_texte: "AyaSanté : Bonjour Maman Awa, c'est l'heure du rappel vaccinal pour Koffi Junior au centre de Niakara. Munissez-vous du carnet jaune !",
    script_vocal: "Bonjour Maman de Koffi Junior. N'oubliez pas d'emmener Koffi Junior au centre médical pour le rappel. Prenez le carnet jaune.",
    statut_envoi: "planifie",
    status: "synced",
    last_updated: "2026-05-10T14:30:00Z"
  }
];
