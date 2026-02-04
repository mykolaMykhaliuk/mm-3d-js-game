import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { setupScene } from './scene-setup';
import { Game } from './game';

// Register service worker for better performance (optional)
// import '@babylonjs/core/Loading/loadingScreen';

/**
 * Application entry point
 * Initializes the Babylon.js engine and starts the game
 */
function main(): void {
  // Get the canvas element
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    throw new Error('Canvas element not found');
  }

  // Create the Babylon.js engine
  const engine = new Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
  });

  // Create the scene
  const scene = new Scene(engine);

  // Set up camera, lights, and ground
  const camera = setupScene(scene);

  // Create the game instance
  const game = new Game(scene, camera);

  // Handle window resize
  window.addEventListener('resize', () => {
    engine.resize();
  });

  // Start the render loop
  engine.runRenderLoop(() => {
    const deltaTime = engine.getDeltaTime() / 1000; // Convert to seconds
    game.update(deltaTime);
    scene.render();
  });
}

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
