import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { IEntity } from '../entity-manager';
import { PLAYER_SPEED, PLAYER_SIZE, ARENA_SIZE, PLAYER_HEALTH } from '../utils/constants';
import { clamp } from '../utils/helpers';

/**
 * Player entity - controlled by the player via input
 */
export class Player implements IEntity {
  type: 'player' = 'player';
  mesh: Mesh;
  private health: number;
  private alive: boolean = true;

  // Shooting cooldown
  private lastFireTime: number = 0;

  constructor(scene: Scene, position: Vector3 = Vector3.Zero()) {
    this.health = PLAYER_HEALTH;

    // Create player mesh (a box/turret)
    this.mesh = MeshBuilder.CreateBox(
      'player',
      { width: PLAYER_SIZE, height: PLAYER_SIZE, depth: PLAYER_SIZE },
      scene
    );
    this.mesh.position = position;

    // Create material
    const material = new StandardMaterial('playerMat', scene);
    material.diffuseColor = new Color3(0.2, 0.6, 1.0); // Blue
    material.specularColor = new Color3(0.3, 0.3, 0.3);
    this.mesh.material = material;
  }

  /**
   * Update player position based on input
   * @param deltaTime - Time since last frame in seconds
   * @param movement - Movement direction from input
   */
  updateMovement(deltaTime: number, movement: Vector2): void {
    if (movement.length() === 0) return;

    // Convert 2D movement to 3D (XZ plane)
    const moveDirection = new Vector3(movement.x, 0, movement.y);
    const velocity = moveDirection.scale(PLAYER_SPEED * deltaTime);

    // Update position
    this.mesh.position.addInPlace(velocity);

    // Clamp to arena bounds
    this.mesh.position.x = clamp(this.mesh.position.x, -ARENA_SIZE, ARENA_SIZE);
    this.mesh.position.z = clamp(this.mesh.position.z, -ARENA_SIZE, ARENA_SIZE);
  }

  /**
   * Check if enough time has passed to fire again
   * @param currentTime - Current game time in seconds
   * @param fireRate - Minimum time between shots
   * @returns True if player can fire
   */
  canFire(currentTime: number, fireRate: number): boolean {
    return currentTime - this.lastFireTime >= fireRate;
  }

  /**
   * Record that the player fired
   * @param currentTime - Current game time in seconds
   */
  recordFire(currentTime: number): void {
    this.lastFireTime = currentTime;
  }

  /**
   * Take damage
   * @param amount - Amount of damage to take
   */
  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.health = 0;
      this.alive = false;
    }
  }

  /**
   * Get current health
   */
  getHealth(): number {
    return this.health;
  }

  /**
   * Get maximum health
   */
  getMaxHealth(): number {
    return PLAYER_HEALTH;
  }

  /**
   * Get position
   */
  getPosition(): Vector3 {
    return this.mesh.position;
  }

  /**
   * Update entity (required by IEntity interface)
   */
  update(_deltaTime: number): void {
    // Player movement is handled externally by Game class
    // This is just to satisfy the IEntity interface
  }

  /**
   * Check if entity is alive
   */
  isAlive(): boolean {
    return this.alive;
  }

  /**
   * Dispose of the entity
   */
  dispose(): void {
    this.mesh.dispose();
  }
}
