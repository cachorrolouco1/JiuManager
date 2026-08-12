/**
 * JiuManager - Types & Domain Models
 * Master Specification Architecture
 */

export type BeltRank = 'BRANCA' | 'AZUL' | 'ROXA' | 'MARROM' | 'PRETA';

export type FightStyle = 
  | 'Passador'
  | 'Guardião'
  | 'Wrestler'
  | 'Finalizador'
  | 'Pressionador'
  | 'Equilibrado'
  | 'Imprevisível';

export type PersonalityTrait = 
  | 'agressivo'
  | 'defensivo'
  | 'estratégico'
  | 'paciente'
  | 'finalizador'
  | 'passador'
  | 'guardião'
  | 'wrestler'
  | 'pressionador'
  | 'imprevisível';

export type WeightCategory = 
  | 'Galo'         // até 57.5 kg
  | 'Pluma'        // até 64.0 kg
  | 'Pena'         // até 70.0 kg
  | 'Leve'         // até 76.0 kg
  | 'Médio'        // até 82.3 kg
  | 'Meio-Pesado'  // até 88.3 kg
  | 'Pesado'       // até 94.3 kg
  | 'Super-Pesado' // até 100.5 kg
  | 'Pesadíssimo'  // sem limite
  | 'Absoluto';    // sem limite de peso

export interface AthleteAttributes {
  tecnica: number;      // 1-100
  guarda: number;       // 1-100
  passagem: number;     // 1-100
  quedas: number;       // 1-100
  raspagem: number;     // 1-100
  finalizacao: number;  // 1-100
  defesa: number;       // 1-100
  forca: number;        // 1-100
  resistencia: number;  // 1-100
  explosao: number;     // 1-100
  mobilidade: number;   // 1-100
  mental: number;       // 1-100
  estrategia: number;   // 1-100
  experiencia: number;  // 1-100
  cardio: number;       // 1-100
}

export type TrainingFocus = 
  | 'guarda'
  | 'passagem'
  | 'quedas'
  | 'finalizacao'
  | 'defesa'
  | 'cardio'
  | 'forca'
  | 'mobilidade'
  | 'estrategia'
  | 'descanso';

export interface Athlete {
  id: string;
  userId?: string;
  name: string;
  nickname: string;
  avatar: string;
  sex: 'M' | 'F';
  age: number;
  heightCm: number;
  weightKg: number;
  category: WeightCategory;
  city: string;
  country: string;
  academyId: string;
  academyName: string;
  belt: BeltRank;
  degrees: number; // 0-4 degrees (or 0-6 black belt)
  style: FightStyle;
  personality: PersonalityTrait;
  
  // Data Integrity Rules (Absolutas)
  isBot: boolean;
  botTag?: 'SIMULADO' | 'IA' | 'VIRTUAL' | 'GERADO PELO JIUMANAGER';
  
  // Dynamic state
  energy: number;      // 0-100
  fatigue: number;     // 0-100
  xp: number;
  level: number;
  attributes: AthleteAttributes;
  
  // Training
  currentTrainingFocus: TrainingFocus;
  trainingEndTime?: number; // timestamp
  
  // Career stats
  wins: number;
  losses: number;
  draws: number;
  submissionsCount: number;
  titlesCount: number;
  rankingPoints: number;
  
  status: 'active' | 'training' | 'fighting' | 'resting' | 'paused' | 'retired';
  difficulty?: 'fácil' | 'médio' | 'difícil' | 'elite';
  createdAt: number;
}

export interface FightLogEntry {
  id: string;
  timeSeconds: number;
  timeDisplay: string; // e.g. "02:14"
  description: string;
  position: 'em_pe' | 'guarda' | 'passagem' | 'montada' | 'costas' | 'meia_guarda' | 'finalizacao';
  actorId: string;
  actorName: string;
  actionType: 'action' | 'score' | 'advantage' | 'penalty' | 'submission_attempt' | 'finish';
  pointsAwarded?: number;
}

export interface MatchScore {
  p1Points: number;
  p2Points: number;
  p1Advantages: number;
  p2Advantages: number;
  p1Penalties: number;
  p2Penalties: number;
}

