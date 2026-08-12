import React, { useState } from 'react';
import { Tournament, Athlete } from '../../types';
import { Trophy, Calendar, MapPin, Award, CheckCircle, Flame } from 'lucide-react';

interface TournamentsViewProps {
  tournaments: Tournament[];
  athlete: Athlete | null;
  onRegister: (tournamentId: string) => Promise<void>;
}

export const TournamentsView: React.FC<TournamentsViewProps> = ({ tournaments, athlete, onRegister }) => {
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const handleRegister = async (tournamentId: string) => {
    setLoadingId(tournamentId);
    await onRegister(tournamentId);
    setLoadingId(null);
  };

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-purple-950/80 to-zinc-950 border border-purple-900/50 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Trophy className="w-6 h-6 text-amber-400" />
            Torneios & Campeonatos Regionais BJJ
          </h1>
          <p className="text-xs text-purple-300 mt-1">
            Participe dos Opens regionais de Jiu-Jitsu. Todos os campeonatos de IA possuem inscrição gratuita!
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-amber-950/80 text-amber-300 px-3 py-1 rounded-lg border border-amber-800">
            CUSTO: 0 JT • RECOMPENSA: MEDALHAS & XP
          </span>
        </div>
      </div>

      {/* Tournament Cards List */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tourn) => {
          const isRegistered = athlete && tourn.participants.some((p) => p.id === athlete.id);

          return (
            <div
              key={tourn.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-purple-800/80 rounded-2xl p-6 flex flex-col justify-between gap-5 transition shadow-xl"
            >
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-400 bg-emerald-950/80 px-2.5 py-1 rounded-md border border-emerald-800 font-mono uppercase">
                    INSCRIÇÕES ABERTAS
                  </span>
                  <span className="text-xs font-mono font-bold text-amber-400">0 JT (Grátis)</span>
                </div>

                <div>
                  <h3 className="font-extrabold text-white text-base leading-snug">{tourn.name}</h3>
                  <p className="text-xs text-zinc-400 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5 text-purple-400" />
                    {tourn.location}
                  </p>
                </div>

                <div className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs flex flex-col gap-1.5">
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Categoria Faixa:</span>
                    <span className="font-bold text-zinc-200">{tourn.beltCategory}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Inscritos:</span>
                    <span className="font-bold text-purple-300">{tourn.participants.length} Atletas</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Prêmio XP:</span>
                    <span className="font-bold text-amber-400">+{tourn.rewardXP} XP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-400">Medalha:</span>
                    <span className="font-bold text-zinc-300 truncate">{tourn.rewardMedal}</span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              {isRegistered ? (
                <div className="w-full bg-emerald-950/80 border border-emerald-800 text-emerald-300 text-xs font-bold py-3 rounded-xl flex items-center justify-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Atleta Inscrito na Chave</span>
                </div>
              ) : (
                <button
                  disabled={loadingId === tourn.id}
                  onClick={() => handleRegister(tourn.id)}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white font-bold py-3 rounded-xl text-xs transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/50"
                >
                  <Flame className="w-4 h-4 text-amber-300" />
                  <span>
                    {loadingId === tourn.id ? 'Realizando Inscrição...' : 'Confirmar Inscrição Gratuita'}
                  </span>
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
