/**
 * JiuManager Game Engine - Automated Test Suite
 * Validates requirements section 31: Takedowns, Passes, Sweeps, Submissions, Defenses,
 * Scoring, Advantages, Penalties, Energy, Fatigue, Clock, Early Sub, Draw, Replay, Seed, AI.
 */

import {
  CombatEngine,
  EngineFighter,
  PositionEngine,
  ScoringEngine,
  EnergyEngine,
  SubmissionEngine,
  DefenseEngine,
  CombatAI,
  ReplayEngine,
  RandomEngine,
  MatchScoreState,
} from '../index';
import { runClockEngineTests } from './clockTests';

export async function runAllEngineTests(): Promise<{ passed: number; failed: number; logs: string[] }> {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      passed++;
      logs.push(`✅ PASS: ${testName}`);
    } else {
      failed++;
      logs.push(`❌ FAIL: ${testName}`);
    }
  }

  // Mock Fighter Builders
  const f1: EngineFighter = {
    id: 'f1',
    name: 'João Gracie',
    belt: 'Faixa Preta',
    style: 'GUARDEIRO',
    strategy: 'SUBMISSION',
    energy: 100,
    stamina: 100,
    fatigue: 0,
    isBot: false,
    attributes: {
      takedown: 70,
      guard: 90,
      passing: 75,
      sweeping: 88,
      submission: 92,
      submissionDefense: 85,
      escape: 80,
      pressure: 75,
      grip: 85,
      technique: 90,
      strength: 78,
      speed: 82,
      explosion: 80,
      cardio: 85,
      flexibility: 88,
      balance: 80,
      mental: 88,
      aggression: 75,
      tacticalIntelligence: 85,
      experience: 80,
    },
  };

  const f2: EngineFighter = {
    id: 'f2',
    name: 'Lucas Mendes',
    belt: 'Faixa Preta',
    style: 'PASSADOR',
    strategy: 'PRESSURE',
    energy: 100,
    stamina: 100,
    fatigue: 0,
    isBot: true,
    attributes: {
      takedown: 85,
      guard: 70,
      passing: 92,
      sweeping: 72,
      submission: 75,
      submissionDefense: 80,
      escape: 82,
      pressure: 90,
      grip: 88,
      technique: 86,
      strength: 88,
      speed: 78,
      explosion: 85,
      cardio: 82,
      flexibility: 70,
      balance: 85,
      mental: 82,
      aggression: 80,
      tacticalIntelligence: 80,
      experience: 78,
    },
  };

  // 1. Seed Determinism Test
  const engine = new CombatEngine();
  const seed = 'TEST_SEED_123456';

  const matchA = engine.simulateFullMatch(f1, f2, { seed, durationSeconds: 300 });
  const matchB = engine.simulateFullMatch(f1, f2, { seed, durationSeconds: 300 });

  assert(
    matchA.winnerId === matchB.winnerId &&
      matchA.eventHistory.length === matchB.eventHistory.length &&
      matchA.score.aPoints === matchB.score.aPoints &&
      matchA.score.bPoints === matchB.score.bPoints,
    'Seed Determinism (Seed produces identical match output)'
  );

  // 2. Position Transitions Test
  assert(
    PositionEngine.isValidTransition('STANDING', 'CLOSED_GUARD') &&
      PositionEngine.isValidTransition('CLOSED_GUARD', 'SIDE_CONTROL') &&
      PositionEngine.isValidTransition('SIDE_CONTROL', 'MOUNT'),
    'Position Engine Transitions'
  );

  // 3. Scoring & Advantage Rules Test
  const scoring = new ScoringEngine();
  const scoreState: MatchScoreState = { aPoints: 0, bPoints: 0, aAdvantages: 0, bAdvantages: 0, aPenalties: 0, bPenalties: 0 };
  scoring.awardPoints(scoreState, true, 'TAKEDOWN');
  scoring.awardPoints(scoreState, true, 'GUARD_PASS');
  scoring.awardAdvantage(scoreState, false);

  assert(
    scoreState.aPoints === 5 && scoreState.bAdvantages === 1,
    'Scoring Engine (Takedown + Guard Pass = 5 pts)'
  );

  // 4. Energy & Fatigue Drain Test
  const fEnergyTest = { ...f1, energy: 100, fatigue: 0 };
  EnergyEngine.processActionCost(fEnergyTest, 'TAKEDOWN');
  assert(fEnergyTest.energy < 100 && fEnergyTest.fatigue > 0, 'Energy & Fatigue Drain Calculation');

  // 5. Submission & Defense Engine Test
  const rng = new RandomEngine('SUB_TEST_888');
  const subOutcome = DefenseEngine.evaluateSubmissionAttempt(f1, f2, 'BACK_CONTROL', 'REAR_NAKED_CHOKE', rng);
  assert(typeof subOutcome.success === 'boolean' && subOutcome.narrationKey !== undefined, 'Submission & Defense Engine Evaluation');

  // 6. Clock Progression & Max Duration Test
  assert(matchA.timeSeconds <= 300, 'Clock Progression respects Max Duration (5 minutes)');

  // 7. Replay Engine Test
  const replayedEvents = ReplayEngine.getEventsUpToTime(matchA, 120);
  assert(
    Array.isArray(replayedEvents) && replayedEvents.every((e) => e.timestampSeconds <= 120),
    'Replay Engine Event Stream Filtering'
  );

  // 8. AI Decision Making Test
  const aiDecision = CombatAI.decideNextAction(matchA, f1.id, rng);
  assert(aiDecision.actionType !== undefined && aiDecision.targetPosition !== undefined, 'Combat AI Decision Engine');

  // 9. Real-Time Combat Clock Engine Test Suite
  const clockRes = await runClockEngineTests();
  passed += clockRes.passed;
  failed += clockRes.failed;
  logs.push(...clockRes.logs);

  return { passed, failed, logs };
}

// Allow direct CLI test invocation
if (process.argv[1] && process.argv[1].includes('engineTests')) {
  console.log('=== RUNNING JIUMANAGER GAME ENGINE TESTS ===');
  runAllEngineTests().then((result) => {
    console.log(result.logs.join('\n'));
    console.log(`\nSUMMARY: ${result.passed} PASSED, ${result.failed} FAILED.`);
  });
}
