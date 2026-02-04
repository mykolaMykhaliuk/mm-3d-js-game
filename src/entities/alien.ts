import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { IEntity } from '../entity-manager';
import { ALIEN_SIZE, ALIEN_HEALTH } from '../utils/constants';

/**
 * Alien entity - enemy that moves toward the player
 */
export class Alien implements IEntity {
  type: 'alien' = 'alien';
  mesh: Mesh;
  private speed: number;
  private targetPosition: Vector3;
  private health: number;
  private alive: boolean = true;

  constructor(scene: Scene, position: Vector3, speed: number, color: Color3) {
    this.speed = speed;
    this.targetPosition = Vector3.Zero(); // Will be updated each frame
    this.health = ALIEN_HEALTH;

    // Create alien mesh (sphere with slight distortion)
    this.mesh = MeshBuilder.CreateSphere(
      'alien',
      { diameter: ALIEN_SIZE * 2, segments: 12 },
      scene
    );
    this.mesh.position = position.clone();
    this.mesh.scaling.y = 0.8; // Slight distortion to make it look more alien

    // Create material with the provided color
    const material = new StandardMaterial('alienMat', scene);
    material.diffuseColor = color;
    material.specularColor = new Color3(0.2, 0.2, 0.2);
    this.mesh.material = material;
  }

  /**
   * Update alien movement toward target
   * @param deltaTime - Time since last frame in seconds
   */
  update(deltaTime: number): void {
    // Move toward target position
    const direction = this.targetPosition.subtract(this.mesh.position);
    const distance = direction.length();

    if (distance > 0.1) {
      const normalized = direction.normalize();
      const velocity = normalized.scale(this.speed * deltaTime);
      this.mesh.position.addInPlace(velocity);
    }
  }

  /**
   * Set the target position to move toward
   * @param target - Target position (usually player position)
   */
  setTarget(target: Vector3): void {
    this.targetPosition = target;
  }

  /**
   * Take damage
   * @param amount - Amount of damage to take
   */
  takeDamage(amount: number): void {
    this.health -= amount;
    if (this.health <= 0) {
      this.alive = false;
    }
  }

  /**
   * Get position
   */
  getPosition(): Vector3 {
    return this.mesh.position;
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
