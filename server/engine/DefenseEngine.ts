/**
 * JiuManager Game Engine - Defense & Escape Engine
 * Evaluates defense & escape chances when a submission or dominant position is applied.
 */

import { EngineFighter, FighterAttributes, PositionState, SubmissionName } from './types';
import { EnergyEngine } from './EnergyEngine';
import { SubmissionEngine } from './SubmissionEngine';
import { RandomEngine } from './RandomEngine';

export interface SubmissionOutcome {
  success: boolean;
  escaped: boolean;
  defended: boolean;
  positionAfter: PositionState;
  narrationKey: 'TAP' | 'ESCAPE_RECOVER_GUARD' | 'DEFENDED_HOLD_POSITION';
}

export class DefenseEngine {
  /**
   * Resolves a submission attempt mathematically:
   * Attacker power vs Defender escape & submission defense + Random Factor.
   */
  public static evaluateSubmissionAttempt(
    attacker: EngineFighter,
    defender: EngineFighter,
    currentPos: PositionState,
    subName: SubmissionName,
    randomEngine: RandomEngine
  ): SubmissionOutcome {
    const attEff = EnergyEngine.getEffectiveAttributes(attacker);
    const defEff = EnergyEngine.getEffectiveAttributes(defender);
    const subSpec = SubmissionEngine.getSpec(subName);

    // Calculate Attacker Submission Rating
    let attScore = attEff.submission * 1.3 + attEff.technique * 1.0 + attEff.grip * 0.7;
    if (attacker.style === 'SUBMISSION_HUNTER') attScore += 12;

    // Position advantage modifier
    if (currentPos === 'BACK_CONTROL' || currentPos === 'MOUNT') {
      attScore += 20;
    }

    // Calculate Defender Escape Rating
    let defScore = defEff.submissionDefense * 1.2 + defEff.escape * 1.1 + defEff.mental * 0.7 + defEff.experience * 0.5;

    // Energy & fatigue differential
    const energyDiff = (attacker.energy - defender.energy) * 0.3;
    const fatigueDiff = (defender.fatigue - attacker.fatigue) * 0.4;

    // Controlled Random Factor (-15 to +15)
    const randomFactor = randomEngine.nextInt(-15, 15);

    const netChance = attScore - defScore + energyDiff + fatigueDiff + randomFactor;

    // If netChance > 25, TAP OUT SUCCESS
    if (netChance >= 25) {
      return {
        success: true,
        escaped: false,
        defended: false,
        positionAfter: currentPos,
        narrationKey: 'TAP',
      };
    }

    // If netChance < -10, Defender ESCAPES and recovers guard or reverses position
    if (netChance < -10) {
      const escapePosition: PositionState = currentPos === 'BACK_CONTROL' || currentPos === 'MOUNT' ? 'CLOSED_GUARD' : 'OPEN_GUARD';
      return {
        success: false,
        escaped: true,
        defended: true,
        positionAfter: escapePosition,
        narrationKey: 'ESCAPE_RECOVER_GUARD',
      };
    }

    // Otherwise, defender defends the immediate submission but stays in position (Advantage to attacker)
    return {
      success: false,
      escaped: false,
      defended: true,
      positionAfter: currentPos,
      narrationKey: 'DEFENDED_HOLD_POSITION',
    };
  }
}
