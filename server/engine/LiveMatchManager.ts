/**
 * JiuManager Game Engine - Live Match Manager
 * Manages active real-time combat matches with WebSocket / SSE broadcast capability.
 * Guarantees real-time progression, event emission timing, live AI decision making,
 * speed scaling (1x, 2x, 4x, 8x), pause/resume, and clock synchronization.
 */

import {
  MatchState,
  EngineFighter,
  CombatEvent,
  PositionState,
  SubmissionName,
  MatchRulesConfig,
} from './types';
import { RealTimeClock, ClockSpeed, ClockSnapshot } from './RealTimeClock';
import { RandomEngine } from './RandomEngine';
import { CombatAI } from './CombatAI';
import { EnergyEngine } from './EnergyEngine';
import { DefenseEngine } from './DefenseEngine';
import { ScoringEngine, DEFAULT_RULES_CONFIG } from './ScoringEngine';
import { CombatEventEngine } from './CombatEventEngine';

export type LiveMatchListener = (eventType: string, payload: any) => void;

export class LiveMatchManager {
  private matchState: MatchState;
  private clock: RealTimeClock;
  private randomEngine: RandomEngine;
  private scoringEngine: ScoringEngine;
  private nextEventCombatMs: number = 0;
  private tickIntervalHandle: ReturnType<typeof setInterval> | null = null;
  private listeners: Set<LiveMatchListener> = new Set();
  private lastHeartbeatRealMs: number = 0;

