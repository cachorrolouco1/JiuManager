import React, { useState } from 'react';
import { Athlete } from '../../types';
import { BeltBadge } from '../BeltBadge';
import { BarChart3, Bot, User, Award, Shield } from 'lucide-react';

interface RankingsViewProps {
  rankings: {
    global: Athlete[];
    realOnly: Athlete[];
    botsOnly: Athlete[];
  } | null;
}

export const RankingsView: React.FC<RankingsViewProps> = ({ rankings }) => {
  const [filter, setFilter] = useState<'global' | 'realOnly' | 'botsOnly'>('global');

  if (!rankings) return <div className="p-8 text-zinc-400">Carregando rankings...</div>;

  const currentList = rankings[filter] || rankings.global;

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-purple-950/80 to-zinc-950 border border-purple-900/50 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-purple-400" />
            Rankings Oficiais de Jiu-Jitsu
          </h1>
          <p className="text-xs text-purple-300 mt-1">
            Classificação geral de pontuação e títulos. Transparência total entre Atletas Reais e Entidades IA.
          </p>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-1.5 bg-zinc-900 p-1 rounded-xl border border-zinc-800 text-xs">
          <button
            onClick={() => setFilter('global')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'global' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Geral Universo
          </button>
          <button
            onClick={() => setFilter('realOnly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'realOnly' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Atletas Reais
          </button>
          <button
            onClick={() => setFilter('botsOnly')}
            className={`px-3 py-1.5 rounded-lg font-bold transition ${
              filter === 'botsOnly' ? 'bg-purple-600 text-white' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Entidades IA
          </button>
        </div>
      </div>

      {/* Rankings Leaderboard Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="bg-zinc-950 text-zinc-400 uppercase font-bold tracking-wider border-b border-zinc-800">
              <tr>
                <th className="py-4 px-6">Posição</th>
                <th className="py-4 px-6">Atleta</th>
                <th className="py-4 px-6">Tipo</th>
                <th className="py-4 px-6">Faixa</th>
                <th className="py-4 px-6">Academia</th>
                <th className="py-4 px-6">Cartel</th>
                <th className="py-4 px-6 text-right">Pontos</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60 font-medium">
              {currentList.map((athlete, index) => (
                <tr
                  key={athlete.id}
                  className={`hover:bg-zinc-800/50 transition ${
                    !athlete.isBot ? 'bg-purple-950/20' : ''
                  }`}
                >
                  <td className="py-4 px-6 font-mono font-bold text-sm text-zinc-400">
                    #{index + 1}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <img
                        src={athlete.avatar}
                        alt={athlete.name}
                        className="w-9 h-9 rounded-xl object-cover ring-2 ring-purple-500/30"
                      />
                      <div className="flex flex-col">
                        <span className="font-bold text-white text-sm">{athlete.name}</span>
                        <span className="text-[10px] text-zinc-400">"{athlete.nickname}" • {athlete.category}</span>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {athlete.isBot ? (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-purple-950 text-purple-300 px-2 py-0.5 rounded border border-purple-800 font-mono">
                        <Bot className="w-3 h-3 text-purple-400" />
                        IA / BOT
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-950 text-emerald-300 px-2 py-0.5 rounded border border-emerald-800 font-mono font-bold">
                        <User className="w-3 h-3 text-emerald-400" />
                        ATLETA REAL
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <BeltBadge belt={athlete.belt} degrees={athlete.degrees} size="sm" />
                  </td>
                  <td className="py-4 px-6 text-zinc-400">
                    {athlete.academyName}
                  </td>
                  <td className="py-4 px-6 font-mono">
                    {athlete.wins}V - {athlete.losses}D ({athlete.submissionsCount} Fin)
                  </td>
                  <td className="py-4 px-6 text-right font-mono font-bold text-purple-300 text-sm">
                    {athlete.rankingPoints} PTS
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
