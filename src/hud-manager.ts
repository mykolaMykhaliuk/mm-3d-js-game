import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Ellipse } from '@babylonjs/gui/2D/controls/ellipse';
import { Control } from '@babylonjs/gui/2D/controls/control';
import { InputManager } from './input-manager';
import { isMobile } from './utils/helpers';
import { debugLog } from './utils/debug-logger';

const TAG = 'HUDManager';

/**
 * Manages all HUD and GUI elements including:
 * - In-game HUD (score, health, wave)
 * - Virtual joystick overlay (mobile)
 * - Muzzle flash feedback
 * - Menu / Game-over / Win screens
 */
export class HUDManager {
  private advancedTexture: AdvancedDynamicTexture;
  private mobile: boolean;

  // HUD elements (in-game)
  private scoreText!: TextBlock;
  private healthText!: TextBlock;
  private waveText!: TextBlock;

  // Menu elements
  private menuContainer!: Rectangle;
  private menuTitle!: TextBlock;
  private menuButton!: Button;

  // Game over elements
  private gameOverContainer!: Rectangle;
  private gameOverTitle!: TextBlock;
  private gameOverScore!: TextBlock;
  private gameOverButton!: Button;

  // Win elements
  private winContainer!: Rectangle;
  private winTitle!: TextBlock;
  private winScore!: TextBlock;
  private winButton!: Button;

  // Virtual joystick visual elements (mobile only)
  private joystickBase: Ellipse | null = null;
  private joystickKnob: Ellipse | null = null;

  // Muzzle flash overlay
  private muzzleFlash!: Rectangle;

  // Callbacks
  private onStartGame?: () => void;
  private onRestartGame?: () => void;

  constructor(_scene: Scene) {
    this.mobile = isMobile();

    debugLog.info(TAG, 'Creating AdvancedDynamicTexture (fullscreen UI)...');
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');

    // On mobile, make the GUI texture ideal width/height match the actual resolution
    // so pixel-based positioning for joystick is accurate
    if (this.mobile) {
      this.advancedTexture.idealWidth = 0;
      this.advancedTexture.idealHeight = 0;
      this.advancedTexture.useSmallestIdeal = false;
      this.advancedTexture.renderAtIdealSize = false;
    }

    debugLog.info(TAG, 'Creating HUD elements...');
    this.createHUD();
    debugLog.info(TAG, 'Creating menu screen...');
    this.createMenu();
    debugLog.info(TAG, 'Creating game-over screen...');
    this.createGameOverScreen();
    debugLog.info(TAG, 'Creating win screen...');
    this.createWinScreen();

    if (this.mobile) {
      debugLog.info(TAG, 'Creating mobile joystick visuals...');
      this.createJoystickVisuals();
    }

    debugLog.info(TAG, 'Creating muzzle flash overlay...');
    this.createMuzzleFlash();

    debugLog.info(TAG, 'HUDManager construction complete');
  }

  /**
   * Create in-game HUD elements.
   * On mobile landscape, elements are positioned to avoid notch/safe-area edges
   * and the joystick zone in the bottom-left.
   */
  private createHUD(): void {
    // Score text (top-right on mobile to avoid joystick zone, top-left on desktop)
    this.scoreText = new TextBlock('scoreText', 'Score: 0');
    this.scoreText.fontSize = this.mobile ? 20 : 24;
    this.scoreText.color = 'white';
    this.scoreText.outlineColor = 'black';
    this.scoreText.outlineWidth = 2;
    this.scoreText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    if (this.mobile) {
      this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.scoreText.left = -20;
      this.scoreText.top = 12;
    } else {
      this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      this.scoreText.left = 20;
      this.scoreText.top = 20;
    }
    this.advancedTexture.addControl(this.scoreText);

    // Health text (below score)
    this.healthText = new TextBlock('healthText', 'Health: 10');
    this.healthText.fontSize = this.mobile ? 20 : 24;
    this.healthText.color = 'white';
    this.healthText.outlineColor = 'black';
    this.healthText.outlineWidth = 2;
    this.healthText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;

    if (this.mobile) {
      this.healthText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_RIGHT;
      this.healthText.left = -20;
      this.healthText.top = 36;
    } else {
      this.healthText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
      this.healthText.left = 20;
      this.healthText.top = 50;
    }
    this.advancedTexture.addControl(this.healthText);

    // Wave text (top center)
    this.waveText = new TextBlock('waveText', 'Wave: 1 / 5');
    this.waveText.fontSize = this.mobile ? 22 : 28;
    this.waveText.color = 'white';
    this.waveText.outlineColor = 'black';
    this.waveText.outlineWidth = 2;
    this.waveText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.waveText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.waveText.top = this.mobile ? 12 : 20;
    this.advancedTexture.addControl(this.waveText);
  }

