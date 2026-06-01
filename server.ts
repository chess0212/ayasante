import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
if (process.env.GEMINI_API_KEY) {
  try {
    ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
    console.log('Gemini API initialized successfully.');
  } catch (error) {
    console.error('Error initializing Gemini developer client:', error);
  }
} else {
  console.log('No GEMINI_API_KEY variable specified. Running in offline fallback mode.');
}

// Global In-Memory Store for Synchronization (resembles the Abidjan Central Server Database)
const SERVER_DATABASE = {
  mamans: new Map<string, any>(),
  enfants: new Map<string, any>(),
  vaccins: new Map<string, any>(),
  alertes: new Map<string, any>(),
  sync_logs: [] as any[],
};

// Seed initial values in central cloud server database so the demo starts with some pre-existing synced families
const initialMamanId = "mam-uuid-999-sample";
SERVER_DATABASE.mamans.set(initialMamanId, {
  id: initialMamanId,
  nom: "Alima Ouattara",
  contact: "+225 0708091011",
  village: "Katiola Rurale",
  region: "Hambol",
  date_inscription: new Date('2026-01-10T08:00:00Z').toISOString(),
  code_pin_hash: "1234",
  cpn_visites: [
    { id: "cpn-1", date: "2026-01-11", trimestre: 1, poids_maman: 62, tension: "11/7", notes: "Première visite, maman anxieuse mais en bonne santé." },
    { id: "cpn-2", date: "2026-03-24", trimestre: 2, poids_maman: 65, tension: "12/8", notes: "Flingue de fer prescrit. Battements cardiaques fœtaux excellents." }
  ],
  status: "synced",
  last_updated: new Date('2026-03-24T09:30:00Z').toISOString(),
});

const initialEnfantId = "enf-uuid-888-sample";
SERVER_DATABASE.enfants.set(initialEnfantId, {
  id: initialEnfantId,
  maman_id: initialMamanId,
  nom: "Yao Koffi Blaise",
  genre: "M",
  date_naissance: "2026-04-01",
  poids_naissance: 3.2,
  taille_naissance: 49,
  historique_poids: [
    { date: "2026-04-01", valeur: 3.2 },
    { date: "2026-05-15", valeur: 4.5 }
  ],
  historique_taille: [
    { date: "2026-04-01", valeur: 49 },
    { date: "2026-05-15", valeur: 52.5 }
  ],
  status: "synced",
  last_updated: new Date('2026-05-15T11:00:00Z').toISOString(),
});

// Seed some vaccines for the sample child on server
const serverVaccines = [
  { id: "vac-s1", enfant_id: initialEnfantId, vaccin_code: "BCG", nom: "BCG (Tuberculose)", description: "Vaccin antituberculeux universel", age_recommande_mois: 0, date_prevue: "2026-04-01", date_administration: "2026-04-02", est_fait: true, lot_number: "BCG-2026-AX", agent_nom_charge: "Agent Coulibaly", status: "synced", last_updated: "2026-04-02T10:00:00Z" },
  { id: "vac-s2", enfant_id: initialEnfantId, vaccin_code: "VPO_0", nom: "VPO 0 (Poliomyélite 0)", description: "Vaccin polio oral à la naissance", age_recommande_mois: 0, date_prevue: "2026-04-01", date_administration: "2026-04-02", est_fait: true, lot_number: "VPO-90", agent_nom_charge: "Agent Coulibaly", status: "synced", last_updated: "2026-04-02T10:00:00Z" },
  { id: "vac-s3", enfant_id: initialEnfantId, vaccin_code: "ROTA_1", nom: "Rotavirus 1 (Diarhées)", description: "Première dose rotavirus", age_recommande_mois: 1.5, date_prevue: "2026-05-15", date_administration: "2026-05-15", est_fait: true, lot_number: "ROT-55", agent_nom_charge: "Agent Coulibaly", status: "synced", last_updated: "2026-05-15T11:00:00Z" },
  { id: "vac-s4", enfant_id: initialEnfantId, vaccin_code: "PENTA_1", nom: "Penta 1 (DTC-HepB-Hib)", description: "Maladies infantiles majeures", age_recommande_mois: 1.5, date_prevue: "2026-05-15", date_administration: null, est_fait: false, status: "synced", last_updated: "2026-05-15T11:00:00Z" },
];
serverVaccines.forEach(v => SERVER_DATABASE.vaccins.set(v.id, v));

