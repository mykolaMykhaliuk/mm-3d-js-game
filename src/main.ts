import { Engine } from '@babylonjs/core/Engines/engine';
import { Scene } from '@babylonjs/core/scene';
import { setupScene } from './scene-setup';
import { Game } from './game';
import { debugLog, initDebugOverlay, forceShowOverlay } from './utils/debug-logger';
import { isMobile } from './utils/helpers';

const TAG = 'Main';

/**
 * Install global error handlers as early as possible so we catch
 * any uncaught exceptions or promise rejections and surface them
 * on the debug overlay (critical for mobile debugging).
 */
function installGlobalErrorHandlers(): void {
  window.addEventListener('error', (event) => {
    debugLog.error(TAG, `Uncaught error: ${event.message}`, event.error);
    debugLog.error(TAG, `  at ${event.filename}:${event.lineno}:${event.colno}`);
  });

  window.addEventListener('unhandledrejection', (event) => {
    debugLog.error(TAG, 'Unhandled promise rejection', event.reason);
  });

  debugLog.info(TAG, 'Global error handlers installed');
}

/**
 * Attempt to lock the screen orientation to landscape on mobile.
 * Uses the Screen Orientation API where available (most Android browsers).
 * Falls back gracefully — the CSS portrait overlay handles iOS/unsupported.
 */
function lockLandscapeOrientation(): void {
  if (!isMobile()) return;

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orientation = screen.orientation as any;
    if (orientation && typeof orientation.lock === 'function') {
      orientation.lock('landscape').then(() => {
        debugLog.info(TAG, 'Screen orientation locked to landscape');
      }).catch((err: Error) => {
        // Expected to fail on iOS and some browsers — CSS handles it
        debugLog.info(TAG, `Orientation lock not supported: ${err.message}`);
      });
    }
  } catch (_e) {
    debugLog.info(TAG, 'Screen Orientation API not available');
  }
}

/**
 * Application entry point
 * Initializes the Babylon.js engine and starts the game
 */
function main(): void {
  // Initialize debug overlay first (shows if ?debug=true in URL)
  initDebugOverlay();
  installGlobalErrorHandlers();

  debugLog.info(TAG, '=== Game startup begin ===');
  debugLog.info(TAG, `URL: ${window.location.href}`);
  debugLog.info(TAG, `User-Agent: ${navigator.userAgent}`);
  debugLog.info(
    TAG,
    `Screen: ${screen.width}x${screen.height}, DPR: ${window.devicePixelRatio}`
  );
  debugLog.info(
    TAG,
    `Window inner: ${window.innerWidth}x${window.innerHeight}`
  );

  // Attempt landscape lock on mobile
  lockLandscapeOrientation();

  // Step 1: Get the canvas element
  debugLog.info(TAG, 'Step 1: Looking for #renderCanvas...');
  const canvas = document.getElementById('renderCanvas') as HTMLCanvasElement;
  if (!canvas) {
    debugLog.error(TAG, 'Canvas element #renderCanvas not found in DOM!');
    forceShowOverlay();
    return;
  }
  debugLog.info(
    TAG,
    `Canvas found: ${canvas.width}x${canvas.height}, clientSize: ${canvas.clientWidth}x${canvas.clientHeight}`
  );

  // Step 2: Create the Babylon.js engine
  debugLog.info(TAG, 'Step 2: Creating Babylon.js Engine...');
  let engine: Engine;
  try {
    engine = new Engine(canvas, true, {
      preserveDrawingBuffer: true,
      stencil: true,
    });
    debugLog.info(TAG, `Engine created. WebGL version: ${engine.webGLVersion}`);
    debugLog.info(
      TAG,
      `Hardware scaling level: ${engine.getHardwareScalingLevel()}`
    );
  } catch (err) {
    debugLog.error(
      TAG,
      'Failed to create Babylon.js Engine — WebGL may not be supported on this device',
      err
    );
    return;
  }

  // Step 3: Create the scene
  debugLog.info(TAG, 'Step 3: Creating Scene...');
  let scene: Scene;
  try {
    scene = new Scene(engine);
    debugLog.info(TAG, 'Scene created successfully');
  } catch (err) {
    debugLog.error(TAG, 'Failed to create Scene', err);
    return;
  }

  // Step 4: Set up camera, lights, and ground
  debugLog.info(TAG, 'Step 4: Setting up scene (camera, lights, ground)...');
  let camera;
  try {
    camera = setupScene(scene);
    debugLog.info(TAG, 'Scene setup complete');
  } catch (err) {
    debugLog.error(TAG, 'Failed during scene setup', err);
    return;
  }

  // Step 5: Create the game instance
  debugLog.info(TAG, 'Step 5: Creating Game instance...');
  let game: Game;
  try {
    game = new Game(scene, camera);
    debugLog.info(TAG, 'Game instance created successfully');
  } catch (err) {
    debugLog.error(TAG, 'Failed to create Game instance', err);
    return;
  }

  // Handle window resize and orientation change
  const handleResize = () => {
    engine.resize();
  };
  window.addEventListener('resize', handleResize);
  window.addEventListener('orientationchange', () => {
    // Delay resize slightly to let the browser settle the new dimensions
    setTimeout(handleResize, 150);
  });
  debugLog.info(TAG, 'Window resize + orientationchange handlers registered');

  // Step 6: Start the render loop
  debugLog.info(TAG, 'Step 6: Starting render loop...');
  let frameCount = 0;
  try {
    engine.runRenderLoop(() => {
      const deltaTime = engine.getDeltaTime() / 1000; // Convert to seconds
      game.update(deltaTime);
      scene.render();

      frameCount++;
      // Log first few frames to confirm rendering is working
      if (frameCount === 1) {
        debugLog.info(TAG, 'First frame rendered');
      } else if (frameCount === 10) {
        debugLog.info(TAG, '10 frames rendered — render loop is stable');
      } else if (frameCount === 60) {
        debugLog.info(TAG, '60 frames rendered — game appears to be running normally');
      }
    });
    debugLog.info(TAG, 'Render loop started');
  } catch (err) {
    debugLog.error(TAG, 'Failed to start render loop', err);
    return;
  }

  debugLog.info(TAG, '=== Game startup complete ===');
}

// Start the application when the DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', main);
} else {
  main();
}
