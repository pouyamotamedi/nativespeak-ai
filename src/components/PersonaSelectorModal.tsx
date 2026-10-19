import React from 'react';
import { AIPersona } from '../types';
import { AI_PERSONAS } from '../data/initialData';
import { X, Volume2, CheckCircle2, Sparkles } from 'lucide-react';
import { playAudioText } from '../utils/audio';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentPersona: AIPersona;
  onSelectPersona: (persona: AIPersona) => void;
}

export const PersonaSelectorModal: React.FC<Props> = ({
  isOpen,
  onClose,
  currentPersona,
  onSelectPersona,
}) => {
  if (!isOpen) return null;

  const handleTestVoice = (persona: AIPersona, e: React.MouseEvent) => {
    e.stopPropagation();
    const greetings: Record<string, string> = {
      'sam-california': "Hey what's up! Let's get your speaking to the next level today.",
      'victoria-nyc': 'Good day. I look forward to refining your professional communication skills.',
      'oliver-london': "Splendid to meet you! Let's practice some proper British pronunciation, shall we?",
      'chloe-sydney': "G'day mate! Ready to have some fun and practice speaking like a pro?",
      'marcus-texas': "Howdy partner! Don't hold back, let's speak up with confidence!",
    };
    playAudioText(greetings[persona.id] || "Hello, let's practice speaking!", {
      lang: persona.accentCode,
      rate: persona.speechRate,
      pitch: persona.speechPitch,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
      <div className="w-full max-w-md max-h-[90vh] overflow-hidden rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl flex flex-col font-fa">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800">
          <div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" />
              انتخاب مربی هوش مصنوعی
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              لحن و لهجه پارتنر مکالمه خود را انتخاب کنید
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Persona list */}
        <div className="overflow-y-auto p-4 space-y-3 flex-1">
          {AI_PERSONAS.map((persona) => {
            const isSelected = persona.id === currentPersona.id;
            return (
              <div
                key={persona.id}
                onClick={() => {
                  onSelectPersona(persona);
                  onClose();
                }}
                className={`relative p-4 rounded-2xl border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-indigo-950/50 border-indigo-500 shadow-lg shadow-indigo-500/10'
                    : 'bg-slate-800/40 border-slate-800/80 hover:bg-slate-800/70 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start gap-3.5">
                  <div className="text-3xl p-2 rounded-2xl bg-slate-800 border border-slate-700/60 shadow-inner">
                    {persona.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">{persona.titleFa}</h4>
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                          {persona.badge}
                        </span>
                      </div>
                      {isSelected && (
                        <CheckCircle2 className="w-5 h-5 text-indigo-400 shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-slate-300 mt-1 font-fa leading-relaxed">
                      {persona.descriptionFa}
                    </p>
                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-slate-800/60 text-[11px] text-slate-400">
                      <span className="font-en text-slate-400 font-medium">
                        {persona.accent}
                      </span>
                      <button
                        type="button"
                        onClick={(e) => handleTestVoice(persona, e)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-indigo-600/30 text-indigo-300 border border-slate-700 text-xs transition active:scale-95"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span>تست صدا</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
