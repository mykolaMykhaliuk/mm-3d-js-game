import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { Color4 } from '@babylonjs/core/Maths/math.color';
import {
  CAMERA_ALPHA,
  CAMERA_BETA,
  CAMERA_RADIUS,
} from './utils/constants';
import { debugLog } from './utils/debug-logger';
import { createTownEnvironment } from './environment/town';

const TAG = 'SceneSetup';

/**
 * Sets up the scene with camera, lights, and ground plane
 * @param scene - The Babylon.js scene to configure
 * @returns The configured camera
 */
export function setupScene(scene: Scene): ArcRotateCamera {
  debugLog.info(TAG, 'Setting clear color...');
  // Set background color (dark blue/purple sky)
  scene.clearColor = new Color4(0.1, 0.1, 0.2, 1.0);

  // Create and configure the camera
  debugLog.info(TAG, `Creating ArcRotateCamera (alpha=${CAMERA_ALPHA}, beta=${CAMERA_BETA}, radius=${CAMERA_RADIUS})...`);
  const camera = new ArcRotateCamera(
    'camera',
    CAMERA_ALPHA,
    CAMERA_BETA,
    CAMERA_RADIUS,
    Vector3.Zero(),
    scene
  );

  // Lock camera to prevent user rotation
  camera.lowerRadiusLimit = CAMERA_RADIUS;
  camera.upperRadiusLimit = CAMERA_RADIUS;
  camera.lowerAlphaLimit = CAMERA_ALPHA;
  camera.upperAlphaLimit = CAMERA_ALPHA;
  camera.lowerBetaLimit = CAMERA_BETA;
  camera.upperBetaLimit = CAMERA_BETA;
  debugLog.info(TAG, 'Camera limits locked');

  // Attach camera to canvas (needed for pointer events)
  const canvas = scene.getEngine().getRenderingCanvas();
  if (canvas) {
    camera.attachControl(canvas, true);
    debugLog.info(TAG, 'Camera attached to canvas');
  } else {
    debugLog.warn(TAG, 'No rendering canvas found — camera not attached');
  }

  // Main directional light (sun-like)
  debugLog.info(TAG, 'Creating lights...');
  const sunLight = new DirectionalLight('sun', new Vector3(-1, -2, -1), scene);
  sunLight.intensity = 0.8;

  // Ambient hemispheric light (fill)
  const ambientLight = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.4;

  // Create town environment (ground, roads, houses, cars, trees)
  debugLog.info(TAG, 'Creating town environment...');
  createTownEnvironment(scene);

  debugLog.info(TAG, 'Scene setup complete');
  return camera;
}
