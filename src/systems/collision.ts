import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { Player } from '../entities/player';
import { Alien } from '../entities/alien';
import { Projectile } from '../entities/projectile';
import { HIT_DISTANCE_PROJECTILE_ALIEN, HIT_DISTANCE_ALIEN_PLAYER } from '../utils/constants';

/**
 * Collision detection result
 */
export interface CollisionResult {
  projectileHits: Array<{ projectile: Projectile; alien: Alien }>;
  alienPlayerHits: Alien[];
}

/**
 * Performs collision detection between game entities
 */
export class CollisionSystem {
  /**
   * Check all collisions between projectiles, aliens, and player
   * @param projectiles - Array of active projectiles
   * @param aliens - Array of active aliens
   * @param player - The player entity
   * @returns Collision results
   */
  checkCollisions(
    projectiles: Projectile[],
    aliens: Alien[],
    player: Player
  ): CollisionResult {
    const result: CollisionResult = {
      projectileHits: [],
      alienPlayerHits: [],
    };

    // Check projectile vs alien collisions
    for (const projectile of projectiles) {
      if (!projectile.isAlive()) continue;

      const projectilePos = projectile.getPosition();

      for (const alien of aliens) {
        if (!alien.isAlive()) continue;

        const alienPos = alien.getPosition();
        const distance = Vector3.Distance(projectilePos, alienPos);

        if (distance < HIT_DISTANCE_PROJECTILE_ALIEN) {
          result.projectileHits.push({ projectile, alien });
          break; // Projectile can only hit one alien
        }
      }
    }

    // Check alien vs player collisions
    const playerPos = player.getPosition();

    for (const alien of aliens) {
      if (!alien.isAlive()) continue;

      const alienPos = alien.getPosition();
      const distance = Vector3.Distance(playerPos, alienPos);

      if (distance < HIT_DISTANCE_ALIEN_PLAYER) {
        result.alienPlayerHits.push(alien);
      }
    }

    return result;
  }
}
