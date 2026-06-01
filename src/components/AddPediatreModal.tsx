import React, { useState } from 'react';
import { X, UserPlus, Heart, Phone, MapPin, Award } from 'lucide-react';
import { MedecinPediatre } from '../types';

interface AddPediatreModalProps {
  onClose: () => void;
  onSave: (newPed: MedecinPediatre) => void;
}

export default function AddPediatreModal({ onClose, onSave }: AddPediatreModalProps) {
  const [nom, setNom] = useState('');
  const [specialite, setSpecialite] = useState('');
  const [telephone, setTelephone] = useState('');
  const [email, setEmail] = useState('');
  const [ville, setVille] = useState('');
  const [adresse, setAdresse] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !specialite || !telephone || !ville || !adresse) {
      setErrorMessage('Veuillez remplir tous les champs obligatoires (*).');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');

    const newPedData = {
      nom,
      specialite,
      telephone,
      email: email || undefined,
      ville,
      adresse,
    };

    try {
      // Send register action to backend API
      const response = await fetch('/api/pediatricians', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newPedData),
      });

      if (!response.ok) {
        throw new Error('Erreur de communication avec le serveur central.');
      }

      const createdPed: MedecinPediatre = await response.json();
      
      // Pass the added pediatrician to App.tsx state
      onSave(createdPed);
      onClose();
    } catch (error) {
      console.warn("L'enregistrement du pédiatre sur le serveur a échoué. Ajout en local.", error);
      // Fallback: add locally
      const localId = `ped-local-${Date.now()}`;
      onSave({
        id: localId,
        nom,
        specialite,
        telephone,
        email: email || undefined,
        ville,
        adresse,
        est_disponible: true
      });
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4 font-sans animate-fade-in">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl overflow-hidden animate-scale-up border border-stone-200">
        
        {/* Header decoration */}
        <div className="bg-gradient-to-r from-teal-700 to-emerald-800 text-white px-5 py-4 pb-3 flex justify-between items-center relative">
          <div className="flex items-center gap-2">
            <div className="p-1.5 bg-white/10 rounded-lg">
              <UserPlus className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <h2 className="font-sans font-extrabold text-sm tracking-tight leading-none">
                Prendre un Pédiatre Agréé
              </h2>
              <span className="text-[10px] text-teal-100 tracking-wider font-medium font-sans uppercase mt-1 block">
                Ajout d'un pédiatre partenaire
              </span>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-full bg-white/10 hover:bg-white/20 text-white cursor-pointer transition-all"
            title="Fermer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form area */}
        <form onSubmit={handleSubmit} className="p-5 space-y-3.5">
          {errorMessage && (
            <div className="bg-red-50 border border-red-150 p-2.5 rounded-xl text-red-700 text-xs font-bold leading-normal">
              ⚠️ {errorMessage}
            </div>
          )}

          <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1">
            
            {/* Nom */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Award className="w-3.5 h-3.5 text-teal-700" />
                <label className="block text-[10px] font-bold text-stone-600 uppercase">Nom complet du Pédiatre *</label>
              </div>
              <input
                id="ped-register-nom"
                type="text"
                required
                placeholder="Ex. Dr. Kouassi Koffi"
                value={nom}
                onChange={(e) => setNom(e.target.value)}
                className="w-full text-stone-850 text-xs bg-stone-100/50 border border-stone-300 rounded-lg p-2 focus:border-teal-600"
              />
            </div>

            {/* Specialité */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Heart className="w-3.5 h-3.5 text-teal-700" />
                <label className="block text-[10px] font-bold text-stone-600 uppercase">Spécialité / Compétences *</label>
              </div>
              <input
                id="ped-register-specialite"
                type="text"
                required
                placeholder="Ex. Vaccination & Prévention pédiatrique"
                value={specialite}
                onChange={(e) => setSpecialite(e.target.value)}
                className="w-full text-stone-850 text-xs bg-stone-100/50 border border-stone-300 rounded-lg p-2 focus:border-teal-600"
              />
            </div>

            {/* Téléphone */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <Phone className="w-3.5 h-3.5 text-teal-700" />
                <label className="block text-[10px] font-bold text-stone-600 uppercase">Numéro de Téléphone *</label>
              </div>
              <input
                id="ped-register-telephone"
                type="text"
                required
                placeholder="Ex. +225 0708091011"
                value={telephone}
                onChange={(e) => setTelephone(e.target.value)}
                className="w-full text-stone-850 text-xs bg-stone-100/50 border border-stone-300 rounded-lg p-2 focus:border-teal-600 font-mono"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1">Adresse Email (Optionnel)</label>
              <input
                id="ped-register-email"
                type="email"
                placeholder="Ex. k.koffi@pediatre.ci"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full text-stone-850 text-xs bg-stone-100/50 border border-stone-300 rounded-lg p-2 focus:border-teal-600"
              />
            </div>

            {/* Ville */}
            <div>
              <div className="flex items-center gap-1 mb-1">
                <MapPin className="w-3.5 h-3.5 text-teal-700" />
                <label className="block text-[10px] font-bold text-stone-600 uppercase">Ville / Région *</label>
              </div>
              <input
                id="ped-register-ville"
                type="text"
                required
                placeholder="Ex. Bouaké, Gagnoa, Korhogo, Abidjan..."
                value={ville}
                onChange={(e) => setVille(e.target.value)}
                className="w-full text-stone-850 text-xs bg-stone-100/50 border border-stone-300 rounded-lg p-2 focus:border-teal-600"
              />
            </div>

            {/* Adresse */}
            <div>
              <label className="block text-[10px] font-bold text-stone-600 uppercase mb-1 font-sans">Adresse du Cabinet / Hôpital *</label>
              <textarea
                id="ped-register-adresse"
                required
                rows={2}
                placeholder="Ex. CHR de Gagnoa, Quartier Babré, face pharmacie"
                value={adresse}
                onChange={(e) => setAdresse(e.target.value)}
                className="w-full text-stone-850 text-xs bg-stone-100/50 border border-stone-300 rounded-lg p-2 focus:border-teal-600 resize-none font-sans"
              />
            </div>

          </div>

          {/* Footer Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              id="ped-register-cancel"
              type="button"
              onClick={onClose}
              className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
              disabled={isSubmitting}
            >
              Annuler
            </button>
            <button
              id="ped-register-submit"
              type="submit"
              className="flex-1 bg-gradient-to-r from-teal-700 to-emerald-800 hover:from-teal-800 hover:to-emerald-900 text-white font-extrabold py-2.5 rounded-xl text-xs transition-all shadow-sm active:translate-y-0.5 flex items-center justify-center gap-1"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Enregistrement...' : 'Enregistrer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
