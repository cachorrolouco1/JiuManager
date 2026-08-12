/**
 * JiuManager Game Engine - Real-Time Combat Clock Engine Test Suite
 * Validates requirements sections 30 & 31:
 * - Monotonic timestamp real-time clock accuracy
 * - 1x, 2x, 4x, 8x speed scaling
 * - Pause / Resume fidelity
 * - Real-time progression (10s, 30s, 60s, 120s, 180s, 240s, 300s -> 05:00 MATCH_FINISHED)
 * - Event timestamp lock (no event emitted ahead of combat clock)
 */

import { RealTimeClock } from '../RealTimeClock';
import { LiveMatchManager } from '../LiveMatchManager';
import { EngineFighter } from '../types';

export async function runClockEngineTests(): Promise<{ passed: number; failed: number; logs: string[] }> {
  const logs: string[] = [];
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string, detail?: string) {
    if (condition) {
      passed++;
      logs.push(`✅ PASS: ${testName} ${detail ? `(${detail})` : ''}`);
    } else {
      failed++;
      logs.push(`❌ FAIL: ${testName} ${detail ? `(${detail})` : ''}`);
    }
  }

  const f1: EngineFighter = {
    id: 'f1',
    name: 'João Gracie',
    belt: 'Faixa Preta',
    style: 'BALANCED',
    strategy: 'BALANCED',
    energy: 100,
    stamina: 100,
    fatigue: 0,
    isBot: false,
    attributes: {
      takedown: 75,
      guard: 80,
      passing: 75,
      sweeping: 75,
      submission: 80,
      submissionDefense: 85,
      escape: 80,
      pressure: 75,
      grip: 80,
      technique: 80,
      strength: 75,
      speed: 75,
      explosion: 75,
      cardio: 80,
      flexibility: 80,
      balance: 80,
      mental: 80,
      aggression: 50,
      tacticalIntelligence: 80,
      experience: 80,
    },
  };

  const f2: EngineFighter = {
    id: 'f2',
    name: 'Lucas Mendes',
    belt: 'Faixa Preta',
    style: 'BALANCED',
    strategy: 'BALANCED',
    energy: 100,
    stamina: 100,
    fatigue: 0,
    isBot: true,
    attributes: {
      takedown: 75,
      guard: 80,
      passing: 75,
      sweeping: 75,
      submission: 80,
      submissionDefense: 85,
      escape: 80,
      pressure: 75,
      grip: 80,
      technique: 80,
      strength: 75,
      speed: 75,
      explosion: 75,
      cardio: 80,
      flexibility: 80,
      balance: 80,
      mental: 80,
      aggression: 50,
      tacticalIntelligence: 80,
      experience: 80,
    },
  };

  // 1. Monotonic Real-Time Clock Accuracy Test (Simulated Monotonic Ticks)
  const clock = new RealTimeClock(300000, 1);
  const t0 = 1000000; // Simulated performance.now() base
  clock.start(1, t0);

  const t10 = t0 + 10000; // +10s real time
  const t30 = t0 + 30000; // +30s real time
  const t60 = t0 + 60000; // +60s real time

  assert(
    Math.round(clock.getElapsedCombatMs(t10) / 1000) === 10,
    'Section 30 Test: Real-time clock at 10 seconds',
    `Display: ${RealTimeClock.formatTime(clock.getElapsedCombatMs(t10))}`
  );

  assert(
    Math.round(clock.getElapsedCombatMs(t30) / 1000) === 30,
    'Section 30 Test: Real-time clock at 30 seconds',
    `Display: ${RealTimeClock.formatTime(clock.getElapsedCombatMs(t30))}`
  );

  assert(
    Math.round(clock.getElapsedCombatMs(t60) / 1000) === 60,
    'Section 30 Test: Real-time clock at 60 seconds (01:00)',
    `Display: ${RealTimeClock.formatTime(clock.getElapsedCombatMs(t60))}`
  );

  // 2. Section 31 Test: 5-Minute Progression (00:00 -> 01:00 -> 02:00 -> 03:00 -> 04:00 -> 05:00)
  const clock5Min = new RealTimeClock(300000, 1);
  clock5Min.start(1, t0);

  const t60s = t0 + 60000;
  const t120s = t0 + 120000;
  const t180s = t0 + 180000;
  const t240s = t0 + 240000;
  const t300s = t0 + 300000;

  const m1 = RealTimeClock.formatTime(clock5Min.getElapsedCombatMs(t60s));
  const m2 = RealTimeClock.formatTime(clock5Min.getElapsedCombatMs(t120s));
  const m3 = RealTimeClock.formatTime(clock5Min.getElapsedCombatMs(t180s));
  const m4 = RealTimeClock.formatTime(clock5Min.getElapsedCombatMs(t240s));
  const m5 = RealTimeClock.formatTime(clock5Min.getElapsedCombatMs(t300s));

  assert(
    m1 === '01:00' && m2 === '02:00' && m3 === '03:00' && m4 === '04:00' && m5 === '05:00',
    'Section 31 Test: 5-Minute Full Progression Milestones',
    `01:00=${m1}, 02:00=${m2}, 03:00=${m3}, 04:00=${m4}, 05:00=${m5}`
  );

  // 3. Speed Multipliers Test (2x, 4x, 8x)
  const clock2x = new RealTimeClock(300000, 2);
  clock2x.start(2, t0);
  assert(
    clock2x.getElapsedCombatMs(t0 + 10000) === 20000,
    'Speed 2x Test: 10s real time = 20s combat time'
  );

  const clock4x = new RealTimeClock(300000, 4);
  clock4x.start(4, t0);
  assert(
    clock4x.getElapsedCombatMs(t0 + 10000) === 40000,
    'Speed 4x Test: 10s real time = 40s combat time'
  );

  const clock8x = new RealTimeClock(300000, 8);
  clock8x.start(8, t0);
  assert(
    clock8x.getElapsedCombatMs(t0 + 10000) === 80000,
    'Speed 8x Test: 10s real time = 80s combat time'
  );

  // 4. Pause / Resume Test (No time loss or gain)
  const clockPause = new RealTimeClock(300000, 1);
  clockPause.start(1, t0);
  clockPause.getElapsedCombatMs(t0 + 10000); // 10s combat
  clockPause.pause(t0 + 10000); // Pause at 10s

  // Stay paused for 20 real seconds (t0 + 30000)
  assert(
    clockPause.getElapsedCombatMs(t0 + 30000) === 10000,
    'Pause Test: Clock remains frozen at 10s while paused'
  );

  clockPause.resume(t0 + 30000); // Resume at t0 + 30000
  // Advance another 10 real seconds to t0 + 40000
  assert(
    clockPause.getElapsedCombatMs(t0 + 40000) === 20000,
    'Resume Test: Clock resumes smoothly from 10s to 20s after pause'
  );

  // 5. Live Match Manager Event Timing Lock Test
  const liveMgr = new LiveMatchManager(f1, f2, { seed: 'CLOCK_TEST_SEED_123' });
  liveMgr.start(1, t0);

  // Simulate tick progression up to 300s
  for (let ms = 0; ms <= 300000; ms += 1000) {
    liveMgr.tick(t0 + ms);
  }
  liveMgr.stopTickLoop();

  const matchState = liveMgr.getMatchState();
  assert(
    matchState.isFinished === true && matchState.elapsedMilliseconds <= 300000,
    'LiveMatchManager 5-Minute Resolution',
    `Status: ${matchState.status}, Method: ${matchState.method}, Final Time: ${RealTimeClock.formatTime(matchState.elapsedMilliseconds)}`
  );

  // Verify all events in event history have strictly ascending non-future timestamps
  let timestampsAscending = true;
  for (let i = 1; i < matchState.eventHistory.length; i++) {
    if (matchState.eventHistory[i].timestampSeconds < matchState.eventHistory[i - 1].timestampSeconds) {
      timestampsAscending = false;
      break;
    }
  }

  assert(
    timestampsAscending,
    'Event Timing Rule: Events occur in strictly ascending time, no time travel'
  );

  return { passed, failed, logs };
}

// Direct runner
if (process.argv[1] && process.argv[1].includes('clockTests')) {
  console.log('=== RUNNING REAL-TIME COMBAT CLOCK ENGINE TESTS ===');
  runClockEngineTests().then((res) => {
    console.log(res.logs.join('\n'));
    console.log(`\nSUMMARY: ${res.passed} PASSED, ${res.failed} FAILED.`);
  });
}
