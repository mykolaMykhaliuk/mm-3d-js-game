import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { EntityManager } from './entity-manager';
import { InputManager } from './input-manager';
import { HUDManager } from './hud-manager';
import { Player } from './entities/player';
import { Projectile } from './entities/projectile';
import { Alien } from './entities/alien';
import { CollisionSystem } from './systems/collision';
import { ScoringSystem } from './systems/scoring';
import { SpawnerSystem } from './systems/spawner';
import { PROJECTILE_FIRE_RATE } from './utils/constants';
import { debugLog } from './utils/debug-logger';

const TAG = 'Game';

/**
 * Game states
 */
enum GameState {
  MENU,
  PLAYING,
  GAME_OVER,
  WIN,
}

/**
 * Main game class - orchestrates all systems and manages game state
 */
export class Game {
  private scene: Scene;
  private camera: ArcRotateCamera;
  private state: GameState = GameState.MENU;

  // Managers and systems
  private entityManager: EntityManager;
  private inputManager: InputManager;
  private hudManager: HUDManager;
  private collisionSystem: CollisionSystem;
  private scoringSystem: ScoringSystem;
  private spawnerSystem: SpawnerSystem;

  // Player reference
  private player: Player | null = null;

  // Game time
  private gameTime: number = 0;

  // Wave management
  private waitingForNextWave: boolean = false;

  constructor(scene: Scene, camera: ArcRotateCamera) {
    debugLog.info(TAG, 'Constructor: begin');
    this.scene = scene;
    this.camera = camera;

    // Initialize managers and systems
    debugLog.info(TAG, 'Creating EntityManager...');
    this.entityManager = new EntityManager(scene);
    debugLog.info(TAG, 'Creating InputManager...');
    this.inputManager = new InputManager(scene);
    debugLog.info(TAG, 'Creating HUDManager...');
    this.hudManager = new HUDManager(scene);
    debugLog.info(TAG, 'Creating CollisionSystem...');
    this.collisionSystem = new CollisionSystem();
    debugLog.info(TAG, 'Creating ScoringSystem...');
    this.scoringSystem = new ScoringSystem();
    debugLog.info(TAG, 'Creating SpawnerSystem...');
    this.spawnerSystem = new SpawnerSystem(scene, this.entityManager);

    // Set up HUD callbacks
    this.hudManager.setOnStartGame(() => this.startGame());
    this.hudManager.setOnRestartGame(() => this.restartGame());
    debugLog.info(TAG, 'HUD callbacks registered');

    // Show initial menu
    this.hudManager.showMenu();
    debugLog.info(TAG, 'Constructor: complete — menu shown');
  }

  /**
   * Start a new game
   */
  private startGame(): void {
    debugLog.info(TAG, 'startGame: transitioning to PLAYING state');
    this.state = GameState.PLAYING;
    this.gameTime = 0;
    this.waitingForNextWave = false;

    // Reset systems
    this.entityManager.clear();
    this.scoringSystem.reset();
    this.spawnerSystem.reset();

    // Create player
    this.player = new Player(this.scene);
    this.entityManager.add(this.player);
    debugLog.info(TAG, 'Player created and added to EntityManager');

    // Start first wave
    this.spawnerSystem.startWave(0);
    debugLog.info(TAG, 'First wave started');

    // Show HUD
    this.hudManager.showHUD();
    this.updateHUD();
  }

  /**
   * Restart the game after game over or win
   */
  private restartGame(): void {
    this.startGame();
  }

  /**
   * Main update loop called every frame
   * @param deltaTime - Time since last frame in seconds
   */
  update(deltaTime: number): void {
    // Update input state (deltaTime needed for shoot flash decay)
    this.inputManager.update(deltaTime);

    // Update touch visuals (joystick + muzzle flash) every frame
    this.hudManager.updateTouchVisuals(this.inputManager);

    // Update based on current state
    switch (this.state) {
      case GameState.MENU:
        // Nothing to update in menu
        break;

      case GameState.PLAYING:
        this.updatePlaying(deltaTime);
        break;

      case GameState.GAME_OVER:
      case GameState.WIN:
        // Nothing to update after game ends
        break;
    }
  }

