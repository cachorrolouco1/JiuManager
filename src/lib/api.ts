/**
 * JiuManager - Frontend API Client
 */

import {
  AdminAuditLog,
  Academy,
  Athlete,
  CombatMatch,
  JTTransaction,
  Match,
  OfflineDigest,
  SimulationEngineStatus,
  Tournament,
  UserAccount,
  WorldEvent,
} from '../types';

export async function fetchAuthMe(): Promise<{ user: UserAccount; athlete: Athlete }> {
  const res = await fetch('/api/auth/me');
  if (!res.ok) throw new Error('Falha ao obter autenticação');
  return res.json();
}

export async function updatePlayerProfile(data: {
  name?: string;
  nickname?: string;
  style?: Athlete['style'];
  academyId?: string;
  weightCategory?: Athlete['category'];
}): Promise<{ success: boolean; athlete: Athlete }> {
  const res = await fetch('/api/player/update', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function setTrainingFocus(focus: Athlete['currentTrainingFocus']): Promise<{ success: boolean; athlete: Athlete }> {
  const res = await fetch('/api/training/set-focus', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ focus }),
  });
  return res.json();
}

export async function simulateMatchApi(opponentId: string): Promise<Match> {
  const res = await fetch('/api/matches/simulate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ opponentId }),
  });
  return res.json();
}

export async function fetchTournaments(): Promise<Tournament[]> {
  const res = await fetch('/api/tournaments');
  return res.json();
}

export async function registerTournament(tournamentId: string): Promise<{ success: boolean; tournament: Tournament }> {
  const res = await fetch(`/api/tournaments/${tournamentId}/register`, {
    method: 'POST',
  });
  return res.json();
}

export async function fetchRankings(): Promise<{ global: Athlete[]; realOnly: Athlete[]; botsOnly: Athlete[] }> {
  const res = await fetch('/api/rankings');
  return res.json();
}

export async function fetchAcademies(): Promise<Academy[]> {
  const res = await fetch('/api/academies');
  return res.json();
}

export async function fetchBots(): Promise<Athlete[]> {
  const res = await fetch('/api/bots');
  return res.json();
}

export async function fetchWorldEvents(): Promise<WorldEvent[]> {
  const res = await fetch('/api/world/events');
  return res.json();
}

export async function fetchOfflineDigest(lastSeen?: number): Promise<OfflineDigest> {
  const timestamp = lastSeen || Date.now() - 86400000;
  const res = await fetch(`/api/world/offline-digest?lastSeen=${timestamp}`);
  return res.json();
}

export async function fetchJTWallet(): Promise<{ balanceJT: number; transactions: JTTransaction[] }> {
  const res = await fetch('/api/jt/wallet');
  return res.json();
}

export async function transferJTApi(toUserId: string, amountJT: number, reason: string) {
  const res = await fetch('/api/jt/transfer', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ toUserId, amountJT, reason }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error || 'Erro na transferência de JT');
  }
  return res.json();
}

export async function fetchAdminDashboard(): Promise<any> {
  const res = await fetch('/api/admin/dashboard');
  return res.json();
}

export async function adminCreateBotsApi(count: number, belt: Athlete['belt'], category: Athlete['category'], reason: string) {
  const res = await fetch('/api/admin/bots/create', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ count, belt, category, reason }),
  });
  return res.json();
}

export async function adminSetBotStatusApi(botId: string, newStatus: Athlete['status'], reason: string) {
  const res = await fetch('/api/admin/bots/status', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ botId, newStatus, reason }),
  });
  return res.json();
}

export async function adminModifyJTApi(targetUserId: string, amountJT: number, reason: string) {
  const res = await fetch('/api/admin/jt/modify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ targetUserId, amountJT, reason }),
  });
  return res.json();
}

export async function adminControlSimulationApi(
  command: 'START' | 'STOP' | 'PAUSE' | 'FAST_FORWARD',
  speed?: SimulationEngineStatus['speed'],
  fastForwardDays?: number
) {
  const res = await fetch('/api/admin/simulation/control', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ command, speed, fastForwardDays }),
  });
  return res.json();
}

export async function fetchAdminAuditLogs(): Promise<AdminAuditLog[]> {
  const res = await fetch('/api/admin/audit');
  return res.json();
}

export async function fetchCombats(): Promise<CombatMatch[]> {
  const res = await fetch('/api/combats');
  return res.json();
}

export async function proposeChallenge(challengedAthleteId: string, isTournament: boolean) {
  const res = await fetch('/api/combats/propose', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ challengedAthleteId, isTournament }),
  });
  return res.json();
}

export async function acceptChallenge(combatId: string) {
  const res = await fetch(`/api/combats/${combatId}/accept`, {
    method: 'POST',
  });
  return res.json();
}

// Unified API helper object
export const api = {
  getAthleteProfile: async (): Promise<Athlete> => {
    const data = await fetchAuthMe();
    return data.athlete;
  },
  getUserAccount: async (): Promise<UserAccount> => {
    const data = await fetchAuthMe();
    return data.user;
  },
  trainAthlete: async (focus: Athlete['currentTrainingFocus']): Promise<Athlete> => {
    const res = await setTrainingFocus(focus);
    return res.athlete;
  },
  getCombats: async (): Promise<CombatMatch[]> => {
    return fetchCombats();
  },
  proposeChallenge: async (challengedAthleteId: string, isTournament: boolean) => {
    return proposeChallenge(challengedAthleteId, isTournament);
  },
  acceptChallenge: async (combatId: string) => {
    return acceptChallenge(combatId);
  },
  simulateCombat: async (opponentIdOrCombatId: string) => {
    return simulateMatchApi(opponentIdOrCombatId);
  },
  getRankings: async () => {
    return fetchRankings();
  },
  getAcademies: async (): Promise<Academy[]> => {
    return fetchAcademies();
  },
  getTournaments: async (): Promise<Tournament[]> => {
    return fetchTournaments();
  },
  registerTournament: async (tournamentId: string) => {
    return registerTournament(tournamentId);
  },
  getJTTransactions: async (): Promise<JTTransaction[]> => {
    const wallet = await fetchJTWallet();
    return wallet.transactions;
  },
  transferJT: async (toUserId: string, amountJT: number, reason: string) => {
    return transferJTApi(toUserId, amountJT, reason);
  },
  updateAthleteProfile: async (data: any): Promise<Athlete> => {
    const res = await updatePlayerProfile(data);
    return res.athlete;
  },
  getOfflineDigest: async () => {
    return fetchOfflineDigest();
  },
  getWorldEvents: async (): Promise<WorldEvent[]> => {
    return fetchWorldEvents();
  },
  getAdminStats: async () => {
    return fetchAdminDashboard();
  },
  getAuditLogs: async () => {
    return fetchAdminAuditLogs();
  },
  getBots: async () => {
    return fetchBots();
  },
  adminCreateBots: async (count: number, belt: Athlete['belt'], category: Athlete['category'], reason: string) => {
    return adminCreateBotsApi(count, belt, category, reason);
  },
  adminSetBotStatus: async (botId: string, newStatus: Athlete['status'], reason: string) => {
    return adminSetBotStatusApi(botId, newStatus, reason);
  },
  adminModifyJT: async (targetUserId: string, amountJT: number, reason: string) => {
    return adminModifyJTApi(targetUserId, amountJT, reason);
  },
  adminControlSimulation: async (
    command: 'START' | 'STOP' | 'PAUSE' | 'FAST_FORWARD',
    speed?: any,
    fastForwardDays?: number
  ) => {
    return adminControlSimulationApi(command, speed, fastForwardDays);
  },
};