// Mock Specialists Pediatricians in Côte d'Ivoire major centers
const SEEDED_PEDIATRICIANS = [
  // Abidjan
  { id: "ped-1", nom: "Dr. Kra Faustin", specialite: "Pédiatrie Générale & Néonatologie", telephone: "+225 0102030405", email: "f.kra@chu-treichville.ci", ville: "Abidjan", adresse: "CHU de Treichville, Avenue de la République", est_disponible: true },
  { id: "ped-2", nom: "Prof. Cynthia Yao", specialite: "Nutrition Infantile & Vaccination", telephone: "+225 0506070809", email: "c.yao@chu-cocody.ci", ville: "Abidjan", adresse: "CHU de Cocody, Boulevard de l'Université", est_disponible: true },
  
  // Bouaké
  { id: "ped-3", nom: "Dr. Diallo Sidiki", specialite: "Pédiatrie Préventive & Maladies Tropicaux", telephone: "+225 0707112233", email: "s.diallo@chu-bouake.ci", ville: "Bouaké", adresse: "CHU de Bouaké, Quartier Dar-Es-Salam", est_disponible: true },
  
  // Yamoussoukro
  { id: "ped-4", nom: "Dr. Brou Kouamé", specialite: "Suivi du Développement de la petite enfance", telephone: "+225 0530405060", ville: "Yamoussoukro", adresse: "Hôpital Général de Yamoussoukro, Route de Sinfra", est_disponible: true },
  
  // Korhogo
  { id: "ped-5", nom: "Dr. Sorho Gnakpa", specialite: "Infections de la Mère & de l'Enfant", telephone: "+225 0751998822", ville: "Korhogo", adresse: "CHR de Korhogo, Quartier Résidentiel", est_disponible: true },
  
  // Daloa
  { id: "ped-6", nom: "Dr. Touré Massandjé", specialite: "Gynécologie Obstétrique et Pédiatrie", telephone: "+225 0140228834", ville: "Daloa", adresse: "CHR de Daloa, Centre Ville", est_disponible: true },
];

// --- API ENDPOINTS ---

// 1. Get Pediatricians List
app.get('/api/pediatricians', (req, res) => {
  res.json(SEEDED_PEDIATRICIANS);
});

// Added: Add a new pediatrician
app.post('/api/pediatricians', (req, res) => {
  const { nom, specialite, telephone, email, ville, adresse } = req.body;
  if (!nom || !specialite || !telephone || !ville || !adresse) {
    return res.status(400).json({ error: "Veuillez remplir tous les champs requis." });
  }
  const newPed = {
    id: `ped-${Date.now()}`,
    nom,
    specialite,
    telephone,
    email: email || "",
    ville,
    adresse,
    est_disponible: true
  };
  SEEDED_PEDIATRICIANS.push(newPed);
  res.status(201).json(newPed);
});

// 2. Get Central Dashboard Metrics
app.get('/api/central-metrics', (req, res) => {
  const mamanCount = SERVER_DATABASE.mamans.size;
  const enfantCount = SERVER_DATABASE.enfants.size;
  const totalVaccines = Array.from(SERVER_DATABASE.vaccins.values());
  const appliedVaccines = totalVaccines.filter(v => v.est_fait).length;
  const coverageRate = totalVaccines.length > 0 ? Math.round((appliedVaccines / totalVaccines.length) * 100) : 100;
  
  // Group by region
  const regionStats: Record<string, { mamans: number; enfants: number; vaccines: number }> = {};
  Array.from(SERVER_DATABASE.mamans.values()).forEach(m => {
    const reg = m.region || 'Inconnue';
    if (!regionStats[reg]) regionStats[reg] = { mamans: 0, enfants: 0, vaccines: 0 };
    regionStats[reg].mamans++;
  });
  
  Array.from(SERVER_DATABASE.enfants.values()).forEach(e => {
    const maman = SERVER_DATABASE.mamans.get(e.maman_id);
    const reg = maman ? maman.region : 'Inconnue';
    if (!regionStats[reg]) regionStats[reg] = { mamans: 0, enfants: 0, vaccines: 0 };
    regionStats[reg].enfants++;
  });

  res.json({
    totals: {
      mamans: mamanCount,
      enfants: enfantCount,
      vaccins_administres: appliedVaccines,
      taux_couverture: coverageRate,
    },
    regionStats,
    recentLogs: SERVER_DATABASE.sync_logs.slice(-10).reverse()
  });
});

