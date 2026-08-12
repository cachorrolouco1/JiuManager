/**
 * JiuManager - World Simulation Engine
 * Master Specification Section 9, 23, 33, 54
 */

import { getDB, saveDatabase, createProceduralBot } from './db';
import { simulateMatch } from './combatEngine';
import { Athlete, WorldEvent, OfflineDigest } from '../src/types';

let timer: NodeJS.Timeout | null = null;

export function startWorldSimulationEngine() {
  if (timer) clearInterval(timer);

  // Tick every 30 seconds
  timer = setInterval(() => {
    runWorldSimulationTick();
  }, 30000);

  console.log('JiuManager World Simulation Engine started (24/7 Background Runner).');
}

export function stopWorldSimulationEngine() {
  if (timer) clearInterval(timer);
  timer = null;
}

export function runWorldSimulationTick(forceFastForwardSeconds?: number) {
  const db = getDB();
  if (db.simulationStatus.status === 'paused' || db.simulationStatus.status === 'stopped') {
    return;
  }

  const now = Date.now();
  const timeDelta = forceFastForwardSeconds 
    ? forceFastForwardSeconds 
    : Math.max(1, Math.floor((now - db.lastSimulatedAt) / 1000));

  db.lastSimulatedAt = now;
  db.simulationStatus.lastTickAt = now;

  const bots = db.athletes.filter((a) => a.isBot && a.status !== 'retired' && a.status !== 'paused');
  if (bots.length === 0) return;

  // 1. Simulate Bot Training & Attribute Progression
  bots.forEach((bot) => {
    if (Math.random() < 0.4) {
      // Small attribute gain
      const statKeys: (keyof Athlete['attributes'])[] = ['tecnica', 'guarda', 'passagem', 'finalizacao', 'cardio', 'forca'];
      const chosen = statKeys[Math.floor(Math.random() * statKeys.length)];
      if (bot.attributes[chosen] < 99) {
        bot.attributes[chosen] += 1;
        bot.xp += 15;
      }
    }
  });

  // 2. Simulate Bot vs Bot Matches
  if (bots.length >= 2 && Math.random() < 0.6) {
    const b1 = bots[Math.floor(Math.random() * bots.length)];
    let b2 = bots[Math.floor(Math.random() * bots.length)];
    while (b2.id === b1.id) {
      b2 = bots[Math.floor(Math.random() * bots.length)];
    }

    const match = simulateMatch(b1, b2, 'Luta de Treino da Academia');
    db.matches.unshift(match);
    if (db.matches.length > 50) db.matches.pop(); // Keep last 50 matches

    // Update bot records
    if (match.winnerId === b1.id) {
      b1.wins += 1;
      b1.rankingPoints += 15;
      b2.losses += 1;
      if (match.method === 'finalizacao') b1.submissionsCount += 1;
    } else if (match.winnerId === b2.id) {
      b2.wins += 1;
      b2.rankingPoints += 15;
      b1.losses += 1;
      if (match.method === 'finalizacao') b2.submissionsCount += 1;
    }

    const winnerName = match.winnerId === b1.id ? b1.name : b2.name;
    const event: WorldEvent = {
      id: 'we_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      timestamp: Date.now(),
      type: 'bot_fight',
      title: `Luta de IA: ${b1.name} vs ${b2.name}`,
      description: `${winnerName} venceu por ${match.method}${match.submissionMove ? ' (' + match.submissionMove + ')' : ''}.`,
      involvedAthleteIds: [b1.id, b2.id],
      isUserImpacted: false,
    };
    db.worldEvents.unshift(event);
  }

  // 3. Maintain Min Bot Population (At least 12 bots)
  if (bots.length < 12) {
    const newBot = createProceduralBot(
      'bot_' + Date.now() + '_' + Math.random().toString(36).substring(2, 5),
      `Atleta Procedural ${Math.floor(Math.random() * 900 + 100)}`,
      'Promessa',
      'AZUL',
      1,
      'Médio',
      db.academies[Math.floor(Math.random() * db.academies.length)],
      'Passador',
      'agressivo',
      60
    );
    db.athletes.push(newBot);
    db.simulationStatus.totalBots = db.athletes.filter((a) => a.isBot).length;
    db.simulationStatus.activeBots = db.athletes.filter((a) => a.isBot && a.status === 'active').length;
  }

  // Keep world events log trimmed to 100
  if (db.worldEvents.length > 100) {
    db.worldEvents = db.worldEvents.slice(0, 100);
  }

  saveDatabase();
}

export function generateOfflineDigest(userAthleteId: string, lastSeenTimestamp: number): OfflineDigest {
  const db = getDB();
  const now = Date.now();
  const absentTimeSeconds = Math.max(0, Math.floor((now - lastSeenTimestamp) / 1000));

  const relevantEvents = db.worldEvents.filter((e) => e.timestamp >= lastSeenTimestamp);
  const userAthlete = db.athletes.find((a) => a.id === userAthleteId);

  // Calculate training progress if user was training
  let trainingProgressMessage = 'Seu atleta descansou e recuperou 100% da sua energia!';
  if (userAthlete) {
    userAthlete.energy = 100;
    userAthlete.fatigue = Math.max(0, userAthlete.fatigue - 20);
    trainingProgressMessage = `Seu treino focado em ${userAthlete.currentTrainingFocus.toUpperCase()} progrediu. Energia totalmente restaurada!`;
  }

  return {
    absentTimeSeconds,
    fightsOccurred: relevantEvents.filter((e) => e.type === 'bot_fight').length,
    tournamentsFinished: relevantEvents.filter((e) => e.type === 'tournament_finished').length,
    rivalUpdates: [
      'Lucas "Lobo" Andrade completou 5 sessões de treino de passagem de guarda.',
      'Mateus "Tanque" Silva venceu um torneio regional de IA.',
    ],
    rankChangeMessage: 'Você subiu no ranking regional de atletas da faixa ' + (userAthlete?.belt || 'BRANCA') + '!',
    trainingProgressMessage,
    recentEvents: relevantEvents.slice(0, 6),
  };
}
