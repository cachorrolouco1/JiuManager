/**
 * JiuManager Game Engine - Scoring Engine
 * Centralized configurable IBJJF / BJJ scoring, advantage, and penalty logic
 */

import { MatchScoreState, MatchRulesConfig, EventType } from './types';

export const DEFAULT_RULES_CONFIG: MatchRulesConfig = {
  matchDurationSeconds: 300, // 5 minutes
  pointsMap: {
    TAKEDOWN: 2,
    SWEEP: 2,
    GUARD_PASS: 3,
    KNEE_ON_BELLY: 2,
    MOUNT: 4,
    BACK_CONTROL: 4,
  },
  penaltyDisqualificationThreshold: 3,
};

export class ScoringEngine {
  private config: MatchRulesConfig;

  constructor(config: MatchRulesConfig = DEFAULT_RULES_CONFIG) {
    this.config = config;
  }

  public getConfig(): MatchRulesConfig {
    return this.config;
  }

  /**
   * Awards points to Player A or Player B based on event action
   */
  public awardPoints(
    score: MatchScoreState,
    isPlayerA: boolean,
    action: keyof MatchRulesConfig['pointsMap']
  ): number {
    const pts = this.config.pointsMap[action] || 0;
    if (isPlayerA) {
      score.aPoints += pts;
    } else {
      score.bPoints += pts;
    }
    return pts;
  }

  /**
   * Awards an advantage to Player A or Player B
   */
  public awardAdvantage(score: MatchScoreState, isPlayerA: boolean): void {
    if (isPlayerA) {
      score.aAdvantages += 1;
    } else {
      score.bAdvantages += 1;
    }
  }

  /**
   * Issues a penalty to Player A or Player B.
   * On 2nd penalty: opponent gets 1 advantage.
   * On 3rd penalty: opponent gets 2 points or disqualification depending on rules.
   */
  public applyPenalty(score: MatchScoreState, isPlayerA: boolean): { disqualified: boolean } {
    if (isPlayerA) {
      score.aPenalties += 1;
      const count = score.aPenalties;
      if (count === 2) {
        score.bAdvantages += 1;
      } else if (count >= this.config.penaltyDisqualificationThreshold) {
        return { disqualified: true };
      }
    } else {
      score.bPenalties += 1;
      const count = score.bPenalties;
      if (count === 2) {
        score.aAdvantages += 1;
      } else if (count >= this.config.penaltyDisqualificationThreshold) {
        return { disqualified: true };
      }
    }
    return { disqualified: false };
  }

  /**
   * Evaluates who is leading on points, advantages, and penalties.
   * Returns 'A', 'B', or 'TIED'.
   */
  public compareScore(score: MatchScoreState): 'A' | 'B' | 'TIED' {
    // Weighted comparison: 100 per point, 10 per advantage, -5 per penalty
    const valA = score.aPoints * 100 + score.aAdvantages * 10 - score.aPenalties * 5;
    const valB = score.bPoints * 100 + score.bAdvantages * 10 - score.bPenalties * 5;

    if (valA > valB) return 'A';
    if (valB > valA) return 'B';
    return 'TIED';
  }
}
