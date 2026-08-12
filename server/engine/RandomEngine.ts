/**
 * JiuManager Game Engine - Seedable Deterministic Random Engine
 * Uses Mulberry32 algorithm to guarantee 100% reproducible match simulation
 */

export class RandomEngine {
  private state: number;

  constructor(seedInput?: string | number) {
    if (typeof seedInput === 'number') {
      this.state = seedInput >>> 0;
    } else if (typeof seedInput === 'string' && seedInput.trim().length > 0) {
      this.state = this.hashString(seedInput);
    } else {
      this.state = Math.floor(Math.random() * 0xffffffff);
    }
  }

  private hashString(str: string): number {
    let hash = 0x811c9dc5;
    for (let i = 0; i < str.length; i++) {
      hash ^= str.charCodeAt(i);
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  }

  /**
   * Generates a deterministic float between 0 (inclusive) and 1 (exclusive)
   */
  public nextFloat(): number {
    let t = (this.state += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  }

  /**
   * Generates a deterministic integer between min (inclusive) and max (inclusive)
   */
  public nextInt(min: number, max: number): number {
    const floatVal = this.nextFloat();
    return Math.floor(floatVal * (max - min + 1)) + min;
  }

  /**
   * Picks a random element from an array deterministically
   */
  public pickOne<T>(arr: T[]): T {
    if (arr.length === 0) {
      throw new Error('Cannot pick element from empty array.');
    }
    const idx = this.nextInt(0, arr.length - 1);
    return arr[idx];
  }

  public getSeedState(): number {
    return this.state;
  }
}
