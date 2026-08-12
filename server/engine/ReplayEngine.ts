/**
 * JiuManager Game Engine - Replay Engine
 * Reproduces a saved match using original event log or deterministic seed.
 * STRICT RULE: Does NOT recalculate or alter match results during replay.
 */

import { MatchState, CombatEvent } from './types';

export class ReplayEngine {
  /**
   * Returns event stream sliced up to the specified playback time
   */
  public static getEventsUpToTime(
    matchState: MatchState,
    replayTimeSeconds: number
  ): CombatEvent[] {
    return matchState.eventHistory.filter((evt) => evt.timestampSeconds <= replayTimeSeconds);
  }

  /**
   * Calculates actual playback duration in milliseconds based on speed multiplier (1x, 2x, 4x, 8x)
   */
  public static calculatePlaybackDurationMs(
    matchDurationSeconds: number,
    speedMultiplier: 1 | 2 | 4 | 8 = 1
  ): number {
    return (matchDurationSeconds * 1000) / speedMultiplier;
  }
}
