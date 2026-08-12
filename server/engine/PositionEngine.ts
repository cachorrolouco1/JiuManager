/**
 * JiuManager Game Engine - Position Engine
 * Manages position states, allowed moves, transitions, and constraints
 */

import { PositionState } from './types';

export interface ActionOpportunity {
  actionType:
    | 'TAKEDOWN'
    | 'GUARD_PULL'
    | 'GUARD_PASS'
    | 'SWEEP'
    | 'SUBMISSION'
    | 'TRANSITION'
    | 'DEFENSIVE_RECOVERY'
    | 'STAND_UP';
  name: string;
  targetPosition: PositionState;
  staminaCost: number;
}

export class PositionEngine {
  private static ALLOWED_TRANSITIONS: Record<PositionState, PositionState[]> = {
    STANDING: ['CLOSED_GUARD', 'OPEN_GUARD', 'HALF_GUARD', 'SIDE_CONTROL', 'SCRAMBLE', 'STANDING'],
    CLOSED_GUARD: ['OPEN_GUARD', 'HALF_GUARD', 'SIDE_CONTROL', 'MOUNT', 'BACK_CONTROL', 'STANDING', 'SCRAMBLE'],
    OPEN_GUARD: ['CLOSED_GUARD', 'HALF_GUARD', 'SIDE_CONTROL', 'MOUNT', 'STANDING', 'SCRAMBLE'],
    HALF_GUARD: ['CLOSED_GUARD', 'OPEN_GUARD', 'SIDE_CONTROL', 'MOUNT', 'BACK_CONTROL', 'STANDING', 'SCRAMBLE'],
    SIDE_CONTROL: ['KNEE_ON_BELLY', 'MOUNT', 'BACK_CONTROL', 'CLOSED_GUARD', 'HALF_GUARD', 'TURTLE', 'STANDING', 'SCRAMBLE'],
    KNEE_ON_BELLY: ['MOUNT', 'SIDE_CONTROL', 'BACK_CONTROL', 'OPEN_GUARD', 'STANDING'],
    MOUNT: ['BACK_CONTROL', 'SIDE_CONTROL', 'HALF_GUARD', 'CLOSED_GUARD', 'TURTLE', 'SCRAMBLE'],
    BACK_CONTROL: ['MOUNT', 'SIDE_CONTROL', 'CLOSED_GUARD', 'TURTLE', 'SCRAMBLE'],
    TURTLE: ['BACK_CONTROL', 'SIDE_CONTROL', 'GUARD_PULL' as any, 'CLOSED_GUARD', 'STANDING', 'SCRAMBLE'],
    SCRAMBLE: ['STANDING', 'CLOSED_GUARD', 'HALF_GUARD', 'SIDE_CONTROL'],
  };