  /**
   * Create visual joystick elements (mobile only).
   * These are GUI Ellipse controls that get repositioned each frame
   * to match the touch-tracked joystick state from InputManager.
   */
  private createJoystickVisuals(): void {
    // Outer ring (base)
    this.joystickBase = new Ellipse('joystickBase');
    this.joystickBase.width = '140px';
    this.joystickBase.height = '140px';
    this.joystickBase.thickness = 3;
    this.joystickBase.color = 'rgba(255, 255, 255, 0.4)';
    this.joystickBase.background = 'rgba(255, 255, 255, 0.08)';
    this.joystickBase.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.joystickBase.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.joystickBase.isVisible = false;
    this.joystickBase.isHitTestVisible = false;
    this.advancedTexture.addControl(this.joystickBase);

    // Inner knob
    this.joystickKnob = new Ellipse('joystickKnob');
    this.joystickKnob.width = '56px';
    this.joystickKnob.height = '56px';
    this.joystickKnob.thickness = 2;
    this.joystickKnob.color = 'rgba(255, 255, 255, 0.7)';
    this.joystickKnob.background = 'rgba(255, 255, 255, 0.25)';
    this.joystickKnob.horizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.joystickKnob.verticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.joystickKnob.isVisible = false;
    this.joystickKnob.isHitTestVisible = false;
    this.advancedTexture.addControl(this.joystickKnob);
  }

  /**
   * Create the muzzle flash overlay - a brief white-tinted rectangle
   * that flashes on the screen border when shooting.
   */
  private createMuzzleFlash(): void {
    this.muzzleFlash = new Rectangle('muzzleFlash');
    this.muzzleFlash.width = 1;
    this.muzzleFlash.height = 1;
    this.muzzleFlash.thickness = 0;
    this.muzzleFlash.background = 'rgba(255, 255, 200, 0.12)';
    this.muzzleFlash.isVisible = false;
    this.muzzleFlash.isHitTestVisible = false;
    this.advancedTexture.addControl(this.muzzleFlash);
  }

  /**
   * Create start menu
   */
  private createMenu(): void {
    this.menuContainer = new Rectangle('menuContainer');
    this.menuContainer.width = this.mobile ? 0.7 : 0.5;
    this.menuContainer.height = this.mobile ? 0.6 : 0.4;
    this.menuContainer.thickness = 0;
    this.menuContainer.background = 'rgba(0, 0, 0, 0.7)';
    this.advancedTexture.addControl(this.menuContainer);

    this.menuTitle = new TextBlock('menuTitle', 'ALIEN SHOOTER 3D');
    this.menuTitle.fontSize = this.mobile ? 32 : 48;
    this.menuTitle.color = 'white';
    this.menuTitle.top = -60;
    this.menuContainer.addControl(this.menuTitle);

    this.menuButton = Button.CreateSimpleButton('startButton', 'TAP TO PLAY');
    this.menuButton.width = this.mobile ? 0.6 : 0.5;
    this.menuButton.height = '60px';
    this.menuButton.color = 'white';
    this.menuButton.background = 'green';
    this.menuButton.fontSize = 24;
    this.menuButton.top = 20;
    this.menuButton.onPointerClickObservable.add(() => {
      if (this.onStartGame) {
        this.onStartGame();
      }
    });
    this.menuContainer.addControl(this.menuButton);
  }

