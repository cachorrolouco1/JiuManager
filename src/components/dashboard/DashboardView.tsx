import React from 'react';
import { Athlete, WorldEvent } from '../../types';
import { BeltBadge } from '../BeltBadge';
import { Swords, Zap, Trophy, TrendingUp, Calendar, Newspaper, Flame, Activity } from 'lucide-react';

interface DashboardViewProps {
  athlete: Athlete | null;
  worldEvents?: WorldEvent[];
  onNavigate: (tab: string) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ athlete, worldEvents = [], onNavigate }) => {
  if (!athlete) return <div className="p-8 text-zinc-400">Carregando dados do atleta...</div>;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Welcome Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-zinc-950 via-purple-950/60 to-zinc-950 p-6 sm:p-8 border border-purple-900/40 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <img
              src={athlete.avatar}
              alt={athlete.name}
              className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-purple-500/30 shadow-lg"
            />
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-3 flex-wrap">
                <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">{athlete.name}</h1>
                <BeltBadge belt={athlete.belt} degrees={athlete.degrees} size="md" />
              </div>
              <p className="text-xs sm:text-sm text-purple-300">
                "{athlete.nickname}" • Estilo <span className="font-semibold text-white">{athlete.style}</span> • {athlete.academyName}
              </p>
              <span className="text-xs text-zinc-400">
                Categoria <strong className="text-zinc-200">{athlete.category}</strong> ({athlete.weightKg} kg) • {athlete.city}, {athlete.country}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => onNavigate('arena')}
              className="flex items-center gap-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold px-6 py-3 rounded-xl shadow-lg shadow-purple-950/50 transition transform hover:-translate-y-0.5"
            >
              <Swords className="w-5 h-5 text-amber-300" />
              <span>Entrar na Arena</span>
            </button>
            <button
              onClick={() => onNavigate('atleta')}
              className="bg-zinc-900/90 hover:bg-zinc-800 text-zinc-200 font-bold px-4 py-3 rounded-xl border border-zinc-700 transition"
            >
              Ajustar Treino
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Record & Wins */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Cartel Profissional</span>
            <Trophy className="w-5 h-5 text-amber-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-white">
              {athlete.wins}V - {athlete.losses}D - {athlete.draws}E
            </div>
            <p className="text-xs text-emerald-400 font-medium mt-0.5">
              {athlete.submissionsCount} Finalizações no Cartel
            </p>
          </div>
        </div>

        {/* Energy & Stamina */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Energia & Treino</span>
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400/20" />
          </div>
          <div>
            <div className="flex items-baseline justify-between mb-1">
              <span className="text-2xl font-black text-white">{athlete.energy}%</span>
              <span className="text-xs text-zinc-400 uppercase">Foco: {athlete.currentTrainingFocus}</span>
            </div>
            <div className="w-full h-2 bg-zinc-800 rounded-full overflow-hidden border border-zinc-700">
              <div
                className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 transition-all duration-300"
                style={{ width: `${athlete.energy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Ranking Points */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Pontos de Ranking</span>
            <TrendingUp className="w-5 h-5 text-purple-400" />
          </div>
          <div>
            <div className="text-2xl font-black text-purple-300">{athlete.rankingPoints} PTS</div>
            <p className="text-xs text-zinc-400 mt-0.5">Nível {athlete.level} • XP {athlete.xp}</p>
          </div>
        </div>

        {/* Active Belt Status */}
        <div className="bg-zinc-900/80 border border-zinc-800 p-5 rounded-2xl flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">Graduação BJJ</span>
            <Flame className="w-5 h-5 text-red-500" />
          </div>
          <div className="flex items-center gap-3">
            <BeltBadge belt={athlete.belt} degrees={athlete.degrees} size="md" />
          </div>
        </div>
      </div>

      {/* Bottom 2 Column Layout: Quick Arena Match & World Feed */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Next Championship & Arena Shortcut */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-extrabold text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-purple-400" />
                Próximos Campeonatos do Calendário
              </h2>
              <button
                onClick={() => onNavigate('eventos')}
                className="text-xs text-purple-400 hover:text-purple-300 font-semibold"
              >
                Ver Todos →
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-amber-400 bg-amber-950/80 px-2 py-0.5 rounded border border-amber-800">
                    OPEN GRATUITO
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">0 JT</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">OPEN RIO DE JANEIRO BJJ</h3>
                  <p className="text-xs text-zinc-400">Inscrições abertas para todas as faixas</p>
                </div>
                <button
                  onClick={() => onNavigate('eventos')}
                  className="w-full bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold py-2 rounded-lg transition"
                >
                  Inscrever Atleta (Grátis)
                </button>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 flex flex-col justify-between gap-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-400 bg-blue-950/80 px-2 py-0.5 rounded border border-blue-800">
                    CATEGORIA AZUL
                  </span>
                  <span className="text-[10px] text-zinc-400 font-mono">0 JT</span>
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-sm">OPEN SÃO PAULO BJJ</h3>
                  <p className="text-xs text-zinc-400">Disputa regional para faixa azul</p>
                </div>
                <button
                  onClick={() => onNavigate('eventos')}
                  className="w-full bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold py-2 rounded-lg transition"
                >
                  Ver Chaveamento
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Live World Feed Ticker */}
        <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-extrabold text-white flex items-center gap-2">
              <Newspaper className="w-5 h-5 text-purple-400" />
              Notícias do Mundo Vivo
            </h2>
            <span className="text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-mono">
              IA 24/7
            </span>
          </div>

          <div className="flex flex-col gap-3 max-h-[300px] overflow-y-auto pr-1">
            {(worldEvents || []).length === 0 ? (
              <p className="text-xs text-zinc-500 py-4 text-center">Nenhum evento registrado ainda.</p>
            ) : (
              (worldEvents || []).slice(0, 6).map((evt) => (
                <div key={evt.id} className="bg-zinc-950 p-3 rounded-xl border border-zinc-800 text-xs flex flex-col gap-1">
                  <span className="font-bold text-zinc-200">{evt.title}</span>
                  <span className="text-zinc-400 leading-snug">{evt.description}</span>
                  <span className="text-[10px] text-zinc-500 font-mono mt-1">
                    {new Date(evt.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
