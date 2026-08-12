import React from 'react';
import { OfflineDigest } from '../types';
import { X, History, Swords, Trophy, Zap, Activity } from 'lucide-react';

interface OfflineModalProps {
  digest: OfflineDigest | null;
  onClose: () => void;
}

export const OfflineModal: React.FC<OfflineModalProps> = ({ digest, onClose }) => {
  if (!digest) return null;

  const hoursAbsent = Math.floor((digest.absentTimeSeconds || 0) / 3600);
  const minutesAbsent = Math.floor(((digest.absentTimeSeconds || 0) % 3600) / 60);

  const rawEvents = digest.recentEvents || (digest as any).offlineEvents || [];
  const eventsList = rawEvents.map((e: any, idx: number) => ({
    id: e.id || `evt_${idx}`,
    title: e.title || e.type || 'Evento no Tatame',
    description: e.description || e.details || e.reason || 'Movimentação no universo do BJJ.',
  }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl text-zinc-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-950 via-zinc-900 to-zinc-900 p-5 border-b border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-purple-900/40 rounded-xl border border-purple-700/50">
              <History className="w-6 h-6 text-purple-400" />
            </div>
            <div>
              <h3 className="font-extrabold text-lg tracking-tight text-white uppercase">
                Enquanto Você Estava Fora...
              </h3>
              <p className="text-xs text-purple-300 font-mono">
                {hoursAbsent > 0 ? `${hoursAbsent}h ${minutesAbsent}m` : `${minutesAbsent} min`} de simulação do mundo vivo
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-white rounded-lg bg-zinc-800/80 hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 flex flex-col gap-5 max-h-[70vh] overflow-y-auto">
          {/* Summary Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-3">
              <Swords className="w-5 h-5 text-purple-400" />
              <div>
                <span className="text-xl font-extrabold text-white">{digest.fightsOccurred}</span>
                <p className="text-[11px] text-zinc-400">Lutas no Mundo IA</p>
              </div>
            </div>

            <div className="bg-zinc-950 p-3.5 rounded-xl border border-zinc-800 flex items-center gap-3">
              <Trophy className="w-5 h-5 text-amber-400" />
              <div>
                <span className="text-xl font-extrabold text-white">{digest.tournamentsFinished}</span>
                <p className="text-[11px] text-zinc-400">Torneios Concluídos</p>
              </div>
            </div>
          </div>

          {/* Status Updates */}
          <div className="bg-purple-950/30 border border-purple-900/50 p-4 rounded-xl flex flex-col gap-2">
            <div className="flex items-center gap-2 text-xs font-bold text-purple-300 uppercase">
              <Zap className="w-4 h-4 text-amber-400" />
              <span>Progresso do Atleta</span>
            </div>
            <p className="text-xs text-zinc-300">{digest.trainingProgressMessage}</p>
            <p className="text-xs text-emerald-400 font-semibold">{digest.rankChangeMessage}</p>
          </div>

          {/* World Feed */}
          <div className="flex flex-col gap-2">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider flex items-center gap-2">
              <Activity className="w-4 h-4 text-purple-400" />
              Eventos Recentes do Universo
            </span>
            <div className="flex flex-col gap-2">
              {eventsList.map((evt) => (
                <div key={evt.id} className="bg-zinc-950 p-3 rounded-lg border border-zinc-800 text-xs flex flex-col gap-1">
                  <span className="font-bold text-zinc-200">{evt.title}</span>
                  <span className="text-zinc-400">{evt.description}</span>
                </div>
              ))}
              {eventsList.length === 0 && (
                <p className="text-xs text-zinc-500 italic">Nenhum grande evento durante o período.</p>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-zinc-950 border-t border-zinc-800 flex justify-end">
          <button
            onClick={onClose}
            className="w-full sm:w-auto bg-purple-600 hover:bg-purple-500 text-white font-bold px-6 py-2.5 rounded-xl transition shadow-lg shadow-purple-950"
          >
            Entrar no Tatame
          </button>
        </div>
      </div>
    </div>
  );
};
