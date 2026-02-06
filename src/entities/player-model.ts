import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';

/**
 * Color palette for the explorer character.
 *
 * Warm browns and tans contrast against the cool dark-green ground,
 * keeping the player readable at the game's ~60° top-down camera angle.
 */
const COLORS = {
  hat: new Color3(0.45, 0.28, 0.12),
  hatBand: new Color3(0.28, 0.16, 0.07),
  skin: new Color3(0.85, 0.65, 0.45),
  jacket: new Color3(0.50, 0.28, 0.14),
  shirt: new Color3(0.90, 0.84, 0.70),
  trousers: new Color3(0.64, 0.54, 0.37),
  belt: new Color3(0.24, 0.14, 0.07),
  boots: new Color3(0.28, 0.17, 0.09),
  gloves: new Color3(0.52, 0.35, 0.20),
  satchel: new Color3(0.70, 0.54, 0.34),
  buckle: new Color3(0.78, 0.68, 0.32),
};

/** Shared low segments for mobile-friendly meshes. */
const LOW_SEG = 10;
const MED_SEG = 14;

function mat(name: string, color: Color3, scene: Scene, specular?: Color3): StandardMaterial {
  const m = new StandardMaterial(name, scene);
  m.diffuseColor = color;
  m.specularColor = specular ?? new Color3(0.12, 0.12, 0.12);
  return m;
}

/**
 * Build the explorer player character from Babylon.js primitives.
 *
 * Returns an invisible root Mesh at ground level (y = 0). All visible
 * body parts are parented to it, so moving / rotating the root moves
 * the entire character. The model faces +Z by default.
 *
 * Design notes
 * ────────────
 * Indiana-Jones-inspired adventurer: wide fedora, leather jacket over
 * a light shirt, khaki trousers, boots, gloves, belt with holster,
 * and a cross-body satchel. Proportions are slightly stylized for
 * game readability. The wide hat brim is the dominant visual element
 * from the top-down camera, providing a clear silhouette.
 *
 * Poly budget: ~400 tris total (mobile-safe).
 */
