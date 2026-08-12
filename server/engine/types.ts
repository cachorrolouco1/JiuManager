/**
 * JiuManager Game Engine - Types & Domain Models
 * Core mathematical & logical simulation model
 */

export type PositionState =
  | 'STANDING'
  | 'CLOSED_GUARD'
  | 'OPEN_GUARD'
  | 'HALF_GUARD'
  | 'SIDE_CONTROL'
  | 'KNEE_ON_BELLY'
  | 'MOUNT'
  | 'BACK_CONTROL'
  | 'TURTLE'
  | 'SCRAMBLE';

export type EventType =
  | 'TAKEDOWN_ATTEMPT'
  | 'TAKEDOWN_SUCCESS'
  | 'TAKEDOWN_DEFENSE'
  | 'GUARD_PULL'
  | 'CLOSED_GUARD'
  | 'OPEN_GUARD'
  | 'HALF_GUARD'
  | 'GUARD_PASS_ATTEMPT'
  | 'GUARD_PASS_SUCCESS'
  | 'GUARD_RECOVERY'
  | 'SWEEP_ATTEMPT'
  | 'SWEEP_SUCCESS'
  | 'SWEEP_DEFENSE'
  | 'SIDE_CONTROL'
  | 'MOUNT'
  | 'BACK_CONTROL'
  | 'SUBMISSION_ATTEMPT'
  | 'SUBMISSION_DEFENSE'
  | 'SUBMISSION_ESCAPE'
  | 'SUBMISSION_SUCCESS'
  | 'POSITION_TRANSITION'
  | 'STAND_UP'
  | 'PENALTY'
  | 'ADVANTAGE'
  | 'POINTS'
  | 'END_MATCH';

export type SubmissionName =
  | 'REAR_NAKED_CHOKE'
  | 'ARMBAR'
  | 'TRIANGLE'
  | 'GUILLOTINE'
  | 'KIMURA'
  | 'AMERICANA'
  | 'OMOPLATA'
  | 'STRAIGHT_ANKLE_LOCK'
  | 'HEEL_HOOK'
  | 'DARCE'
  | 'ANACONDA'
  | 'BOW_AND_ARROW'
  | 'EZEQUIEL';

export type FighterStyle =
  | 'GUARDEIRO'
  | 'PASSADOR'
  | 'PRESSURE'
  | 'WRESTLER'
  | 'SUBMISSION_HUNTER'
  | 'COUNTER_FIGHTER'
  | 'MODERN'
  | 'BALANCED';

export type FighterStrategy =
  | 'AGGRESSIVE'
  | 'BALANCED'
  | 'DEFENSIVE'
  | 'SUBMISSION'
  | 'PASSING'
  | 'GUARD'
  | 'TAKEDOWN'
  | 'PRESSURE'
  | 'COUNTER';

export interface FighterAttributes {
  takedown: number;
  guard: number;
  passing: number;
  sweeping: number;
  submission: number;
  submissionDefense: number;
  escape: number;
  pressure: number;
  grip: number;
  technique: number;
  strength: number;
  speed: number;
  explosion: number;
  cardio: number;
  flexibility: number;
  balance: number;
  mental: number;
  aggression: number;
  tacticalIntelligence: number;
  experience: number;
}

export interface EngineFighter {
  id: string;
  name: string;
  belt: string;
  style: FighterStyle;
  strategy: FighterStrategy;
  attributes: FighterAttributes;
  energy: number; // 0 - 100
  stamina: number; // 0 - 100
  fatigue: number; // 0 - 100
  personality?: string;
  isBot: boolean;
}

export interface MatchScoreState {
  aPoints: number;
  bPoints: number;
  aAdvantages: number;
  bAdvantages: number;
  aPenalties: number;
  bPenalties: number;
}

export interface CombatEvent {
  eventId: string;
  matchId: string;
  timestampSeconds: number; // match internal clock seconds (0..300)
  timestampDisplay: string; // "MM:SS"
  eventType: EventType;
  actorId: string;
  actorName: string;
  targetId: string;
  targetName: string;
  positionBefore: PositionState;
  positionAfter: PositionState;
  points: number;
  advantage: number;
  penalty: number;
  energyChangeActor: number;
  energyChangeTarget: number;
  fatigueChangeActor: number;
  fatigueChangeTarget: number;
  success: boolean;
  submissionMove?: SubmissionName | string;
  narration: string;
  actionDetails?: string;
}

export type MatchStatus = 'RUNNING' | 'PAUSED' | 'FINISHED' | 'CANCELLED';

export type WinningMethod =
  | 'SUBMISSION'
  | 'POINTS'
  | 'ADVANTAGES'
  | 'PENALTIES'
  | 'DECISION'
  | 'DISQUALIFICATION'
  | 'IN_PROGRESS';

export interface MatchState {
  matchId: string;
  seed: string;
  status: MatchStatus;
  timeSeconds: number; // Current match clock seconds (0..300)
  maxDurationSeconds: number; // Default 300 (5 minutes)
  
  // Real-Time Combat Clock Engine mandatory fields
  startedAt: number | null; // Monotonic/Server timestamp ms when match started
  pausedAt: number | null; // Monotonic/Server timestamp ms when match paused
  endedAt: number | null; // Monotonic/Server timestamp ms when match ended
  totalPausedMs: number; // Total accumulated real pause duration in ms
  elapsedMilliseconds: number; // Current elapsed combat duration in ms (0..300000)
  durationMilliseconds: number; // Default 300000 ms (5:00)
  speed: 1 | 2 | 4 | 8; // Speed multiplier (1x, 2x, 4x, 8x)
  lastServerTimestamp: number; // Server timestamp ms at last state sync

  fighterA: EngineFighter;
  fighterB: EngineFighter;
  topFighterId: string | null;
  bottomFighterId: string | null;
  position: PositionState;
  score: MatchScoreState;
  isFinished: boolean;
  winnerId: string | null;
  method: WinningMethod;
  submissionTechnique?: SubmissionName | string;
  lastEvent: CombatEvent | null;
  eventHistory: CombatEvent[];
}

export interface MatchRulesConfig {
  matchDurationSeconds: number; // Standard 300s (5 min)
  pointsMap: {
    TAKEDOWN: number;
    SWEEP: number;
    GUARD_PASS: number;
    KNEE_ON_BELLY: number;
    MOUNT: number;
    BACK_CONTROL: number;
  };
  penaltyDisqualificationThreshold: number; // Default 3 penalties
}
