import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { IEntity } from '../entity-manager';
import { PROJECTILE_SPEED, PROJECTILE_SIZE, PROJECTILE_LIFETIME, ARENA_SIZE } from '../utils/constants';

/**
 * Projectile entity - fired by the player
 */
export class Projectile implements IEntity {
  type: 'projectile' = 'projectile';
  mesh: Mesh;
  private direction: Vector3;
  private lifetime: number = 0;
  private alive: boolean = true;

  constructor(scene: Scene, position: Vector3, direction: Vector3) {
    this.direction = direction.normalize();

    // Create projectile mesh (small sphere)
    this.mesh = MeshBuilder.CreateSphere(
      'projectile',
      { diameter: PROJECTILE_SIZE * 2, segments: 8 },
      scene
    );
    this.mesh.position = position.clone();

    // Create glowing material
    const material = new StandardMaterial('projectileMat', scene);
    material.diffuseColor = new Color3(1.0, 1.0, 0.2); // Bright yellow
    material.emissiveColor = new Color3(1.0, 1.0, 0.2); // Self-illuminated
    material.specularColor = new Color3(0, 0, 0);
    this.mesh.material = material;
  }

  /**
   * Update projectile position and check lifetime
   * @param deltaTime - Time since last frame in seconds
   */
  update(deltaTime: number): void {
    // Move in direction
    const velocity = this.direction.scale(PROJECTILE_SPEED * deltaTime);
    this.mesh.position.addInPlace(velocity);

    // Update lifetime
    this.lifetime += deltaTime;

    // Check if projectile should be removed
    if (this.lifetime > PROJECTILE_LIFETIME) {
      this.alive = false;
    }

    // Check if projectile left arena bounds
    if (
      Math.abs(this.mesh.position.x) > ARENA_SIZE + 10 ||
      Math.abs(this.mesh.position.z) > ARENA_SIZE + 10
    ) {
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
   * Mark projectile as dead (e.g., after hitting something)
   */
  kill(): void {
    this.alive = false;
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