  /**
   * Create game over screen
   */
  private createGameOverScreen(): void {
    this.gameOverContainer = new Rectangle('gameOverContainer');
    this.gameOverContainer.width = this.mobile ? 0.7 : 0.5;
    this.gameOverContainer.height = this.mobile ? 0.7 : 0.5;
    this.gameOverContainer.thickness = 0;
    this.gameOverContainer.background = 'rgba(0, 0, 0, 0.8)';
    this.advancedTexture.addControl(this.gameOverContainer);

    this.gameOverTitle = new TextBlock('gameOverTitle', 'GAME OVER');
    this.gameOverTitle.fontSize = this.mobile ? 36 : 48;
    this.gameOverTitle.color = 'red';
    this.gameOverTitle.top = -80;
    this.gameOverContainer.addControl(this.gameOverTitle);

    this.gameOverScore = new TextBlock('gameOverScore', 'Final Score: 0');
    this.gameOverScore.fontSize = this.mobile ? 26 : 32;
    this.gameOverScore.color = 'white';
    this.gameOverScore.top = -20;
    this.gameOverContainer.addControl(this.gameOverScore);

    this.gameOverButton = Button.CreateSimpleButton('retryButton', 'PLAY AGAIN');
    this.gameOverButton.width = this.mobile ? 0.6 : 0.5;
    this.gameOverButton.height = '60px';
    this.gameOverButton.color = 'white';
    this.gameOverButton.background = 'green';
    this.gameOverButton.fontSize = 24;
    this.gameOverButton.top = 60;
    this.gameOverButton.onPointerClickObservable.add(() => {
      if (this.onRestartGame) {
        this.onRestartGame();
      }
    });
    this.gameOverContainer.addControl(this.gameOverButton);
  }

  /**
   * Create win screen
   */
  private createWinScreen(): void {
    this.winContainer = new Rectangle('winContainer');
    this.winContainer.width = this.mobile ? 0.7 : 0.5;
    this.winContainer.height = this.mobile ? 0.7 : 0.5;
    this.winContainer.thickness = 0;
    this.winContainer.background = 'rgba(0, 0, 0, 0.8)';
    this.advancedTexture.addControl(this.winContainer);

    this.winTitle = new TextBlock('winTitle', 'YOU WIN!');
    this.winTitle.fontSize = this.mobile ? 36 : 48;
    this.winTitle.color = 'gold';
    this.winTitle.top = -80;
    this.winContainer.addControl(this.winTitle);

    this.winScore = new TextBlock('winScore', 'Final Score: 0');
    this.winScore.fontSize = this.mobile ? 26 : 32;
    this.winScore.color = 'white';
    this.winScore.top = -20;
    this.winContainer.addControl(this.winScore);

    this.winButton = Button.CreateSimpleButton('winButton', 'PLAY AGAIN');
    this.winButton.width = this.mobile ? 0.6 : 0.5;
    this.winButton.height = '60px';
    this.winButton.color = 'white';
    this.winButton.background = 'green';
    this.winButton.fontSize = 24;
    this.winButton.top = 60;
    this.winButton.onPointerClickObservable.add(() => {
      if (this.onRestartGame) {
        this.onRestartGame();
      }
    });
    this.winContainer.addControl(this.winButton);
  }

  /**
   * Update HUD with current game state
   */
  updateHUD(score: number, health: number, wave: number, totalWaves: number): void {
    this.scoreText.text = `Score: ${score}`;
    this.healthText.text = `Health: ${health}`;
    this.waveText.text = `Wave: ${wave} / ${totalWaves}`;
  }

