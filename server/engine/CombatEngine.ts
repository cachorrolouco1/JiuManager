/**
 * JiuManager Game Engine - Master Combat Engine
 * Orchestrates match creation, step-by-step time progression, state updates,
 * AI decisions, scoring, submissions, and match resolution.
 */

import {
  MatchState,
  EngineFighter,
  CombatEvent,
  PositionState,
  SubmissionName,
  MatchRulesConfig,
} from './types';
import { RandomEngine } from './RandomEngine';
import { PositionEngine } from './PositionEngine';
import { ScoringEngine, DEFAULT_RULES_CONFIG } from './ScoringEngine';
import { EnergyEngine } from './EnergyEngine';
import { DefenseEngine } from './DefenseEngine';
import { CombatAI } from './CombatAI';
import { CombatEventEngine } from './CombatEventEngine';
import { SubmissionEngine } from './SubmissionEngine';

export interface MatchOptions {
  seed?: string;
  durationSeconds?: number;
  rulesConfig?: MatchRulesConfig;
}

export class CombatEngine {
  private rulesConfig: MatchRulesConfig;
  private scoringEngine: ScoringEngine;

  constructor(rulesConfig: MatchRulesConfig = DEFAULT_RULES_CONFIG) {
    this.rulesConfig = rulesConfig;
    this.scoringEngine = new ScoringEngine(rulesConfig);
  }

