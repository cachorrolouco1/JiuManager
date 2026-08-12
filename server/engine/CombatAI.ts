/**
 * JiuManager Game Engine - Combat AI
 * Autonomous strategic decision-making engine for fighters (AI vs AI, Player vs AI, Player vs Player)
 */

import { EngineFighter, MatchState, PositionState } from './types';
import { PositionEngine, ActionOpportunity } from './PositionEngine';
import { SubmissionEngine } from './SubmissionEngine';
import { EnergyEngine } from './EnergyEngine';
import { RandomEngine } from './RandomEngine';

export interface AIDecision {
  actionType:
    | 'TAKEDOWN'
    | 'GUARD_PULL'
    | 'GUARD_PASS'
    | 'SWEEP'
    | 'SUBMISSION'
    | 'TRANSITION'
    | 'DEFENSIVE_RECOVERY'
    | 'STAND_UP'
    | 'STALL';
  subName?: string;
  targetPosition: PositionState;
  aggressionLevel: number; // 0..100
}

export class CombatAI {
  /**
   * Evaluates match context and selects optimal decision for the fighter
   */
  public static decideNextAction(
    matchState: MatchState,
    fighterId: string,
    randomEngine: RandomEngine
  ): AIDecision {
    const isFighterA = matchState.fighterA.id === fighterId;
    const self = isFighterA ? matchState.fighterA : matchState.fighterB;
    const opponent = isFighterA ? matchState.fighterB : matchState.fighterA;
    const isTop = matchState.topFighterId === self.id;

    const remainingTimeSeconds = matchState.maxDurationSeconds - matchState.timeSeconds;
    const scoreDiff = isFighterA
      ? matchState.score.aPoints - matchState.score.bPoints
      : matchState.score.bPoints - matchState.score.aPoints;

    const effSelf = EnergyEngine.getEffectiveAttributes(self);

    // Dynamic Aggression Calculation based on time & score
    let baseAggression = effSelf.aggression || 50;
    if (self.strategy === 'AGGRESSIVE') baseAggression += 20;
    if (self.strategy === 'DEFENSIVE') baseAggression -= 20;

    // Time pressure logic
    if (remainingTimeSeconds < 60) {
      if (scoreDiff < 0) {
        // Trailing near end of match -> Max aggression & submission seeking
        baseAggression += 35;
      } else if (scoreDiff > 0) {
        // Leading near end of match -> Conservative / Position control
        baseAggression -= 25;
      }
    }

    const currentPos = matchState.position;
    const availableActions = PositionEngine.getAvailableActions(currentPos, isTop);

    // If standing
    if (currentPos === 'STANDING') {
      if (self.style === 'GUARDEIRO' || self.strategy === 'GUARD') {
        const pullAction = availableActions.find((a) => a.actionType === 'GUARD_PULL');
        if (pullAction) {
          return {
            actionType: 'GUARD_PULL',
            targetPosition: pullAction.targetPosition,
            aggressionLevel: baseAggression,
          };
        }
      }

      if (self.style === 'WRESTLER' || self.strategy === 'TAKEDOWN' || effSelf.takedown > effSelf.guard) {
        const takeAction = availableActions.find((a) => a.actionType === 'TAKEDOWN');
        if (takeAction) {
          return {
            actionType: 'TAKEDOWN',
            targetPosition: takeAction.targetPosition,
            aggressionLevel: baseAggression,
          };
        }
      }
    }

    // Check submission availability if high aggression or submission hunter
    const possibleSubs = SubmissionEngine.getSubmissionsForPosition(currentPos);
    if (
      possibleSubs.length > 0 &&
      (baseAggression > 65 || self.style === 'SUBMISSION_HUNTER' || self.personality === 'finalizador' as any)
    ) {
      const chosenSub = randomEngine.pickOne(possibleSubs);
      return {
        actionType: 'SUBMISSION',
        subName: chosenSub.name,
        targetPosition: currentPos,
        aggressionLevel: baseAggression,
      };
    }

    // Default: Pick best action candidate from available actions
    if (availableActions.length > 0) {
      const chosen = randomEngine.pickOne(availableActions);
      return {
        actionType: chosen.actionType,
        targetPosition: chosen.targetPosition,
        aggressionLevel: Math.max(10, Math.min(100, baseAggression)),
      };
    }

    // Fallback transition/stand up
    return {
      actionType: 'TRANSITION',
      targetPosition: 'STANDING',
      aggressionLevel: baseAggression,
    };
  }
}