// 3. Offline-First Sync Router Endpoint
// Receives client's local records and resolves conflicts with database
app.post('/api/sync', (req, res) => {
  const { mamans, enfants, vaccins, alertes, client_last_sync_time } = req.body;
  const sync_timestamp = new Date().toISOString();
  
  let totalProcessed = 0;
  let conflictsResolved = 0;
  const responsePayload = {
    mamansToUpdate: [] as any[],
    enfantsToUpdate: [] as any[],
    vaccinsToUpdate: [] as any[],
    alertesToUpdate: [] as any[],
    sync_status: 'success',
    details: '',
  };

  try {
    // --- Mamans Sync & Conflict Resolution ---
    if (Array.isArray(mamans)) {
      mamans.forEach((clientMaman: any) => {
        totalProcessed++;
        const serverMaman = SERVER_DATABASE.mamans.get(clientMaman.id);
        if (!serverMaman) {
          // New record created on the tablet field offline
          clientMaman.status = 'synced';
          SERVER_DATABASE.mamans.set(clientMaman.id, clientMaman);
        } else {
          // Conflict checking! Use 'last_updated' timestamp (Last Weighted/Write Wins)
          const clientTime = new Date(clientMaman.last_updated).getTime();
          const serverTime = new Date(serverMaman.last_updated).getTime();
          
          if (clientTime >= serverTime) {
            // Client is newer, update server and distribute back
            clientMaman.status = 'synced';
            SERVER_DATABASE.mamans.set(clientMaman.id, clientMaman);
          } else {
            // Server has more up-to-date data (e.g. edited by Abidjan portal)
            conflictsResolved++;
            responsePayload.mamansToUpdate.push(serverMaman);
          }
        }
      });
    }

    // --- Enfants Sync & Conflict Resolution ---
    if (Array.isArray(enfants)) {
      enfants.forEach((clientEnfant: any) => {
        totalProcessed++;
        const serverEnfant = SERVER_DATABASE.enfants.get(clientEnfant.id);
        if (!serverEnfant) {
          // Create on server
          clientEnfant.status = 'synced';
          SERVER_DATABASE.enfants.set(clientEnfant.id, clientEnfant);
        } else {
          const clientTime = new Date(clientEnfant.last_updated).getTime();
          const serverTime = new Date(serverEnfant.last_updated).getTime();
          
          if (clientTime >= serverTime) {
            clientEnfant.status = 'synced';
            SERVER_DATABASE.enfants.set(clientEnfant.id, clientEnfant);
          } else {
            conflictsResolved++;
            responsePayload.enfantsToUpdate.push(serverEnfant);
          }
        }
      });
    }

    // --- Vaccins Sync & Conflict Resolution ---
    if (Array.isArray(vaccins)) {
      vaccins.forEach((clientVac: any) => {
        totalProcessed++;
        const serverVac = SERVER_DATABASE.vaccins.get(clientVac.id);
        if (!serverVac) {
          clientVac.status = 'synced';
          SERVER_DATABASE.vaccins.set(clientVac.id, clientVac);
        } else {
          const clientTime = new Date(clientVac.last_updated).getTime();
          const serverTime = new Date(serverVac.last_updated).getTime();
          
          if (clientTime >= serverTime) {
            clientVac.status = 'synced';
            SERVER_DATABASE.vaccins.set(clientVac.id, clientVac);
          } else {
            conflictsResolved++;
            responsePayload.vaccinsToUpdate.push(serverVac);
          }
        }
      });
    }

    // --- Alertes Sync & Conflict Resolution ---
    if (Array.isArray(alertes)) {
      alertes.forEach((clientAlert: any) => {
        totalProcessed++;
        const serverAlert = SERVER_DATABASE.alertes.get(clientAlert.id);
        if (!serverAlert) {
          clientAlert.status = 'synced';
          SERVER_DATABASE.alertes.set(clientAlert.id, clientAlert);
        } else {
          const clientTime = new Date(clientAlert.last_updated).getTime();
          const serverTime = new Date(serverAlert.last_updated).getTime();
          
          if (clientTime >= serverTime) {
            clientAlert.status = 'synced';
            SERVER_DATABASE.alertes.set(clientAlert.id, clientAlert);
          } else {
            conflictsResolved++;
            responsePayload.alertesToUpdate.push(serverAlert);
          }
        }
      });
    }

    // --- PULL PHASE (Download any server records that the client doesn't have) ---
    // In production, we'd query for items where last_updated > client_last_sync_time
    const clientSyncTime = client_last_sync_time ? new Date(client_last_sync_time).getTime() : 0;
    
    SERVER_DATABASE.mamans.forEach((maman) => {
      const serverTime = new Date(maman.last_updated).getTime();
      const clientHasIt = mamans?.some((m: any) => m.id === maman.id);
      if (!clientHasIt || serverTime > clientSyncTime) {
        if (!responsePayload.mamansToUpdate.some(m => m.id === maman.id)) {
          responsePayload.mamansToUpdate.push(maman);
        }
      }
    });

    SERVER_DATABASE.enfants.forEach((enfant) => {
      const serverTime = new Date(enfant.last_updated).getTime();
      const clientHasIt = enfants?.some((e: any) => e.id === enfant.id);
      if (!clientHasIt || serverTime > clientSyncTime) {
        if (!responsePayload.enfantsToUpdate.some(e => e.id === enfant.id)) {
          responsePayload.enfantsToUpdate.push(enfant);
        }
      }
    });

    SERVER_DATABASE.vaccins.forEach((vac) => {
      const serverTime = new Date(vac.last_updated).getTime();
      const clientHasIt = vaccins?.some((v: any) => v.id === vac.id);
      if (!clientHasIt || serverTime > clientSyncTime) {
        if (!responsePayload.vaccinsToUpdate.some(v => v.id === vac.id)) {
          responsePayload.vaccinsToUpdate.push(vac);
        }
      }
    });

    SERVER_DATABASE.alertes.forEach((alert) => {
      const serverTime = new Date(alert.last_updated).getTime();
      const clientHasIt = alertes?.some((a: any) => a.id === alert.id);
      if (!clientHasIt || serverTime > clientSyncTime) {
        if (!responsePayload.alertesToUpdate.some(a => a.id === alert.id)) {
          responsePayload.alertesToUpdate.push(alert);
        }
      }
    });

    // Save Sync Log
    const successLog = {
      id: `log-s-${Date.now()}`,
      timestamp: sync_timestamp,
      direction: 'both',
      records_sent: totalProcessed - conflictsResolved,
      records_received: responsePayload.mamansToUpdate.length + responsePayload.enfantsToUpdate.length + responsePayload.vaccinsToUpdate.length,
      status: conflictsResolved > 0 ? 'conflicts' : 'success',
      details: `Données traitées: ${totalProcessed}. Conflits 'Last-Write-Wins' résolus: ${conflictsResolved}. Envoi complet effectué avec succès.`
    };
    SERVER_DATABASE.sync_logs.push(successLog);

    res.json({
      ...responsePayload,
      sync_timestamp,
      sync_log: successLog
    });

  } catch (error: any) {
    console.error('Error during database synchronization:', error);
    res.status(500).json({ sync_status: 'failure', details: error.message || 'Unknown network sync error' });
  }
});

