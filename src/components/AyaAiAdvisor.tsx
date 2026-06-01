import React, { useState } from 'react';
import { Sparkles, Volume2, VolumeX, ArrowRight, CheckCircle, Languages, AlertCircle, Headphones, Play, Pause, RefreshCw } from 'lucide-react';
import { Maman, Enfant } from '../types';
import { motion } from 'motion/react';

interface AyaAiAdvisorProps {
  mamans: Maman[];
  enfants: Enfant[];
  isOnline: boolean;
}

export default function AyaAiAdvisor({ mamans, enfants, isOnline }: AyaAiAdvisorProps) {
  const [selectedMaman, setSelectedMaman] = useState<string>('');
  const [selectedLanguage, setSelectedLanguage] = useState<'dioula' | 'baoule' | 'bete' | 'francais'>('dioula');
  const [loading, setLoading] = useState<boolean>(false);
  const [resultText, setResultText] = useState<string>('');
  const [errorWord, setErrorWord] = useState<string>('');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Active speech synthesis ref/instance
  const [speechInstance, setSpeechInstance] = useState<SpeechSynthesisUtterance | null>(null);

  const mamanObj = mamans.find(m => m.id === selectedMaman);
  const mamanEnfants = enfants.filter(e => e.maman_id === selectedMaman);
  const enfantObj = mamanEnfants[0] || null;

  const handleGenerateAdvisor = async () => {
    if (!selectedMaman) {
      setErrorWord('Veuillez sélectionner une maman pour générer un rappel personnalisé.');
      return;
    }
    setErrorWord('');
    setLoading(true);
    setResultText('');
    stopSpeech();

    try {
      const response = await fetch('/api/advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'vocal_script',
          langue: selectedLanguage === 'dioula' ? 'Dioula' : selectedLanguage === 'baoule' ? 'Baoulé' : selectedLanguage === 'bete' ? 'Bété' : 'Français',
          maman_nom: mamanObj?.nom || 'Awa',
          enfant_nom: enfantObj?.nom || 'Koffi',
          prochain_rdv: enfantObj ? 'Vaccin Penta + VPO le 15 Juin 2026' : 'Consultation prénatale',
        }),
      });

      const data = await response.json();
      setResultText(data.text);
    } catch (err: any) {
      console.error(err);
      setErrorWord('Impossible de joindre le serveur central d\'AyaSanté. Veuillez vérifier votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  const speakTextRef = () => {
    if (!resultText) return;
    
    // Stop any ongoing speech
    window.speechSynthesis.cancel();

    if (isPlaying) {
      setIsPlaying(false);
      return;
    }

    // Isolate vocal transcription content or french translation text 
    let textToSpeak = "";
    if (resultText.includes('[Traduction')) {
      const parts = resultText.split('[Traduction');
      const textPart = parts[1]?.split('(')[0] || '';
      textToSpeak = textPart.replace(/["'\[\]\-\n\r]/g, " ").trim();
    } else if (resultText.includes('Bonjour Maman')) {
      const match = resultText.match(/Bonjour Maman [\s\S]*?vie\./);
      if (match) textToSpeak = match[0];
    }

    if (!textToSpeak) {
      // Fallback: Speak everything
      textToSpeak = resultText.replace(/[*#_]/g, "").substring(0, 200);
    }

    const utterance = new SpeechSynthesisUtterance(textToSpeak);
    utterance.lang = 'fr-FR'; // Adapt standard French synthesized speaker voice
    utterance.rate = 0.85; // Speak slowly and clearly for rural context

    utterance.onend = () => {
      setIsPlaying(false);
    };
    utterance.onerror = () => {
      setIsPlaying(false);
    };

    setSpeechInstance(utterance);
    setIsPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(resultText);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  return (
    <div id="aya-ai-advisor-container" className="p-5 bg-white border border-stone-200 rounded-2xl shadow-xs">
      <div className="flex items-center gap-2 mb-3">
        <div className="p-2 bg-gradient-to-br from-emerald-500 to-teal-600 text-white rounded-lg">
          <Sparkles className="w-5 h-5" />
        </div>
        <div>
          <h3 className="font-sans font-bold text-stone-800 text-lg">Aya AI <span className="text-emerald-600 font-mono text-xs px-2 py-0.5 bg-emerald-50 border border-emerald-200 rounded-full">Intelligent</span></h3>
          <p className="text-xs text-stone-500 font-sans">Générateur d'Alerte et Message Vocal pour Mamans peu alphabétisées</p>
        </div>
      </div>

      <div className="bg-gradient-to-r from-stone-50 to-emerald-50/30 p-3 rounded-xl border border-stone-100 text-xs mb-4">
        <p className="text-stone-600 leading-relaxed">
          <strong className="text-emerald-700">Pourquoi ?</strong> Plus de <span className="font-bold underline">45% des mamans</span> en brousse ne lisent pas les SMS écrits. 
          AyaSanté surmonte cet obstacle en générant un <strong>script vocal parlé</strong> que l'agent de santé diffuse 
          aux villages ou envoie en message audio préenregistré.
        </p>
      </div>

      <div className="space-y-3">
        {/* Select Mother */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Sélectionner la Maman :</label>
          <select
            id="advisor-select-maman"
            value={selectedMaman}
            onChange={(e) => {
              setSelectedMaman(e.target.value);
              setErrorWord('');
            }}
            className="w-full text-sm bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-800 outline-emerald-500 focus:bg-white"
          >
            <option value="">-- Choisir une maman --</option>
            {mamans.map((m) => (
              <option key={m.id} value={m.id}>
                {m.nom} ({m.village} - {m.region})
              </option>
            ))}
          </select>
        </div>

        {/* Selected Child Info Feedback */}
        {selectedMaman && (
          <div className="p-2 bg-stone-50 rounded-lg border border-stone-200 text-xs text-stone-600 flex justify-between items-center">
            <span>
              Enfant associé : <strong className="text-stone-800">{enfantObj ? enfantObj.nom : 'Aucun enregistré'}</strong>
            </span>
            {enfantObj && (
              <span className="px-2 py-0.5 bg-stone-100 rounded text-stone-700 text-[10px] font-mono">
                DOB: {enfantObj.date_naissance}
              </span>
            )}
          </div>
        )}

        {/* Select Language */}
        <div>
          <label className="block text-xs font-semibold text-stone-600 mb-1">Langue de l'appel Vocal :</label>
          <div className="grid grid-cols-4 gap-1.5">
            {[
              { code: 'dioula', label: 'Dioula', accent: 'Nord/Ouest' },
              { code: 'baoule', label: 'Baoulé', accent: 'Centre/Est' },
              { code: 'bete', label: 'Bété', accent: 'Centre/Ouest' },
              { code: 'francais', label: 'Français', accent: 'Officiel' },
            ].map((lg) => (
              <button
                id={`lang-btn-${lg.code}`}
                key={lg.code}
                onClick={() => setSelectedLanguage(lg.code as any)}
                type="button"
                className={`py-1.5 px-1 flex flex-col items-center justify-center border rounded-lg transition-all text-center cursor-pointer ${
                  selectedLanguage === lg.code
                    ? 'border-emerald-600 bg-emerald-50 text-emerald-800 ring-1 ring-emerald-500/20'
                    : 'border-stone-300 bg-stone-50 hover:bg-stone-100 text-stone-700'
                }`}
              >
                <Languages className="w-3.5 h-3.5 mb-0.5 text-stone-500" />
                <span className="text-xs font-sans font-bold">{lg.label}</span>
                <span className="text-[8px] text-stone-400 font-serif leading-none mt-0.5">{lg.accent}</span>
              </button>
            ))}
          </div>
        </div>

        {errorWord && (
          <p className="text-xs text-red-600 font-sans flex items-center gap-1.5 bg-red-50 p-2 rounded border border-red-200">
            <AlertCircle className="w-3.5 h-3.5" />
            <span>{errorWord}</span>
          </p>
        )}

        {/* Trigger Button */}
        <button
          id="btn-trigger-advisor"
          onClick={handleGenerateAdvisor}
          disabled={loading}
          type="button"
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-emerald-650 hover:bg-emerald-700 text-white border-b-2 border-emerald-800 rounded-xl font-bold text-sm transition-all shadow-sm active:translate-y-0.5 cursor-pointer disabled:opacity-75 disabled:pointer-events-none"
        >
          {loading ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>Génération par IA (Aya)...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-4 h-4 text-emerald-200" />
              <span>Générer Carnet d'Appel & Rappel</span>
            </>
          )}
        </button>
      </div>

      {/* Result Display area */}
      {resultText && (
        <div className="mt-4 p-3 bg-stone-900 text-stone-50 rounded-xl border border-stone-800 font-sans shadow-inner relative overflow-hidden">
          <div className="flex justify-between items-center pb-2 mb-2 border-b border-stone-800">
            <span className="text-[11px] font-mono text-stone-400 flex items-center gap-1">
              <Headphones className="w-3 h-3 text-emerald-400" />
              Script d'appel audio vocal généré
            </span>
            <div className="flex items-center gap-2">
              <button
                id="btn-advisor-copy"
                onClick={handleCopy}
                className="text-[10px] bg-stone-800 hover:bg-stone-700 text-stone-300 px-2 py-1 rounded transition-all cursor-pointer"
              >
                {isCopied ? 'Copié!' : 'Copier'}
              </button>
            </div>
          </div>

          <div className="text-xs space-y-2 max-h-52 overflow-y-auto text-stone-200 whitespace-pre-line leading-relaxed pr-1 font-mono">
            {resultText}
          </div>

          {/* Audio synthethizer player buttons */}
          <div className="mt-3 pt-2 border-t border-stone-800 flex items-center justify-between">
            <span className="text-[10px] text-stone-400">
              🔊 <span className="italic">Écouter la lecture phonétique simulée</span>
            </span>
            <div className="flex gap-2">
              {isPlaying ? (
                <button
                  id="btn-advisor-stop"
                  onClick={stopSpeech}
                  className="flex items-center gap-1.5 text-xs bg-red-650 hover:bg-red-700 text-white font-bold py-1 px-3 rounded-full shadow transition-all cursor-pointer"
                >
                  <VolumeX className="w-3.5 h-3.5" />
                  <span>Arrêter</span>
                </button>
              ) : (
                <button
                  id="btn-advisor-play"
                  onClick={speakTextRef}
                  className="flex items-center gap-1.5 text-xs bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-1.5 px-4 rounded-full shadow transition-all hover:scale-105 active:scale-95 cursor-pointer"
                >
                  <Play className="w-3.5 h-3.5 fill-current" />
                  <span>Diffuser l'Audio vocal</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
