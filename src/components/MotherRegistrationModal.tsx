import React, { useState } from 'react';
import { X, UserPlus, Shield, Heart } from 'lucide-react';
import { Maman } from '../types';
import { generateOfflineUUID, generatePatientMatricule } from '../utils/dataHelper';

interface MotherRegistrationModalProps {
  onClose: () => void;
  onSave: (newMaman: Maman) => void;
  regions: string[];
}

export default function MotherRegistrationModal({ onClose, onSave, regions }: MotherRegistrationModalProps) {
  const [nom, setNom] = useState('');
  const [contact, setContact] = useState('');
  const [village, setVillage] = useState('');
  const [region, setRegion] = useState(regions[0] || 'Hambol');
  const [pinCode, setPinCode] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [estEnceinte, setEstEnceinte] = useState<boolean>(false);
  const [dateConstat, setDateConstat] = useState<string>(new Date().toISOString().split('T')[0]);

  const getCalculatedDpa = (constatDate: string) => {
    if (!constatDate) return '';
    const d = new Date(constatDate);
    // Add 273 days (approx. 9 months / 39 weeks) to determine estimated delivery date
    d.setDate(d.getDate() + 273);
    return d.toISOString().split('T')[0];
  };

  const calculatedDpa = estEnceinte ? getCalculatedDpa(dateConstat) : '';

  const formatFrenchDate = (dateStr: string) => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length === 3) {
      const months = [
        'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
        'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'
      ];
      const day = parseInt(parts[2], 10);
      const monthIdx = parseInt(parts[1], 10) - 1;
      const year = parts[0];
      return `${day} ${months[monthIdx]} ${year}`;
    }
    return dateStr;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !village) {
      setErrorMessage('Veuillez remplir le nom et le village.');
      return;
    }
    if (!/^\d{4}$/.test(pinCode)) {
      setErrorMessage('Le code PIN de sécurité doit être composé d\'exactement 4 chiffres.');
      return;
    }

    const mamanUuid = generateOfflineUUID('mam');
    const mamanMatricule = generatePatientMatricule('M');

    let plannedCpns: any[] = [];
    if (estEnceinte && calculatedDpa) {
      const dpaDate = new Date(calculatedDpa);
      
      // We schedule 4 standard CPN reviews spaced back from delivery date
      // CPN 1: DPA - 180 days
      const cpn1 = new Date(dpaDate); cpn1.setDate(cpn1.getDate() - 180);
      // CPN 2: DPA - 90 days
      const cpn2 = new Date(dpaDate); cpn2.setDate(cpn2.getDate() - 90);
      // CPN 3: DPA - 45 days
      const cpn3 = new Date(dpaDate); cpn3.setDate(cpn3.getDate() - 45);
      // CPN 4: DPA - 15 days
      const cpn4 = new Date(dpaDate); cpn4.setDate(cpn4.getDate() - 15);

      plannedCpns = [
        {
          id: generateOfflineUUID('cpn'),
          date: cpn1.toISOString().split('T')[0],
          trimestre: 1,
          poids_maman: 0,
          tension: 'Non mesurée',
          notes: 'Planifiée d\'office (Premier trimestre)',
          est_realise: false
        },
        {
          id: generateOfflineUUID('cpn'),
          date: cpn2.toISOString().split('T')[0],
          trimestre: 2,
          poids_maman: 0,
          tension: 'Non mesurée',
          notes: 'Planifiée d\'office (Deuxième trimestre)',
          est_realise: false
        },
        {
          id: generateOfflineUUID('cpn'),
          date: cpn3.toISOString().split('T')[0],
          trimestre: 3,
          poids_maman: 0,
          tension: 'Non mesurée',
          notes: 'Planifiée d\'office (Troisième trimestre)',
          est_realise: false
        },
        {
          id: generateOfflineUUID('cpn'),
          date: cpn4.toISOString().split('T')[0],
          trimestre: 3,
          poids_maman: 0,
          tension: 'Non mesurée',
          notes: 'Planifiée d\'office (Dernier contrôle)',
          est_realise: false
        }
      ];
    }

    const newMaman: Maman = {
      id: mamanUuid,
      matricule: mamanMatricule,
      nom: nom.trim(),
      contact: contact.trim() || 'Non spécifié (Appel vocal par village)',
      village: village.trim(),
      region,
      date_inscription: new Date().toISOString(),
      code_pin_hash: pinCode,
      cpn_visites: plannedCpns,
      est_enceinte: estEnceinte,
      date_accouchement_prevue: estEnceinte ? calculatedDpa : undefined,
      status: 'pending_creation', // Starts as offline pending sync
      last_updated: new Date().toISOString(),
    };

    onSave(newMaman);
  };

  return (
    <div id="maman-registration-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-emerald-800 text-white">
          <div className="flex items-center gap-2">
            <UserPlus className="w-5 h-5 text-emerald-250" />
            <h3 className="font-bold text-base">Enregistrer une Nouvelle Maman</h3>
          </div>
          <button
            id="close-maman-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {errorMessage && (
            <p className="text-xs text-red-600 bg-red-50 p-2.5 rounded border border-red-200 font-semibold">
              ⚠️ {errorMessage}
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nom complet de la maman *</label>
            <input
              id="maman-register-nom"
              type="text"
              required
              placeholder="ex: Yao Amenan Eugénie"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full text-stone-850 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-emerald-500 font-medium"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Téléphone (Optionnel)</label>
              <input
                id="maman-register-phone"
                type="tel"
                placeholder="ex: +225 07020304"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                className="w-full text-stone-850 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-emerald-500 font-medium"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Village d'origine *</label>
              <input
                id="maman-register-village"
                type="text"
                required
                placeholder="ex: Katiola Rurale"
                value={village}
                onChange={(e) => setVillage(e.target.value)}
                className="w-full text-stone-850 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-emerald-500 font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Région (Côte d'Ivoire)</label>
            <select
              id="maman-register-region"
              value={region}
              onChange={(e) => setRegion(e.target.value)}
              className="w-full text-stone-850 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-emerald-500"
            >
              {regions.map(reg => (
                <option key={reg} value={reg}>{reg}</option>
              ))}
            </select>
          </div>

          <div className="p-3 bg-rose-50/40 rounded-xl border border-rose-200">
            <div className="flex items-center gap-1.5 mb-1">
              <Shield className="w-4 h-4 text-rose-600" />
              <label className="block text-xs font-bold text-stone-700 uppercase">Code PIN de Sécurité de la Maman *</label>
            </div>
            <input
              id="maman-register-pincode"
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={4}
              required
              placeholder="Ex: 5678"
              value={pinCode}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, ''); // only digits
                setPinCode(val);
              }}
              className="w-full text-stone-850 text-sm bg-white border border-stone-300 rounded-lg p-2 focus:border-rose-500 font-mono font-bold tracking-widest text-center"
            />
            <span className="text-[10px] text-stone-500 block leading-normal mt-1 italic">
              Ce code à 4 chiffres sécurise le dossier de la maman. Elle devra le saisir pour ouvrir sa fiche.
            </span>
          </div>

          <div className="p-3 bg-stone-50 rounded-xl border border-stone-200">
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Statut Médical de la Maman</label>
            <div className="flex gap-2">
              <button
                id="pregnant-status-btn"
                type="button"
                onClick={() => setEstEnceinte(true)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  estEnceinte
                    ? 'bg-rose-50 border-rose-200 text-rose-800 ring-2 ring-rose-500/10'
                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'
                }`}
              >
                🤰 Enceinte (Suivi CPN)
              </button>
              <button
                id="non-pregnant-status-btn"
                type="button"
                onClick={() => setEstEnceinte(false)}
                className={`flex-1 py-2 px-3 rounded-xl border text-xs font-bold font-sans flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  !estEnceinte
                    ? 'bg-emerald-50 border-emerald-250 text-emerald-800 ring-2 ring-emerald-500/10'
                    : 'bg-white border-stone-200 text-stone-500 hover:bg-stone-100'
                }`}
              >
                👶 Déjà Accouché
              </button>
            </div>

            {estEnceinte && (
              <div className="mt-3 space-y-2.5 animate-fade-in text-stone-800">
                <div>
                  <label className="block text-[11px] font-bold text-stone-600 uppercase mb-1 font-sans">Date estimée du constat ou début de grossesse *</label>
                  <input
                    id="maman-register-constat"
                    type="date"
                    required={estEnceinte}
                    value={dateConstat}
                    onChange={(e) => setDateConstat(e.target.value)}
                    className="w-full text-stone-800 text-sm bg-white border border-stone-300 rounded-lg p-2 focus:border-rose-500 font-semibold"
                  />
                </div>
                
                <div className="bg-rose-50 border border-rose-100 p-2.5 rounded-lg font-sans">
                  <span className="text-[10px] text-rose-800 font-bold block uppercase mb-1">Estimation d'accouchement (DPA) :</span>
                  <div className="text-sm font-sans font-extrabold text-rose-900 flex items-center gap-1">
                    📅 {formatFrenchDate(calculatedDpa)}
                  </div>
                  <span className="text-[9.5px] text-stone-500 block mt-1 leading-normal italic">
                    Calcul d'estimation automatique (+9 mois) pour adapter l'évolution obstétricale et générer le calendrier d'alertes vocales.
                  </span>
                </div>

                <div className="bg-emerald-50 border border-emerald-250/60 p-2.5 rounded-lg font-sans">
                  <span className="text-[10px] text-emerald-850 font-bold block uppercase mb-1">📅 Planification CPN automatique :</span>
                  <ul className="text-[10px] text-stone-600 space-y-1 font-semibold list-disc list-inside">
                    <li><strong>Consultation 1 (Trimestre 1) :</strong> Planifiée</li>
                    <li><strong>Consultation 2 (Trimestre 2) :</strong> Planifiée</li>
                    <li><strong>Consultation 3 (Trimestre 3) :</strong> Planifiée</li>
                    <li><strong>Consultation 4 (Trimestre 3) :</strong> Planifiée</li>
                  </ul>
                  <span className="text-[9px] text-emerald-800 italic block mt-1.5 font-sans">
                    Ces consultations seront pré-enregistrées dans le carnet de santé numérique de la maman.
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              id="maman-register-cancel"
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="maman-register-submit"
              type="submit"
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all shadow-sm active:translate-y-0.5"
            >
              Enregistrer (Local)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
