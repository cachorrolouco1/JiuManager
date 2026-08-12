/**
 * JiuManager - Combat Engine Bridge
 * Delegates simulation execution to the modular Game Engine
 */

import { Athlete, FightLogEntry, Match } from '../src/types';
import { CombatEngine, EngineFighter, MatchState } from './engine';

export function convertAthleteToEngineFighter(p: Athlete): EngineFighter {
  return {
    id: p.id,
    name: p.name,
    belt: p.belt,
    style: (p.style as any) || 'BALANCED',
    strategy: 'BALANCED',
    energy: p.energy ?? 100,
    stamina: 100,
    fatigue: p.fatigue ?? 0,
    personality: p.personality,
    isBot: p.isBot,
    attributes: {
      takedown: p.attributes.quedas || 50,
      guard: p.attributes.guarda || 50,
      passing: p.attributes.passagem || 50,
      sweeping: p.attributes.raspagem || 50,
      submission: p.attributes.finalizacao || 50,
      submissionDefense: p.attributes.defesa || 50,
      escape: p.attributes.defesa || 50,
      pressure: p.attributes.forca || 50,
      grip: p.attributes.tecnica || 50,
      technique: p.attributes.tecnica || 50,
      strength: p.attributes.forca || 50,
      speed: p.attributes.resistencia || 50,
      explosion: p.attributes.explosao || 50,
      cardio: p.attributes.cardio || 50,
      flexibility: p.attributes.mobilidade || 50,
      balance: p.attributes.defesa || 50,
      mental: p.attributes.mental || 50,
      aggression: p.attributes.estrategia || 50,
      tacticalIntelligence: p.attributes.estrategia || 50,
      experience: p.attributes.experiencia || 50,
    },
  };
}

export function simulateMatch(p1: Athlete, p2: Athlete, tournamentName?: string): Match {
  const engine = new CombatEngine();

  const ef1: EngineFighter = convertAthleteToEngineFighter(p1);
  const ef2: EngineFighter = convertAthleteToEngineFighter(p2);

  const matchState: MatchState = engine.simulateFullMatch(ef1, ef2, { durationSeconds: 300 });

  // Map engine combat events to legacy UI FightLogEntry
  const logs: FightLogEntry[] = matchState.eventHistory.map((evt, idx) => ({
    id: evt.eventId || `log_${idx}`,
    timeSeconds: evt.timestampSeconds,
    timeDisplay: evt.timestampDisplay,
    description: evt.narration,
    position: mapPositionToLegacy(evt.positionAfter),
    actorId: evt.actorId,
    actorName: evt.actorName,
    actionType: mapEventTypeToLegacyAction(evt.eventType),
    pointsAwarded: evt.points > 0 ? evt.points : undefined,
  }));

  const methodLegacy =
    matchState.method === 'SUBMISSION'
      ? 'finalizacao'
      : matchState.method === 'POINTS'
      ? 'pontos'
      : matchState.method === 'ADVANTAGES'
      ? 'vantagens'
      : 'pontos';

  return {
    id: matchState.matchId,
    type: !p1.isBot && !p2.isBot ? 'PvP' : 'PvE',
    tournamentName,
    p1,
    p2,
    winnerId: matchState.winnerId,
    method: methodLegacy,
    score: {
      p1Points: matchState.score.aPoints,
      p2Points: matchState.score.bPoints,
      p1Advantages: matchState.score.aAdvantages,
      p2Advantages: matchState.score.bAdvantages,
      p1Penalties: matchState.score.aPenalties,
      p2Penalties: matchState.score.bPenalties,
    },
    submissionMove: matchState.submissionTechnique,
    logs,
    durationSeconds: matchState.timeSeconds,
    isSimulated: true,
    createdAt: Date.now(),
  };
}

function mapPositionToLegacy(pos: string): FightLogEntry['position'] {
  switch (pos) {
    case 'STANDING':
      return 'em_pe';
    case 'CLOSED_GUARD':
    case 'OPEN_GUARD':
      return 'guarda';
    case 'HALF_GUARD':
      return 'meia_guarda';
    case 'SIDE_CONTROL':
      return 'passagem';
    case 'MOUNT':
      return 'montada';
    case 'BACK_CONTROL':
      return 'costas';
    default:
      return 'guarda';
  }
}

function mapEventTypeToLegacyAction(evtType: string): FightLogEntry['actionType'] {
  switch (evtType) {
    case 'TAKEDOWN_SUCCESS':
    case 'GUARD_PASS_SUCCESS':
    case 'SWEEP_SUCCESS':
    case 'POINTS':
      return 'score';
    case 'SUBMISSION_ATTEMPT':
      return 'submission_attempt';
    case 'SUBMISSION_SUCCESS':
      return 'finish';
    case 'ADVANTAGE':
      return 'advantage';
    case 'PENALTY':
      return 'penalty';
    default:
      return 'action';
  }
}
