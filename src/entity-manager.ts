import { Scene } from '@babylonjs/core/scene';

/**
 * Base interface for all game entities
 */
export interface IEntity {
  /** Entity type identifier */
  type: 'player' | 'alien' | 'projectile';
  /** Update entity state each frame */
  update(deltaTime: number): void;
  /** Dispose of the entity and clean up resources */
  dispose(): void;
  /** Check if entity should be removed */
  isAlive(): boolean;
}

/**
 * Manages the lifecycle of all game entities
 */
export class EntityManager {
  private entities: IEntity[] = [];

  constructor(_scene: Scene) {
    // Scene parameter kept for potential future use
  }

  /**
   * Add an entity to the manager
   * @param entity - The entity to add
   */
  add(entity: IEntity): void {
    this.entities.push(entity);
  }

  /**
   * Remove an entity from the manager
   * @param entity - The entity to remove
   */
  remove(entity: IEntity): void {
    const index = this.entities.indexOf(entity);
    if (index !== -1) {
      this.entities.splice(index, 1);
      entity.dispose();
    }
  }

  /**
   * Update all entities and remove dead ones
   * @param deltaTime - Time elapsed since last frame in seconds
   */
  update(deltaTime: number): void {
    // Update all entities
    for (const entity of this.entities) {
      entity.update(deltaTime);
    }

    // Remove dead entities
    this.entities = this.entities.filter((entity) => {
      if (!entity.isAlive()) {
        entity.dispose();
        return false;
      }
      return true;
    });
  }

  /**
   * Get all entities of a specific type
   * @param type - The entity type to filter
   * @returns Array of entities matching the type
   */
  getByType(type: 'player' | 'alien' | 'projectile'): IEntity[] {
    return this.entities.filter((entity) => entity.type === type);
  }

  /**
   * Get all entities
   * @returns Array of all entities
   */
  getAll(): IEntity[] {
    return this.entities;
  }

  /**
   * Clear all entities
   */
  clear(): void {
    for (const entity of this.entities) {
      entity.dispose();
    }
    this.entities = [];
  }

  /**
   * Get the total number of entities
   * @returns Entity count
   */
  getCount(): number {
    return this.entities.length;
  }
}
