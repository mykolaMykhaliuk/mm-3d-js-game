import { Scene } from '@babylonjs/core/scene';
import { ArcRotateCamera } from '@babylonjs/core/Cameras/arcRotateCamera';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { DirectionalLight } from '@babylonjs/core/Lights/directionalLight';
import { HemisphericLight } from '@babylonjs/core/Lights/hemisphericLight';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3, Color4 } from '@babylonjs/core/Maths/math.color';
import {
  CAMERA_ALPHA,
  CAMERA_BETA,
  CAMERA_RADIUS,
  ARENA_GROUND_SIZE,
} from './utils/constants';

/**
 * Sets up the scene with camera, lights, and ground plane
 * @param scene - The Babylon.js scene to configure
 * @returns The configured camera
 */
export function setupScene(scene: Scene): ArcRotateCamera {
  // Set background color (dark blue/purple sky)
  scene.clearColor = new Color4(0.1, 0.1, 0.2, 1.0);

  // Create and configure the camera
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

  // Attach camera to canvas (needed for pointer events)
  const canvas = scene.getEngine().getRenderingCanvas();
  if (canvas) {
    camera.attachControl(canvas, true);
  }

  // Main directional light (sun-like)
  const sunLight = new DirectionalLight('sun', new Vector3(-1, -2, -1), scene);
  sunLight.intensity = 0.8;

  // Ambient hemispheric light (fill)
  const ambientLight = new HemisphericLight('ambient', new Vector3(0, 1, 0), scene);
  ambientLight.intensity = 0.4;

  // Create ground plane
  const ground = MeshBuilder.CreateGround(
    'ground',
    { width: ARENA_GROUND_SIZE, height: ARENA_GROUND_SIZE },
    scene
  );

  // Ground material with grid pattern
  const groundMaterial = new StandardMaterial('groundMat', scene);
  groundMaterial.diffuseColor = new Color3(0.2, 0.3, 0.2);
  groundMaterial.specularColor = new Color3(0, 0, 0);
  ground.material = groundMaterial;

  return camera;
}