  /**
   * Validates if a position transition is structurally valid under BJJ mechanics
   */
  public static isValidTransition(from: PositionState, to: PositionState): boolean {
    if (from === to) return true;
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  /**
   * Returns logical available actions based on whether athlete is Top, Bottom, or Standing
   */
  public static getAvailableActions(
    currentPos: PositionState,
    isTop: boolean
  ): ActionOpportunity[] {
    switch (currentPos) {
      case 'STANDING':
        return [
          { actionType: 'TAKEDOWN', name: 'Queda de Quadril / Double Leg', targetPosition: 'SIDE_CONTROL', staminaCost: 8 },
          { actionType: 'TAKEDOWN', name: 'Baiana (Takedown)', targetPosition: 'CLOSED_GUARD', staminaCost: 7 },
          { actionType: 'GUARD_PULL', name: 'Puxar para Guarda Fechada', targetPosition: 'CLOSED_GUARD', staminaCost: 4 },
          { actionType: 'GUARD_PULL', name: 'Puxar para Guarda Aberta', targetPosition: 'OPEN_GUARD', staminaCost: 3 },
        ];

      case 'CLOSED_GUARD':
        if (isTop) {
          return [
            { actionType: 'GUARD_PASS', name: 'Passar Guarda Fechada', targetPosition: 'SIDE_CONTROL', staminaCost: 6 },
            { actionType: 'GUARD_PASS', name: 'Abrir Guarda e ir para Meia', targetPosition: 'HALF_GUARD', staminaCost: 5 },
            { actionType: 'SUBMISSION', name: 'Estrangulamento / Chave de Braço por cima', targetPosition: 'CLOSED_GUARD', staminaCost: 7 },
          ];
        } else {
          return [
            { actionType: 'SWEEP', name: 'Raspagem Tesourinha / Pêndulo', targetPosition: 'MOUNT', staminaCost: 6 },
            { actionType: 'SWEEP', name: 'Raspagem Flor / Guilhotina', targetPosition: 'SIDE_CONTROL', staminaCost: 5 },
            { actionType: 'SUBMISSION', name: 'Triângulo / Armlock na Guarda', targetPosition: 'CLOSED_GUARD', staminaCost: 7 },
            { actionType: 'SUBMISSION', name: 'Omoplata', targetPosition: 'CLOSED_GUARD', staminaCost: 6 },
          ];
        }

      case 'OPEN_GUARD':
        if (isTop) {
          return [
            { actionType: 'GUARD_PASS', name: 'Passagem Toreando / Knee Cut', targetPosition: 'SIDE_CONTROL', staminaCost: 6 },
            { actionType: 'GUARD_PASS', name: 'Passagem Emborcando', targetPosition: 'MOUNT', staminaCost: 7 },
          ];
        } else {
          return [
            { actionType: 'SWEEP', name: 'Raspagem De La Riva / Aranha', targetPosition: 'SIDE_CONTROL', staminaCost: 5 },
            { actionType: 'SUBMISSION', name: 'Chave de Pé / Triângulo', targetPosition: 'OPEN_GUARD', staminaCost: 6 },
          ];
        }

      case 'HALF_GUARD':
        if (isTop) {
          return [
            { actionType: 'GUARD_PASS', name: 'Passagem de Meia Guarda', targetPosition: 'SIDE_CONTROL', staminaCost: 5 },
            { actionType: 'TRANSITION', name: 'Avançar para Montada', targetPosition: 'MOUNT', staminaCost: 6 },
          ];
        } else {
          return [
            { actionType: 'SWEEP', name: 'Raspagem de Esgrima (Deep Half)', targetPosition: 'SIDE_CONTROL', staminaCost: 5 },
            { actionType: 'DEFENSIVE_RECOVERY', name: 'Recompor Guarda Fechada', targetPosition: 'CLOSED_GUARD', staminaCost: 4 },
          ];
        }

      case 'SIDE_CONTROL':
        if (isTop) {
          return [
            { actionType: 'TRANSITION', name: 'Avançar para Joelho na Barriga', targetPosition: 'KNEE_ON_BELLY', staminaCost: 3 },
            { actionType: 'TRANSITION', name: 'Avançar para Montada', targetPosition: 'MOUNT', staminaCost: 5 },
            { actionType: 'SUBMISSION', name: 'Kimura / Katagatame / Ezekiel', targetPosition: 'SIDE_CONTROL', staminaCost: 6 },
          ];
        } else {
          return [
            { actionType: 'DEFENSIVE_RECOVERY', name: 'Fuga de Quadril e Recompor Guarda', targetPosition: 'HALF_GUARD', staminaCost: 6 },
            { actionType: 'STAND_UP', name: 'Levantar e Empurrar (Scramble)', targetPosition: 'STANDING', staminaCost: 7 },
          ];
        }

      case 'KNEE_ON_BELLY':
        if (isTop) {
          return [
            { actionType: 'TRANSITION', name: 'Transição para Montada', targetPosition: 'MOUNT', staminaCost: 4 },
            { actionType: 'SUBMISSION', name: 'Chave de Braço voadora / Estrangulamento', targetPosition: 'KNEE_ON_BELLY', staminaCost: 6 },
          ];
        } else {
          return [
            { actionType: 'DEFENSIVE_RECOVERY', name: 'Fuga para Guarda Aberta', targetPosition: 'OPEN_GUARD', staminaCost: 5 },
          ];
        }

      case 'MOUNT':
        if (isTop) {
          return [
            { actionType: 'TRANSITION', name: 'Pegada de Costas', targetPosition: 'BACK_CONTROL', staminaCost: 4 },
            { actionType: 'SUBMISSION', name: 'Armlock da Montada / Ezekiel / Americana', targetPosition: 'MOUNT', staminaCost: 7 },
          ];
        } else {
          return [
            { actionType: 'DEFENSIVE_RECOVERY', name: 'Ponte e Barrigada (Upa) para Guarda', targetPosition: 'CLOSED_GUARD', staminaCost: 7 },
          ];
        }

      case 'BACK_CONTROL':
        if (isTop) {
          return [
            { actionType: 'SUBMISSION', name: 'Mata-Leão / Arco e Flecha', targetPosition: 'BACK_CONTROL', staminaCost: 7 },
          ];
        } else {
          return [
            { actionType: 'DEFENSIVE_RECOVERY', name: 'Escapar os ganchos e girar para Guarda', targetPosition: 'HALF_GUARD', staminaCost: 7 },
          ];
        }

      case 'TURTLE':
        if (isTop) {
          return [
            { actionType: 'TRANSITION', name: 'Colocar Ganchos e Pegar Costas', targetPosition: 'BACK_CONTROL', staminaCost: 5 },
            { actionType: 'SUBMISSION', name: 'Guilhotina / D\'Arce', targetPosition: 'TURTLE', staminaCost: 6 },
          ];
        } else {
          return [
            { actionType: 'DEFENSIVE_RECOVERY', name: 'Puxar Guarda Fechada', targetPosition: 'CLOSED_GUARD', staminaCost: 5 },
            { actionType: 'STAND_UP', name: 'Levantar para Posição em Pé', targetPosition: 'STANDING', staminaCost: 6 },
          ];
        }

      default:
        return [
          { actionType: 'STAND_UP', name: 'Restabelecer em pé', targetPosition: 'STANDING', staminaCost: 4 },
        ];
    }
  }
}
