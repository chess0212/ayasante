import React, { useState, useEffect } from 'react';
import {
  Smartphone,
  Server,
  Activity,
  Wifi,
  WifiOff,
  Baby,
  Users,
  Calendar,
  AlertTriangle,
  RefreshCw,
  Search,
  PhoneCall,
  MapPin,
  Clock,
  Heart,
  Plus,
  ChevronRight,
  Database,
  Lock,
  MessageSquare,
  Volume2,
  VolumeX,
  Languages,
  Headphones,
  Sparkles,
  Settings,
  FileText,
  BookmarkCheck,
  Check,
  CheckCircle2,
  ListRestart,
  BarChart3,
  TrendingUp,
  Inbox
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// Domain models and helpers
import { Maman, Enfant, VaccinEffectue, Alerte, MedecinPediatre, SyncLog, CpnVisite } from './types';
import {
  generateOfflineUUID,
  calculateVaccineDueDate,
  getAgeInMonths,
  generateVaccineCalendarForChild,
  SEEDED_LOCAL_MAMANS,
  SEEDED_LOCAL_ENFANTS,
  getSeededVaccines,
  SEEDED_LOCAL_ALERTES
} from './utils/dataHelper';

// UI Subcomponents
import PasscodeScreen from './components/PasscodeScreen';
import MamanPinUnlockContainer from './components/MamanPinUnlockContainer';
import GrowthChart from './components/GrowthChart';
import MotherRegistrationModal from './components/MotherRegistrationModal';
import ChildRegistrationModal from './components/ChildRegistrationModal';
import AyaAiAdvisor from './components/AyaAiAdvisor';
import AddPediatreModal from './components/AddPediatreModal';

export default function App() {
  const REGIONS_CI = ['Hambol', 'Poro', 'Gbêkê', 'Cavally', 'Gboklè', 'Lagunes'];

  // --- PERSISTENT LOCAL HEALTH DATABASE (Simulating SQLite/Room in Mobile Storage) ---
  const [localMamans, setLocalMamans] = useState<Maman[]>([]);
  const [localEnfants, setLocalEnfants] = useState<Enfant[]>([]);
  const [localVaccins, setLocalVaccins] = useState<VaccinEffectue[]>([]);
  const [localAlertes, setLocalAlertes] = useState<Alerte[]>([]);
  const [localSyncLogs, setLocalSyncLogs] = useState<SyncLog[]>([]);

  // --- STATE FOR SECRET ADMINISTRATION LOGO TAP ---
  const [logoClicksCount, setLogoClicksCount] = useState<number>(0);
  const [showAdminStatusPanel, setShowAdminStatusPanel] = useState<boolean>(false);
  const [selectedAdminEnfantId, setSelectedAdminEnfantId] = useState<string>('');
  const [adminSearchQuery, setAdminSearchQuery] = useState<string>('');
  const [showAddPediatreModal, setShowAddPediatreModal] = useState<boolean>(false);

  // --- STATE FOR LOCAL LANGUAGE MULTILINGUAL VOICE PLAYER ---
  const [globalLanguage, setGlobalLanguage] = useState<'dioula' | 'baoule' | 'bete' | 'francais'>('francais');
  const [activeSpeechInfo, setActiveSpeechInfo] = useState<{
    title: string;
    textFr: string;
    textPhonetic: string;
    lang: 'dioula' | 'baoule' | 'bete' | 'francais';
  } | null>(null);
  const [isVoiceCurrentlyPlaying, setIsVoiceCurrentlyPlaying] = useState<boolean>(false);

  // --- STATE FOR CPN (CONSULTATION PRENATALE) FORM ---
  const [showCpnForm, setShowCpnForm] = useState<boolean>(false);
  const [cpnPoids, setCpnPoids] = useState<string>('');
  const [cpnTension, setCpnTension] = useState<string>('12/8');
  const [cpnTrimestre, setCpnTrimestre] = useState<number>(1);
  const [cpnNotes, setCpnNotes] = useState<string>('');
  const [realizeCpnId, setRealizeCpnId] = useState<string | null>(null);

  // Simulation controls state
  const [isUnlocked, setIsUnlocked] = useState<boolean>(true);
  const [isConnected, setIsConnected] = useState<boolean>(false); // Starts offline as village is normal
  const [activeTab, setActiveTab] = useState<'membres' | 'vocal' | 'pediatres'>('membres');
  const [selectedMamanId, setSelectedMamanId] = useState<string | null>(null);
  const [unlockedMamanId, setUnlockedMamanId] = useState<string | null>(null);
  const [selectedEnfantId, setSelectedEnfantId] = useState<string | null>(null);
  const [searchParam, setSearchParam] = useState<string>('');

  // Modals state
  const [showMamanModal, setShowMamanModal] = useState<boolean>(false);
  const [showEnfantModal, setShowEnfantModal] = useState<boolean>(false);

  // Central Server Mirror Stats (Abidjan Head Office API responses)
  const [centralMetrics, setCentralMetrics] = useState<any>({
    totals: { mamans: 1, enfants: 1, vaccins_administres: 3, taux_couverture: 75 },
    regionStats: {},
    recentLogs: []
  });
  const [pediatricians, setPediatricians] = useState<MedecinPediatre[]>([]);
  const [syncingLoading, setSyncingLoading] = useState<boolean>(false);

  // Growth logs addition helper
  const [newWeightValue, setNewWeightValue] = useState<string>('');

  // Low literacy visual administration panels helper
  const [activeAdministerVaccine, setActiveAdministerVaccine] = useState<VaccinEffectue | null>(null);
  const [vaccineLot, setVaccineLot] = useState<string>('');
  const [vaccineAgent, setVaccineAgent] = useState<string>('Agent Coulibaly');

  // --- INITIALIZE LOCAL STORAGE OR USE DEFAULTS ---
  useEffect(() => {
    const storedMamans = localStorage.getItem('ayasanté_mamans');
    const storedEnfants = localStorage.getItem('ayasanté_enfants');
    const storedVaccins = localStorage.getItem('ayasanté_vaccins');
    const storedAlertes = localStorage.getItem('ayasanté_alertes');
    const storedLogs = localStorage.getItem('ayasanté_sync_logs');

    if (storedMamans && storedEnfants && storedVaccins) {
      setLocalMamans(JSON.parse(storedMamans));
      setLocalEnfants(JSON.parse(storedEnfants));
      setLocalVaccins(JSON.parse(storedVaccins));
      setLocalAlertes(storedAlertes ? JSON.parse(storedAlertes) : SEEDED_LOCAL_ALERTES);
      setLocalSyncLogs(storedLogs ? JSON.parse(storedLogs) : []);
    } else {
      // Use seeded local offline SQLite content
      setLocalMamans(SEEDED_LOCAL_MAMANS);
      setLocalEnfants(SEEDED_LOCAL_ENFANTS);
      setLocalVaccins(getSeededVaccines());
      setLocalAlertes(SEEDED_LOCAL_ALERTES);
      
      const setupLog: SyncLog = {
        id: 'log-initial',
        timestamp: new Date().toISOString(),
        direction: 'pull',
        records_sent: 0,
        records_received: 3,
        status: 'success',
        details: 'Initialisation de la base SQLite mobile de terrain.'
      };
      setLocalSyncLogs([setupLog]);
    }

    // Fetch pediatricians from real-world central endpoint
    fetch('/api/pediatricians')
      .then(r => r.json())
      .then(data => setPediatricians(data))
      .catch(err => console.error("Error loading pediatricians:", err));

    // Fetch initial central metrics
    fetchCentralMetrics();
  }, []);

  // Save changes to localStorage instantly to simulate persistent offline DB
  useEffect(() => {
    if (localMamans.length > 0) {
      localStorage.setItem('ayasanté_mamans', JSON.stringify(localMamans));
      localStorage.setItem('ayasanté_enfants', JSON.stringify(localEnfants));
      localStorage.setItem('ayasanté_vaccins', JSON.stringify(localVaccins));
      localStorage.setItem('ayasanté_alertes', JSON.stringify(localAlertes));
      localStorage.setItem('ayasanté_sync_logs', JSON.stringify(localSyncLogs));
    }
  }, [localMamans, localEnfants, localVaccins, localAlertes, localSyncLogs]);

  // Fetch metrics from the centralized government cloud server
  const fetchCentralMetrics = async () => {
    try {
      const response = await fetch('/api/central-metrics');
      const data = await response.json();
      setCentralMetrics(data);
    } catch (e) {
      console.error(e);
    }
  };

  // --- SYNC PROCESSOR (The Real Sync Protocol implementation) ---
  const handleTriggerSync = async () => {
    if (!isConnected) {
      alert("⚠️ Mode Hors-Ligne Actif. Pour simuler la synchronisation, veuillez activer le mode 'En ligne (Chef-lieu connecté)' en haut de la page.");
      return;
    }

    setSyncingLoading(true);
    try {
      // Collect only updated or created elements
      const mamansPayload = localMamans.filter(m => m.status.startsWith('pending'));
      const enfantsPayload = localEnfants.filter(e => e.status.startsWith('pending'));
      const vaccinsPayload = localVaccins.filter(v => v.status.startsWith('pending'));
      const alertesPayload = localAlertes.filter(a => a.status.startsWith('pending'));

      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mamans: localMamans, // Pass everything to check conflict resolution
          enfants: localEnfants,
          vaccins: localVaccins,
          alertes: localAlertes,
          client_last_sync_time: localSyncLogs[0]?.timestamp || null
        }),
      });

      if (!response.ok) throw new Error("Sync protocol aborted by server gateway");

      const data = await response.json();

      // Merge results returned by the server's Last-Write-Wins and UUID conflict resolution logic
      // Server lists what elements the local machine should update with newer server values
      const mergedMamans = [...localMamans];
      const mergedEnfants = [...localEnfants];
      const mergedVaccins = [...localVaccins];
      const mergedAlertes = [...localAlertes];

      // 1. Mark our sent records as 'synced'
      mergedMamans.forEach(m => { if (m.status.startsWith('pending')) m.status = 'synced'; });
      mergedEnfants.forEach(e => { if (e.status.startsWith('pending')) e.status = 'synced'; });
      mergedVaccins.forEach(v => { if (v.status.startsWith('pending')) v.status = 'synced'; });
      mergedAlertes.forEach(a => { if (a.status.startsWith('pending')) a.status = 'synced'; });

      // 2. Intercalate / Update newer records from server
      if (Array.isArray(data.mamansToUpdate)) {
        data.mamansToUpdate.forEach((sMam: any) => {
          const index = mergedMamans.findIndex(m => m.id === sMam.id);
          if (index > -1) mergedMamans[index] = { ...sMam, status: 'synced' };
          else mergedMamans.push({ ...sMam, status: 'synced' });
        });
      }

      if (Array.isArray(data.enfantsToUpdate)) {
        data.enfantsToUpdate.forEach((sEnf: any) => {
          const index = mergedEnfants.findIndex(e => e.id === sEnf.id);
          if (index > -1) mergedEnfants[index] = { ...sEnf, status: 'synced' };
          else mergedEnfants.push({ ...sEnf, status: 'synced' });
        });
      }

      if (Array.isArray(data.vaccinsToUpdate)) {
        data.vaccinsToUpdate.forEach((sVac: any) => {
          const index = mergedVaccins.findIndex(v => v.id === sVac.id);
          if (index > -1) mergedVaccins[index] = { ...sVac, status: 'synced' };
          else mergedVaccins.push({ ...sVac, status: 'synced' });
        });
      }

      if (Array.isArray(data.alertesToUpdate)) {
        data.alertesToUpdate.forEach((sAle: any) => {
          const index = mergedAlertes.findIndex(a => a.id === sAle.id);
          if (index > -1) mergedAlertes[index] = { ...sAle, status: 'synced' };
          else mergedAlertes.push({ ...sAle, status: 'synced' });
        });
      }

      // Update state
      setLocalMamans(mergedMamans);
      setLocalEnfants(mergedEnfants);
      setLocalVaccins(mergedVaccins);
      setLocalAlertes(mergedAlertes);

      // Save the returned Synchronisation Log
      if (data.sync_log) {
        setLocalSyncLogs(prev => [data.sync_log, ...prev]);
      }

      // Refresh Central office database statistics
      await fetchCentralMetrics();
    } catch (e: any) {
      alert("❌ Une erreur de réseau est survenue lors de la tentative de synchronisation : " + e.message);
    } finally {
      setSyncingLoading(false);
    }
  };

  // --- LOGIC: ADMIN PANEL HEALTH DEPUTY UPDATE VACCINE STATUS ---
  const handleUpdateVaccineStatusAdmin = (vacId: string, estFait: boolean, lot: string, agent: string, dateStr: string) => {
    const updated = localVaccins.map(v => {
      if (v.id === vacId) {
        return {
          ...v,
          est_fait: estFait,
          numero_lot: lot,
          agent_nom: agent,
          date_fait: estFait ? dateStr || new Date().toISOString().split('T')[0] : undefined,
          status: v.status === 'synced' ? 'pending_update' : v.status
        };
      }
      return v;
    });
    setLocalVaccins(updated);
    
    // Create detailed clinical log for status audits
    const vacName = localVaccins.find(v => v.id === vacId)?.nom;
    const logMsg: SyncLog = {
      id: generateOfflineUUID('log'),
      timestamp: new Date().toISOString(),
      direction: 'push',
      records_sent: 1,
      records_received: 0,
      status: 'success',
      details: `MEDECIN : Vaccin ${vacName || vacId} mis à jour (${estFait ? 'Fait' : 'Non fait'}). Lot: ${lot}.`
    };
    setLocalSyncLogs(current => [logMsg, ...current]);
  };

  // --- SECRET LOGO CLICKS HANDLER FOR HEALTH DEPT ADMIN PANEL ---
  const handleLogoClick = () => {
    setLogoClicksCount(prev => {
      const next = prev + 1;
      if (next >= 4) {
        setShowAdminStatusPanel(true);
        const logMsg: SyncLog = {
          id: generateOfflineUUID('log'),
          timestamp: new Date().toISOString(),
          direction: 'pull',
          records_sent: 0,
          records_received: 0,
          status: 'success',
          details: 'DÉVERROUILLAGE : Accès secret Administration Clinique par 4 clics logo.'
        };
        setLocalSyncLogs(current => [logMsg, ...current]);
        return 0; // reset
      }
      return next;
    });
  };

  // --- LOGIC: REGISTER PRENATAL CONSULTATION (CPN) ---
  const handleAddNewCpnVisite = (mamanId: string) => {
    if (!cpnPoids || !cpnTension) {
      alert("Veuillez saisir le poids et la tension de la maman.");
      return;
    }
    const poids = parseFloat(cpnPoids);
    if (isNaN(poids) || poids <= 0) {
      alert("Poids invalide.");
      return;
    }

    const updatedMamans = localMamans.map(m => {
      if (m.id === mamanId) {
        const list = m.cpn_visites || [];
        let updatedList;
        if (realizeCpnId) {
          // Update the pre-scheduled consultation to complete it
          updatedList = list.map(c => {
            if (c.id === realizeCpnId) {
              return {
                ...c,
                date: new Date().toISOString().split('T')[0],
                poids_maman: poids,
                tension: cpnTension,
                notes: cpnNotes || 'Consultation effectuée.',
                est_realise: true
              };
            }
            return c;
          });
        } else {
          // Append a fresh custom consultation to the list
          const newVisite: CpnVisite = {
            id: generateOfflineUUID('cpn'),
            date: new Date().toISOString().split('T')[0],
            trimestre: Number(cpnTrimestre),
            poids_maman: poids,
            tension: cpnTension,
            notes: cpnNotes || 'Consultation de routine.',
            est_realise: true
          };
          updatedList = [...list, newVisite];
        }
        return {
          ...m,
          cpn_visites: updatedList,
          status: m.status === 'synced' ? 'pending_update' : m.status,
          last_updated: new Date().toISOString()
        };
      }
      return m;
    });

    setLocalMamans(updatedMamans as any);
    setShowCpnForm(false);
    setRealizeCpnId(null);
    setCpnPoids('');
    setCpnNotes('');
    
    // Log Sync Event
    const maman = localMamans.find(m => m.id === mamanId);
    const label = realizeCpnId ? "complétée et enregistrée" : "ajoutée";
    const newLog: SyncLog = {
      id: generateOfflineUUID('log'),
      timestamp: new Date().toISOString(),
      direction: 'push',
      records_sent: 1,
      records_received: 0,
      status: 'success',
      details: `CPN (T${cpnTrimestre}) ${label} localement pour ${maman?.nom || 'la maman'}.`
    };
    setLocalSyncLogs(prev => [newLog, ...prev]);
  };

  // --- MULTILINGUAL VOICE GUIDANCE HANDLER (PHONETIC AUDIO FOR LOCAL LANGUAGES) ---
  const triggerVoiceAssist = (
    title: string,
    mamanNom: string,
    type: 'profile' | 'vaccine' | 'cpn',
    extra?: string,
    overrideLang?: 'dioula' | 'baoule' | 'bete' | 'francais'
  ) => {
    const lang = overrideLang || globalLanguage || 'francais';
    
    window.speechSynthesis.cancel();
    setIsVoiceCurrentlyPlaying(false);

    let textFr = "";
    let textPhonetic = "";

    if (type === 'profile') {
      textFr = `Fiche d'AyaSanté pour maman ${mamanNom}. Village d'origine : ${extra || 'zone rurale'}. Données médicales stockées de manière sécurisée hors-ligne.`;
      
      if (lang === 'dioula') {
        textPhonetic = `I bôra ${extra || 'dugu'} dugu kônô. Maman ${mamanNom} ka kénéya gari-taw dɔgɔ-tɔrɔso gnakaradi.`;
      } else if (lang === 'baoule') {
        textPhonetic = `Maman ${mamanNom} i bô ${extra || 'lopa'} lopa klô. Kénéa bôba ye mami fɛ bô baola.`;
      } else if (lang === 'bete') {
        textPhonetic = `Maman ${mamanNom} bhô ${extra || 'gre'} gre dɔgɔtɔrɔ. Kéné gbo nion koblali dɔgɔtɔrɔ faza de bété.`;
      } else {
        textPhonetic = textFr;
      }
    } else if (type === 'vaccine') {
      textFr = `Alerte vaccinale d'AyaSanté. Le vaccin ${extra || 'recommandé'} protège l'enfant contre de graves infections. Veuillez emmener le bébé au dispensaire.`;
      
      if (lang === 'dioula') {
        textPhonetic = `Fura-kisɛ ${extra || 'sogo'} bɛ i dden sogo. An ddem kɛnyɛ-ya lamini dɔgɔtɔrɔ sora dɔni dɔni.`;
      } else if (lang === 'baoule') {
        textPhonetic = `Dolo ko dden gbo vaccina ${extra || 'Penta'} kaba o bounzoua lakari boro ma rabi dɔgɔtɔrɔ-so.`;
      } else if (lang === 'bete') {
        textPhonetic = `Likpo go dden kéné gbo vaccina ${extra || 'BCG'} ko dɔgɔtɔrɔ-so dden loba.`;
      } else {
        textPhonetic = textFr;
      }
    } else if (type === 'cpn') {
      textFr = `Consultation prénatale pour surveiller votre grossesse. Prévue au trimestre ${extra || '1'}. Prenez régulièrement votre fer et acide folique.`;
      
      if (lang === 'dioula') {
        textPhonetic = `🤰 Sinin i bɛ dɔgɔ-tɔrɔso taaraw bange tulon fɛ kɛnyɛ-ya trimestre ${extra || 'kura'}.`;
      } else if (lang === 'baoule') {
        textPhonetic = `🤰 CPN awou-lalè kéné weun bô mami ba dolo fɛ trimestre ${extra || 'ko'}.`;
      } else if (lang === 'bete') {
        textPhonetic = `🤰 CPN dɔgɔtɔrɔ faza lomi baghi trimestre ${extra || 'bhô'}.`;
      } else {
        textPhonetic = textFr;
      }
    }

    const info = {
      title,
      textFr,
      textPhonetic,
      lang
    };

    setActiveSpeechInfo(info);
    setIsVoiceCurrentlyPlaying(true);

    const utterance = new SpeechSynthesisUtterance(info.textPhonetic);
    utterance.lang = 'fr-FR'; // Standardized voice carrying realistic African French pronunciation
    utterance.rate = 0.82; 
    
    utterance.onend = () => {
      setIsVoiceCurrentlyPlaying(false);
    };
    utterance.onerror = () => {
      setIsVoiceCurrentlyPlaying(false);
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopVoiceAssist = () => {
    window.speechSynthesis.cancel();
    setIsVoiceCurrentlyPlaying(false);
    setActiveSpeechInfo(null);
  };

  // --- LOGIC: REGISTER MOTHER ---
  const handleAddNewMaman = (newMaman: Maman) => {
    setLocalMamans(prev => [newMaman, ...prev]);
    setShowMamanModal(false);
    setSelectedMamanId(newMaman.id);
    setUnlockedMamanId(newMaman.id);
  };

  // --- LOGIC: REGISTER CHILD & EMIT PEV SCHEDULE ---
  const handleAddNewEnfant = (newEnfant: Enfant) => {
    // 1. Add child record
    setLocalEnfants(prev => [newEnfant, ...prev]);

    // 2. Generate and append their PEV immunization program
    const schedule = generateVaccineCalendarForChild(newEnfant.id, newEnfant.date_naissance);
    setLocalVaccins(prev => [...schedule, ...prev]);

    // 3. Create initial registration local alerting notice
    const maman = localMamans.find(m => m.id === newEnfant.maman_id);
    const newAlerte: Alerte = {
      id: generateOfflineUUID('al'),
      maman_id: newEnfant.maman_id,
      maman_nom: maman?.nom || 'Maman',
      enfant_id: newEnfant.id,
      enfant_nom: newEnfant.nom,
      type: 'VOCAL',
      langue: 'dioula',
      date_prevue: calculateVaccineDueDate(newEnfant.date_naissance, 1.5),
      message_texte: `AyaSanté: Rappel du vaccin PENTA_1 pour ${newEnfant.nom} prévu au dispensaire de village.`,
      script_vocal: `Bonjour Maman ${maman?.nom}. Protégez ${newEnfant.nom}. C'est l'heure du premier vaccin pentavalent. Rendons-nous au centre de santé rurale.`,
      statut_envoi: 'planifie',
      status: 'pending_creation',
      last_updated: new Date().toISOString()
    };
    setLocalAlertes(prev => [newAlerte, ...prev]);

    setShowEnfantModal(false);
    setSelectedEnfantId(newEnfant.id);
  };

  // --- LOGIC: ADD NEW WEIGHING LOG TO GROWTH CHART ---
  const handleAddWeightRecord = () => {
    if (!selectedEnfantId || !newWeightValue) return;
    const val = parseFloat(newWeightValue);
    if (isNaN(val) || val <= 0) return;

    const updatedEnfants = localEnfants.map(enf => {
      if (enf.id === selectedEnfantId) {
        const hPoids = [...enf.historique_poids, { date: new Date().toISOString().split('T')[0], valeur: val }];
        return {
          ...enf,
          poids_actuel: val,
          historique_poids: hPoids,
          status: enf.status === 'synced' ? 'pending_update' : enf.status, // transition of synchronization status
          last_updated: new Date().toISOString()
        };
      }
      return enf;
    });

    setLocalEnfants(updatedEnfants as any);
    setNewWeightValue('');
  };

  // --- LOGIC: EXECUTE LOW LITERACY VACCINATION ---
  const handleAdministerVaccineSubmit = () => {
    if (!activeAdministerVaccine) return;

    const updatedVaccines = localVaccins.map(vac => {
      if (vac.id === activeAdministerVaccine.id) {
        return {
          ...vac,
          est_fait: true,
          date_administration: new Date().toISOString().split('T')[0],
          lot_number: vaccineLot || 'LOT-CIV-PEV',
          agent_nom_charge: vaccineAgent,
          status: vac.status === 'synced' ? 'pending_update' : vac.status,
          last_updated: new Date().toISOString()
        };
      }
      return vac;
    });

    setLocalVaccins(updatedVaccines);
    setActiveAdministerVaccine(null);
    setVaccineLot('');
  };

  // Clear demo changes completely to start fresh
  const handleResetDemoData = () => {
    if (confirm("Réinitialiser les données locales démo d'AyaSanté ? Cela va restaurer les patients par défaut.")) {
      localStorage.removeItem('ayasanté_mamans');
      localStorage.removeItem('ayasanté_enfants');
      localStorage.removeItem('ayasanté_vaccins');
      localStorage.removeItem('ayasanté_alertes');
      localStorage.removeItem('ayasanté_sync_logs');
      window.location.reload();
    }
  };

  // Filtering variables
  const [strictMatriculeSearch, setStrictMatriculeSearch] = useState<boolean>(false);

  const filteredMamans = localMamans.filter(m => {
    const s = searchParam.trim().toLowerCase();
    if (!s) return true;

    const mamanMatriculeFormatted = (m.matricule || `AYA-M-${m.id.slice(-4).toUpperCase()}`).toLowerCase();
    
    // Check if search query matches the maman's matricule in multiple formats:
    // Format 1: AYA-M-1049 (Full)
    // Format 2: M-1049 (Short)
    // Format 3: 1049 (Numeric suffix)
    const matchesMamanMatricule = 
      mamanMatriculeFormatted === s || 
      mamanMatriculeFormatted.includes(s) ||
      mamanMatriculeFormatted.replace('aya-', '').includes(s) ||
      (s.length >= 3 && mamanMatriculeFormatted.endsWith(s));

    if (strictMatriculeSearch) {
      if (matchesMamanMatricule) return true;

      // Check child strict matricule match
      return localEnfants.some(ch => {
        if (ch.maman_id !== m.id) return false;
        const childMatriculeFormatted = (ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`).toLowerCase();
        return childMatriculeFormatted === s || 
               childMatriculeFormatted.includes(s) ||
               childMatriculeFormatted.replace('aya-', '').includes(s) ||
               (s.length >= 3 && childMatriculeFormatted.endsWith(s));
      });
    }

    // Normal loose search of other maman fields if not strict
    const matchesMamanFields = m.nom.toLowerCase().includes(s) || 
                              m.village.toLowerCase().includes(s) || 
                              m.region.toLowerCase().includes(s);

    if (matchesMamanMatricule || matchesMamanFields) return true;

    // Check if any child of this mother matches by name or matricule
    const matchesChild = localEnfants.some(ch => {
      if (ch.maman_id !== m.id) return false;
      const childMatriculeFormatted = (ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`).toLowerCase();
      
      const childMatchesMatricule = 
        childMatriculeFormatted === s || 
        childMatriculeFormatted.includes(s) ||
        childMatriculeFormatted.replace('aya-', '').includes(s) ||
        (s.length >= 3 && childMatriculeFormatted.endsWith(s));

      const childMatchesFields = ch.nom.toLowerCase().includes(s);

      return childMatchesMatricule || childMatchesFields;
    });
    return matchesChild;
  });

  const selectedMaman = localMamans.find(m => m.id === selectedMamanId) || null;
  const selectedEnfant = localEnfants.find(e => e.id === selectedEnfantId) || null;
  const mamanEnfants = selectedMaman ? localEnfants.filter(e => e.maman_id === selectedMaman.id) : [];
  const selectedEnfantVaccines = selectedEnfant ? localVaccins.filter(v => v.enfant_id === selectedEnfant.id).sort((a,b) => a.age_recommande_mois - b.age_recommande_mois) : [];

  return (
    <div className="min-h-screen bg-stone-100 flex flex-col antialiased">
      {/* BEAUTIFUL COMPACT WEB HEADER (REPLACES sim-connectivity-header) */}
      <header className="bg-stone-900 text-stone-100 py-3.5 px-6 shadow-md sticky top-0 z-40">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div 
            onClick={handleLogoClick}
            className="flex items-center gap-2.5 cursor-pointer hover:opacity-90 select-none active:scale-95"
            title="Cliquez 4 fois pour l'Administration Clinique"
          >
            <div className="p-1.5 bg-emerald-500/10 rounded-lg text-emerald-400 border border-emerald-500/20">
              <Heart className="w-5 h-5 fill-emerald-500 stroke-none" />
            </div>
            <div>
              <h1 className="font-sans font-extrabold text-stone-100 text-sm md:text-base tracking-tight leading-none flex items-center gap-1.5">
                AyaSanté <span className="text-[10px] uppercase bg-emerald-500/15 text-emerald-400 px-1.5 py-0.5 rounded-md font-bold tracking-wider">CIV</span>
                {logoClicksCount > 0 && (
                  <span className="text-[10.5px] bg-amber-500 text-stone-900 font-extrabold px-1 rounded animate-pulse">
                    Admin {logoClicksCount}/4
                  </span>
                )}
              </h1>
              <span className="text-[11px] text-stone-400 font-sans mt-0.5 block">
                Suivi maternel, pédiatrique & vaccinal (Côte d'Ivoire)
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Sync flag is connected */}
            {localMamans.some(m => m.status.startsWith('pending')) && (
              <span className="text-[10px] text-amber-300 bg-amber-500/10 border border-amber-500/25 rounded-lg px-2.5 py-1 font-bold animate-pulse">
                Modifications locales
              </span>
            )}

            {isConnected ? (
              <button
                id="sync-btn-header"
                onClick={handleTriggerSync}
                className="px-2.5 py-1 bg-emerald-600 active:bg-emerald-700 hover:bg-emerald-650 rounded-lg text-[10px] font-bold text-white flex items-center gap-1 transition-all cursor-pointer shadow-3xs"
              >
                <RefreshCw className="w-2.5 h-2.5" />
                <span>Sync</span>
              </button>
            ) : (
              <span className="px-2 py-0.5 bg-stone-800 text-[9px] font-mono text-amber-500 rounded border border-amber-500/20">
                Mode Hors-Ligne
              </span>
            )}

            {/* Subtle Connection Switcher */}
            <div className="flex bg-stone-800 p-0.5 rounded-lg border border-stone-700">
              <button
                id="switch-offline-btn"
                onClick={() => setIsConnected(false)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  !isConnected
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                Hors-Ligne
              </button>
              <button
                id="switch-online-btn"
                onClick={() => setIsConnected(true)}
                className={`px-2 py-1 rounded-md text-[10px] font-bold transition-all cursor-pointer ${
                  isConnected
                    ? 'bg-emerald-600 text-white shadow-xs'
                    : 'text-stone-400 hover:text-white'
                }`}
              >
                En Ligne
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* DETAILED CONTENT WORKSPACE */}
      <div id="main-integral-workspace" className="flex-1 max-w-4xl mx-auto w-full p-4 lg:p-6 flex flex-col justify-stretch">
        
        {/* ENTIRE CENTRAL CARD */}
        <div className="bg-stone-50 border border-stone-200 shadow-sm rounded-2xl flex flex-col flex-1 overflow-hidden min-h-[640px] relative">
          
          {!isUnlocked ? (
            // Screen Locked State
            <div className="flex-1 flex items-center justify-center bg-white p-6 md:p-12">
              <PasscodeScreen 
                onUnlock={() => setIsUnlocked(true)} 
                workerName="Agent Coulibaly (Centre de Gagnoa)" 
              />
            </div>
          ) : (
            // Screen Unlocked State - Active App
            <div className="flex-1 flex flex-col overflow-hidden">
              
              {/* SUB-HEADER APP BAR */}
              <div className="bg-white border-b border-stone-200 px-3 py-2 flex gap-1 shadow-2xs">
                    <button
                      id="tab-membres"
                      onClick={() => { setActiveTab('membres'); setSelectedMamanId(null); }}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTab === 'membres'
                          ? 'bg-emerald-50 text-emerald-850 ring-1 ring-emerald-500/10'
                          : 'text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      <Users className="w-3.5 h-3.5" />
                      <span>Mamans</span>
                    </button>
                    <button
                      id="tab-vocal"
                      onClick={() => setActiveTab('vocal')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTab === 'vocal'
                          ? 'bg-emerald-50 text-emerald-850 ring-1 ring-emerald-500/10'
                          : 'text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      <Volume2 className="w-3.5 h-3.5" />
                      <span>Conseils AI</span>
                    </button>
                    <button
                      id="tab-pediatres"
                      onClick={() => setActiveTab('pediatres')}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold font-sans flex items-center justify-center gap-1 transition-all cursor-pointer ${
                        activeTab === 'pediatres'
                          ? 'bg-emerald-50 text-emerald-850 ring-1 ring-emerald-500/10'
                          : 'text-stone-500 hover:bg-stone-50'
                      }`}
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span>Pédiatres</span>
                    </button>
                  </div>

                  {/* GLOBAL VOICE SELECTION RIBBON FOR LOW-LITERACY HELP */}
                  <div className="bg-[#12583e] text-white px-3 py-1.5 flex items-center justify-between gap-1 shadow-sm select-none">
                    <span className="text-[10px] font-extrabold flex items-center gap-1.5 shrink-0 uppercase tracking-tight text-amber-300">
                      <Volume2 className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
                      <span>Radio vocal Aya :</span>
                    </span>
                    <div className="flex gap-1.5">
                      {[
                        { code: 'francais', label: 'FR' },
                        { code: 'dioula', label: 'Dioula' },
                        { code: 'baoule', label: 'Baoulé' },
                        { code: 'bete', label: 'Bété' }
                      ].map((lg) => (
                        <button
                          key={lg.code}
                          onClick={() => {
                            setGlobalLanguage(lg.code as any);
                            // If speech is playing, instantly shift voice language
                            if (activeSpeechInfo) {
                              triggerVoiceAssist(activeSpeechInfo.title, "", "profile", "", lg.code as any);
                            }
                          }}
                          className={`text-[9.5px] font-black px-2 py-0.5 rounded transition-all cursor-pointer ${
                            globalLanguage === lg.code
                              ? 'bg-amber-400 text-stone-900 shadow-md scale-105 font-extrabold'
                              : 'bg-emerald-900/60 hover:bg-emerald-800 text-emerald-100'
                          }`}
                        >
                          {lg.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* ACTIVE APP BODY WINDOW */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3 relative">
                    
                    {activeTab === 'membres' && (
                      <div className="space-y-3">
                        
                        {/* Selected Patient Record / child detail subview if expanded */}
                        {selectedMamanId ? (
                          selectedMamanId !== unlockedMamanId ? (
                            <MamanPinUnlockContainer 
                              selectedMaman={selectedMaman!} 
                              onUnlock={() => setUnlockedMamanId(selectedMamanId)} 
                              onCancel={() => { setSelectedMamanId(null); setSelectedEnfantId(null); setUnlockedMamanId(null); }}
                              triggerVoiceAssist={triggerVoiceAssist}
                            />
                          ) : (
                            <div className="space-y-3 animate-fade-in">
                              {/* GO BACK HANDLE */}
                              <button
                                id="btn-back-to-list"
                                onClick={() => { setSelectedMamanId(null); setSelectedEnfantId(null); setUnlockedMamanId(null); }}
                                className="text-[11px] font-bold text-emerald-800 hover:emerald-900 flex items-center gap-1 cursor-pointer"
                              >
                                ← Retour à l'annuaire des Mamans
                              </button>

                            {/* Patient Core Card */}
                            {selectedMaman && (
                              <div className="bg-white p-3.5 rounded-xl border border-stone-200 shadow-3xs relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-50 rounded-bl-full flex items-center justify-center text-emerald-600 font-extrabold pr-2 pt-2">
                                  {selectedMaman.status === 'synced' ? (
                                    <CheckCircle2 className="w-4 h-4 text-emerald-700" title="Synchronisé" />
                                  ) : (
                                    <Clock className="w-4 h-4 text-amber-500 animate-pulse" title="En attente de réseau" />
                                  )}
                                </div>

                                <div className="flex gap-1.5 flex-wrap items-center">
                                  <span className="text-[9px] uppercase font-mono tracking-wider font-extrabold px-2 py-0.5 bg-stone-100 text-stone-600 rounded">
                                    Région {selectedMaman.region}
                                  </span>
                                  <span className="text-[9px] uppercase font-mono tracking-wider font-black px-2 py-0.5 bg-emerald-100 text-emerald-900 rounded border border-emerald-200">
                                    👤 Matricule : {selectedMaman.matricule || `AYA-M-${selectedMaman.id.slice(-4).toUpperCase()}`}
                                  </span>
                                </div>
                                <div className="flex items-center justify-between mt-1">
                                  <h3 className="text-base font-sans font-bold text-stone-850">{selectedMaman.nom}</h3>
                                  <div className="flex items-center gap-1.5">
                                    {selectedMaman.est_enceinte && (
                                      <span className="text-[10px] font-black bg-rose-50 text-rose-700 px-2 py-0.5 rounded-full border border-rose-200">
                                        🤰 ENCEINTE
                                      </span>
                                    )}
                                    <button
                                      id="speak-maman-profile-btn"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        triggerVoiceAssist(
                                          `Fiche d'aide de ${selectedMaman.nom}`,
                                          selectedMaman.nom,
                                          'profile',
                                          selectedMaman.village
                                        );
                                      }}
                                      className="p-1 px-1.5 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-full cursor-pointer transition-all active:scale-95 flex items-center justify-center"
                                      title="Écouter la fiche vocale"
                                    >
                                      <Volume2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                </div>
                                <p className="text-xs text-stone-500 mt-1 flex items-center gap-1.5 font-medium">
                                  📍 Village : <strong className="text-stone-700">{selectedMaman.village}</strong>
                                </p>
                                <p className="text-xs text-stone-500 flex items-center gap-1.5 font-medium">
                                  📞 Contact : <strong className="text-stone-700">{selectedMaman.contact}</strong>
                                </p>
                                {selectedMaman.est_enceinte && selectedMaman.date_accouchement_prevue && (
                                  <p className="text-xs text-rose-700 flex items-center gap-1.5 font-semibold bg-rose-50/50 p-1.5 rounded mt-1.5 border border-rose-100">
                                    📅 Accouchement prévu (terme) : <strong className="text-rose-800">{selectedMaman.date_accouchement_prevue}</strong>
                                  </p>
                                )}

                                {/* Gynécological visit section CPN */}
                                <div className="mt-3.5 pt-3 border-t border-stone-150">
                                  <div className="flex items-center justify-between mb-2">
                                    <h4 className="text-[11.5px] font-sans font-bold text-stone-750 uppercase tracking-tight">
                                      Suivi Consultation Prénatale (CPN)
                                    </h4>
                                    <div className="flex items-center gap-1.5">
                                      <button
                                        id="speak-cpn-guidelines-btn"
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          triggerVoiceAssist(
                                            "Aide de grossesse CPN",
                                            selectedMaman.nom,
                                            'cpn',
                                            String(selectedMaman.cpn_visites.length + 1)
                                          );
                                        }}
                                        className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-lg cursor-pointer flex items-center justify-center p-1"
                                        title="Écouter les consignes de grossesse"
                                      >
                                        <Volume2 className="w-3 h-3" />
                                      </button>
                                      
                                      <button
                                        id="add-cpn-btn"
                                        onClick={() => {
                                          if (showCpnForm) {
                                            setShowCpnForm(false);
                                            setRealizeCpnId(null);
                                          } else {
                                            setRealizeCpnId(null);
                                            setShowCpnForm(true);
                                          }
                                        }}
                                        className="py-1 px-2.5 bg-emerald-700 text-white rounded text-[10px] font-bold flex items-center gap-0.5 cursor-pointer hover:bg-emerald-600 active:translate-y-0.5"
                                      >
                                        {showCpnForm ? "Fermer" : "+ Nouveau"}
                                      </button>
                                    </div>
                                  </div>

                                  {/* CPN Form */}
                                  {showCpnForm && (
                                    <div className="mb-3.5 p-3.5 bg-stone-50 border-2 border-emerald-600 rounded-xl space-y-2.5 text-stone-800 text-xs shadow-3xs animate-fade-in select-none">
                                      <div className="flex items-center gap-1.5 pb-1 border-b border-stone-250">
                                        <Heart className="w-4 h-4 text-emerald-700" />
                                        <h5 className="font-extrabold text-emerald-850 uppercase text-[10.5px]">
                                          {realizeCpnId ? `Compléter la consultation CPN (Trimestre ${cpnTrimestre})` : "Saisir une Consultation Prénatale Additionnelle"}
                                        </h5>
                                      </div>
                                      
                                      <div className="grid grid-cols-3 gap-2">
                                        <div>
                                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Trimestre :</label>
                                          <select
                                            id="cpn-trimestre-select"
                                            value={cpnTrimestre}
                                            disabled={realizeCpnId !== null}
                                            onChange={(e) => setCpnTrimestre(Number(e.target.value))}
                                            className="w-full bg-white border border-stone-300 p-1 text-xs rounded disabled:bg-stone-100 disabled:text-stone-500 font-bold"
                                          >
                                            <option value={1}>1er Trimestre</option>
                                            <option value={2}>2e Trimestre</option>
                                            <option value={3}>3e Trimestre</option>
                                          </select>
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Poids (kg) :</label>
                                          <input
                                            id="cpn-weight-input"
                                            type="number"
                                            step="0.1"
                                            placeholder="ex: 62.5"
                                            value={cpnPoids}
                                            onChange={(e) => setCpnPoids(e.target.value)}
                                            className="w-full bg-white border border-stone-300 p-1 text-xs rounded text-center font-bold"
                                          />
                                        </div>
                                        <div>
                                          <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Tension (TA) :</label>
                                          <input
                                            id="cpn-tension-input"
                                            type="text"
                                            placeholder="ex: 12/8"
                                            value={cpnTension}
                                            onChange={(e) => setCpnTension(e.target.value)}
                                            className="w-full bg-white border border-stone-300 p-1 text-xs rounded text-center font-bold"
                                          />
                                        </div>
                                      </div>

                                      <div>
                                        <label className="text-[10px] text-stone-500 font-bold block mb-0.5">Observations cliniques & Mémo de consultation :</label>
                                        <textarea
                                          id="cpn-notes-textarea"
                                          placeholder="Symptômes constatés, prescription de fer/acide folique, conseils donnés, etc."
                                          value={cpnNotes}
                                          onChange={(e) => setCpnNotes(e.target.value)}
                                          className="w-full bg-white border border-stone-300 p-1.5 text-xs rounded font-sans h-12"
                                        />
                                      </div>

                                      <div className="flex justify-end gap-1.5 pt-1">
                                        <button
                                          id="btn-cpn-cancel"
                                          type="button"
                                          onClick={() => {
                                            setShowCpnForm(false);
                                            setRealizeCpnId(null);
                                          }}
                                          className="py-1 px-2.5 bg-stone-200 text-stone-700 hover:bg-stone-300 text-[10px] font-bold rounded"
                                        >
                                          Annuler
                                        </button>
                                        <button
                                          id="btn-cpn-submit"
                                          type="button"
                                          onClick={() => handleAddNewCpnVisite(selectedMaman.id)}
                                          className="py-1 px-2.5 bg-emerald-600 text-stone-50 hover:bg-emerald-700 text-[10px] font-bold rounded"
                                        >
                                          Confirmer & Enregistrer
                                        </button>
                                      </div>
                                    </div>
                                  )}
                                  
                                  {selectedMaman.cpn_visites.length === 0 ? (
                                    <div className="p-2.5 bg-amber-50 text-amber-800 rounded-lg text-xs leading-relaxed border border-amber-200">
                                      🤰 Aucun examen prénatal enregistré. Veuillez planifier ou enregistrer la <strong className="font-bold underline">CPN 1</strong> pour débuter le suivi.
                                    </div>
                                  ) : (
                                    <div className="space-y-2">
                                      {selectedMaman.cpn_visites.map((cpn, idx) => {
                                        const estPlanifie = cpn.est_realise === false;
                                        return (
                                          <div key={cpn.id} className={`p-3 rounded-xl border transition-all text-xs ${
                                            estPlanifie 
                                              ? 'bg-amber-50/45 border-amber-200/80 hover:bg-amber-50 text-stone-750' 
                                              : 'bg-stone-50 border-stone-200 text-stone-600'
                                          }`}>
                                            <div className="flex justify-between items-center mb-1 font-bold">
                                              <div className="flex items-center gap-1.5 flex-wrap">
                                                <span className="text-emerald-850 font-sans font-black">CPN Trimestre {cpn.trimestre}</span>
                                                {estPlanifie ? (
                                                  <span className="text-[8.5px] uppercase font-bold tracking-wider font-mono px-1.5 py-0.5 bg-amber-100 text-amber-900 border border-amber-200 rounded">
                                                    ⏳ Planifiée
                                                  </span>
                                                ) : (
                                                  <span className="text-[8.5px] uppercase font-bold tracking-wider font-mono px-1.5 py-0.5 bg-emerald-100 text-emerald-950 border border-emerald-200 rounded">
                                                    ✅ Réalisée
                                                  </span>
                                                )}
                                              </div>
                                              <span className="text-stone-400 font-mono text-[9.5px]">{cpn.date}</span>
                                            </div>

                                            {estPlanifie ? (
                                              <div className="mt-2 pt-2 border-t border-dashed border-amber-250/80 flex justify-between items-center bg-transparent gap-2 flex-wrap">
                                                <span className="text-[10px] text-amber-800 font-semibold italic">
                                                  Examen planifié d'office. Enregistrer les mesures cliniques.
                                                </span>
                                                <button
                                                  type="button"
                                                  onClick={() => {
                                                    setRealizeCpnId(cpn.id);
                                                    setCpnTrimestre(cpn.trimestre);
                                                    setCpnPoids('');
                                                    setCpnTension('12/8');
                                                    setCpnNotes('');
                                                    setShowCpnForm(true);
                                                  }}
                                                  className="py-1 px-2 pb-1 bg-amber-600 hover:bg-amber-700 text-stone-50 rounded font-bold text-[10px] flex items-center gap-0.5 cursor-pointer transition-all active:translate-y-0.5"
                                                >
                                                  ✍️ Saisir Examen
                                                </button>
                                              </div>
                                            ) : (
                                              <>
                                                <div className="grid grid-cols-2 gap-1 text-[10px] pb-1 font-semibold text-stone-500">
                                                  <span>⚖️ Poids : <strong className="font-extrabold text-stone-700">{cpn.poids_maman} kg</strong></span>
                                                  <span>🩺 Tension : <strong className="font-extrabold text-stone-700">{cpn.tension}</strong></span>
                                                </div>
                                                <p className="italic text-stone-600 text-[10.5px] bg-white p-2 rounded-lg border border-stone-200 mt-1">
                                                  ✏️ {cpn.notes}
                                                </p>
                                              </>
                                            )}
                                          </div>
                                        );
                                      })}
                                    </div>
                                  )}
                                </div>
                              </div>
                            )}

                            {/* Enfant details rattachés */}
                            <div className="space-y-2.5">
                              <div className="flex justify-between items-center">
                                <h4 className="text-[12px] font-bold text-stone-800 uppercase tracking-tight">👦 Enfants Enregistrés ({mamanEnfants.length})</h4>
                                <button
                                  id="add-child-btn-trigger"
                                  onClick={() => setShowEnfantModal(true)}
                                  className="py-1 px-2.5 bg-teal-800 text-white rounded-lg text-xs font-bold leading-none flex items-center gap-1 cursor-pointer hover:bg-teal-700 active:translate-y-0.5"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Ajouter Enfant</span>
                                </button>
                              </div>

                              {mamanEnfants.length === 0 ? (
                                <div className="p-4 bg-white border border-dashed border-stone-300 rounded-xl text-center text-xs text-stone-500 font-sans">
                                  Aucun enfant enregistré pour cette maman. Cliquez ci-dessus pour en rattacher un du village.
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {mamanEnfants.map((child) => (
                                    <div
                                      id={`child-card-${child.id}`}
                                      key={child.id}
                                      onClick={() => setSelectedEnfantId(child.id === selectedEnfantId ? null : child.id)}
                                      className={`p-3 rounded-xl border transition-all cursor-pointer ${
                                        selectedEnfantId === child.id
                                          ? 'border-teal-600 bg-teal-50/20 shadow-xs ring-1 ring-teal-500/10'
                                          : 'border-stone-200 bg-white hover:border-stone-300 shadow-3xs'
                                      }`}
                                    >
                                      <div className="flex justify-between items-start">
                                        <div className="flex gap-2 items-center">
                                          <div className="p-1.5 bg-teal-100 text-teal-700 rounded-lg">
                                            <Baby className="w-4 h-4" />
                                          </div>
                                          <div>
                                            <div className="flex items-center gap-1.5 flex-wrap">
                                              <h5 className="text-sm font-sans font-extrabold text-stone-850 leading-tight">
                                                {child.nom}
                                              </h5>
                                              <span className="text-[9px] bg-teal-100 text-teal-800 border border-teal-200 font-mono font-bold px-1.5 py-0.5 rounded uppercase">
                                                {child.matricule || `AYA-E-${child.id.slice(-4).toUpperCase()}`}
                                              </span>
                                            </div>
                                            <span className="text-[10px] text-stone-500 font-sans block mt-1">
                                              Date de naiss : {child.date_naissance} ({getAgeInMonths(child.date_naissance)} mois)
                                            </span>
                                          </div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                          <span className={`text-[8.5px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                            child.status === 'synced' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                          }`}>
                                            {child.status === 'synced' ? 'synced' : 'pending'}
                                          </span>
                                        </div>
                                      </div>

                                      {/* Expanded child health details / vaccine diary */}
                                      {selectedEnfantId === child.id && (
                                        <motion.div
                                          initial={{ height: 0, opacity: 0 }}
                                          animate={{ height: 'auto', opacity: 1 }}
                                          className="mt-3.5 pt-3.5 border-t border-stone-200 space-y-4 overflow-hidden"
                                        >
                                          {/* WHO Weight Curve component */}
                                          <GrowthChart enfant={child} />

                                          {/* Add Weight Input Form */}
                                          <div className="p-2.5 bg-stone-100 rounded-lg border border-stone-200 flex items-center justify-between gap-2.5">
                                            <span className="text-[10.5px] font-bold text-stone-700">⚖️ Nouveau Poids :</span>
                                            <div className="flex items-center gap-1">
                                              <input
                                                id="input-weight-new"
                                                type="number"
                                                step="0.1"
                                                placeholder="ex: 8.5"
                                                value={newWeightValue}
                                                onChange={(e) => setNewWeightValue(e.target.value)}
                                                className="w-16 text-center text-xs bg-white border border-stone-300 rounded p-1 font-mono font-bold"
                                              />
                                              <button
                                                id="btn-add-weight"
                                                onClick={handleAddWeightRecord}
                                                className="bg-teal-800 shrink-0 text-white text-xs font-bold py-1 px-2.5 rounded hover:bg-teal-700 cursor-pointer"
                                              >
                                                Ajouter
                                              </button>
                                            </div>
                                          </div>

                                          {/* VACCINES LISTS FOR SELECTED CHILD (DYNAMIC CALENDAR) */}
                                          <div className="space-y-1.5">
                                            <h6 className="text-[11.5px] font-sans font-bold text-stone-750 uppercase">
                                              💉 Calendrier de Vaccination Dynamique (PEV)
                                            </h6>

                                            <div className="grid grid-cols-1 gap-2">
                                              {selectedEnfantVaccines.map((vac) => (
                                                <div
                                                  id={`vaccine-row-${vac.id}`}
                                                  key={vac.id}
                                                  className={`p-2.5 rounded-lg border flex items-center justify-between text-xs transition-all ${
                                                    vac.est_fait
                                                      ? 'bg-emerald-50/50 border-emerald-250 text-emerald-900'
                                                      : 'bg-white border-stone-250 text-stone-700'
                                                  }`}
                                                >
                                                  <div className="flex gap-2 items-center">
                                                    <div className={`w-6.5 h-6.5 rounded-full flex items-center justify-center font-bold text-[10.5px] ${
                                                      vac.est_fait ? 'bg-emerald-200 text-emerald-800' : 'bg-stone-150 text-stone-600'
                                                    }`}>
                                                      {vac.vaccin_code.substring(0, 4)}
                                                    </div>
                                                    <div>
                                                      <span className="font-bold block text-[11px] leading-tight">
                                                        {vac.nom}
                                                      </span>
                                                      <span className="text-[9.5px] text-stone-400 font-sans block leading-none mt-0.5">
                                                        Maladie : {vac.description} • Prévu : {vac.date_prevue}
                                                      </span>
                                                    </div>
                                                  </div>

                                                  <div className="flex items-center gap-1.5 justify-end">
                                                    <button
                                                      id={`speak-vaccine-${vac.id}`}
                                                      type="button"
                                                      onClick={(e) => {
                                                        e.stopPropagation();
                                                        triggerVoiceAssist(
                                                          `Vaccin ${vac.nom}`,
                                                          child.nom,
                                                          'vaccine',
                                                          vac.nom
                                                        );
                                                      }}
                                                      className="p-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-sm cursor-pointer flex items-center justify-center"
                                                      title="Écouter l'enregistrement vocal"
                                                    >
                                                      <Volume2 className="w-3 h-3" />
                                                    </button>

                                                    {vac.est_fait ? (
                                                      <span className="px-1.5 py-0.5 bg-emerald-100 text-emerald-850 hover:bg-emerald-200 rounded text-[9.5px] font-semibold border border-emerald-200">
                                                        ✓ Fait
                                                      </span>
                                                    ) : (
                                                      <button
                                                        id={`btn-administer-${vac.vaccin_code}`}
                                                        onClick={() => setActiveAdministerVaccine(vac)}
                                                        className="py-1 px-2.5 bg-emerald-600 hover:bg-emerald-700 text-stone-50 rounded text-[10px] font-extrabold cursor-pointer transition-all"
                                                      >
                                                        Administrer
                                                      </button>
                                                    )}
                                                  </div>
                                                </div>
                                              ))}
                                            </div>
                                          </div>
                                        </motion.div>
                                      )}
                                    </div>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )
                      ) : (
                          // ANNURE DES MAMANS DIRECTORY LIST VIEW
                          <div className="space-y-3">
                            <div className="space-y-1">
                              <div className="flex justify-between items-center gap-2">
                                <div className="relative flex-1">
                                  <Search className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                                  <input
                                    id="village-mamans-search"
                                    type="text"
                                    placeholder="Nom, village, ou matricule (ex: AYA-M-1049, AYA-E-3928)..."
                                    value={searchParam}
                                    onChange={(e) => setSearchParam(e.target.value)}
                                    className="w-full text-xs bg-white border border-stone-300 rounded-xl py-2 pl-9 pr-4 text-stone-800 focus:outline-emerald-500 font-medium"
                                  />
                                </div>
                                <button
                                  id="btn-add-maman-trigger"
                                  onClick={() => setShowMamanModal(true)}
                                  className="bg-emerald-750 hover:bg-emerald-800 text-white rounded-xl py-2 px-3 font-bold text-xs flex items-center gap-1 shrink-0 shadow-3xs active:translate-y-0.5 cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5" />
                                  <span>Ajouter</span>
                                </button>
                              </div>
                              
                              <div className="flex flex-wrap items-center justify-between gap-y-1 px-1 pt-0.5 pb-1">
                                <span className="text-[9.5px] text-stone-500 italic block font-sans">
                                  🔍 Recherche par matricule de la maman ou du bébé.
                                </span>
                                <label className="inline-flex items-center gap-1 cursor-pointer text-[10px] text-emerald-850 font-bold bg-emerald-50/80 hover:bg-emerald-100 transition-colors px-1.5 py-0.5 rounded border border-emerald-200 select-none">
                                  <input
                                    type="checkbox"
                                    checked={strictMatriculeSearch}
                                    onChange={(e) => setStrictMatriculeSearch(e.target.checked)}
                                    className="rounded border-emerald-300 text-emerald-700 focus:ring-emerald-500 w-3 h-3"
                                  />
                                  <span>Matricule Strict uniquement</span>
                                </label>
                              </div>
                            </div>

                            {/* Mamans list iteration */}
                            {filteredMamans.length === 0 ? (
                              <div className="p-8 text-center bg-white border border-stone-200 rounded-2xl text-xs text-stone-400 font-sans">
                                <Users className="w-10 h-10 text-stone-200 mx-auto mb-2" />
                                Aucun patient trouvé correspondant à la recherche.
                              </div>
                            ) : (
                              <div className="space-y-2">
                                {filteredMamans.map((maman) => {
                                  const childs = localEnfants.filter(e => e.maman_id === maman.id);
                                  
                                  // Compute high-precision search matches for visual decoration
                                  const cleanSearch = searchParam.trim().toLowerCase();
                                  const mamanMatricule = (maman.matricule || `AYA-M-${maman.id.slice(-4).toUpperCase()}`).toLowerCase();
                                  const isMamanMatriculeMatch = cleanSearch && (
                                    mamanMatricule === cleanSearch ||
                                    mamanMatricule.includes(cleanSearch) ||
                                    mamanMatricule.replace('aya-', '').includes(cleanSearch)
                                  );

                                  const matchedChildMatricule = cleanSearch ? childs.find(ch => {
                                    const childMatricule = (ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`).toLowerCase();
                                    return childMatricule === cleanSearch ||
                                           childMatricule.includes(cleanSearch) ||
                                           childMatricule.replace('aya-', '').includes(cleanSearch);
                                  }) : null;

                                  const isExactResult = isMamanMatriculeMatch || matchedChildMatricule;

                                  return (
                                    <div
                                      id={`maman-card-${maman.id}`}
                                      key={maman.id}
                                      onClick={() => setSelectedMamanId(maman.id)}
                                      className={`p-3 rounded-xl transition-all cursor-pointer shadow-3xs flex justify-between items-center ${
                                        selectedMamanId === maman.id
                                          ? 'bg-emerald-50/70 border-2 border-emerald-600'
                                          : isExactResult 
                                            ? 'bg-emerald-50/40 border-2 border-emerald-400 hover:bg-emerald-50' 
                                            : 'bg-white hover:bg-stone-50 border border-stone-200 hover:border-emerald-500'
                                      }`}
                                    >
                                      <div className="space-y-1">
                                        <div className="flex items-center gap-1.5 flex-wrap">
                                          <h4 className="text-sm font-sans font-bold text-stone-850 leading-tight">
                                            {maman.nom}
                                          </h4>
                                          <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${
                                            isMamanMatriculeMatch 
                                              ? 'bg-emerald-200 text-emerald-950 border-emerald-300 ring-2 ring-emerald-400' 
                                              : 'bg-emerald-50 text-emerald-850 border-emerald-150'
                                          }`}>
                                            {maman.matricule || `AYA-M-${maman.id.slice(-4).toUpperCase()}`}
                                          </span>

                                          {/* Match Indicators */}
                                          {isMamanMatriculeMatch && (
                                            <span className="text-[8px] bg-emerald-650 text-white font-bold px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5 shadow-2xs">
                                              🎯 Matricule Mère
                                            </span>
                                          )}

                                          {matchedChildMatricule && (
                                            <span className="text-[8px] bg-rose-600 text-white font-bold px-1.5 py-0.5 rounded font-sans flex items-center gap-0.5 shadow-2xs">
                                              👶 {matchedChildMatricule.nom} ({matchedChildMatricule.matricule || `AYA-E-${matchedChildMatricule.id.slice(-4).toUpperCase()}`})
                                            </span>
                                          )}
                                        </div>
                                        <div className="flex flex-wrap items-center gap-y-1 gap-x-2 text-[10px] text-stone-500 font-semibold">
                                          <span className="flex items-center gap-0.5 text-stone-600">
                                            📍 {maman.village} ({maman.region})
                                          </span>
                                          <span className="text-stone-300">•</span>
                                          <span className="text-emerald-700">
                                            🤰 {childs.length} {childs.length === 1 ? 'enfant rattaché' : 'enfants rattachés'}
                                          </span>
                                        </div>
                                      </div>
                                      
                                      <div className="flex items-center gap-2">
                                        <span className={`text-[8px] uppercase font-bold px-1.5 py-0.5 rounded ${
                                          maman.status === 'synced' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                        }`}>
                                          {maman.status === 'synced' ? 'synced' : 'pending'}
                                        </span>
                                        <ChevronRight className="w-4 h-4 text-stone-300" />
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {activeTab === 'vocal' && (
                      <AyaAiAdvisor
                        mamans={localMamans}
                        enfants={localEnfants}
                        isOnline={isConnected}
                      />
                    )}

                    {activeTab === 'pediatres' && (
                      <div className="space-y-3">
                        <div className="bg-teal-50 border border-teal-200 p-2.5 rounded-xl text-[11px] text-teal-800 leading-relaxed">
                          📌 <strong>Conseils d'Urgence :</strong> En cas de convulsions, fièvre supérieure à 38°C persistante, ou diarrhées liquides profuses, appelez immédiatement l'un des pédiatres agréés à proximité ci-dessous.
                        </div>

                        {/* Add Pediatrician Header Trigger row */}
                        <div className="flex justify-between items-center gap-2 pt-0.5 pb-1">
                          <span className="text-[10px] text-stone-500 font-extrabold uppercase tracking-wider font-sans">
                            👩‍⚕️ Pédiatres partenaires
                          </span>
                          <button
                            id="btn-add-new-pediatre"
                            type="button"
                            onClick={() => setShowAddPediatreModal(true)}
                            className="inline-flex items-center gap-1 text-[10px] text-teal-900 font-bold bg-teal-50 hover:bg-teal-100/90 transition-colors px-2.5 py-1 rounded-lg border border-teal-200 shadow-3xs cursor-pointer select-none active:scale-95"
                          >
                            <Plus className="w-3 h-3 stroke-[2.5]" />
                            <span>Contacter un nouveau Pédiatre</span>
                          </button>
                        </div>

                        <div className="space-y-2">
                          {pediatricians.map((ped) => (
                            <div key={ped.id} className="p-3 bg-white border border-stone-200 rounded-xl shadow-3xs flex flex-col">
                              <div className="flex justify-between items-start">
                                <div>
                                  <span className="text-[9px] uppercase font-extrabold px-1.5 py-0.5 bg-teal-50 text-teal-800 rounded font-mono">
                                    {ped.ville}
                                  </span>
                                  <h4 className="text-sm font-sans font-extrabold text-stone-850 mt-1">{ped.nom}</h4>
                                  <p className="text-[11px] text-teal-700 font-sans font-semibold leading-tight">{ped.specialite}</p>
                                </div>
                              </div>

                              <p className="text-xs text-stone-400 font-sans mt-2.5">
                                📍 {ped.adresse}
                              </p>

                              <div className="mt-3 pt-2.5 border-t border-stone-100 flex justify-between items-center">
                                <span className="text-[10px] text-emerald-600 font-bold flex items-center gap-1">
                                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                                  Disponible
                                </span>
                                <a
                                  href={`tel:${ped.telephone}`}
                                  className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold rounded-lg text-xs flex items-center gap-1 shadow-3xs cursor-pointer"
                                >
                                  <PhoneCall className="w-3.5 h-3.5" />
                                  <span>Appeler</span>
                                </a>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                  </div>

                  {/* ACTIVE VOICE TRANSLATION ORAL PLAYER BAR */}
                  <AnimatePresence>
                    {activeSpeechInfo && (
                      <motion.div
                        id="voice-assist-player-bar"
                        initial={{ y: 80, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        exit={{ y: 80, opacity: 0 }}
                        className="bg-amber-400 border-t border-amber-500 p-3 flex flex-col gap-1.5 select-none text-stone-900 font-sans shadow-lg z-30 shrink-0"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-1.5">
                            <Headphones className="w-4 h-4 text-emerald-950 animate-bounce" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-emerald-950">
                              📻 Radio Aya : {activeSpeechInfo.lang.toUpperCase()}
                            </span>
                          </div>
                          
                          {/* Animated equalizer waves */}
                          {isVoiceCurrentlyPlaying && (
                            <div className="flex gap-0.5 items-end h-3">
                              <span className="w-0.5 h-full bg-emerald-950 rounded-sm animate-pulse" />
                              <span className="w-0.5 h-2/3 bg-emerald-950 rounded-sm animate-pulse delay-75" />
                              <span className="w-0.5 h-1/2 bg-emerald-950 rounded-sm animate-pulse delay-150" />
                              <span className="w-0.5 h-5/6 bg-emerald-950 rounded-sm animate-pulse" />
                            </div>
                          )}

                          <button
                            id="stop-speech-player-btn"
                            onClick={stopVoiceAssist}
                            className="bg-emerald-950 text-white rounded-full p-1 cursor-pointer hover:bg-emerald-900 flex items-center justify-center transition-all"
                            title="Fermer la lecture vocale"
                          >
                            <VolumeX className="w-3.5 h-3.5" />
                          </button>
                        </div>

                        {/* Title of active help query */}
                        <p className="text-[10.5px] font-black underline text-emerald-900 leading-tight">
                          {activeSpeechInfo.title}
                        </p>

                        {/* Phonetics representation to facilitate visual understanding of spoken voice */}
                        <div className="bg-white/70 p-2 rounded-lg border border-amber-300 text-[11px] font-extrabold text-stone-850 italic break-words leading-relaxed max-h-16 overflow-y-auto">
                          📢 "{activeSpeechInfo.textPhonetic}"
                        </div>
                        <span className="text-[8.5px] text-emerald-900/80 font-semibold block text-right font-sans">
                          {isVoiceCurrentlyPlaying ? "🔊 Lecture audio en cours..." : "⏸️ Fin de lecture"}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* SECRET CLINICAL ADMINISTRATION OVERLAY MODAL */}
                  <AnimatePresence>
                    {showAdminStatusPanel && (
                      <div id="admin-clinical-workspace" className="fixed inset-0 bg-stone-950/85 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans select-none animate-fade-in">
                        <div className="bg-white rounded-2xl w-full max-w-sm max-h-[85vh] flex flex-col overflow-hidden shadow-2xl border border-stone-200">
                          {/* Header */}
                          <div className="bg-stone-900 text-stone-100 p-4 border-b border-stone-850 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Settings className="w-5 h-5 text-amber-500 animate-spin-slow" />
                              <div>
                                <h3 className="font-extrabold text-xs uppercase tracking-wider text-amber-500">Administration PEV</h3>
                                <span className="text-[9px] text-stone-400 font-mono">PANEL MÉDECIN DE RÉGION</span>
                              </div>
                            </div>
                            <button
                              id="btn-close-admin-popup"
                              onClick={() => {
                                setShowAdminStatusPanel(false);
                                setSelectedAdminEnfantId('');
                                setAdminSearchQuery('');
                              }}
                              className="px-2.5 py-1 bg-stone-800 hover:bg-stone-750 text-stone-300 text-xs font-bold rounded cursor-pointer transition-all"
                            >
                              Fermer [X]
                            </button>
                          </div>

                          {/* Body */}
                          <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            <div className="bg-amber-50 text-amber-900 p-2.5 rounded-lg border border-amber-250 text-xs leading-relaxed font-semibold">
                              ⚠️ Cet accès permet de changer à tout moment le statut des vaccins pour l'un des enfants du village pour simulation ou correction des erreurs de carnet.
                            </div>

                            {/* Select baby with search input */}
                            <div className="space-y-2">
                              <div>
                                <label className="text-[11px] text-stone-500 font-bold uppercase block mb-1">
                                  🔍 Rechercher l'Enfant / Matricule / Autre :
                                </label>
                                <div className="relative">
                                  <input
                                    id="admin-search-input"
                                    type="text"
                                    placeholder="Ex: Nom, matricule, maman..."
                                    value={adminSearchQuery}
                                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                                    className="w-full bg-stone-100 hover:bg-stone-50 focus:bg-white border border-stone-300 rounded-xl py-2 px-3 pr-8 text-xs font-bold text-stone-800 outline-emerald-500 transition-all placeholder:text-stone-400"
                                  />
                                  {adminSearchQuery && (
                                    <button
                                      type="button"
                                      onClick={() => setAdminSearchQuery('')}
                                      className="absolute right-2 top-2 text-stone-400 hover:text-stone-600 font-extrabold text-xs"
                                    >
                                      ✕
                                    </button>
                                  )}
                                </div>
                              </div>

                              <div className="space-y-1">
                                <label className="text-[10px] text-stone-400 font-bold uppercase block">
                                  Sélectionner parmi filtrés :
                                </label>
                                <select
                                  id="admin-baby-selector"
                                  value={selectedAdminEnfantId}
                                  onChange={(e) => setSelectedAdminEnfantId(e.target.value)}
                                  className="w-full bg-stone-100 border border-stone-300 p-2 text-xs rounded-xl font-bold text-stone-800 focus:bg-white outline-emerald-500"
                                >
                                  <option value="">-- Sélectionnez un enfant --</option>
                                  {localEnfants
                                    .filter(ch => {
                                      const query = adminSearchQuery.trim().toLowerCase();
                                      if (!query) return true;
                                      const mother = localMamans.find(m => m.id === ch.maman_id);
                                      const childMatricule = (ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`).toLowerCase();
                                      const motherNom = (mother?.nom || '').toLowerCase();
                                      const childNom = ch.nom.toLowerCase();
                                      return childNom.includes(query) || childMatricule.includes(query) || motherNom.includes(query);
                                    })
                                    .map(ch => {
                                      const mother = localMamans.find(m => m.id === ch.maman_id);
                                      const childMatricule = ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`;
                                      return (
                                        <option key={ch.id} value={ch.id}>
                                          👦 {ch.nom} ({childMatricule}) - Mère: {mother?.nom || 'Inconnue'}
                                        </option>
                                      );
                                    })}
                                </select>
                              </div>

                              {/* Quick select chips for easier usability */}
                              {adminSearchQuery.trim().length > 0 && (
                                <div className="space-y-1 bg-stone-50 p-2 rounded-xl border border-stone-200">
                                  <span className="text-[9px] text-emerald-850 font-bold block uppercase">
                                    Résultats rapides ({
                                      localEnfants.filter(ch => {
                                        const query = adminSearchQuery.trim().toLowerCase();
                                        const mother = localMamans.find(m => m.id === ch.maman_id);
                                        const childMatricule = (ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`).toLowerCase();
                                        const motherNom = (mother?.nom || '').toLowerCase();
                                        const childNom = ch.nom.toLowerCase();
                                        return childNom.includes(query) || childMatricule.includes(query) || motherNom.includes(query);
                                      }).length
                                    }) :
                                  </span>
                                  <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                                    {localEnfants
                                      .filter(ch => {
                                        const query = adminSearchQuery.trim().toLowerCase();
                                        const mother = localMamans.find(m => m.id === ch.maman_id);
                                        const childMatricule = (ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`).toLowerCase();
                                        const motherNom = (mother?.nom || '').toLowerCase();
                                        const childNom = ch.nom.toLowerCase();
                                        return childNom.includes(query) || childMatricule.includes(query) || motherNom.includes(query);
                                      })
                                      .slice(0, 5)
                                      .map(ch => {
                                        const isSelected = selectedAdminEnfantId === ch.id;
                                        return (
                                          <button
                                            key={ch.id}
                                            type="button"
                                            onClick={() => setSelectedAdminEnfantId(ch.id)}
                                            className={`text-[9.5px] px-2 py-1 rounded-lg border font-bold text-left flex items-center gap-1 transition-all cursor-pointer ${
                                              isSelected 
                                                ? 'bg-emerald-700 text-white border-emerald-800' 
                                                : 'bg-white hover:bg-stone-150 text-stone-700 border-stone-250'
                                            }`}
                                          >
                                            <span>👦 {ch.nom}</span>
                                          </button>
                                        );
                                      })}
                                    {localEnfants
                                      .filter(ch => {
                                        const query = adminSearchQuery.trim().toLowerCase();
                                        const mother = localMamans.find(m => m.id === ch.maman_id);
                                        const childMatricule = (ch.matricule || `AYA-E-${ch.id.slice(-4).toUpperCase()}`).toLowerCase();
                                        const motherNom = (mother?.nom || '').toLowerCase();
                                        const childNom = ch.nom.toLowerCase();
                                        return childNom.includes(query) || childMatricule.includes(query) || motherNom.includes(query);
                                      }).length === 0 && (
                                        <span className="text-[9.5px] text-stone-400 italic">Aucun enfant trouvé pour cette recherche.</span>
                                      )}
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Vaccine list & togglers */}
                            {selectedAdminEnfantId ? (
                              <div className="space-y-3">
                                <h4 className="text-[11px] text-stone-500 font-bold uppercase border-b border-stone-200 pb-1">
                                  Vaccinations du bébé ({localVaccins.filter(v => v.enfant_id === selectedAdminEnfantId).length})
                                </h4>

                                <div className="space-y-2.5 max-h-[35vh] overflow-y-auto pr-1">
                                  {localVaccins
                                    .filter(v => v.enfant_id === selectedAdminEnfantId)
                                    .map(vac => {
                                      return (
                                        <div key={vac.id} className="p-2.5 bg-stone-50 rounded-lg border border-stone-250 space-y-2">
                                          <div className="flex justify-between items-center">
                                            <span className="font-extrabold text-xs text-stone-850 leading-tight block">
                                              {vac.nom}
                                            </span>
                                            
                                            {/* Status toggle trigger button */}
                                            <button
                                              id={`admin-toggle-status-${vac.id}`}
                                              onClick={() => handleUpdateVaccineStatusAdmin(
                                                vac.id,
                                                !vac.est_fait,
                                                vac.numero_lot || 'LOT-' + Math.floor(Math.random() * 900 + 100),
                                                vac.agent_nom || 'Dr Coulibaly',
                                                new Date().toISOString().split('T')[0]
                                              )}
                                              className={`py-0.5 px-2 rounded font-black text-[9.5px] cursor-pointer transition-all shadow-3xs ${
                                                vac.est_fait
                                                  ? 'bg-emerald-600 text-stone-50 hover:bg-emerald-700'
                                                  : 'bg-red-500 text-stone-50 hover:bg-red-600'
                                              }`}
                                            >
                                              {vac.est_fait ? 'Fait ✓ (Changer)' : 'Non fait ❌ (Fixer)'}
                                            </button>
                                          </div>

                                          <div className="grid grid-cols-2 gap-2 text-[10px]">
                                            <div>
                                              <span className="text-stone-400 block font-semibold mb-0.5">N° Lot :</span>
                                              <input
                                                id={`admin-lot-input-${vac.id}`}
                                                type="text"
                                                value={vac.numero_lot || ''}
                                                onChange={(e) => handleUpdateVaccineStatusAdmin(
                                                  vac.id,
                                                  vac.est_fait,
                                                  e.target.value,
                                                  vac.agent_nom || 'Dr Adama',
                                                  vac.date_fait || new Date().toISOString().split('T')[0]
                                                )}
                                                placeholder="N° Lot"
                                                className="w-full bg-white border border-stone-300 rounded p-1 text-[10px]"
                                              />
                                            </div>
                                            <div>
                                              <span className="text-stone-400 block font-semibold mb-0.5">Agent de santé :</span>
                                              <input
                                                id={`admin-agent-input-${vac.id}`}
                                                type="text"
                                                value={vac.agent_nom || ''}
                                                onChange={(e) => handleUpdateVaccineStatusAdmin(
                                                  vac.id,
                                                  vac.est_fait,
                                                  vac.numero_lot || 'Lot A',
                                                  e.target.value,
                                                  vac.date_fait || new Date().toISOString().split('T')[0]
                                                )}
                                                placeholder="ex: Dr Adama"
                                                className="w-full bg-white border border-stone-300 rounded p-1 text-[10px]"
                                              />
                                            </div>
                                          </div>
                                        </div>
                                      );
                                    })}
                                </div>
                              </div>
                            ) : (
                              <div className="text-center py-6 text-stone-400 text-xs italic font-sans">
                                Aucun enfant sélectionné. Choisissez-en un ci-dessus pour administrer ses vaccins.
                              </div>
                            )}
                          </div>

                          {/* Footer */}
                          <div className="bg-stone-50 p-3 border-t border-stone-200 flex justify-end">
                            <button
                              id="btn-admin-save-all"
                              onClick={() => {
                                setShowAdminStatusPanel(false);
                                setSelectedAdminEnfantId('');
                                setAdminSearchQuery('');
                              }}
                              className="w-full py-2 bg-[#12583e] hover:bg-[#0c402d] text-white text-xs font-black rounded-xl cursor-pointer"
                            >
                              Confirmer et Fermer d'Administration
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </AnimatePresence>

                  {/* APP FOOTER CONTROLS AND SESSION RESET */}
                  <div className="bg-stone-50 border-t border-stone-150 px-5 py-4 flex items-center justify-center text-stone-500">
                    <span className="text-[10px] tracking-wide font-medium font-sans text-center">
                      Dossier Médical AyaSanté — Sécurisé & Chiffré en Côte d'Ivoire
                    </span>
                  </div>
                </div>
              )}
            </div>

          </div>

      {/* FOOTER */}
      <footer className="bg-stone-900 border-t border-stone-800 py-6 text-center text-stone-400 text-xs mt-auto font-sans">
        <p>© 2026 AyaSanté CI — Programme National de Télémédecine rurale de Côte d'Ivoire.</p>
        <p className="text-stone-500 text-[11px] mt-1.5 leading-relaxed max-w-lg mx-auto">
          Développé en conformité avec les directives PEV ouest-africaines et de cryptographie médicale locale asymétrique.
        </p>
      </footer>

      {/* MOTHER REGISTRATION MODAL */}
      {showMamanModal && (
        <MotherRegistrationModal
          onClose={() => setShowMamanModal(false)}
          onSave={handleAddNewMaman}
          regions={REGIONS_CI}
        />
      )}

      {/* CHILD REGISTRATION MODAL */}
      {showEnfantModal && selectedMaman && (
        <ChildRegistrationModal
          onClose={() => setShowEnfantModal(false)}
          mamanId={selectedMaman.id}
          mamanNom={selectedMaman.nom}
          onSave={handleAddNewEnfant}
        />
      )}

      {/* PEDIATRICIAN REGISTRATION MODAL */}
      {showAddPediatreModal && (
        <AddPediatreModal
          onClose={() => setShowAddPediatreModal(false)}
          onSave={(newPed) => setPediatricians(prev => [newPed, ...prev])}
        />
      )}

      {/* LOW LITERACY VACCINE ADMIN CONFIRMATION DRAWER/MODAL */}
      {activeAdministerVaccine && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-sans select-none">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 border border-stone-200 shadow-xl overflow-hidden text-center relative">
            <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 scale-110">
              <Check className="w-10 h-10 stroke-[3]" />
            </div>

            <h3 className="text-lg font-extrabold text-stone-800">Confirmer la Vaccination ?</h3>
            <p className="text-stone-500 text-xs mt-1.5 px-4">
              Vous allez enregistrer l'administration de <strong className="text-stone-850 font-bold block mt-0.5">{activeAdministerVaccine.nom}</strong>
            </p>

            <div className="mt-4 space-y-2.5 text-left bg-stone-50 p-3 rounded-xl border border-stone-150">
              <div>
                <label className="text-[10.5px] font-bold text-stone-500 block">N° Lot du Vaccin :</label>
                <input
                  id="vaccine-lot-input"
                  type="text"
                  placeholder="ex: BCG-2026-X9"
                  value={vaccineLot}
                  onChange={(e) => setVaccineLot(e.target.value)}
                  className="w-full text-xs font-mono font-bold bg-white text-stone-800 p-2 rounded border border-stone-350 mt-1 uppercase"
                />
              </div>
              <div>
                <label className="text-[10.5px] font-bold text-stone-500 block">Agent Confirmateur :</label>
                <input
                  id="vaccine-agent-input"
                  type="text"
                  value={vaccineAgent}
                  onChange={(e) => setVaccineAgent(e.target.value)}
                  className="w-full text-xs font-sans font-bold bg-white text-stone-800 p-2 rounded border border-stone-350 mt-1"
                />
              </div>
            </div>

            {/* Tap Button Confirm */}
            <div className="grid grid-cols-2 gap-3 mt-5">
              <button
                id="btn-confirm-vaccine-cancel"
                onClick={() => setActiveAdministerVaccine(null)}
                className="py-2.5 bg-stone-150 hover:bg-stone-200 text-stone-700 font-bold rounded-xl text-xs cursor-pointer"
              >
                Annuler
              </button>
              <button
                id="btn-confirm-vaccine-submit"
                onClick={handleAdministerVaccineSubmit}
                className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all active:scale-95 cursor-pointer shadow-sm"
              >
                ★ OUI, Taper pour Confirmer
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
