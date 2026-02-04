import { Scene } from '@babylonjs/core/scene';
import { AdvancedDynamicTexture } from '@babylonjs/gui/2D/advancedDynamicTexture';
import { TextBlock } from '@babylonjs/gui/2D/controls/textBlock';
import { Rectangle } from '@babylonjs/gui/2D/controls/rectangle';
import { Button } from '@babylonjs/gui/2D/controls/button';
import { Control } from '@babylonjs/gui/2D/controls/control';

/**
 * Manages all HUD and GUI elements
 */
export class HUDManager {
  private advancedTexture: AdvancedDynamicTexture;

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

  // Callbacks
  private onStartGame?: () => void;
  private onRestartGame?: () => void;

  constructor(_scene: Scene) {
    this.advancedTexture = AdvancedDynamicTexture.CreateFullscreenUI('UI');
    this.createHUD();
    this.createMenu();
    this.createGameOverScreen();
    this.createWinScreen();
  }

  /**
   * Create in-game HUD elements
   */
  private createHUD(): void {
    // Score text (top left)
    this.scoreText = new TextBlock('scoreText', 'Score: 0');
    this.scoreText.fontSize = 24;
    this.scoreText.color = 'white';
    this.scoreText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.scoreText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.scoreText.left = 20;
    this.scoreText.top = 20;
    this.advancedTexture.addControl(this.scoreText);

    // Health text (top left, below score)
    this.healthText = new TextBlock('healthText', 'Health: 10');
    this.healthText.fontSize = 24;
    this.healthText.color = 'white';
    this.healthText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_LEFT;
    this.healthText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.healthText.left = 20;
    this.healthText.top = 50;
    this.advancedTexture.addControl(this.healthText);

    // Wave text (top center)
    this.waveText = new TextBlock('waveText', 'Wave: 1 / 5');
    this.waveText.fontSize = 28;
    this.waveText.color = 'white';
    this.waveText.textHorizontalAlignment = Control.HORIZONTAL_ALIGNMENT_CENTER;
    this.waveText.textVerticalAlignment = Control.VERTICAL_ALIGNMENT_TOP;
    this.waveText.top = 20;
    this.advancedTexture.addControl(this.waveText);
  }

  /**
   * Create start menu
   */
  private createMenu(): void {
    // Container
    this.menuContainer = new Rectangle('menuContainer');
    this.menuContainer.width = 0.5;
    this.menuContainer.height = 0.4;
    this.menuContainer.thickness = 0;
    this.menuContainer.background = 'rgba(0, 0, 0, 0.7)';
    this.advancedTexture.addControl(this.menuContainer);

    // Title
    this.menuTitle = new TextBlock('menuTitle', 'ALIEN SHOOTER 3D');
    this.menuTitle.fontSize = 48;
    this.menuTitle.color = 'white';
    this.menuTitle.top = -60;
    this.menuContainer.addControl(this.menuTitle);

    // Start button
    this.menuButton = Button.CreateSimpleButton('startButton', 'TAP TO PLAY');
    this.menuButton.width = 0.5;
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
    // Container
    this.gameOverContainer = new Rectangle('gameOverContainer');
    this.gameOverContainer.width = 0.5;
    this.gameOverContainer.height = 0.5;
    this.gameOverContainer.thickness = 0;
    this.gameOverContainer.background = 'rgba(0, 0, 0, 0.8)';
    this.advancedTexture.addControl(this.gameOverContainer);

    // Title
    this.gameOverTitle = new TextBlock('gameOverTitle', 'GAME OVER');
    this.gameOverTitle.fontSize = 48;
    this.gameOverTitle.color = 'red';
    this.gameOverTitle.top = -80;
    this.gameOverContainer.addControl(this.gameOverTitle);

    // Score
    this.gameOverScore = new TextBlock('gameOverScore', 'Final Score: 0');
    this.gameOverScore.fontSize = 32;
    this.gameOverScore.color = 'white';
    this.gameOverScore.top = -20;
    this.gameOverContainer.addControl(this.gameOverScore);

    // Retry button
    this.gameOverButton = Button.CreateSimpleButton('retryButton', 'PLAY AGAIN');
    this.gameOverButton.width = 0.5;
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
    // Container
    this.winContainer = new Rectangle('winContainer');
    this.winContainer.width = 0.5;
    this.winContainer.height = 0.5;
    this.winContainer.thickness = 0;
    this.winContainer.background = 'rgba(0, 0, 0, 0.8)';
    this.advancedTexture.addControl(this.winContainer);

    // Title
    this.winTitle = new TextBlock('winTitle', 'YOU WIN!');
    this.winTitle.fontSize = 48;
    this.winTitle.color = 'gold';
    this.winTitle.top = -80;
    this.winContainer.addControl(this.winTitle);

    // Score
    this.winScore = new TextBlock('winScore', 'Final Score: 0');
    this.winScore.fontSize = 32;
    this.winScore.color = 'white';
    this.winScore.top = -20;
    this.winContainer.addControl(this.winScore);

    // Play again button
    this.winButton = Button.CreateSimpleButton('winButton', 'PLAY AGAIN');
    this.winButton.width = 0.5;
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
   * Show menu screen
   */
  showMenu(): void {
    this.menuContainer.isVisible = true;
    this.gameOverContainer.isVisible = false;
    this.winContainer.isVisible = false;
    this.hideHUD();
  }

  /**
   * Show game over screen
   */
  showGameOver(finalScore: number): void {
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
