/**
 * JiuManager Game Engine - Narration Engine
 * Converts structured CombatEvents into dynamic, realistic Portuguese BJJ commentary.
 * STRICT RULE: Does NOT invent events or modify simulation outcomes.
 */

import { CombatEvent, PositionState, SubmissionName } from './types';
import { SubmissionEngine } from './SubmissionEngine';

export class NarrationEngine {
  /**
   * Generates narrative description for a validated CombatEvent
   */
  public static generateNarration(event: CombatEvent): string {
    const actor = event.actorName;
    const target = event.targetName;
    const posName = this.getPositionDisplayName(event.positionAfter);

    switch (event.eventType) {
      case 'TAKEDOWN_ATTEMPT':
        return `${actor} ataca uma entrada de queda com explosão em cima de ${target}!`;

      case 'TAKEDOWN_SUCCESS':
        return `${actor} executa uma queda limpa sobre ${target} e estabelece o controle! (+2 Pontos)`;

      case 'TAKEDOWN_DEFENSE':
        return `${target} faz um excelente sprawl, bloqueando a queda de ${actor}!`;

      case 'GUARD_PULL':
        return `${actor} puxa ${target} direto para a ${posName}!`;

      case 'GUARD_PASS_ATTEMPT':
        return `${actor} trabalha a pressão para tentar passar a guarda de ${target}!`;

      case 'GUARD_PASS_SUCCESS':
        return `${actor} passa a guarda com técnica perfeita e estabiliza no cem quilos! (+3 Pontos)`;

      case 'GUARD_RECOVERY':
        return `${actor} faz a fuga de quadril e recompõe a guarda sobre ${target}!`;

      case 'SWEEP_ATTEMPT':
        return `${actor} desequilibra ${target} buscando a raspagem!`;

      case 'SWEEP_SUCCESS':
        return `${actor} completa a raspagem com maestria, invertendo a posição e subindo por cima! (+2 Pontos)`;

      case 'SWEEP_DEFENSE':
        return `${target} esgrima e mantém a base, defendendo a tentativa de raspagem de ${actor}!`;

      case 'SUBMISSION_ATTEMPT': {
        const subDisp = event.submissionMove ? SubmissionEngine.getSpec(event.submissionMove as SubmissionName).displayName : 'finalização';
        return `${actor} encaixa um perigoso ${subDisp} sobre ${target}!`;
      }

      case 'SUBMISSION_DEFENSE':
        return `${target} mantém a calma e defende o ajuste da finalização exercida por ${actor}.`;

      case 'SUBMISSION_ESCAPE':
        return `${actor} faz uma fuga explosiva e consegue se livrar da finalização de ${target}!`;

      case 'SUBMISSION_SUCCESS': {
        const subDisp = event.submissionMove ? SubmissionEngine.getSpec(event.submissionMove as SubmissionName).displayName : 'golpe';
        return `BATEU! ${target} bate no ${subDisp}! Vitória sensacional por FINALIZAÇÃO de ${actor}!`;
      }

      case 'POSITION_TRANSITION':
        return `${actor} progride a posição para ${posName}.`;

      case 'ADVANTAGE':
        return `Vantagem assinalada pela arbitragem para ${actor}!`;

      case 'PENALTY':
        return `Punição por falta ou falta de combatividade atribuída a ${actor}.`;

      case 'POINTS':
        return `Pontuação confirmada para ${actor}! (+${event.points} Pontos)`;

      case 'END_MATCH':
        return `FIM DE COMBATE! A luta encerra aos ${event.timestampDisplay}.`;

      default:
        return `${actor} trabalha movimentação contra ${target} na posição de ${posName}.`;
    }
  }

  private static getPositionDisplayName(pos: PositionState): string {
    const names: Record<PositionState, string> = {
      STANDING: 'Luta em Pé',
      CLOSED_GUARD: 'Guarda Fechada',
      OPEN_GUARD: 'Guarda Aberta',
      HALF_GUARD: 'Meia-Guarda',
      SIDE_CONTROL: 'Domínio Lateral (Cem Quilos)',
      KNEE_ON_BELLY: 'Joelho na Barriga',
      MOUNT: 'Montada',
      BACK_CONTROL: 'Pegada de Costas',
      TURTLE: 'Posição de Quatro Apoios',
      SCRAMBLE: 'Luta Franca (Scramble)',
    };
    return names[pos] || pos;
  }
}
