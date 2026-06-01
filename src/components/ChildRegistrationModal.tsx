import React, { useState } from 'react';
import { X, Baby, Weight, Ruler } from 'lucide-react';
import { Enfant } from '../types';
import { generateOfflineUUID, generatePatientMatricule } from '../utils/dataHelper';

interface ChildRegistrationModalProps {
  onClose: () => void;
  mamanId: string;
  mamanNom: string;
  onSave: (newEnfant: Enfant) => void;
}

export default function ChildRegistrationModal({ onClose, mamanId, mamanNom, onSave }: ChildRegistrationModalProps) {
  const [nom, setNom] = useState('');
  const [genre, setGenre] = useState<'M' | 'F'>('M');
  const [dateNaissance, setDateNaissance] = useState(new Date().toISOString().split('T')[0]);
  const [poidsNaissance, setPoidsNaissance] = useState<string>('3.1');
  const [tailleNaissance, setTailleNaissance] = useState<string>('49');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !poidsNaissance || !tailleNaissance) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const childUuid = generateOfflineUUID('enf');
    const childMatricule = generatePatientMatricule('E');
    const weightNum = parseFloat(poidsNaissance);
    const heightNum = parseFloat(tailleNaissance);

    if (isNaN(weightNum) || weightNum <= 0) {
      setErrorMessage('Le poids de naissance renseigné est invalide.');
      return;
    }
    if (isNaN(heightNum) || heightNum <= 0) {
      setErrorMessage('La taille de naissance renseignée est invalide.');
      return;
    }

    const newEnfant: Enfant = {
      id: childUuid,
      maman_id: mamanId,
      matricule: childMatricule,
      nom: nom.trim(),
      genre,
      date_naissance: dateNaissance,
      poids_naissance: weightNum,
      taille_naissance: heightNum,
      historique_poids: [
        { date: dateNaissance, valeur: weightNum }
      ],
      historique_taille: [
        { date: dateNaissance, valeur: heightNum }
      ],
      status: 'pending_creation', // Local-first offline pending
      last_updated: new Date().toISOString()
    };

    onSave(newEnfant);
  };

  return (
    <div id="enfant-registration-modal" className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs font-sans">
      <div className="relative w-full max-w-md bg-white rounded-2xl shadow-xl border border-stone-200 overflow-hidden transform transition-all">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 bg-teal-800 text-white">
          <div className="flex items-center gap-2">
            <Baby className="w-5 h-5 text-teal-200 animate-bounce" />
            <h3 className="font-bold text-base">Rattacher un Enfant à la Maman</h3>
          </div>
          <button
            id="close-child-modal-btn"
            onClick={onClose}
            className="p-1 rounded-full hover:bg-white/10 text-white transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="p-2 bg-stone-50 rounded-lg border border-stone-150 text-xs text-stone-600">
            Mère d'affiliation : <strong className="text-teal-900 font-bold">{mamanNom}</strong>
          </div>

          {errorMessage && (
            <p className="text-xs text-red-650 bg-red-50 p-2 rounded border border-red-200 font-medium">
              ⚠️ {errorMessage}
            </p>
          )}

          <div>
            <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Nom Complet de l'Enfant *</label>
            <input
              id="child-register-nom"
              type="text"
              required
              placeholder="ex: Koffi Kouassi Mathieu"
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              className="w-full text-stone-850 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-teal-500 font-semibold"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Genre de l'infant</label>
              <div className="flex bg-stone-150 rounded-xl p-1 gap-1">
                <button
                  id="child-gen-m"
                  type="button"
                  onClick={() => setGenre('M')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    genre === 'M' ? 'bg-white text-teal-700 shadow-xs' : 'text-stone-500 hover:bg-white/40'
                  }`}
                >
                  Garçon (M)
                </button>
                <button
                  id="child-gen-f"
                  type="button"
                  onClick={() => setGenre('F')}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold text-center transition-all cursor-pointer ${
                    genre === 'F' ? 'bg-white text-rose-700 shadow-xs' : 'text-stone-500 hover:bg-white/40'
                  }`}
                >
                  Fille (F)
                </button>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1">Date de Naissance *</label>
              <input
                id="child-register-dob"
                type="date"
                required
                value={dateNaissance}
                onChange={(e) => setDateNaissance(e.target.value)}
                className="w-full text-stone-800 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-teal-500 font-semibold"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <Weight className="w-3.5 h-3.5 text-stone-500" />
                Poids Naissance (kg) *
              </label>
              <input
                id="child-register-poids"
                type="number"
                step="0.01"
                min="0.5"
                max="10.0"
                required
                value={poidsNaissance}
                onChange={(e) => setPoidsNaissance(e.target.value)}
                className="w-full text-stone-850 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-teal-500 font-mono font-bold text-center"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-stone-600 uppercase mb-1 flex items-center gap-1">
                <Ruler className="w-3.5 h-3.5 text-stone-500" />
                Taille Naissance (cm) *
              </label>
              <input
                id="child-register-taille"
                type="number"
                step="0.1"
                min="20"
                max="80"
                required
                value={tailleNaissance}
                onChange={(e) => setTailleNaissance(e.target.value)}
                className="w-full text-stone-850 text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 focus:bg-white outline-teal-500 font-mono font-bold text-center"
              />
            </div>
          </div>

          <div className="p-3 bg-teal-50 border border-teal-150 text-[11.5px] text-teal-800 rounded-xl leading-relaxed">
            <strong className="font-bold flex items-center gap-1 text-teal-900 mb-0.5">
              📅 Calendrier Vaccinal Automatique
            </strong>
            L'enregistrement génèrera instantanément la liste des 13 doses vaccinales du <strong>PEV de Côte d'Ivoire</strong> à administrer de la naissance à 15 mois.
          </div>

          {/* Footer buttons */}
          <div className="flex gap-3 pt-2">
            <button
              id="child-register-cancel"
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer"
            >
              Annuler
            </button>
            <button
              id="child-register-submit"
              type="submit"
              className="flex-1 bg-teal-650 hover:bg-teal-700 text-white font-bold py-2.5 rounded-xl text-sm transition-all"
            >
              Enregistrer l'Enfant (Local)
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
