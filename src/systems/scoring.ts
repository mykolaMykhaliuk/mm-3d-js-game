import { POINTS_PER_ALIEN, WAVES } from '../utils/constants';

/**
 * Tracks score and wave progression
 */
export class ScoringSystem {
  private score: number = 0;
  private currentWave: number = 0;

  /**
   * Add points to the score
   * @param points - Points to add
   */
  addPoints(points: number): void {
    this.score += points;
  }

  /**
   * Get the current score
   */
  getScore(): number {
    return this.score;
  }

  /**
   * Add points for killing an alien
   */
  addAlienKillPoints(): void {
    this.addPoints(POINTS_PER_ALIEN);
  }

  /**
   * Get the current wave number (0-indexed)
   */
  getCurrentWave(): number {
    return this.currentWave;
  }

  /**
   * Get the current wave number for display (1-indexed)
   */
  getCurrentWaveDisplay(): number {
    return this.currentWave + 1;
  }

  /**
   * Advance to the next wave
   */
  nextWave(): void {
    this.currentWave++;
  }

  /**
   * Check if all waves are completed
   */
  isAllWavesComplete(): boolean {
    return this.currentWave >= WAVES.length;
  }

  /**
   * Get total number of waves
   */
  getTotalWaves(): number {
    return WAVES.length;
  }

  /**
   * Reset scoring for a new game
   */
  reset(): void {
    this.score = 0;
    this.currentWave = 0;
  }
}
