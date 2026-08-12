/**
 * JiuManager - Server Persistent Database & Store
 * Guarantees 100% persistence for User Athlete, Bots, Academies, Matches, Tournaments, JT Wallet, and World Events.
 */

import fs from 'fs';
import path from 'path';
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
} from '../src/types';

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'jiumanager.json');

export interface DBState {
  users: UserAccount[];
  athletes: Athlete[];
  academies: Academy[];
  matches: Match[];
  combats: CombatMatch[];
  tournaments: Tournament[];
  jtTransactions: JTTransaction[];
  worldEvents: WorldEvent[];
  adminAuditLogs: AdminAuditLog[];
  simulationStatus: SimulationEngineStatus;
  lastSimulatedAt: number;
}

// Initial Seeding Data
const initialAcademies: Academy[] = [
  {
    id: 'acad_1',
    name: 'Alliance Jiu-Jitsu Matrix',
    city: 'São Paulo',
    country: 'Brasil',
    professorName: 'Mestre Fabio Gurgel (Virtual)',
    reputation: 98,
    studentCount: 342,
    isBot: true,
    description: 'Uma das academias mais vitoriosas da história do BJJ mundial.',
  },
  {
    id: 'acad_2',
    name: 'Atos Jiu-Jitsu HQ',
    city: 'San Diego',
    country: 'EUA',
    professorName: 'Mestre André Galvão (Virtual)',
    reputation: 97,
    studentCount: 289,
    isBot: true,
    description: 'Foco total em alta performance e preparação física.',
  },
  {
    id: 'acad_3',
    name: 'Gracie Barra Headquarter',
    city: 'Rio de Janeiro',
    country: 'Brasil',
    professorName: 'Mestre Carlos Gracie Jr (Virtual)',
    reputation: 96,
    studentCount: 512,
    isBot: true,
    description: 'Jiu-Jitsu para todos com forte filosofia de vida.',
  },
  {
    id: 'acad_4',
    name: 'Art of Jiu Jitsu (AOJ)',
    city: 'Costa Mesa',
    country: 'EUA',
    professorName: 'Mendes Bros (Virtual)',
    reputation: 95,
    studentCount: 198,
    isBot: true,
    description: 'Especialistas em guarda moderna e passagem de guarda cirúrgica.',
  },
  {
    id: 'acad_5',
    name: 'Checkmat Santos HQ',
    city: 'Santos',
    country: 'Brasil',
    professorName: 'Mestre Leo Vieira (Virtual)',
    reputation: 94,
    studentCount: 240,
    isBot: true,
    description: 'Estilo agressivo, focado em quedas e finalizações dinâmicas.',
  },
];

// Helper to procedural generate bot attributes
export function createProceduralBot(
  id: string,
  name: string,
  nickname: string,
  belt: Athlete['belt'],
  degrees: number,
  category: Athlete['category'],
  academy: Academy,
  style: Athlete['style'],
  personality: Athlete['personality'],
  baseRating: number
): Athlete {
  const variation = () => Math.floor(baseRating + (Math.random() * 12 - 6));
  return {
    id,
    name,
    nickname,
    avatar: `https://images.unsplash.com/photo-${1534528741775 + Math.floor(Math.random()*1000)}?w=150&auto=format&fit=crop&q=80`,
    sex: Math.random() > 0.2 ? 'M' : 'F',
    age: Math.floor(20 + Math.random() * 15),
    heightCm: Math.floor(170 + Math.random() * 20),
    weightKg: Math.floor(65 + Math.random() * 30),
    category,
    city: academy.city,
    country: academy.country,
    academyId: academy.id,
    academyName: academy.name,
    belt,
    degrees,
    style,
    personality,
    isBot: true,
    botTag: 'IA',
    energy: 100,
    fatigue: 0,
    xp: baseRating * 150,
    level: Math.floor(baseRating / 5),
    attributes: {
      tecnica: variation(),
      guarda: variation(),
      passagem: variation(),
      quedas: variation(),
      raspagem: variation(),
      finalizacao: variation(),
      defesa: variation(),
      forca: variation(),
      resistencia: variation(),
      explosao: variation(),
      mobilidade: variation(),
      mental: variation(),
      estrategia: variation(),
      experiencia: variation(),
      cardio: variation(),
    },
    currentTrainingFocus: 'guarda',
    wins: Math.floor(baseRating / 2 + Math.random() * 10),
    losses: Math.floor(Math.random() * 8),
    draws: Math.floor(Math.random() * 3),
    submissionsCount: Math.floor(baseRating / 3 + Math.random() * 5),
    titlesCount: Math.floor(Math.random() * 4),
    rankingPoints: baseRating * 12,
    status: 'active',
    createdAt: Date.now() - Math.floor(Math.random() * 100000000),
  };
}

