/**
 * JiuManager Game Engine - Combat Event Engine
 * Builds, validates, and emits structured CombatEvent objects.
 */

import { CombatEvent, EventType, MatchState, PositionState, SubmissionName } from './types';
import { NarrationEngine } from './NarrationEngine';

export class CombatEventEngine {
  /**
   * Constructs and emits a validated CombatEvent with narrative description
   */
  public static createEvent(params: {
    matchState: MatchState;
    eventType: EventType;
    actorId: string;
    actorName: string;
    targetId: string;
    targetName: string;
    positionBefore: PositionState;
    positionAfter: PositionState;
    points?: number;
    advantage?: number;
    penalty?: number;
    energyChangeActor?: number;
    energyChangeTarget?: number;
    fatigueChangeActor?: number;
    fatigueChangeTarget?: number;
    success: boolean;
    submissionMove?: SubmissionName | string;
    actionDetails?: string;
  }): CombatEvent {
    const mins = String(Math.floor(params.matchState.timeSeconds / 60)).padStart(2, '0');
    const secs = String(params.matchState.timeSeconds % 60).padStart(2, '0');
    const timeDisplay = `${mins}:${secs}`;

    const eventId = `evt_${params.matchState.eventHistory.length + 1}_${Date.now()}`;

    const partialEvent: CombatEvent = {
      eventId,
      matchId: params.matchState.matchId,
      timestampSeconds: params.matchState.timeSeconds,
      timestampDisplay: timeDisplay,
      eventType: params.eventType,
      actorId: params.actorId,
      actorName: params.actorName,
      targetId: params.targetId,
      targetName: params.targetName,
      positionBefore: params.positionBefore,
      positionAfter: params.positionAfter,
      points: params.points || 0,
      advantage: params.advantage || 0,
      penalty: params.penalty || 0,
      energyChangeActor: params.energyChangeActor || 0,
      energyChangeTarget: params.energyChangeTarget || 0,
      fatigueChangeActor: params.fatigueChangeActor || 0,
      fatigueChangeTarget: params.fatigueChangeTarget || 0,
      success: params.success,
      submissionMove: params.submissionMove,
      narration: '',
      actionDetails: params.actionDetails,
    };

    partialEvent.narration = NarrationEngine.generateNarration(partialEvent);
    return partialEvent;
  }
}
