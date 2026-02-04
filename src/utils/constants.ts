/**
 * Game constants - all tunable parameters in one place
 */

// Arena
export const ARENA_SIZE = 40; // Half-width of the square arena
export const ARENA_GROUND_SIZE = 100; // Visual ground plane size

// Player
export const PLAYER_SPEED = 8; // Units per second
export const PLAYER_HEALTH = 10;
export const PLAYER_SIZE = 1.5; // Box dimensions

// Projectile
export const PROJECTILE_SPEED = 30; // Units per second
export const PROJECTILE_SIZE = 0.3; // Sphere radius
export const PROJECTILE_LIFETIME = 2.0; // Seconds before auto-despawn
export const PROJECTILE_FIRE_RATE = 0.25; // Minimum seconds between shots

// Alien
export const ALIEN_BASE_SPEED = 3; // Units per second for wave 1
export const ALIEN_SPEED_INCREMENT = 0.5; // Speed increase per wave
export const ALIEN_SIZE = 1.0; // Sphere radius
export const ALIEN_HEALTH = 1; // Hits to destroy

// Spawning
export const SPAWN_RADIUS = 35; // Aliens spawn this far from center
export const WAVE_DELAY = 2.0; // Seconds between waves

// Wave configuration (aliens per wave, spawn interval)
export const WAVES = [
  { count: 5, interval: 1.5 },
  { count: 8, interval: 1.2 },
  { count: 12, interval: 1.0 },
  { count: 15, interval: 0.9 },
  { count: 20, interval: 0.8 },
];

// Collision
export const HIT_DISTANCE_PROJECTILE_ALIEN = 1.5; // Distance threshold
export const HIT_DISTANCE_ALIEN_PLAYER = 2.0;

// Camera
export const CAMERA_ALPHA = -Math.PI / 2;
export const CAMERA_BETA = Math.PI / 3; // ~60 degrees from vertical
export const CAMERA_RADIUS = 30;

// Scoring
export const POINTS_PER_ALIEN = 10;

// Visual effects
export const PARTICLE_COUNT = 20; // Particles per alien destruction
export const PARTICLE_LIFETIME = 0.3; // Seconds