export function buildPlayerModel(scene: Scene): Mesh {
  // Invisible root at ground level – position / collision anchor
  const root = MeshBuilder.CreateBox('playerRoot', { size: 0.01 }, scene);
  root.isVisible = false;

  // ── materials (reused across parts) ──────────────────────────
  const hatMat = mat('pm_hat', COLORS.hat, scene);
  const hatBandMat = mat('pm_hatBand', COLORS.hatBand, scene);
  const skinMat = mat('pm_skin', COLORS.skin, scene, new Color3(0.06, 0.06, 0.06));
  const jacketMat = mat('pm_jacket', COLORS.jacket, scene, new Color3(0.06, 0.04, 0.03));
  const shirtMat = mat('pm_shirt', COLORS.shirt, scene);
  const trousersMat = mat('pm_trousers', COLORS.trousers, scene);
  const beltMat = mat('pm_belt', COLORS.belt, scene);
  const bootsMat = mat('pm_boots', COLORS.boots, scene, new Color3(0.04, 0.04, 0.04));
  const glovesMat = mat('pm_gloves', COLORS.gloves, scene);
  const satchelMat = mat('pm_satchel', COLORS.satchel, scene);
  const buckleMat = mat('pm_buckle', COLORS.buckle, scene, new Color3(0.35, 0.30, 0.10));

  // Helper: create, position, assign material, parent to root.
  function part(
    _name: string,
    mesh: Mesh,
    pos: Vector3,
    material: StandardMaterial,
    rotation?: Vector3
  ): Mesh {
    mesh.position = pos;
    mesh.material = material;
    mesh.parent = root;
    if (rotation) mesh.rotation = rotation;
    return mesh;
  }

  // ── BOOTS ────────────────────────────────────────────────────
  part(
    'leftBoot',
    MeshBuilder.CreateBox('pm_lBoot', { width: 0.28, height: 0.20, depth: 0.36 }, scene),
    new Vector3(-0.17, 0.10, 0.03),
    bootsMat
  );
  part(
    'rightBoot',
    MeshBuilder.CreateBox('pm_rBoot', { width: 0.28, height: 0.20, depth: 0.36 }, scene),
    new Vector3(0.17, 0.10, 0.03),
    bootsMat
  );

  // ── LEGS / TROUSERS ─────────────────────────────────────────
  part(
    'leftLeg',
    MeshBuilder.CreateBox('pm_lLeg', { width: 0.25, height: 0.52, depth: 0.26 }, scene),
    new Vector3(-0.16, 0.46, 0),
    trousersMat
  );
  part(
    'rightLeg',
    MeshBuilder.CreateBox('pm_rLeg', { width: 0.25, height: 0.52, depth: 0.26 }, scene),
    new Vector3(0.16, 0.46, 0),
    trousersMat
  );

  // ── BELT ─────────────────────────────────────────────────────
  part(
    'belt',
    MeshBuilder.CreateBox('pm_belt', { width: 0.70, height: 0.09, depth: 0.38 }, scene),
    new Vector3(0, 0.76, 0),
    beltMat
  );
  // Buckle (small bright accent)
  part(
    'buckle',
    MeshBuilder.CreateBox('pm_buckle', { width: 0.09, height: 0.07, depth: 0.03 }, scene),
    new Vector3(0, 0.76, 0.20),
    buckleMat
  );

  // ── TORSO / JACKET ──────────────────────────────────────────
  part(
    'torso',
    MeshBuilder.CreateBox('pm_torso', { width: 0.68, height: 0.56, depth: 0.36 }, scene),
    new Vector3(0, 1.08, 0),
    jacketMat
  );

  // Shirt visible at neckline
  part(
    'shirtFront',
    MeshBuilder.CreateBox('pm_shirt', { width: 0.26, height: 0.20, depth: 0.02 }, scene),
    new Vector3(0, 1.24, 0.18),
    shirtMat
  );

  // Jacket collar/lapels (slightly raised edges)
  part(
    'leftLapel',
    MeshBuilder.CreateBox('pm_lLapel', { width: 0.10, height: 0.16, depth: 0.04 }, scene),
    new Vector3(-0.16, 1.24, 0.18),
    jacketMat
  );
  part(
    'rightLapel',
    MeshBuilder.CreateBox('pm_rLapel', { width: 0.10, height: 0.16, depth: 0.04 }, scene),
    new Vector3(0.16, 1.24, 0.18),
    jacketMat
  );

  // ── ARMS (jacket sleeves) ───────────────────────────────────
  part(
    'leftArm',
    MeshBuilder.CreateBox('pm_lArm', { width: 0.20, height: 0.48, depth: 0.20 }, scene),
    new Vector3(-0.44, 1.0, 0),
    jacketMat
  );
  part(
    'rightArm',
    MeshBuilder.CreateBox('pm_rArm', { width: 0.20, height: 0.48, depth: 0.20 }, scene),
    new Vector3(0.44, 1.0, 0),
    jacketMat
  );

  // ── HANDS / GLOVES ──────────────────────────────────────────
  part(
    'leftHand',
    MeshBuilder.CreateSphere('pm_lHand', { diameter: 0.16, segments: LOW_SEG }, scene),
    new Vector3(-0.44, 0.73, 0),
    glovesMat
  );
  part(
    'rightHand',
    MeshBuilder.CreateSphere('pm_rHand', { diameter: 0.16, segments: LOW_SEG }, scene),
    new Vector3(0.44, 0.73, 0),
    glovesMat
  );

  // ── NECK ─────────────────────────────────────────────────────
  part(
    'neck',
    MeshBuilder.CreateCylinder('pm_neck', { height: 0.10, diameter: 0.16, tessellation: LOW_SEG }, scene),
    new Vector3(0, 1.41, 0),
    skinMat
  );

  // ── HEAD ─────────────────────────────────────────────────────
  part(
    'head',
    MeshBuilder.CreateSphere('pm_head', { diameter: 0.34, segments: LOW_SEG }, scene),
    new Vector3(0, 1.56, 0),
    skinMat
  );

  // ── HAT ──────────────────────────────────────────────────────
  // Brim – wide disc, the dominant silhouette element from above
  part(
    'hatBrim',
    MeshBuilder.CreateCylinder(
      'pm_hatBrim',
      { height: 0.045, diameter: 0.92, tessellation: MED_SEG },
      scene
    ),
    new Vector3(0, 1.70, 0),
    hatMat
  );
  // Crown
  part(
    'hatCrown',
    MeshBuilder.CreateCylinder(
      'pm_hatCrown',
      { height: 0.18, diameterTop: 0.30, diameterBottom: 0.34, tessellation: LOW_SEG },
      scene
    ),
    new Vector3(0, 1.82, 0),
    hatMat
  );
  // Decorative band around the base of the crown
  part(
    'hatBand',
    MeshBuilder.CreateCylinder(
      'pm_hatBand',
      { height: 0.035, diameter: 0.37, tessellation: LOW_SEG },
      scene
    ),
    new Vector3(0, 1.74, 0),
    hatBandMat
  );

  // ── HOLSTER (right hip) ─────────────────────────────────────
  part(
    'holster',
    MeshBuilder.CreateBox('pm_holster', { width: 0.10, height: 0.22, depth: 0.13 }, scene),
    new Vector3(0.40, 0.68, 0.06),
    beltMat
  );

  // ── SATCHEL (left hip / back) ───────────────────────────────
  part(
    'satchel',
    MeshBuilder.CreateBox('pm_satchel', { width: 0.24, height: 0.22, depth: 0.10 }, scene),
    new Vector3(-0.40, 0.84, -0.13),
    satchelMat
  );
  // Satchel strap across torso
  part(
    'strap',
    MeshBuilder.CreateBox('pm_strap', { width: 0.05, height: 0.62, depth: 0.02 }, scene),
    new Vector3(-0.10, 1.10, 0.19),
    satchelMat,
    new Vector3(0, 0, 0.30)
  );

  return root;
}
