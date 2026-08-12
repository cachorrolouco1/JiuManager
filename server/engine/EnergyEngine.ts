/**
 * JiuManager Game Engine - Energy Engine
 * Calculates energy drain, stamina consumption, fatigue accumulation,
 * and effective stat penalties during combat.
 */

import { EngineFighter, FighterAttributes } from './types';

export class EnergyEngine {
  /**
   * Calculates energy drain and fatigue gain based on action intensity
   */
  public static processActionCost(
    fighter: EngineFighter,
    actionType: string,
    intensityMultiplier: number = 1.0
  ): { energyLoss: number; fatigueGain: number } {
    let baseEnergyCost = 4;
    let baseFatigueGain = 2;

    switch (actionType) {
      case 'TAKEDOWN':
      case 'EXPLOSION':
      case 'SUBMISSION_ESCAPE':
        baseEnergyCost = 8;
        baseFatigueGain = 5;
        break;

      case 'GUARD_PASS':
      case 'SWEEP':
      case 'SUBMISSION_ATTEMPT':
        baseEnergyCost = 6;
        baseFatigueGain = 3.5;
        break;

      case 'GUARD_PULL':
      case 'TRANSITION':
        baseEnergyCost = 4;
        baseFatigueGain = 2;
        break;

      case 'DEFENSIVE_HOLD':
      case 'REST':
        baseEnergyCost = 1.5;
        baseFatigueGain = 0.5;
        break;

      default:
        baseEnergyCost = 4;
        baseFatigueGain = 2;
        break;
    }

    // Cardio attribute dampens energy drain & fatigue
    const cardioFactor = Math.max(0.4, 1.2 - (fighter.attributes.cardio || 50) / 100);
    const energyLoss = Math.min(fighter.energy, baseEnergyCost * cardioFactor * intensityMultiplier);
    const fatigueGain = baseFatigueGain * cardioFactor * intensityMultiplier;

    fighter.energy = Math.max(0, fighter.energy - energyLoss);
    fighter.fatigue = Math.min(100, fighter.fatigue + fatigueGain);

    return { energyLoss, fatigueGain };
  }

  /**
   * Computes dynamic effective stats for combat decision checks,
   * factoring in current energy (0..100) and accumulated fatigue (0..100).
   */
  public static getEffectiveAttributes(fighter: EngineFighter): FighterAttributes {
    const energyMult = Math.max(0.4, fighter.energy / 100);
    const fatiguePenaltyRatio = (fighter.fatigue / 100) * 0.35; // Up to 35% attribute reduction when fatigued

    const res: Partial<FighterAttributes> = {};
    const keys = Object.keys(fighter.attributes) as (keyof FighterAttributes)[];

    for (const key of keys) {
      const baseVal = fighter.attributes[key] || 50;
      const effectiveVal = baseVal * energyMult * (1 - fatiguePenaltyRatio);
      res[key] = Math.max(5, Math.round(effectiveVal));
    }

    return res as FighterAttributes;
  }
}