  /**
   * Update joystick visuals and muzzle flash from InputManager state.
   * Called each frame by Game.
   */
  updateTouchVisuals(inputManager: InputManager): void {
    // Update joystick visuals
    if (this.joystickBase && this.joystickKnob) {
      if (inputManager.joystickVisible) {
        this.joystickBase.isVisible = true;
        this.joystickKnob.isVisible = true;

        // Convert screen pixel coordinates to GUI left/top positioning.
        // Since we use HORIZONTAL_ALIGNMENT_LEFT and VERTICAL_ALIGNMENT_TOP,
        // left/top are offsets from the top-left corner of the texture.
        const texW = this.advancedTexture.getSize().width;
        const texH = this.advancedTexture.getSize().height;

        const canvas = this.advancedTexture.getScene()?.getEngine().getRenderingCanvas();
        if (canvas) {
          const rect = canvas.getBoundingClientRect();
          // Scale from CSS pixels to GUI texture pixels
          const scaleX = texW / rect.width;
          const scaleY = texH / rect.height;

          const baseX = inputManager.joystickBaseX * scaleX;
          const baseY = inputManager.joystickBaseY * scaleY;
          const knobX = inputManager.joystickKnobX * scaleX;
          const knobY = inputManager.joystickKnobY * scaleY;

          // Position base centered at touch origin
          this.joystickBase.left = baseX - texW / 2;
          this.joystickBase.top = baseY - texH / 2;

          // Position knob centered at current knob position
          this.joystickKnob.left = knobX - texW / 2;
          this.joystickKnob.top = knobY - texH / 2;
        }
      } else {
        this.joystickBase.isVisible = false;
        this.joystickKnob.isVisible = false;
      }
    }

    // Update muzzle flash
    this.muzzleFlash.isVisible = inputManager.shootFlashTimer > 0;
  }

  /**
   * Show menu screen
   */
  showMenu(): void {
    debugLog.info(TAG, 'showMenu');
    this.menuContainer.isVisible = true;
    this.gameOverContainer.isVisible = false;
    this.winContainer.isVisible = false;
    this.hideHUD();
  }

  /**
   * Show game over screen
   */
  showGameOver(finalScore: number): void {
    debugLog.info(TAG, `showGameOver (score: ${finalScore})`);
    this.gameOverScore.text = `Final Score: ${finalScore}`;
    this.gameOverContainer.isVisible = true;
    this.menuContainer.isVisible = false;
    this.winContainer.isVisible = false;
    this.hideHUD();
  }

  /**
   * Show win screen
   */
  showWin(finalScore: number): void {
    debugLog.info(TAG, `showWin (score: ${finalScore})`);
    this.winScore.text = `Final Score: ${finalScore}`;
    this.winContainer.isVisible = true;
    this.menuContainer.isVisible = false;
    this.gameOverContainer.isVisible = false;
    this.hideHUD();
  }

  /**
   * Show in-game HUD
   */
  showHUD(): void {
    debugLog.info(TAG, 'showHUD');
    this.scoreText.isVisible = true;
    this.healthText.isVisible = true;
    this.waveText.isVisible = true;
    this.menuContainer.isVisible = false;
    this.gameOverContainer.isVisible = false;
    this.winContainer.isVisible = false;
  }

  /**
   * Hide in-game HUD
   */
  hideHUD(): void {
    this.scoreText.isVisible = false;
    this.healthText.isVisible = false;
    this.waveText.isVisible = false;
    this.muzzleFlash.isVisible = false;
    if (this.joystickBase) this.joystickBase.isVisible = false;
    if (this.joystickKnob) this.joystickKnob.isVisible = false;
  }

  /**
   * Set start game callback
   */
  setOnStartGame(callback: () => void): void {
    this.onStartGame = callback;
  }

  /**
   * Set restart game callback
   */
  setOnRestartGame(callback: () => void): void {
    this.onRestartGame = callback;
  }
}