// Initial seed bots
const initialBots: Athlete[] = [
  createProceduralBot('bot_1', 'Lucas "Lobo" Andrade', 'Lobo', 'AZUL', 2, 'Médio', initialAcademies[0], 'Passador', 'agressivo', 68),
  createProceduralBot('bot_2', 'Mateus "Tanque" Silva', 'Tanque', 'ROXA', 3, 'Pesado', initialAcademies[1], 'Pressionador', 'wrestler', 78),
  createProceduralBot('bot_3', 'Gabriel "Mago" Costa', 'Mago', 'MARROM', 1, 'Pena', initialAcademies[3], 'Guardião', 'paciente', 85),
  createProceduralBot('bot_4', 'Rodrigo "Samurai" Santos', 'Samurai', 'PRETA', 2, 'Meio-Pesado', initialAcademies[2], 'Finalizador', 'finalizador', 92),
  createProceduralBot('bot_5', 'Felipe "Pitbull" Barbosa', 'Pitbull', 'BRANCA', 4, 'Leve', initialAcademies[4], 'Wrestler', 'agressivo', 55),
  createProceduralBot('bot_6', 'Enzo "Naja" Oliveira', 'Naja', 'AZUL', 1, 'Pluma', initialAcademies[3], 'Guardião', 'guardião', 64),
  createProceduralBot('bot_7', 'Thiago "Trator" Mendes', 'Trator', 'ROXA', 2, 'Super-Pesado', initialAcademies[0], 'Passador', 'pressionador', 76),
  createProceduralBot('bot_8', 'Bruno "Cobra" Ferreira', 'Cobra', 'MARROM', 3, 'Médio', initialAcademies[1], 'Finalizador', 'estratégico', 87),
];

// Seed initial user
const initialUser: UserAccount = {
  id: 'usr_default',
  username: 'AtletaJiuManager',
  email: 'atleta@jiumanager.com',
  role: 'SUPER_ADMIN', // Super Admin by default for testing God Mode
  jiuSpeakId: 'jiuspeak_usr_88219',
  jtBalance: 1500, // 1500 JT tokens initial
  athleteId: 'ath_user_1',
  createdAt: Date.now(),
};

// Seed initial user athlete
const initialUserAthlete: Athlete = {
  id: 'ath_user_1',
  userId: 'usr_default',
  name: 'Seu Atleta BJJ',
  nickname: 'Fenômeno',
  avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
  sex: 'M',
  age: 24,
  heightCm: 178,
  weightKg: 82,
  category: 'Médio',
  city: 'São Paulo',
  country: 'Brasil',
  academyId: 'acad_1',
  academyName: 'Alliance Jiu-Jitsu Matrix',
  belt: 'BRANCA',
  degrees: 2,
  style: 'Finalizador',
  personality: 'estratégico',
  isBot: false,
  energy: 95,
  fatigue: 10,
  xp: 320,
  level: 4,
  attributes: {
    tecnica: 52,
    guarda: 55,
    passagem: 48,
    quedas: 45,
    raspagem: 50,
    finalizacao: 58,
    defesa: 51,
    forca: 60,
    resistencia: 58,
    explosao: 52,
    mobilidade: 54,
    mental: 65,
    estrategia: 62,
    experiencia: 40,
    cardio: 70,
  },
  currentTrainingFocus: 'finalizacao',
  wins: 6,
  losses: 2,
  draws: 0,
  submissionsCount: 4,
  titlesCount: 1,
  rankingPoints: 180,
  status: 'active',
  createdAt: Date.now() - 86400000 * 10,
};

