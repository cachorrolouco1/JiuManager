import React, { useState, useEffect } from 'react';
import { Athlete, Match, FightLogEntry } from '../../types';
import { BeltBadge } from '../BeltBadge';
import { Swords, Bot, Trophy, Play, FastForward, Shield, Award, RotateCcw, Flame } from 'lucide-react';

interface ArenaViewProps {
  athlete: Athlete | null;
  bots: Athlete[];
  onSimulateMatch?: (opponentId: string) => Promise<Match>;
  onSimulateCombat?: (opponentId: string) => Promise<Match>;
  combats?: any[];
  onProposeChallenge?: (challengedAthleteId: string, isTournament: boolean) => Promise<void>;
  onAcceptChallenge?: (combatId: string) => Promise<void>;
}

export const ArenaView: React.FC<ArenaViewProps> = ({
  athlete,
  bots = [],
  onSimulateMatch,
  onSimulateCombat,
}) => {
  const [selectedBotId, setSelectedBotId] = useState<string>(bots[0]?.id || '');
  const [currentMatch, setCurrentMatch] = useState<Match | null>(null);
  const [loading, setLoading] = useState(false);
  const [visibleLogIndex, setVisibleLogIndex] = useState<number>(0);

  useEffect(() => {
    if (!selectedBotId && bots.length > 0) {
      setSelectedBotId(bots[0].id);
    }
  }, [bots, selectedBotId]);

  if (!athlete) return <div className="p-8 text-zinc-400">Carregando arena...</div>;

  const handleStartFight = async () => {
    if (!selectedBotId) return;
    setLoading(true);
    const simulator = onSimulateMatch || onSimulateCombat;
    if (simulator) {
      const match = await simulator(selectedBotId);
      if (match) {
        setCurrentMatch(match);
        setVisibleLogIndex(match.logs ? match.logs.length : 0);
      }
    }
    setLoading(false);
  };

  const selectedBot = bots.find((b) => b.id === selectedBotId) || bots[0];

  return (
    <div className="flex flex-col gap-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-zinc-950 via-purple-950/80 to-zinc-950 border border-purple-900/50 rounded-2xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white flex items-center gap-2">
            <Swords className="w-6 h-6 text-purple-400" />
            Arena de Luta BJJ (Combate & Motor IA)
          </h1>
          <p className="text-xs text-purple-300 mt-1">
            Simulação de combate baseada nas regras IBJJF e em 15 atributos de lutador.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono bg-purple-900/60 text-purple-200 px-3 py-1 rounded-lg border border-purple-700">
            SISTEMA REGRAS IBJJF
          </span>
        </div>
      </div>

      {/* Opponent Selection & Pre-Match Preview */}
      {!currentMatch && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left 2 Cols: Opponent List */}
          <div className="lg:col-span-2 bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <h2 className="text-sm font-extrabold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Selecione seu Adversário na Arena</span>
              <span className="text-xs text-purple-400 font-mono">
                {bots.length} Atletas IA Disponíveis
              </span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-[480px] overflow-y-auto pr-1">
              {bots.map((bot) => {
                const isSelected = selectedBotId === bot.id;
                return (
                  <button
                    key={bot.id}
                    onClick={() => setSelectedBotId(bot.id)}
                    className={`p-4 rounded-xl border text-left transition flex items-center gap-3 ${
                      isSelected
                        ? 'bg-purple-950/90 border-purple-500 shadow-lg shadow-purple-950/50'
                        : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={bot.avatar}
                      alt={bot.name}
                      className="w-12 h-12 rounded-xl object-cover ring-2 ring-purple-500/30"
                    />
                    <div className="flex flex-col gap-1 flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-white text-xs truncate">{bot.name}</span>
                        <span className="text-[9px] bg-purple-950 text-purple-300 px-1.5 py-0.5 rounded border border-purple-800 font-mono">
                          IA / BOT
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <BeltBadge belt={bot.belt} degrees={bot.degrees} size="sm" />
                        <span className="text-[11px] text-zinc-400">{bot.category}</span>
                      </div>
                      <span className="text-[10px] text-zinc-500">
                        {bot.wins}V - {bot.losses}D • Estilo {bot.style}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Right Col: Matchup Faceoff Preview */}
          {selectedBot && (
            <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between gap-6 shadow-xl">
              <h2 className="text-sm font-bold text-white uppercase tracking-wider text-center">
                Confronto Confirmado
              </h2>

              <div className="flex items-center justify-around gap-2 text-center">
                {/* User Fighter */}
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={athlete.avatar}
                    alt={athlete.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-purple-500/50"
                  />
                  <span className="font-extrabold text-white text-xs">{athlete.name}</span>
                  <BeltBadge belt={athlete.belt} degrees={athlete.degrees} size="sm" />
                </div>

                <div className="flex flex-col items-center">
                  <span className="text-xl font-black text-purple-400 italic">VS</span>
                  <span className="text-[10px] text-zinc-500 uppercase font-mono">10 MIN</span>
                </div>

                {/* Opponent Bot */}
                <div className="flex flex-col items-center gap-2">
                  <img
                    src={selectedBot.avatar}
                    alt={selectedBot.name}
                    className="w-16 h-16 rounded-2xl object-cover ring-4 ring-zinc-700"
                  />
                  <span className="font-extrabold text-white text-xs">{selectedBot.name}</span>
                  <BeltBadge belt={selectedBot.belt} degrees={selectedBot.degrees} size="sm" />
                </div>
              </div>

              <div className="bg-zinc-950 p-4 rounded-xl border border-zinc-800 text-xs flex flex-col gap-2">
                <div className="flex justify-between">
                  <span className="text-zinc-400">Personalidade IA:</span>
                  <span className="font-bold text-purple-300 uppercase">{selectedBot.personality}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Cartel do Oponente:</span>
                  <span className="font-bold text-zinc-200">{selectedBot.wins}V - {selectedBot.losses}D</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-400">Academia:</span>
                  <span className="font-bold text-zinc-200 truncate">{selectedBot.academyName}</span>
                </div>
              </div>

              <button
                disabled={loading}
                onClick={handleStartFight}
                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-extrabold py-3.5 rounded-xl shadow-lg shadow-purple-950/50 transition flex items-center justify-center gap-2"
              >
                <Flame className="w-5 h-5 text-amber-300" />
                <span>{loading ? 'Simulando Combate...' : 'Iniciar Luta na Arena'}</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* Live Play-by-Play Fight Replay Viewer */}
      {currentMatch && (
        <div className="flex flex-col gap-6 animate-fade-in">
          {/* Match Scoreboard Header */}
          <div className="bg-zinc-900 border border-purple-900/60 rounded-2xl p-6 shadow-2xl flex flex-col gap-4">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <span className="text-xs font-bold text-purple-400 uppercase tracking-wider font-mono">
                {currentMatch.tournamentName || 'Arena de Luta BJJ'}
              </span>
              <button
                onClick={() => setCurrentMatch(null)}
                className="flex items-center gap-1.5 text-xs bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-3 py-1.5 rounded-lg border border-zinc-700 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Nova Luta</span>
              </button>
            </div>

            {/* Score Display */}
            <div className="flex items-center justify-between gap-4">
              {/* P1 Athlete */}
              <div className="flex items-center gap-4 flex-1">
                <img
                  src={currentMatch.p1.avatar}
                  alt={currentMatch.p1.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-purple-500"
                />
                <div className="flex flex-col">
                  <span className="font-black text-white text-base">{currentMatch.p1.name}</span>
                  <span className="text-xs text-purple-300">{currentMatch.p1.academyName}</span>
                </div>
              </div>

              {/* Big Score Board */}
              <div className="bg-zinc-950 px-6 py-3 rounded-2xl border border-zinc-800 text-center flex flex-col items-center">
                <span className="text-xs text-zinc-400 font-mono mb-1">PLACAR IBJJF</span>
                <div className="text-3xl font-black text-white tracking-widest font-mono">
                  {currentMatch.score.p1Points} - {currentMatch.score.p2Points}
                </div>
                <div className="text-[10px] text-amber-400 font-mono mt-1">
                  Vantagens: {currentMatch.score.p1Advantages} x {currentMatch.score.p2Advantages}
                </div>
              </div>

              {/* P2 Athlete */}
              <div className="flex items-center justify-end gap-4 flex-1">
                <div className="flex flex-col text-right">
                  <span className="font-black text-white text-base">{currentMatch.p2.name}</span>
                  <span className="text-xs text-purple-300">{currentMatch.p2.academyName}</span>
                </div>
                <img
                  src={currentMatch.p2.avatar}
                  alt={currentMatch.p2.name}
                  className="w-14 h-14 rounded-2xl object-cover ring-2 ring-zinc-700"
                />
              </div>
            </div>

            {/* Winner Announcement Banner */}
            {currentMatch.winnerId && (
              <div className="bg-gradient-to-r from-emerald-950/80 via-zinc-950 to-emerald-950/80 border border-emerald-800/80 p-4 rounded-xl text-center flex flex-col items-center gap-1">
                <div className="flex items-center gap-2">
                  <Trophy className="w-5 h-5 text-amber-400" />
                  <span className="font-black text-emerald-300 text-base uppercase">
                    Vitória de {currentMatch.winnerId === currentMatch.p1.id ? currentMatch.p1.name : currentMatch.p2.name}!
                  </span>
                </div>
                <p className="text-xs text-zinc-300">
                  Método: <strong className="uppercase font-mono text-white">{currentMatch.method}</strong>
                  {currentMatch.submissionMove && ` (${currentMatch.submissionMove})`}
                </p>
              </div>
            )}
          </div>

          {/* Dynamic Play-by-Play Narrative Stream */}
          <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-6 flex flex-col gap-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center justify-between">
              <span>Narrativa Dinâmica do Combate (Play-by-Play)</span>
              <span className="text-xs text-zinc-400 font-mono">
                {currentMatch.logs.length} Lances Gravados
              </span>
            </h3>

            <div className="flex flex-col gap-2 max-h-[400px] overflow-y-auto pr-2">
              {currentMatch.logs.slice(0, visibleLogIndex).map((log) => (
                <div
                  key={log.id}
                  className={`p-3.5 rounded-xl border text-xs flex items-start gap-3 transition ${
                    log.actionType === 'finish'
                      ? 'bg-emerald-950/80 border-emerald-700 text-emerald-100 font-bold'
                      : log.actionType === 'submission_attempt'
                      ? 'bg-amber-950/70 border-amber-800 text-amber-200'
                      : log.actionType === 'score'
                      ? 'bg-purple-950/70 border-purple-800 text-purple-200'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-300'
                  }`}
                >
                  <span className="font-mono text-purple-400 font-bold bg-zinc-900 px-2 py-0.5 rounded border border-zinc-800 shrink-0">
                    {log.timeDisplay}
                  </span>
                  <div className="flex-1">
                    <p className="leading-relaxed">{log.description}</p>
                  </div>
                  {log.pointsAwarded && (
                    <span className="bg-amber-500 text-black font-extrabold px-2 py-0.5 rounded font-mono text-[10px]">
                      +{log.pointsAwarded} PTS
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