export interface Match {
  id: string;
  type: 'PvE' | 'PvP';
  tournamentId?: string;
  tournamentName?: string;
  p1: Athlete;
  p2: Athlete;
  winnerId: string | null;
  method: 'finalizacao' | 'pontos' | 'vantagens' | 'desqualificacao' | 'em_andamento';
  score: MatchScore;
  submissionMove?: string;
  logs: FightLogEntry[];
  durationSeconds: number;
  isSimulated: boolean;
  createdAt: number;
}

export interface CombatMatch {
  id: string;
  challengerAthleteId: string;
  challengedAthleteId: string;
  status: 'PROPOSED' | 'SCHEDULED' | 'COMPLETED' | 'CANCELLED';
  createdTimestamp: number;
  isTournament: boolean;
  matchResult?: Match;
}

export interface TournamentBracketMatch {
  matchId: string;
  roundName: string; // 'Quartas', 'Semi', 'Final'
  p1Id: string;
  p2Id: string;
  winnerId?: string;
}

export interface Tournament {
  id: string;
  name: string;
  location: string;
  beltCategory: BeltRank | 'TODAS';
  weightCategory: WeightCategory | 'TODAS';
  entryFeeJT: 0; // Regional AI tournaments are free!
  rewardJT: 0;   // Regional AI tournaments give 0 JT (economy rule)
  rewardXP: number;
  rewardMedal: string;
  participants: Athlete[];
  status: 'open' | 'in_progress' | 'completed';
  winnerAthleteId?: string;
  bracket: TournamentBracketMatch[];
  isSimulated: true;
  season: number;
  createdAt: number;
}

export interface Academy {
  id: string;
  name: string;
  city: string;
  country: string;
  professorName: string;
  reputation: number; // 1-100
  studentCount: number;
  isBot: boolean;
  description: string;
}

export interface JTTransaction {
  id: string;
  userId: string;
  adminId?: string;
  type: 'deposit' | 'withdrawal' | 'match_reward' | 'p2p_transfer' | 'admin_adjustment';
  amountJT: number;
  previousBalanceJT: number;
  newBalanceJT: number;
  reason: string;
  timestamp: number;
  txHash: string;
}

export interface WorldEvent {
  id: string;
  timestamp: number;
  type: 'bot_fight' | 'bot_training' | 'tournament_finished' | 'rank_changed' | 'belt_promotion' | 'rivalry_update' | 'academy_switch';
  title: string;
  description: string;
  involvedAthleteIds: string[];
  isUserImpacted: boolean;
}

export interface OfflineDigest {
  absentTimeSeconds: number;
  fightsOccurred: number;
  tournamentsFinished: number;
  rivalUpdates: string[];
  rankChangeMessage: string;
  trainingProgressMessage: string;
  recentEvents: WorldEvent[];
  offlineEvents?: Array<{ type: string; details: string; timestamp: number }>;
  pendingTasksCompleted?: number;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminRole: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT' | 'PLAYER';
  action: string;
  targetId: string;
  previousValue: string;
  newValue: string;
  reason: string;
  timestamp: number;
  ipSession: string;
}

export interface SimulationEngineStatus {
  status: 'running' | 'paused' | 'stopped';
  speed: 'NORMAL' | 'RÁPIDA' | 'LENTA' | 'PAUSADA' | 'TESTE';
  activeBots: number;
  totalBots: number;
  matchesPerHour: number;
  jobsInQueue: number;
  lastTickAt: number;
  cpuUsage: number;
  memoryUsageMB: number;
  errorsCount: number;
}

export interface UserAccount {
  id: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MODERATOR' | 'SUPPORT' | 'PLAYER';
  jiuSpeakId?: string;
  jtBalance: number; // Strictly computed on backend
  athleteId?: string;
  createdAt: number;
}

export interface DBState {
  users: UserAccount[];
  athletes: Athlete[];
  matches: Match[];
  combats: CombatMatch[];
  tournaments: Tournament[];
  academies: Academy[];
  jtTransactions: JTTransaction[];
  worldEvents: WorldEvent[];
  adminAuditLogs: AdminAuditLog[];
  simulationStatus: SimulationEngineStatus;
}
