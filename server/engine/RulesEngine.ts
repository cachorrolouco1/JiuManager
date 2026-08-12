/**
 * JiuManager Game Engine - Rules Engine
 * Handles competition rulesets, stall warnings, disqualifications, and points setup.
 */

import { MatchRulesConfig, MatchScoreState, PositionState } from './types';
import { ScoringEngine, DEFAULT_RULES_CONFIG } from './ScoringEngine';

export class RulesEngine {
  private scoringEngine: ScoringEngine;

  constructor(config: MatchRulesConfig = DEFAULT_RULES_CONFIG) {
    this.scoringEngine = new ScoringEngine(config);
  }

  public getScoringEngine(): ScoringEngine {
    return this.scoringEngine;
  }

  /**
   * Validates if a fight action obeys rule restrictions.
   */
  public isLegalAction(actionType: string, position: PositionState): boolean {
    if (actionType === 'HEEL_HOOK' && position === 'CLOSED_GUARD') {
      // Heel hook prohibited in closed guard under IBJJF rules
      return false;
    }
    return true;
  }
}
