/**
 * JiuManager Game Engine - Real-Time Combat Clock Engine
 * Absolute rule: Clock MUST be based on REAL MONOTONIC TIMESTAMP (performance.now()).
 * NEVER uses counter++, time+1, or frame loops as time source.
 */

export type ClockSpeed = 1 | 2 | 4 | 8;
export type ClockStatus = 'NOT_STARTED' | 'RUNNING' | 'PAUSED' | 'FINISHED';

export interface ClockSnapshot {
  startedAt: number | null;
  pausedAt: number | null;
  endedAt: number | null;
  totalPausedMs: number;
  elapsedMilliseconds: number;
  durationMilliseconds: number;
  speed: ClockSpeed;
  status: ClockStatus;
  lastServerTimestamp: number;
  displayTime: string; // "MM:SS"
}

export class RealTimeClock {
  private durationMs: number;
  private speed: ClockSpeed;
  private status: ClockStatus;
  private startedAtMonotonic: number | null = null;
  private pausedAtMonotonic: number | null = null;
  private endedAtMonotonic: number | null = null;
  private totalPausedMs: number = 0;
  private initialElapsedMs: number = 0; // Anchor for speed transitions

  constructor(durationMs: number = 300000, initialSpeed: ClockSpeed = 1) {
    this.durationMs = durationMs;
    this.speed = initialSpeed;
    this.status = 'NOT_STARTED';
  }

  /**
   * Helper to get high-precision monotonic timestamp
   */
  public static getMonotonicNow(): number {
    if (typeof performance !== 'undefined' && typeof performance.now === 'function') {
      return performance.now();
    }
    return Date.now();
  }

  /**
   * Starts the match clock
   */
  public start(speed: ClockSpeed = 1, customNow?: number): void {
    const now = customNow ?? RealTimeClock.getMonotonicNow();
    this.speed = speed;
    this.startedAtMonotonic = now;
    this.pausedAtMonotonic = null;
    this.endedAtMonotonic = null;
    this.totalPausedMs = 0;
    this.initialElapsedMs = 0;
    this.status = 'RUNNING';
  }

  /**
   * Calculates exact elapsed combat milliseconds based on monotonic time difference
   */
  public getElapsedCombatMs(customNow?: number): number {
    if (this.status === 'NOT_STARTED') return 0;
    if (this.status === 'FINISHED') return this.initialElapsedMs;

    const now = customNow ?? RealTimeClock.getMonotonicNow();

    if (this.status === 'PAUSED') {
      const activeMs = (this.pausedAtMonotonic || now) - (this.startedAtMonotonic || now) - this.totalPausedMs;
      const elapsed = this.initialElapsedMs + activeMs * this.speed;
      return Math.min(this.durationMs, Math.max(0, elapsed));
    }

    // RUNNING
    const activeMs = now - (this.startedAtMonotonic || now) - this.totalPausedMs;
    const elapsed = this.initialElapsedMs + activeMs * this.speed;
    return Math.min(this.durationMs, Math.max(0, elapsed));
  }

  /**
   * Pauses the clock. Real time spent while paused is not counted as combat time.
   */
  public pause(customNow?: number): number {
    if (this.status !== 'RUNNING') return this.getElapsedCombatMs(customNow);
    const now = customNow ?? RealTimeClock.getMonotonicNow();
    const currentElapsed = this.getElapsedCombatMs(now);
    this.pausedAtMonotonic = now;
    this.status = 'PAUSED';
    return currentElapsed;
  }

  /**
   * Resumes the clock seamlessly from exact paused position.
   */
  public resume(customNow?: number): void {
    if (this.status !== 'PAUSED' || !this.pausedAtMonotonic) return;
    const now = customNow ?? RealTimeClock.getMonotonicNow();
    const pausedDuration = now - this.pausedAtMonotonic;
    this.totalPausedMs += pausedDuration;
    this.pausedAtMonotonic = null;
    this.status = 'RUNNING';
  }

  /**
   * Dynamic speed multiplier switch (1x, 2x, 4x, 8x).
   * RULE 10: Speed changes ONLY the rate of time presentation.
   * Re-anchors clock so elapsed combat time remains 100% continuous without jumps!
   */
  public setSpeed(newSpeed: ClockSpeed, customNow?: number): void {
    if (this.speed === newSpeed) return;
    const now = customNow ?? RealTimeClock.getMonotonicNow();
    const currentElapsed = this.getElapsedCombatMs(now);

    this.initialElapsedMs = currentElapsed;
    this.speed = newSpeed;
    this.startedAtMonotonic = now;
    this.totalPausedMs = 0;
    if (this.status === 'PAUSED') {
      this.pausedAtMonotonic = now;
    }
  }

  /**
   * Ends the match immediately (e.g. on submission or 05:00 limit)
   */
  public finish(customNow?: number): number {
    const now = customNow ?? RealTimeClock.getMonotonicNow();
    const finalElapsed = this.getElapsedCombatMs(now);
    this.initialElapsedMs = finalElapsed;
    this.endedAtMonotonic = now;
    this.status = 'FINISHED';
    return finalElapsed;
  }

  public getStatus(): ClockStatus {
    return this.status;
  }

  public getSpeed(): ClockSpeed {
    return this.speed;
  }

  public getDurationMs(): number {
    return this.durationMs;
  }

  /**
   * Formats combat time into "MM:SS"
   */
  public static formatTime(milliseconds: number): string {
    const totalSecs = Math.floor(milliseconds / 1000);
    const mins = Math.floor(totalSecs / 60);
    const secs = totalSecs % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  }

  /**
   * Serializes immutable snapshot for client synchronization
   */
  public getSnapshot(customNow?: number): ClockSnapshot {
    const now = customNow ?? RealTimeClock.getMonotonicNow();
    const elapsed = this.getElapsedCombatMs(now);
    return {
      startedAt: this.startedAtMonotonic,
      pausedAt: this.pausedAtMonotonic,
      endedAt: this.endedAtMonotonic,
      totalPausedMs: this.totalPausedMs,
      elapsedMilliseconds: Math.round(elapsed),
      durationMilliseconds: this.durationMs,
      speed: this.speed,
      status: this.status,
      lastServerTimestamp: Date.now(),
      displayTime: RealTimeClock.formatTime(elapsed),
    };
  }
}
