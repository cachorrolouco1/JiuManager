/**
 * JiuManager Game Engine - Submission Engine
 * Defines required positions, attributes, and base risk/success calculations for submissions.
 */

import { PositionState, SubmissionName, EngineFighter, FighterAttributes } from './types';

export interface SubmissionSpec {
  name: SubmissionName;
  displayName: string;
  allowedPositions: PositionState[];
  primaryAttributes: (keyof FighterAttributes)[];
  staminaCost: number;
  riskFactor: number; // 0..1 (risk of losing position if submission fails)
}

export class SubmissionEngine {
  private static SUBMISSIONS: Record<SubmissionName, SubmissionSpec> = {
    REAR_NAKED_CHOKE: {
      name: 'REAR_NAKED_CHOKE',
      displayName: 'Mata-Leão (Rear-Naked Choke)',
      allowedPositions: ['BACK_CONTROL'],
      primaryAttributes: ['submission', 'technique', 'grip', 'pressure'],
      staminaCost: 7,
      riskFactor: 0.1,
    },
    BOW_AND_ARROW: {
      name: 'BOW_AND_ARROW',
      displayName: 'Estrangulamento Arco e Flecha',
      allowedPositions: ['BACK_CONTROL'],
      primaryAttributes: ['submission', 'technique', 'grip', 'flexibility'],
      staminaCost: 8,
      riskFactor: 0.2,
    },
    ARMBAR: {
      name: 'ARMBAR',
      displayName: 'Chave de Braço (Armbar)',
      allowedPositions: ['MOUNT', 'CLOSED_GUARD', 'SIDE_CONTROL', 'KNEE_ON_BELLY'],
      primaryAttributes: ['submission', 'technique', 'flexibility', 'explosion'],
      staminaCost: 7,
      riskFactor: 0.4,
    },
    TRIANGLE: {
      name: 'TRIANGLE',
      displayName: 'Triângulo da Guarda',
      allowedPositions: ['CLOSED_GUARD', 'OPEN_GUARD', 'MOUNT'],
      primaryAttributes: ['submission', 'technique', 'flexibility', 'guard'],
      staminaCost: 7,
      riskFactor: 0.3,
    },
    GUILLOTINE: {
      name: 'GUILLOTINE',
      displayName: 'Guilhotina',
      allowedPositions: ['STANDING', 'CLOSED_GUARD', 'TURTLE'],
      primaryAttributes: ['submission', 'grip', 'strength', 'explosion'],
      staminaCost: 8,
      riskFactor: 0.5,
    },
    KIMURA: {
      name: 'KIMURA',
      displayName: 'Chave de Ombro Kimura',
      allowedPositions: ['CLOSED_GUARD', 'SIDE_CONTROL', 'HALF_GUARD'],
      primaryAttributes: ['submission', 'grip', 'strength', 'technique'],
      staminaCost: 6,
      riskFactor: 0.25,
    },
    AMERICANA: {
      name: 'AMERICANA',
      displayName: 'Chave Americana',
      allowedPositions: ['SIDE_CONTROL', 'MOUNT'],
      primaryAttributes: ['submission', 'strength', 'pressure'],
      staminaCost: 6,
      riskFactor: 0.2,
    },
    OMOPLATA: {
      name: 'OMOPLATA',
      displayName: 'Omoplata',
      allowedPositions: ['CLOSED_GUARD', 'OPEN_GUARD'],
      primaryAttributes: ['submission', 'guard', 'flexibility', 'technique'],
      staminaCost: 6,
      riskFactor: 0.3,
    },
    STRAIGHT_ANKLE_LOCK: {
      name: 'STRAIGHT_ANKLE_LOCK',
      displayName: 'Chave de Pé Reta',
      allowedPositions: ['OPEN_GUARD', 'SCRAMBLE'],
      primaryAttributes: ['submission', 'grip', 'technique'],
      staminaCost: 6,
      riskFactor: 0.3,
    },
    HEEL_HOOK: {
      name: 'HEEL_HOOK',
      displayName: 'Chave de Calcanhar (Heel Hook)',
      allowedPositions: ['OPEN_GUARD', 'SCRAMBLE'],
      primaryAttributes: ['submission', 'technique', 'tacticalIntelligence'],
      staminaCost: 8,
      riskFactor: 0.45,
    },
    DARCE: {
      name: 'DARCE',
      displayName: 'Estrangulamento D\'Arce',
      allowedPositions: ['TURTLE', 'SIDE_CONTROL', 'HALF_GUARD'],
      primaryAttributes: ['submission', 'technique', 'grip'],
      staminaCost: 7,
      riskFactor: 0.2,
    },
    ANACONDA: {
      name: 'ANACONDA',
      displayName: 'Estrangulamento Anaconda',
      allowedPositions: ['TURTLE', 'STANDING'],
      primaryAttributes: ['submission', 'technique', 'explosion'],
      staminaCost: 7,
      riskFactor: 0.3,
    },
    EZEQUIEL: {
      name: 'EZEQUIEL',
      displayName: 'Estrangulamento Ezekiel',
      allowedPositions: ['MOUNT', 'SIDE_CONTROL', 'CLOSED_GUARD'],
      primaryAttributes: ['submission', 'grip', 'technique'],
      staminaCost: 5,
      riskFactor: 0.15,
    },
  };

  public static getSpec(subName: SubmissionName): SubmissionSpec {
    return this.SUBMISSIONS[subName] || this.SUBMISSIONS.ARMBAR;
  }

  /**
   * Returns available submissions for a given position
   */
  public static getSubmissionsForPosition(position: PositionState): SubmissionSpec[] {
    return Object.values(this.SUBMISSIONS).filter((spec) =>
      spec.allowedPositions.includes(position)
    );
  }
}
