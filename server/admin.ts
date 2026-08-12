/**
 * JiuManager - Admin God Mode & Control Center
 * Master Specification Sections 25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 37, 38, 50, 51
 */

import { getDB, saveDatabase, createProceduralBot } from './db';
import { runWorldSimulationTick } from './worldEngine';
import { AdminAuditLog, Athlete, SimulationEngineStatus, Tournament } from '../src/types';

export function getAdminDashboardStats(adminId: string) {
  const db = getDB();
  const bots = db.athletes.filter((a) => a.isBot);
  const realPlayers = db.athletes.filter((a) => !a.isBot);

  const botsByBelt: Record<string, number> = {};
  bots.forEach((b) => {
    botsByBelt[b.belt] = (botsByBelt[b.belt] || 0) + 1;
  });

  const botsByCategory: Record<string, number> = {};
  bots.forEach((b) => {
    botsByCategory[b.category] = (botsByCategory[b.category] || 0) + 1;
  });

  return {
    usersCount: db.users.length,
    realPlayersCount: realPlayers.length,
    botsCount: bots.length,
    activeBotsCount: bots.filter((b) => b.status === 'active').length,
    pausedBotsCount: bots.filter((b) => b.status === 'paused').length,
    retiredBotsCount: bots.filter((b) => b.status === 'retired').length,
    botsByBelt,
    botsByCategory,
    academiesCount: db.academies.length,
    tournamentsCount: db.tournaments.length,
    matchesCount: db.matches.length,
    totalJTCirculating: db.users.reduce((acc, u) => acc + u.jtBalance, 0),
    simulationStatus: db.simulationStatus,
    recentAuditLogs: db.adminAuditLogs.slice(0, 20),
    systemHealth: {
      apiStatus: 'ONLINE',
      dbStatus: 'PERSISTENT_OK',
      simulationEngineStatus: db.simulationStatus.status.toUpperCase(),
      botEngineStatus: 'HEALTHY',
      jtServiceStatus: 'AUDITED_OK',
      pwaServiceStatus: 'ACTIVE',
    },
  };
}

export function adminCreateBots(
  adminId: string,
  count: number,
  baseBelt: Athlete['belt'] = 'AZUL',
  baseCategory: Athlete['category'] = 'Médio',
  reason: string = 'Geração Procedural de População'
): { success: boolean; createdBots: Athlete[] } {
  const db = getDB();
  const admin = db.users.find((u) => u.id === adminId);
  if (!admin || (admin.role !== 'SUPER_ADMIN' && admin.role !== 'ADMIN')) {
    throw new Error('Acesso negado: Requer privilégios de Administrador.');
  }

  const created: Athlete[] = [];
  for (let i = 0; i < count; i++) {
    const academy = db.academies[Math.floor(Math.random() * db.academies.length)];
    const newBot = createProceduralBot(
      'bot_adm_' + Date.now() + '_' + i + '_' + Math.random().toString(36).substring(2, 5),
      `Atleta IA ${Math.floor(Math.random() * 9000 + 1000)}`,
      'Gladiador',
      baseBelt,
      Math.floor(Math.random() * 4),
      baseCategory,
      academy,
      'Passador',
      'agressivo',
      65 + Math.floor(Math.random() * 20)
    );
    db.athletes.push(newBot);
    created.push(newBot);
  }

  db.simulationStatus.totalBots = db.athletes.filter((a) => a.isBot).length;
  db.simulationStatus.activeBots = db.athletes.filter((a) => a.isBot && a.status === 'active').length;

  db.adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    adminId: admin.id,
    adminRole: admin.role,
    action: 'CRIACAO_BOTS_PROCEDURAIS',
    targetId: `BATCH_${count}_BOTS`,
    previousValue: `${db.athletes.length - count} atletas`,
    newValue: `${db.athletes.length} atletas`,
    reason,
    timestamp: Date.now(),
    ipSession: '127.0.0.1',
  });

  saveDatabase();
  return { success: true, createdBots: created };
}

export function adminSetBotStatus(
  adminId: string,
  botId: string,
  newStatus: Athlete['status'],
  reason: string
) {
  const db = getDB();
  const admin = db.users.find((u) => u.id === adminId);
  if (!admin) throw new Error('Administrador não autenticado.');

  const bot = db.athletes.find((a) => a.id === botId && a.isBot);
  if (!bot) throw new Error('Bot não encontrado.');

  const prevStatus = bot.status;
  bot.status = newStatus;

  db.adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    adminId: admin.id,
    adminRole: admin.role,
    action: 'ALTERACAO_STATUS_BOT',
    targetId: bot.id,
    previousValue: prevStatus,
    newValue: newStatus,
    reason,
    timestamp: Date.now(),
    ipSession: '127.0.0.1',
  });

  saveDatabase();
  return { success: true, bot };
}

export function adminControlSimulation(
  adminId: string,
  command: 'START' | 'STOP' | 'PAUSE' | 'FAST_FORWARD',
  speed?: SimulationEngineStatus['speed'],
  fastForwardDays?: number
) {
  const db = getDB();
  const admin = db.users.find((u) => u.id === adminId);
  if (!admin) throw new Error('Administrador não autenticado.');

  if (command === 'PAUSE') {
    db.simulationStatus.status = 'paused';
    db.simulationStatus.speed = 'PAUSADA';
  } else if (command === 'START') {
    db.simulationStatus.status = 'running';
    if (speed) db.simulationStatus.speed = speed;
  } else if (command === 'FAST_FORWARD' && fastForwardDays) {
    const seconds = fastForwardDays * 86400;
    // Execute multiple simulation ticks
    for (let i = 0; i < Math.min(20, fastForwardDays * 2); i++) {
      runWorldSimulationTick(seconds / 20);
    }
  }

  db.adminAuditLogs.unshift({
    id: 'audit_' + Date.now(),
    adminId: admin.id,
    adminRole: admin.role,
    action: `COMANDO_MOTOR_SIMULACAO_${command}`,
    targetId: 'WORLD_SIMULATION_ENGINE',
    previousValue: 'Anterior',
    newValue: db.simulationStatus.status,
    reason: `Comando administrativo: ${command} ${fastForwardDays ? '(' + fastForwardDays + ' dias)' : ''}`,
    timestamp: Date.now(),
    ipSession: '127.0.0.1',
  });

  saveDatabase();
  return { success: true, simulationStatus: db.simulationStatus };
}
