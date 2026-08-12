/**
 * JiuManager - Express + Vite Full-Stack Entry Server
 * Master Specification Section 42 (REST API Architecture)
 */

import express from 'express';
import http from 'http';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { initDatabase, getDB, saveDatabase } from './server/db';
import { startWorldSimulationEngine, generateOfflineDigest } from './server/worldEngine';
import { simulateMatch, convertAthleteToEngineFighter } from './server/combatEngine';
import { transferJT, adminModifyJT } from './server/jtEconomy';
import { getAdminDashboardStats, adminCreateBots, adminSetBotStatus, adminControlSimulation } from './server/admin';
import { CombatMatch } from './src/types';
import { setupWebSocketServer, getOrCreateLiveMatch, getLiveMatch } from './server/wsServer';

async function startServer() {
  const app = express();
  const PORT = 3000;
  const server = http.createServer(app);

  // Setup Real-Time Combat WebSocket Server
  setupWebSocketServer(server);

  app.use(express.json());

  // Initialize persistent database and start background world runner
  initDatabase();
  startWorldSimulationEngine();

  // --- API ROUTES ---

  // 1. /api/auth & User Profile
  app.get('/api/auth/me', (req, res) => {
    const db = getDB();
    const user = db.users[0]; // Active session user
    const athlete = db.athletes.find((a) => a.id === user.athleteId) || db.athletes[0];
    res.json({ user, athlete });
  });

  // 2. /api/player (Athlete Stats, Character Creation, Training)
  app.get('/api/player/me', (req, res) => {
    const db = getDB();
    const athlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];
    res.json(athlete);
  });

  app.post('/api/player/update', (req, res) => {
    const db = getDB();
    const athlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];
    const { name, nickname, style, academyId, weightCategory } = req.body;

    if (name) athlete.name = name;
    if (nickname) athlete.nickname = nickname;
    if (style) athlete.style = style;
    if (weightCategory) athlete.category = weightCategory;

    if (academyId) {
      const acad = db.academies.find((a) => a.id === academyId);
      if (acad) {
        athlete.academyId = acad.id;
        athlete.academyName = acad.name;
      }
    }

    saveDatabase();
    res.json({ success: true, athlete });
  });

  // 3. /api/training
  app.post('/api/training/set-focus', (req, res) => {
    const db = getDB();
    const athlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];
    const { focus } = req.body;

    if (!focus) {
      return res.status(400).json({ error: 'Foco de treino é obrigatório.' });
    }

    athlete.currentTrainingFocus = focus;
    if (focus === 'descanso') {
      athlete.energy = 100;
      athlete.fatigue = Math.max(0, athlete.fatigue - 30);
    } else {
      // Simulate training intensity
      athlete.fatigue = Math.min(100, athlete.fatigue + 15);
      const statKey = focus as keyof typeof athlete.attributes;
      if (athlete.attributes[statKey] !== undefined && athlete.attributes[statKey] < 99) {
        athlete.attributes[statKey] += 1;
        athlete.xp += 20;
        if (athlete.xp >= athlete.level * 100) {
          athlete.level += 1;
        }
      }
    }

    saveDatabase();
    res.json({ success: true, athlete });
  });

  // 4. /api/matches & /api/combats (PvE & PvP Matchmaking & Combat Simulator)
  app.get('/api/matches/history', (req, res) => {
    const db = getDB();
    res.json(db.matches);
  });

  app.get('/api/combats', (req, res) => {
    const db = getDB();
    res.json(db.combats);
  });

  app.post('/api/combats/propose', (req, res) => {
    const db = getDB();
    const { challengedAthleteId, isTournament } = req.body;
    const userAthlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];
    const challenged = db.athletes.find((a) => a.id === challengedAthleteId);

    if (!challenged) {
      return res.status(404).json({ error: 'Atleta não encontrado.' });
    }

    const newCombat: CombatMatch = {
      id: `cbt_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      challengerAthleteId: userAthlete.id,
      challengedAthleteId: challenged.id,
      status: challenged.isBot ? 'SCHEDULED' : 'PROPOSED',
      createdTimestamp: Date.now(),
      isTournament: !!isTournament,
    };

    db.combats.unshift(newCombat);
    saveDatabase();
    res.json(newCombat);
  });

  app.post('/api/combats/:id/accept', (req, res) => {
    const db = getDB();
    const combat = db.combats.find((c) => c.id === req.params.id);
    if (!combat) return res.status(404).json({ error: 'Combate não encontrado.' });

    combat.status = 'SCHEDULED';
    saveDatabase();
    res.json(combat);
  });

  app.post('/api/matches/simulate', (req, res) => {
    const db = getDB();
    const { opponentId } = req.body;
    const userAthlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];

    const opponent = db.athletes.find((a) => a.id === opponentId) || db.athletes.find((a) => a.isBot);
    if (!opponent) {
      return res.status(404).json({ error: 'Adversário não encontrado.' });
    }

    const match = simulateMatch(userAthlete, opponent, 'Luta Avulsa da Arena');
    db.matches.unshift(match);

    // Update user athlete records
    if (match.winnerId === userAthlete.id) {
      userAthlete.wins += 1;
      userAthlete.rankingPoints += 25;
      userAthlete.xp += 50;
      if (match.method === 'finalizacao') userAthlete.submissionsCount += 1;
    } else {
      userAthlete.losses += 1;
      userAthlete.xp += 15;
    }

    saveDatabase();
    res.json(match);
  });

  // --- LIVE REAL-TIME COMBAT CLOCK MATCH ENDPOINTS ---
  app.post('/api/combats/live/start', (req, res) => {
    const db = getDB();
    const { opponentId, speed, matchId } = req.body;
    const userAthlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];
    const opponent = db.athletes.find((a) => a.id === opponentId) || db.athletes.find((a) => a.isBot);

    if (!opponent) {
      return res.status(404).json({ error: 'Adversário não encontrado para luta ao vivo.' });
    }

    const fighterA = convertAthleteToEngineFighter(userAthlete);
    const fighterB = convertAthleteToEngineFighter(opponent);

    const mId = matchId || `live_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    const liveMatch = getOrCreateLiveMatch(mId, fighterA, fighterB, { speed: speed || 1 });

    if (liveMatch.getClockSnapshot().status === 'NOT_STARTED') {
      liveMatch.start(speed || 1);
    }

    res.json({
      matchId: mId,
      matchState: liveMatch.getMatchState(),
      clockSnapshot: liveMatch.getClockSnapshot(),
      wsEndpoint: '/ws/combat',
    });
  });

  app.get('/api/combats/live/:id', (req, res) => {
    const liveMatch = getLiveMatch(req.params.id);
    if (!liveMatch) {
      return res.status(404).json({ error: 'Luta ao vivo não encontrada.' });
    }
    res.json({
      matchState: liveMatch.getMatchState(),
      clockSnapshot: liveMatch.getClockSnapshot(),
    });
  });

  app.post('/api/combats/live/:id/pause', (req, res) => {
    const liveMatch = getLiveMatch(req.params.id);
    if (!liveMatch) return res.status(404).json({ error: 'Luta ao vivo não encontrada.' });
    liveMatch.pause();
    res.json({ success: true, clockSnapshot: liveMatch.getClockSnapshot() });
  });

  app.post('/api/combats/live/:id/resume', (req, res) => {
    const liveMatch = getLiveMatch(req.params.id);
    if (!liveMatch) return res.status(404).json({ error: 'Luta ao vivo não encontrada.' });
    liveMatch.resume();
    res.json({ success: true, clockSnapshot: liveMatch.getClockSnapshot() });
  });

  app.post('/api/combats/live/:id/speed', (req, res) => {
    const liveMatch = getLiveMatch(req.params.id);
    if (!liveMatch) return res.status(404).json({ error: 'Luta ao vivo não encontrada.' });
    const { speed } = req.body;
    if (speed === 1 || speed === 2 || speed === 4 || speed === 8) {
      liveMatch.setSpeed(speed);
    }
    res.json({ success: true, clockSnapshot: liveMatch.getClockSnapshot() });
  });

  // 5. /api/tournaments
  app.get('/api/tournaments', (req, res) => {
    const db = getDB();
    res.json(db.tournaments);
  });

  app.post('/api/tournaments/:id/register', (req, res) => {
    const db = getDB();
    const tournament = db.tournaments.find((t) => t.id === req.params.id);
    if (!tournament) return res.status(404).json({ error: 'Torneio não encontrado.' });

    const userAthlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];
    if (!tournament.participants.some((p) => p.id === userAthlete.id)) {
      tournament.participants.push(userAthlete);
      saveDatabase();
    }

    res.json({ success: true, tournament });
  });

  // 6. /api/rankings
  app.get('/api/rankings', (req, res) => {
    const db = getDB();
    const sorted = [...db.athletes].sort((a, b) => b.rankingPoints - a.rankingPoints);
    res.json({
      global: sorted,
      realOnly: sorted.filter((a) => !a.isBot),
      botsOnly: sorted.filter((a) => a.isBot),
    });
  });

  // 7. /api/academies
  app.get('/api/academies', (req, res) => {
    const db = getDB();
    res.json(db.academies);
  });

  // 8. /api/bots & Bot Control
  app.get('/api/bots', (req, res) => {
    const db = getDB();
    res.json(db.athletes.filter((a) => a.isBot));
  });

  // 9. /api/world (World Events & Offline Digest)
  app.get('/api/world/events', (req, res) => {
    const db = getDB();
    res.json(db.worldEvents);
  });

  app.get('/api/world/offline-digest', (req, res) => {
    const db = getDB();
    const userAthlete = db.athletes.find((a) => !a.isBot) || db.athletes[0];
    const lastSeen = req.query.lastSeen ? Number(req.query.lastSeen) : Date.now() - 3600000;
    const digest = generateOfflineDigest(userAthlete.id, lastSeen);
    res.json(digest);
  });

  // 10. /api/jt (JT Token Wallet & Transfers)
  app.get('/api/jt/wallet', (req, res) => {
    const db = getDB();
    const user = db.users[0];
    const userTxs = db.jtTransactions.filter((t) => t.userId === user.id);
    res.json({
      balanceJT: user.jtBalance,
      transactions: userTxs,
    });
  });

  app.post('/api/jt/transfer', (req, res) => {
    const db = getDB();
    const sender = db.users[0];
    const { toUserId, amountJT, reason } = req.body;

    const result = transferJT(sender.id, toUserId, Number(amountJT), reason || 'Transferência P2P');
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  });

  // 11. /api/admin/* (God Mode Administration)
  app.get('/api/admin/dashboard', (req, res) => {
    const db = getDB();
    const stats = getAdminDashboardStats(db.users[0].id);
    res.json(stats);
  });

  app.post('/api/admin/bots/create', (req, res) => {
    const db = getDB();
    const { count, belt, category, reason } = req.body;
    try {
      const result = adminCreateBots(db.users[0].id, Number(count) || 1, belt, category, reason);
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/bots/status', (req, res) => {
    const db = getDB();
    const { botId, newStatus, reason } = req.body;
    try {
      const result = adminSetBotStatus(db.users[0].id, botId, newStatus, reason || 'Moderação Admin');
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.post('/api/admin/jt/modify', (req, res) => {
    const db = getDB();
    const { targetUserId, amountJT, reason } = req.body;
    const result = adminModifyJT(db.users[0].id, targetUserId, Number(amountJT), reason || 'Ajuste Deus Admin');
    if (!result.success) {
      return res.status(400).json({ error: result.message });
    }
    res.json(result);
  });

  app.post('/api/admin/simulation/control', (req, res) => {
    const db = getDB();
    const { command, speed, fastForwardDays } = req.body;
    try {
      const result = adminControlSimulation(db.users[0].id, command, speed, Number(fastForwardDays));
      res.json(result);
    } catch (err: any) {
      res.status(400).json({ error: err.message });
    }
  });

  app.get('/api/admin/audit', (req, res) => {
    const db = getDB();
    res.json(db.adminAuditLogs);
  });

  // Vite Middleware Setup for Development / Static serving for production
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`JiuManager Server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer();