  /**
   * Initializes a brand new match state with a unique seed
   */
  public createMatch(
    fighterAInput: EngineFighter,
    fighterBInput: EngineFighter,
    options: MatchOptions = {}
  ): { matchState: MatchState; randomEngine: RandomEngine } {
    const seed = options.seed || `seed_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const randomEngine = new RandomEngine(seed);

    // Deep clone fighters to avoid mutating external references
    const fighterA: EngineFighter = JSON.parse(JSON.stringify(fighterAInput));
    const fighterB: EngineFighter = JSON.parse(JSON.stringify(fighterBInput));

    fighterA.energy = fighterA.energy ?? 100;
    fighterA.stamina = fighterA.stamina ?? 100;
    fighterA.fatigue = fighterA.fatigue ?? 0;

    fighterB.energy = fighterB.energy ?? 100;
    fighterB.stamina = fighterB.stamina ?? 100;
    fighterB.fatigue = fighterB.fatigue ?? 0;

    const matchState: MatchState = {
      matchId: `match_${Date.now()}_${randomEngine.nextInt(100, 999)}`,
      seed,
      status: 'RUNNING',
      timeSeconds: 0,
      maxDurationSeconds: options.durationSeconds || this.rulesConfig.matchDurationSeconds || 300,
      
      startedAt: Date.now(),
      pausedAt: null,
      endedAt: null,
      totalPausedMs: 0,
      elapsedMilliseconds: 0,
      durationMilliseconds: (options.durationSeconds || this.rulesConfig.matchDurationSeconds || 300) * 1000,
      speed: 1,
      lastServerTimestamp: Date.now(),

      fighterA,
      fighterB,
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

    // Emit initial Match Start Event
    const startEvent = CombatEventEngine.createEvent({
      matchState,
      eventType: 'POSITION_TRANSITION',
      actorId: fighterA.id,
      actorName: fighterA.name,
      targetId: fighterB.id,
      targetName: fighterB.name,
      positionBefore: 'STANDING',
      positionAfter: 'STANDING',
      success: true,
      actionDetails: 'Início do combate no tatame.',
    });

    matchState.lastEvent = startEvent;
    matchState.eventHistory.push(startEvent);

    return { matchState, randomEngine };
  }

  /**
   * Advances match clock by one step (5-25s) and executes action logic
   */
  public stepMatch(matchState: MatchState, randomEngine: RandomEngine): MatchState {
    if (matchState.isFinished || matchState.status !== 'RUNNING') {
      return matchState;
    }

    // Tick time increment (5 to 25 seconds organically)
    const tickTime = randomEngine.nextInt(10, 25);
    matchState.timeSeconds = Math.min(matchState.maxDurationSeconds, matchState.timeSeconds + tickTime);

    // Determine acting fighter based on speed, energy, aggression, and initiative
    const effA = EnergyEngine.getEffectiveAttributes(matchState.fighterA);
    const effB = EnergyEngine.getEffectiveAttributes(matchState.fighterB);

    const initA = effA.speed + effA.tacticalIntelligence + (matchState.fighterA.strategy === 'AGGRESSIVE' ? 15 : 0) + randomEngine.nextInt(-10, 10);
    const initB = effB.speed + effB.tacticalIntelligence + (matchState.fighterB.strategy === 'AGGRESSIVE' ? 15 : 0) + randomEngine.nextInt(-10, 10);

    const isActorA = initA >= initB;
    const actor = isActorA ? matchState.fighterA : matchState.fighterB;
    const target = isActorA ? matchState.fighterB : matchState.fighterA;

    // AI decision for actor
    const decision = CombatAI.decideNextAction(matchState, actor.id, randomEngine);

    // Process energy cost for action
    const energyCost = EnergyEngine.processActionCost(actor, decision.actionType);

    // Execute decision
    this.executeAction(matchState, actor, target, isActorA, decision, energyCost, randomEngine);

    // Check if match max duration reached without submission
    if (matchState.timeSeconds >= matchState.maxDurationSeconds && !matchState.isFinished) {
      this.resolveEndByScoreOrDecision(matchState, randomEngine);
    }

    return matchState;
  }

  /**
   * Simulates full match synchronously from 00:00 to 05:00 or submission
   */
  public simulateFullMatch(
    fighterA: EngineFighter,
    fighterB: EngineFighter,
    options: MatchOptions = {}
  ): MatchState {
    const { matchState, randomEngine } = this.createMatch(fighterA, fighterB, options);

    while (!matchState.isFinished && matchState.timeSeconds < matchState.maxDurationSeconds) {
      this.stepMatch(matchState, randomEngine);
    }

    return matchState;
  }

  private executeAction(
    matchState: MatchState,
    actor: EngineFighter,
    target: EngineFighter,
    isActorA: boolean,
    decision: any,
    energyCost: { energyLoss: number; fatigueGain: number },
    randomEngine: RandomEngine
  ) {
    const effActor = EnergyEngine.getEffectiveAttributes(actor);
    const effTarget = EnergyEngine.getEffectiveAttributes(target);
    const currentPos = matchState.position;

    switch (decision.actionType) {
      case 'TAKEDOWN': {
        const takeSuccess = effActor.takedown + effActor.explosion > effTarget.takedown * 0.8 + effTarget.flexibility + randomEngine.nextInt(-15, 15);
        if (takeSuccess) {
          const targetPos: PositionState = decision.targetPosition || 'SIDE_CONTROL';
          matchState.position = targetPos;
          matchState.topFighterId = actor.id;
          matchState.bottomFighterId = target.id;
          const pts = this.scoringEngine.awardPoints(matchState.score, isActorA, 'TAKEDOWN');

          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        } else {
          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        }
        break;
      }

      case 'GUARD_PULL': {
        const targetPos: PositionState = decision.targetPosition || 'CLOSED_GUARD';
        matchState.position = targetPos;
        matchState.bottomFighterId = actor.id;
        matchState.topFighterId = target.id;

        const evt = CombatEventEngine.createEvent({
          matchState,
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
        matchState.lastEvent = evt;
        matchState.eventHistory.push(evt);
        break;
      }

      case 'GUARD_PASS': {
        const passSuccess = effActor.passing + effActor.pressure > effTarget.guard * 0.9 + effTarget.flexibility + randomEngine.nextInt(-15, 15);
        if (passSuccess) {
          const targetPos: PositionState = decision.targetPosition || 'SIDE_CONTROL';
          matchState.position = targetPos;
          matchState.topFighterId = actor.id;
          matchState.bottomFighterId = target.id;
          const pts = this.scoringEngine.awardPoints(matchState.score, isActorA, 'GUARD_PASS');

          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        } else {
          this.scoringEngine.awardAdvantage(matchState.score, isActorA);
          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        }
        break;
      }

      case 'SWEEP': {
        const sweepSuccess = effActor.sweeping + effActor.technique > effTarget.passing * 0.8 + effTarget.balance + randomEngine.nextInt(-15, 15);
        if (sweepSuccess) {
          const targetPos: PositionState = decision.targetPosition || 'SIDE_CONTROL';
          matchState.position = targetPos;
          matchState.topFighterId = actor.id;
          matchState.bottomFighterId = target.id;
          const pts = this.scoringEngine.awardPoints(matchState.score, isActorA, 'SWEEP');

          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        } else {
          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        }
        break;
      }

      case 'SUBMISSION': {
        const subName: SubmissionName = decision.subName || 'ARMBAR';
        const outcome = DefenseEngine.evaluateSubmissionAttempt(
          actor,
          target,
          currentPos,
          subName,
          randomEngine
        );

        if (outcome.success) {
          matchState.isFinished = true;
          matchState.status = 'FINISHED';
          matchState.winnerId = actor.id;
          matchState.method = 'SUBMISSION';
          matchState.submissionTechnique = subName;

          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        } else if (outcome.escaped) {
          matchState.position = outcome.positionAfter;
          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        } else {
          this.scoringEngine.awardAdvantage(matchState.score, isActorA);
          const evt = CombatEventEngine.createEvent({
            matchState,
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
          matchState.lastEvent = evt;
          matchState.eventHistory.push(evt);
        }
        break;
      }

      default: {
        const targetPos: PositionState = decision.targetPosition || currentPos;
        matchState.position = targetPos;
        const evt = CombatEventEngine.createEvent({
          matchState,
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
        matchState.lastEvent = evt;
        matchState.eventHistory.push(evt);
        break;
      }
    }
  }

  private resolveEndByScoreOrDecision(matchState: MatchState, randomEngine: RandomEngine) {
    matchState.isFinished = true;
    matchState.status = 'FINISHED';

    const scoreComparison = this.scoringEngine.compareScore(matchState.score);

    if (scoreComparison === 'A') {
      matchState.winnerId = matchState.fighterA.id;
      matchState.method = matchState.score.aPoints !== matchState.score.bPoints ? 'POINTS' : 'ADVANTAGES';
    } else if (scoreComparison === 'B') {
      matchState.winnerId = matchState.fighterB.id;
      matchState.method = matchState.score.aPoints !== matchState.score.bPoints ? 'POINTS' : 'ADVANTAGES';
    } else {
      // Referee decision on tie
      const effA = EnergyEngine.getEffectiveAttributes(matchState.fighterA);
      const effB = EnergyEngine.getEffectiveAttributes(matchState.fighterB);
      const decisionA = effA.mental + effA.technique + randomEngine.nextInt(-10, 10);
      const decisionB = effB.mental + effB.technique + randomEngine.nextInt(-10, 10);

      matchState.winnerId = decisionA >= decisionB ? matchState.fighterA.id : matchState.fighterB.id;
      matchState.method = 'DECISION';
    }

    const endEvt = CombatEventEngine.createEvent({
      matchState,
      eventType: 'END_MATCH',
      actorId: matchState.winnerId || matchState.fighterA.id,
      actorName: matchState.winnerId === matchState.fighterA.id ? matchState.fighterA.name : matchState.fighterB.name,
      targetId: matchState.winnerId === matchState.fighterA.id ? matchState.fighterB.id : matchState.fighterA.id,
      targetName: matchState.winnerId === matchState.fighterA.id ? matchState.fighterB.name : matchState.fighterA.name,
      positionBefore: matchState.position,
      positionAfter: matchState.position,
      success: true,
    });

    matchState.lastEvent = endEvt;
    matchState.eventHistory.push(endEvt);
  }
}