  constructor(
    fighterA: EngineFighter,
    fighterB: EngineFighter,
    options: { seed?: string; durationSeconds?: number; initialSpeed?: ClockSpeed; rulesConfig?: MatchRulesConfig } = {}
  ) {
    const seed = options.seed || `live_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    this.randomEngine = new RandomEngine(seed);

    const rulesConfig = options.rulesConfig || DEFAULT_RULES_CONFIG;
    this.scoringEngine = new ScoringEngine(rulesConfig);

    const durationMs = (options.durationSeconds || rulesConfig.matchDurationSeconds || 300) * 1000;
    this.clock = new RealTimeClock(durationMs, options.initialSpeed || 1);

    const cloneA: EngineFighter = JSON.parse(JSON.stringify(fighterA));
    const cloneB: EngineFighter = JSON.parse(JSON.stringify(fighterB));

    cloneA.energy = cloneA.energy ?? 100;
    cloneA.stamina = cloneA.stamina ?? 100;
    cloneA.fatigue = cloneA.fatigue ?? 0;

    cloneB.energy = cloneB.energy ?? 100;
    cloneB.stamina = cloneB.stamina ?? 100;
    cloneB.fatigue = cloneB.fatigue ?? 0;

    this.matchState = {
      matchId: `match_${Date.now()}_${this.randomEngine.nextInt(100, 999)}`,
      seed,
      status: 'RUNNING',
      timeSeconds: 0,
      maxDurationSeconds: Math.floor(durationMs / 1000),
      startedAt: null,
      pausedAt: null,
      endedAt: null,
      totalPausedMs: 0,
      elapsedMilliseconds: 0,
      durationMilliseconds: durationMs,
      speed: options.initialSpeed || 1,
      lastServerTimestamp: Date.now(),
      fighterA: cloneA,
      fighterB: cloneB,
      topFighterId: null,
      bottomFighterId: null,
      position: 'STANDING',
      score: {
        aPoints: 0,
        bPoints: 0,
        aAdvantages: 0,
        bAdvantages: 0,
        aPenalties: 0,
        bPenalties: 0,
      },
      isFinished: false,
      winnerId: null,
      method: 'IN_PROGRESS',
      lastEvent: null,
      eventHistory: [],
    };
  }

  public getMatchState(): MatchState {
    return this.matchState;
  }

  public getClockSnapshot(): ClockSnapshot {
    return this.clock.getSnapshot();
  }

  public subscribe(listener: LiveMatchListener): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  private broadcast(eventType: string, payload: any): void {
    for (const listener of this.listeners) {
      try {
        listener(eventType, payload);
      } catch (err) {
        console.error('Error broadcasting live match event:', err);
      }
    }
  }

  /**
   * Starts the live match execution loop in real-time
   */
  public start(speed: ClockSpeed = 1, customNow?: number): void {
    this.clock.start(speed, customNow);
    const snapshot = this.clock.getSnapshot(customNow);

    this.matchState.status = 'RUNNING';
    this.matchState.startedAt = snapshot.startedAt;
    this.matchState.speed = speed;
    this.matchState.lastServerTimestamp = Date.now();

    // Initial match start event at 00:00
    const startEvt = CombatEventEngine.createEvent({
      matchState: this.matchState,
      eventType: 'POSITION_TRANSITION',
      actorId: this.matchState.fighterA.id,
      actorName: this.matchState.fighterA.name,
      targetId: this.matchState.fighterB.id,
      targetName: this.matchState.fighterB.name,
      positionBefore: 'STANDING',
      positionAfter: 'STANDING',
      success: true,
      actionDetails: 'Início do combate no tatame.',
    });

    this.matchState.lastEvent = startEvt;
    this.matchState.eventHistory.push(startEvt);

    // Schedule first combat action (5 to 12 seconds in combat time)
    this.nextEventCombatMs = this.randomEngine.nextInt(5000, 12000);

    this.broadcast('MATCH_STARTED', {
      matchState: this.matchState,
      clockState: snapshot,
    });

    this.broadcast('COMBAT_EVENT', startEvt);

    // Start background tick loop (runs every 100ms real time)
    this.startTickLoop();
  }

  private startTickLoop(): void {
    if (this.tickIntervalHandle) clearInterval(this.tickIntervalHandle);

    this.tickIntervalHandle = setInterval(() => {
      this.tick();
    }, 100);
  }

  /**
   * Core real-time tick processor
   */
  public tick(customNow?: number): void {
    if (this.matchState.isFinished || this.clock.getStatus() !== 'RUNNING') {
      return;
    }

    const currentCombatMs = this.clock.getElapsedCombatMs(customNow);
    const currentCombatSecs = Math.floor(currentCombatMs / 1000);

    this.matchState.elapsedMilliseconds = Math.round(currentCombatMs);
    this.matchState.timeSeconds = Math.min(this.matchState.maxDurationSeconds, currentCombatSecs);
    this.matchState.lastServerTimestamp = Date.now();

    // 1. Check if scheduled combat event threshold reached
    if (currentCombatMs >= this.nextEventCombatMs && !this.matchState.isFinished) {
      this.processLiveCombatTurn(currentCombatMs);

      // Schedule next event (6 to 18 seconds in future combat time)
      const gap = this.randomEngine.nextInt(6000, 18000);
      this.nextEventCombatMs = currentCombatMs + gap;
    }

    // 2. Check if 5-minute match limit (300,000 ms) reached
    if (currentCombatMs >= this.clock.getDurationMs() && !this.matchState.isFinished) {
      this.finishMatchByScoreOrDecision(currentCombatMs, customNow);
    }

    // 3. Periodic Heartbeat CLOCK_SYNC broadcast (every 1 second real-time)
    const nowReal = customNow ?? RealTimeClock.getMonotonicNow();
    if (nowReal - this.lastHeartbeatRealMs >= 1000) {
      this.lastHeartbeatRealMs = nowReal;
      this.broadcast('CLOCK_SYNC', this.clock.getSnapshot(customNow));
    }
  }

  /**
   * Executes AI turn and emits progressive real-time event at the exact current combat time
   */
  private processLiveCombatTurn(currentCombatMs: number): void {
    const effA = EnergyEngine.getEffectiveAttributes(this.matchState.fighterA);
    const effB = EnergyEngine.getEffectiveAttributes(this.matchState.fighterB);

    const initA = effA.speed + effA.tacticalIntelligence + (this.matchState.fighterA.strategy === 'AGGRESSIVE' ? 15 : 0) + this.randomEngine.nextInt(-10, 10);
    const initB = effB.speed + effB.tacticalIntelligence + (this.matchState.fighterB.strategy === 'AGGRESSIVE' ? 15 : 0) + this.randomEngine.nextInt(-10, 10);

    const isActorA = initA >= initB;
    const actor = isActorA ? this.matchState.fighterA : this.matchState.fighterB;
    const target = isActorA ? this.matchState.fighterB : this.matchState.fighterA;

    // Autonomous Live AI Decision
    const decision = CombatAI.decideNextAction(this.matchState, actor.id, this.randomEngine);
    const energyCost = EnergyEngine.processActionCost(actor, decision.actionType);

    const currentPos = this.matchState.position;

    switch (decision.actionType) {
      case 'TAKEDOWN': {
        const takeSuccess = effA.takedown + effA.explosion > effB.takedown * 0.8 + effB.flexibility + this.randomEngine.nextInt(-15, 15);
        if (takeSuccess) {
          const targetPos: PositionState = decision.targetPosition || 'SIDE_CONTROL';
          this.matchState.position = targetPos;
          this.matchState.topFighterId = actor.id;
          this.matchState.bottomFighterId = target.id;
          const pts = this.scoringEngine.awardPoints(this.matchState.score, isActorA, 'TAKEDOWN');

          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'TAKEDOWN_SUCCESS',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: targetPos,
            points: pts,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: true,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
          this.broadcast('SCORE_UPDATE', { matchId: this.matchState.matchId, score: this.matchState.score });
          this.broadcast('POSITION_UPDATE', { matchId: this.matchState.matchId, position: targetPos });
        } else {
          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'TAKEDOWN_DEFENSE',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: currentPos,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: false,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
        }
        break;
      }

      case 'GUARD_PULL': {
        const targetPos: PositionState = decision.targetPosition || 'CLOSED_GUARD';
        this.matchState.position = targetPos;
        this.matchState.bottomFighterId = actor.id;
        this.matchState.topFighterId = target.id;

        const evt = CombatEventEngine.createEvent({
          matchState: this.matchState,
          eventType: 'GUARD_PULL',
          actorId: actor.id,
          actorName: actor.name,
          targetId: target.id,
          targetName: target.name,
          positionBefore: currentPos,
          positionAfter: targetPos,
          energyChangeActor: energyCost.energyLoss,
          fatigueChangeActor: energyCost.fatigueGain,
          success: true,
        });

        this.matchState.lastEvent = evt;
        this.matchState.eventHistory.push(evt);
        this.broadcast('COMBAT_EVENT', evt);
        this.broadcast('POSITION_UPDATE', { matchId: this.matchState.matchId, position: targetPos });
        break;
      }

      case 'GUARD_PASS': {
        const passSuccess = effA.passing + effA.pressure > effB.guard * 0.9 + effB.flexibility + this.randomEngine.nextInt(-15, 15);
        if (passSuccess) {
          const targetPos: PositionState = decision.targetPosition || 'SIDE_CONTROL';
          this.matchState.position = targetPos;
          this.matchState.topFighterId = actor.id;
          this.matchState.bottomFighterId = target.id;
          const pts = this.scoringEngine.awardPoints(this.matchState.score, isActorA, 'GUARD_PASS');

          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'GUARD_PASS_SUCCESS',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: targetPos,
            points: pts,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: true,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
          this.broadcast('SCORE_UPDATE', { matchId: this.matchState.matchId, score: this.matchState.score });
          this.broadcast('POSITION_UPDATE', { matchId: this.matchState.matchId, position: targetPos });
        } else {
          this.scoringEngine.awardAdvantage(this.matchState.score, isActorA);
          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'GUARD_PASS_ATTEMPT',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: currentPos,
            advantage: 1,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: false,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
          this.broadcast('SCORE_UPDATE', { matchId: this.matchState.matchId, score: this.matchState.score });
        }
        break;
      }

      case 'SWEEP': {
        const sweepSuccess = effA.sweeping + effA.technique > effB.passing * 0.8 + effB.balance + this.randomEngine.nextInt(-15, 15);
        if (sweepSuccess) {
          const targetPos: PositionState = decision.targetPosition || 'SIDE_CONTROL';
          this.matchState.position = targetPos;
          this.matchState.topFighterId = actor.id;
          this.matchState.bottomFighterId = target.id;
          const pts = this.scoringEngine.awardPoints(this.matchState.score, isActorA, 'SWEEP');

          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'SWEEP_SUCCESS',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: targetPos,
            points: pts,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: true,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
          this.broadcast('SCORE_UPDATE', { matchId: this.matchState.matchId, score: this.matchState.score });
          this.broadcast('POSITION_UPDATE', { matchId: this.matchState.matchId, position: targetPos });
        } else {
          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'SWEEP_DEFENSE',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: currentPos,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: false,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
        }
        break;
      }

      case 'SUBMISSION': {
        const subName: SubmissionName = (decision.subName as SubmissionName) || 'ARMBAR';
        const outcome = DefenseEngine.evaluateSubmissionAttempt(
          actor,
          target,
          currentPos,
          subName,
          this.randomEngine
        );

        if (outcome.success) {
          // SUBMISSION FINISH: Stop clock immediately at exact current time!
          this.matchState.isFinished = true;
          this.matchState.status = 'FINISHED';
          this.matchState.winnerId = actor.id;
          this.matchState.method = 'SUBMISSION';
          this.matchState.submissionTechnique = subName;

          const finalMs = this.clock.finish();
          this.matchState.elapsedMilliseconds = Math.round(finalMs);
          this.matchState.timeSeconds = Math.floor(finalMs / 1000);

          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'SUBMISSION_SUCCESS',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: currentPos,
            submissionMove: subName,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: true,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);

          this.broadcast('COMBAT_EVENT', evt);
          this.broadcast('MATCH_FINISHED', {
            matchId: this.matchState.matchId,
            winnerId: actor.id,
            method: 'SUBMISSION',
            submissionMove: subName,
            elapsedMilliseconds: this.matchState.elapsedMilliseconds,
            clockSnapshot: this.clock.getSnapshot(),
            matchState: this.matchState,
          });

          this.stopTickLoop();
        } else if (outcome.escaped) {
          this.matchState.position = outcome.positionAfter;
          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'SUBMISSION_ESCAPE',
            actorId: target.id,
            actorName: target.name,
            targetId: actor.id,
            targetName: actor.name,
            positionBefore: currentPos,
            positionAfter: outcome.positionAfter,
            submissionMove: subName,
            energyChangeTarget: energyCost.energyLoss,
            fatigueChangeTarget: energyCost.fatigueGain,
            success: true,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
          this.broadcast('POSITION_UPDATE', { matchId: this.matchState.matchId, position: outcome.positionAfter });
        } else {
          this.scoringEngine.awardAdvantage(this.matchState.score, isActorA);
          const evt = CombatEventEngine.createEvent({
            matchState: this.matchState,
            eventType: 'SUBMISSION_ATTEMPT',
            actorId: actor.id,
            actorName: actor.name,
            targetId: target.id,
            targetName: target.name,
            positionBefore: currentPos,
            positionAfter: currentPos,
            submissionMove: subName,
            advantage: 1,
            energyChangeActor: energyCost.energyLoss,
            fatigueChangeActor: energyCost.fatigueGain,
            success: false,
          });

          this.matchState.lastEvent = evt;
          this.matchState.eventHistory.push(evt);
          this.broadcast('COMBAT_EVENT', evt);
          this.broadcast('SCORE_UPDATE', { matchId: this.matchState.matchId, score: this.matchState.score });
        }
        break;
      }

      default: {
        const targetPos: PositionState = decision.targetPosition || currentPos;
        this.matchState.position = targetPos;

        const evt = CombatEventEngine.createEvent({
          matchState: this.matchState,
          eventType: 'POSITION_TRANSITION',
          actorId: actor.id,
          actorName: actor.name,
          targetId: target.id,
          targetName: target.name,
          positionBefore: currentPos,
          positionAfter: targetPos,
          energyChangeActor: energyCost.energyLoss,
          fatigueChangeActor: energyCost.fatigueGain,
          success: true,
        });

        this.matchState.lastEvent = evt;
        this.matchState.eventHistory.push(evt);
        this.broadcast('COMBAT_EVENT', evt);
        if (targetPos !== currentPos) {
          this.broadcast('POSITION_UPDATE', { matchId: this.matchState.matchId, position: targetPos });
        }
        break;
      }
    }
  }

  private finishMatchByScoreOrDecision(currentCombatMs: number, customNow?: number): void {
    this.matchState.isFinished = true;
    this.matchState.status = 'FINISHED';

    const finalMs = this.clock.finish(customNow);
    this.matchState.elapsedMilliseconds = Math.round(finalMs);
    this.matchState.timeSeconds = Math.min(this.matchState.maxDurationSeconds, Math.floor(finalMs / 1000));

    const scoreComparison = this.scoringEngine.compareScore(this.matchState.score);

    if (scoreComparison === 'A') {
      this.matchState.winnerId = this.matchState.fighterA.id;
      this.matchState.method = this.matchState.score.aPoints !== this.matchState.score.bPoints ? 'POINTS' : 'ADVANTAGES';
    } else if (scoreComparison === 'B') {
      this.matchState.winnerId = this.matchState.fighterB.id;
      this.matchState.method = this.matchState.score.aPoints !== this.matchState.score.bPoints ? 'POINTS' : 'ADVANTAGES';
    } else {
      const effA = EnergyEngine.getEffectiveAttributes(this.matchState.fighterA);
      const effB = EnergyEngine.getEffectiveAttributes(this.matchState.fighterB);
      const decisionA = effA.mental + effA.technique + this.randomEngine.nextInt(-10, 10);
      const decisionB = effB.mental + effB.technique + this.randomEngine.nextInt(-10, 10);

      this.matchState.winnerId = decisionA >= decisionB ? this.matchState.fighterA.id : this.matchState.fighterB.id;
      this.matchState.method = 'DECISION';
    }

    const winnerName = this.matchState.winnerId === this.matchState.fighterA.id ? this.matchState.fighterA.name : this.matchState.fighterB.name;
    const loserName = this.matchState.winnerId === this.matchState.fighterA.id ? this.matchState.fighterB.name : this.matchState.fighterA.name;

    const endEvt = CombatEventEngine.createEvent({
      matchState: this.matchState,
      eventType: 'END_MATCH',
      actorId: this.matchState.winnerId!,
      actorName: winnerName,
      targetId: this.matchState.winnerId === this.matchState.fighterA.id ? this.matchState.fighterB.id : this.matchState.fighterA.id,
      targetName: loserName,
      positionBefore: this.matchState.position,
      positionAfter: this.matchState.position,
      success: true,
    });

    this.matchState.lastEvent = endEvt;
    this.matchState.eventHistory.push(endEvt);

    this.broadcast('COMBAT_EVENT', endEvt);
    this.broadcast('MATCH_FINISHED', {
      matchId: this.matchState.matchId,
      winnerId: this.matchState.winnerId,
      method: this.matchState.method,
      elapsedMilliseconds: this.matchState.elapsedMilliseconds,
      clockSnapshot: this.clock.getSnapshot(),
      matchState: this.matchState,
    });

    this.stopTickLoop();
  }

  /**
   * Pauses match clock and emits event
   */
  public pause(): void {
    if (this.matchState.isFinished) return;
    const elapsed = this.clock.pause();
    this.matchState.status = 'PAUSED';
    this.matchState.pausedAt = Date.now();
    this.matchState.elapsedMilliseconds = Math.round(elapsed);

    this.broadcast('MATCH_PAUSED', {
      matchId: this.matchState.matchId,
      clockSnapshot: this.clock.getSnapshot(),
    });
  }

  /**
   * Resumes match clock from exact paused position
   */
  public resume(): void {
    if (this.matchState.isFinished) return;
    this.clock.resume();
    this.matchState.status = 'RUNNING';
    this.matchState.pausedAt = null;

    this.broadcast('MATCH_RESUMED', {
      matchId: this.matchState.matchId,
      clockSnapshot: this.clock.getSnapshot(),
    });
  }

  /**
   * Sets speed multiplier (1x, 2x, 4x, 8x) seamlessly without losing elapsed combat time
   */
  public setSpeed(speed: ClockSpeed): void {
    this.clock.setSpeed(speed);
    this.matchState.speed = speed;

    this.broadcast('CLOCK_SYNC', this.clock.getSnapshot());
  }

  public stopTickLoop(): void {
    if (this.tickIntervalHandle) {
      clearInterval(this.tickIntervalHandle);
      this.tickIntervalHandle = null;
    }
  }
}