// Initial Tournaments
const initialTournaments: Tournament[] = [
  {
    id: 'tourn_1',
    name: 'OPEN RIO DE JANEIRO BJJ',
    location: 'Rio de Janeiro, Brasil',
    beltCategory: 'TODAS',
    weightCategory: 'TODAS',
    entryFeeJT: 0,
    rewardJT: 0,
    rewardXP: 250,
    rewardMedal: 'Medalha de Ouro Open Rio',
    participants: [initialUserAthlete, ...initialBots.slice(0, 7)],
    status: 'open',
    bracket: [],
    isSimulated: true,
    season: 1,
    createdAt: Date.now(),
  },
  {
    id: 'tourn_2',
    name: 'OPEN SÃO PAULO BJJ',
    location: 'São Paulo, Brasil',
    beltCategory: 'AZUL',
    weightCategory: 'Médio',
    entryFeeJT: 0,
    rewardJT: 0,
    rewardXP: 200,
    rewardMedal: 'Medalha de Ouro Open SP',
    participants: [initialBots[0], initialBots[5]],
    status: 'open',
    bracket: [],
    isSimulated: true,
    season: 1,
    createdAt: Date.now(),
  },
  {
    id: 'tourn_3',
    name: 'OPEN CALIFORNIA GRAND PRIX',
    location: 'San Diego, EUA',
    beltCategory: 'ROXA',
    weightCategory: 'TODAS',
    entryFeeJT: 0,
    rewardJT: 0,
    rewardXP: 300,
    rewardMedal: 'Troféu California Champion',
    participants: [initialBots[1], initialBots[6]],
    status: 'open',
    bracket: [],
    isSimulated: true,
    season: 1,
    createdAt: Date.now(),
  },
];

let dbState: DBState = {
  users: [initialUser],
  athletes: [initialUserAthlete, ...initialBots],
  academies: initialAcademies,
  matches: [],
  combats: [
    {
      id: 'cbt_init_1',
      challengerAthleteId: 'bot_1',
      challengedAthleteId: 'ath_user_1',
      status: 'SCHEDULED',
      createdTimestamp: Date.now() - 3600000,
      isTournament: false,
    },
  ],
  tournaments: initialTournaments,
  jtTransactions: [
    {
      id: 'tx_init_1',
      userId: 'usr_default',
      type: 'deposit',
      amountJT: 1500,
      previousBalanceJT: 0,
      newBalanceJT: 1500,
      reason: 'Bônus de Boas-Vindas JiuSpeak Integrado',
      timestamp: Date.now(),
      txHash: '0x' + Math.random().toString(16).substring(2, 14),
    },
  ],
  worldEvents: [
    {
      id: 'we_1',
      timestamp: Date.now() - 3600000,
      type: 'tournament_finished',
      title: 'Inscrições Abertas no Open Rio de Janeiro',
      description: 'O Open Rio de Janeiro BJJ está com inscrições gratuitas abertas no JiuManager!',
      involvedAthleteIds: ['ath_user_1'],
      isUserImpacted: true,
    },
  ],
  adminAuditLogs: [],
  simulationStatus: {
    status: 'running',
    speed: 'NORMAL',
    activeBots: 8,
    totalBots: 8,
    matchesPerHour: 12,
    jobsInQueue: 0,
    lastTickAt: Date.now(),
    cpuUsage: 2.4,
    memoryUsageMB: 128,
    errorsCount: 0,
  },
  lastSimulatedAt: Date.now(),
};

// Persistence Loader & Saver
export function initDatabase(): DBState {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DATA_FILE)) {
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const loaded = JSON.parse(raw);
      dbState = { ...dbState, ...loaded };
      if (!dbState.combats) dbState.combats = [];
      console.log('Database loaded successfully from disk. Total athletes:', dbState.athletes.length);
    } else {
      saveDatabase();
      console.log('New database created and seeded.');
    }
  } catch (err) {
    console.error('Error reading database file:', err);
  }
  return dbState;
}

export function saveDatabase() {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DATA_FILE, JSON.stringify(dbState, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving database file:', err);
  }
}

export function getDB(): DBState {
  return dbState;
}
