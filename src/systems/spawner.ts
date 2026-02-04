import { Scene } from '@babylonjs/core/scene';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Alien } from '../entities/alien';
import { EntityManager } from '../entity-manager';
import { getRandomCirclePosition } from '../utils/helpers';
import {
  WAVES,
  SPAWN_RADIUS,
  ALIEN_BASE_SPEED,
  ALIEN_SPEED_INCREMENT,
  WAVE_DELAY,
} from '../utils/constants';

/**
 * Wave colors for visual variety
 */
const WAVE_COLORS = [
  new Color3(1.0, 0.3, 0.3), // Red
  new Color3(0.3, 1.0, 0.3), // Green
  new Color3(0.3, 0.3, 1.0), // Blue
  new Color3(1.0, 1.0, 0.3), // Yellow
  new Color3(1.0, 0.3, 1.0), // Magenta
];

/**
 * Manages alien wave spawning
 */
export class SpawnerSystem {
  private scene: Scene;
  private entityManager: EntityManager;
  private currentWave: number = 0;
  private aliensToSpawn: number = 0;
  private aliensSpawned: number = 0;
  private spawnTimer: number = 0;
  private waveDelayTimer: number = 0;
  private waveActive: boolean = false;
  private waveComplete: boolean = false;

  constructor(scene: Scene, entityManager: EntityManager) {
    this.scene = scene;
    this.entityManager = entityManager;
  }

  /**
   * Start a new wave
   * @param waveNumber - Wave index (0-based)
   */
  startWave(waveNumber: number): void {
    if (waveNumber >= WAVES.length) {
      return; // No more waves
    }

    this.currentWave = waveNumber;
    this.aliensToSpawn = WAVES[waveNumber].count;
    this.aliensSpawned = 0;
    this.spawnTimer = 0;
    this.waveActive = true;
    this.waveComplete = false;
    this.waveDelayTimer = 0;
  }

  /**
   * Update spawner state
   * @param deltaTime - Time since last frame in seconds
   */
  update(deltaTime: number): void {
    if (!this.waveActive) return;

    // Update spawn timer
    this.spawnTimer += deltaTime;

    // Check if it's time to spawn the next alien
    const spawnInterval = WAVES[this.currentWave].interval;
    if (this.spawnTimer >= spawnInterval && this.aliensSpawned < this.aliensToSpawn) {
      this.spawnAlien();
      this.spawnTimer = 0;
      this.aliensSpawned++;
    }

    // Check if all aliens for this wave have been spawned
    if (this.aliensSpawned >= this.aliensToSpawn) {
      this.waveActive = false;
    }
  }

  /**
   * Spawn a single alien at a random position
   */
  private spawnAlien(): void {
    const position = getRandomCirclePosition(SPAWN_RADIUS, 1.0);
    const speed = ALIEN_BASE_SPEED + this.currentWave * ALIEN_SPEED_INCREMENT;
    const color = WAVE_COLORS[this.currentWave % WAVE_COLORS.length];

    const alien = new Alien(this.scene, position, speed, color);
    this.entityManager.add(alien);
  }

  /**
   * Check if the current wave is complete (all aliens defeated)
   * @returns True if wave is complete
   */
  isWaveComplete(): boolean {
    if (this.waveActive) return false; // Still spawning
    if (this.waveComplete) return true; // Already marked complete

    const aliens = this.entityManager.getByType('alien');
    if (aliens.length === 0 && this.aliensSpawned > 0) {
      this.waveComplete = true;
      return true;
    }

    return false;
  }

  /**
   * Check if wave delay has elapsed and ready for next wave
   * @param deltaTime - Time since last frame in seconds
   * @returns True if ready for next wave
   */
  updateWaveDelay(deltaTime: number): boolean {
    this.waveDelayTimer += deltaTime;
    return this.waveDelayTimer >= WAVE_DELAY;
  }

  /**
   * Reset the spawner for a new game
   */
  reset(): void {
    this.currentWave = 0;
    this.aliensToSpawn = 0;
    this.aliensSpawned = 0;
    this.spawnTimer = 0;
    this.waveDelayTimer = 0;
    this.waveActive = false;
    this.waveComplete = false;
  }

  /**
   * Check if spawner is actively spawning
   */
  isActive(): boolean {
    return this.waveActive;
  }
}