// 4. Clinical Medical & SMS Translator Advisor (Powered by Gemini)
app.post('/api/advisor', async (req, res) => {
  const { prompt, type, langue, maman_nom, enfant_nom, prochain_rdv } = req.body;
  
  if (!ai) {
    // Elegant fallback simulation when running without an API key
    return res.json({
      text: getFallbackAdvisorContent(type, langue, maman_nom, enfant_nom, prochain_rdv),
      offline_simulated: true,
    });
  }

  try {
    let systemInstruction = "Tu es Aya, conseillère de santé virtuelle d'AyaSanté, experte de l'UNICEF spécialisée en néonatalogie et vaccination en Côte d'Ivoire. Tu parles avec compassion et simplicité. Tu adaptes toujours tes réponses pour des milieux ruraux ouest-africains.";
    
    let contents = prompt;
    if (type === "vocal_script") {
      contents = `Rédige un script court de SMS et de MESSAGE VOCAL de rappel de vaccination pour la maman nommée "${maman_nom}" et son enfant "${enfant_nom}".
      Date de rendez-vous : ${prochain_rdv || "la semaine prochaine"}.
      Langue ciblée : ${langue || "Français"}.
      
      Le message doit être extrêmement simple pour une population peu alphabétisée.
      Donne :
      1. SCRIPT SMS EN FRANÇAIS (court, structuré avec icônes universelles de seringue, date, et bébé)
      2. SCRIPT DE MESSAGE VOCAL PHONÉTIQUE ET TRADUIT en langue locale (${langue}) : Écris comment prononcer le conseil phonétiquement pour que la maman entende des directives simples comme : 'Prends le carnet jaune et rends-toi au centre de santé'.
      3. Un conseil pratique de nutrition / santé préventive pour cet âge (ex. allaitement exclusif jusqu'à 6 mois).`;
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: contents,
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.7,
      }
    });

    res.json({
      text: response.text,
      offline_simulated: false,
    });
  } catch (error: any) {
    console.error('Gemini advisor error:', error);
    res.json({
      text: getFallbackAdvisorContent(type, langue, maman_nom, enfant_nom, prochain_rdv) + `\n\n*(Note : Erreur technique de l'API de génération, fallback local utilisé : ${error.message})*`,
      offline_simulated: true,
    });
  }
});