  /**
   * Update game logic during PLAYING state
   * @param deltaTime - Time since last frame in seconds
   */
  private updatePlaying(deltaTime: number): void {
    if (!this.player) return;

    this.gameTime += deltaTime;

    // Update input-based player movement
    const inputState = this.inputManager.getState();
    this.player.updateMovement(deltaTime, inputState.movement);

    // Rotate the character to face the aim direction
    this.player.faceTarget(inputState.aimPoint);

    // Handle shooting — continuous auto-fire while touch/click held
    if (inputState.shooting && this.player.canFire(this.gameTime, PROJECTILE_FIRE_RATE)) {
      this.fireProjectile(inputState.aimPoint);
      this.player.recordFire(this.gameTime);
      this.inputManager.triggerShootFlash();
    }

    // Update camera to follow player smoothly
    const playerPos = this.player.getPosition();
    this.camera.target = this.camera.target.add(
      playerPos.subtract(this.camera.target).scale(deltaTime * 2)
    );

    // Update spawner
    this.spawnerSystem.update(deltaTime);

    // Update all aliens to target player
    const aliens = this.entityManager.getByType('alien') as Alien[];
    for (const alien of aliens) {
      alien.setTarget(playerPos);
    }

    // Update all entities
    this.entityManager.update(deltaTime);

    // Check collisions
    const projectiles = this.entityManager.getByType('projectile') as Projectile[];
    const collisionResult = this.collisionSystem.checkCollisions(projectiles, aliens, this.player);

    // Handle projectile-alien collisions
    for (const hit of collisionResult.projectileHits) {
      hit.projectile.kill();
      hit.alien.takeDamage(1);
      if (!hit.alien.isAlive()) {
        this.scoringSystem.addAlienKillPoints();
      }
    }

    // Handle alien-player collisions
    for (const alien of collisionResult.alienPlayerHits) {
      alien.takeDamage(1);
      this.player.takeDamage(1);
    }

    // Update HUD
    this.updateHUD();

    // Check win/lose conditions
    if (!this.player.isAlive()) {
      this.gameOver();
      return;
    }

    // Check wave completion and progression
    if (!this.waitingForNextWave && this.spawnerSystem.isWaveComplete()) {
      this.waitingForNextWave = true;
    }

    if (this.waitingForNextWave) {
      if (this.spawnerSystem.updateWaveDelay(deltaTime)) {
        this.waitingForNextWave = false;
        this.scoringSystem.nextWave();

        if (this.scoringSystem.isAllWavesComplete()) {
          this.winGame();
        } else {
          this.spawnerSystem.startWave(this.scoringSystem.getCurrentWave());
        }
      }
    }
  }

  /**
   * Fire a projectile toward the aim point
   * @param aimPoint - World position to aim at
   */
  private fireProjectile(aimPoint: Vector3): void {
    if (!this.player) return;

    const playerPos = this.player.getPosition();
    const direction = aimPoint.subtract(playerPos).normalize();

    // Spawn projectile at chest/hand height of the explorer character
    const spawnPos = playerPos.add(new Vector3(0, 1.0, 0));
    const projectile = new Projectile(this.scene, spawnPos, direction);
    this.entityManager.add(projectile);
  }

  /**
   * Update HUD with current game state
   */
  private updateHUD(): void {
    if (!this.player) return;

    this.hudManager.updateHUD(
      this.scoringSystem.getScore(),
      this.player.getHealth(),
      this.scoringSystem.getCurrentWaveDisplay(),
      this.scoringSystem.getTotalWaves()
    );
  }

  /**
   * Handle game over
   */
  private gameOver(): void {
    debugLog.info(TAG, `Game over — final score: ${this.scoringSystem.getScore()}`);
    this.state = GameState.GAME_OVER;
    this.hudManager.showGameOver(this.scoringSystem.getScore());
  }

  /**
   * Handle win condition
   */
  private winGame(): void {
    debugLog.info(TAG, `Player wins — final score: ${this.scoringSystem.getScore()}`);
    this.state = GameState.WIN;
    this.hudManager.showWin(this.scoringSystem.getScore());
  }
}