// Mock/Local fallback script generation helper
function getFallbackAdvisorContent(type: string, langue: string, maman_nom: string, enfant_nom: string, prochain_rdv: string) {
  const maman = maman_nom || "la maman";
  const enfant = enfant_nom || "l'enfant";
  const rdv = prochain_rdv || "bientôt";
  const lg = (langue || "français").toLowerCase();

  const voiceScripts: Record<string, string> = {
    dioula: `[Traduction Dioula - Vocal] 
"Mako nèn, an sôgôma kènèya so. Ka carnet mognan sa ka táa gwan-gwan sôgô-li yoro la sisan ka sogo fô ${enfant} yé fèn o fèn doun." (Traduction phonétique : Maman de ${enfant}, n'oublie pas l'examen de santé. Prends ton carnet jaune et rends-toi au dispensaire pour le vaccin de ${enfant}.)`,
    baoule: `[Traduction Baoulé - Vocal]
"Bla goly bé ka fien mou o, ndè o ndè o. ${enfant} i waka kôli koun goungla kplé gnan wa, fa carnet o kó centre de santé." (Traduction phonétique : Femme d'honneur, bonjour. C'est le jour du vaccin de ${enfant}, prends ton carnet et va au dispensaire pour assurer sa santé.)`,
    bete: `[Traduction Bété - Vocal]
"Ayoka maman de ${enfant}. N'zon koun gougla lilly sogo gbagba yre. Ma gbe cané gbe caneh ga gbelu dispensaire." (Traduction phonétique : Bonjour Maman. C'est le moment d'immuniser ${enfant}. Porte ton enfant et le carnet jaune vers le centre médical le plus prochev.)`,
    francais: `[En Français - Vocal]
"Bonjour Maman ${maman_nom}. N'oublie pas d'emmener ton enfant ${enfant_nom} au centre de santé pour sa vaccination de routine. Munis-toi du carnet de santé jaune. C'est gratuit et protège sa vie."`
  };

  const selectedVoiceScript = voiceScripts[lg] || voiceScripts['francais'];

  return `### 📱 Éléments d'Alerte et Script de Rappel Générés (AyaSanté Base)

**1. 💬 Canal SMS (Texte court épuré + Émoticônes)**
👶 *AyaSanté Rappel* : Bonjour Maman **${maman}**, le rdv de vaccin de **${enfant}** est planifié le **${rdv}** au dispensaire du village.
🏥 Munissez-vous du **CARNET JAUNE** ! 
💪 C'est gratuit et protège la vie de votre bébé contre les épidémies graves.

---

**2. 🎙️ Traduction Audio Vocale (${langue.toUpperCase()}) pour l'Appel Automatisé**
*Utile pour notre boîte vocale AyaSanté d'agents communautaires à diffuser directement sur le haut-parleur dans le village ou via appel de groupe.*

${selectedVoiceScript}

---

**3. 💡 Conseil Pratique de Pédiatre associé (Côte d'Ivoire)**
*   **Allaitement Maternel Exclusif :** Jusqu'à 6 mois, ne donnez ni eau ni bouillies additionnelles à l'enfant; le lait maternel de maman suffit amplement pour lui éviter les salmonelloses rurale.
*   **Eau saine :** Faites toujours bouillir l'eau de puits avant de nettoyer les biberons ou de préparer les aliments de sevrage de bébé.`;
}

// Enable Vite middleware inside Development Mode
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite routing process running as middleware (Development).');
  } else {
    // Serve static bundle in production mode
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production-ready compiled bundle assets.');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AyaSanté Central High-Performance Portal running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
