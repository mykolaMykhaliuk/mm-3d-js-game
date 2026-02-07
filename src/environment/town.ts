import { Scene } from '@babylonjs/core/scene';
import { MeshBuilder } from '@babylonjs/core/Meshes/meshBuilder';
import { Mesh } from '@babylonjs/core/Meshes/mesh';
import { TransformNode } from '@babylonjs/core/Meshes/transformNode';
import { StandardMaterial } from '@babylonjs/core/Materials/standardMaterial';
import { Color3 } from '@babylonjs/core/Maths/math.color';
import { Vector3 } from '@babylonjs/core/Maths/math.vector';
import { VertexBuffer } from '@babylonjs/core/Buffers/buffer';
import { VertexData } from '@babylonjs/core/Meshes/mesh.vertexData';
import { debugLog } from '../utils/debug-logger';

const TAG = 'Town';

// ── Layout constants ────────────────────────────────────────────

const GROUND_SIZE = 120;
const GROUND_SUBS = 40;
const ROAD_WIDTH = 5;
const ROAD_Y = 0.02;
const ROAD_HALF = ROAD_WIDTH / 2;
const TERRAIN_MARGIN = 3.0;

// ── Data definitions ────────────────────────────────────────────

interface RoadDef {
  name: string;
  cx: number;
  cz: number;
  w: number;
  d: number;
}

interface HouseDef {
  x: number;
  z: number;
  rot: number;
  w: number;
  h: number;
  d: number;
  wallIdx: number;
  roofIdx: number;
}

interface CarDef {
  x: number;
  z: number;
  rot: number;
  colorIdx: number;
}

interface TreeDef {
  x: number;
  z: number;
  scale: number;
  type: number;
}

// ── Road layout ─────────────────────────────────────────────────

const ROADS: RoadDef[] = [
  { name: 'mainEW', cx: 0, cz: 0, w: 116, d: ROAD_WIDTH },
  { name: 'mainNS', cx: 0, cz: 0, w: ROAD_WIDTH, d: 116 },
  { name: 'sideN', cx: 0, cz: 25, w: 90, d: ROAD_WIDTH },
  { name: 'sideS', cx: 0, cz: -25, w: 90, d: ROAD_WIDTH },
];

// ── House placement ─────────────────────────────────────────────

const HOUSES: HouseDef[] = [
  // North of main E-W road
  { x: 28, z: 9, rot: Math.PI, w: 6, h: 3.5, d: 5, wallIdx: 0, roofIdx: 0 },
  { x: 44, z: 8, rot: Math.PI, w: 5, h: 3, d: 4, wallIdx: 1, roofIdx: 1 },
  { x: -26, z: 10, rot: Math.PI, w: 7, h: 4, d: 5.5, wallIdx: 2, roofIdx: 0 },
  { x: -44, z: 8, rot: Math.PI, w: 5.5, h: 3, d: 4.5, wallIdx: 3, roofIdx: 2 },
  // South of main E-W road
  { x: 32, z: -9, rot: 0, w: 6.5, h: 3.5, d: 5, wallIdx: 1, roofIdx: 2 },
  { x: -18, z: -10, rot: 0, w: 5, h: 3, d: 4, wallIdx: 0, roofIdx: 1 },
  { x: -42, z: -9, rot: 0, w: 7, h: 4, d: 5.5, wallIdx: 2, roofIdx: 0 },
  // East of main N-S road
  { x: 9, z: 36, rot: Math.PI / 2, w: 5.5, h: 3, d: 4.5, wallIdx: 3, roofIdx: 1 },
  // Along side street z=25 north side
  { x: 14, z: 34, rot: Math.PI, w: 5, h: 3, d: 4, wallIdx: 0, roofIdx: 2 },
  { x: 36, z: 34, rot: Math.PI, w: 6, h: 3.5, d: 5, wallIdx: 1, roofIdx: 0 },
  // Along side street z=-25 south side
  { x: 16, z: -34, rot: 0, w: 5.5, h: 3, d: 4.5, wallIdx: 2, roofIdx: 1 },
  { x: -24, z: -34, rot: 0, w: 6, h: 3.5, d: 5, wallIdx: 3, roofIdx: 2 },
];

// ── Car placement ───────────────────────────────────────────────

const CARS: CarDef[] = [
  { x: 20, z: 3.2, rot: 0, colorIdx: 0 },
  { x: 38, z: -3.2, rot: Math.PI, colorIdx: 1 },
  { x: -32, z: 3.2, rot: 0, colorIdx: 2 },
  { x: 24, z: 13, rot: 0.3, colorIdx: 3 },
  { x: -14, z: -14, rot: -0.2, colorIdx: 4 },
  { x: 22, z: 22, rot: Math.PI / 2, colorIdx: 0 },
];

// ── Tree placement ──────────────────────────────────────────────

const TREES: TreeDef[] = [
  // Along main E-W road
  { x: 10, z: 5, scale: 1.0, type: 0 },
  { x: 18, z: -4.5, scale: 0.85, type: 1 },
  { x: 36, z: 5, scale: 0.95, type: 0 },
  { x: -12, z: -5, scale: 1.1, type: 2 },
  { x: -34, z: 5, scale: 0.9, type: 1 },
  { x: -50, z: 4, scale: 1.0, type: 0 },
  { x: 50, z: -4, scale: 0.85, type: 2 },
  // Along main N-S road
  { x: 5, z: 16, scale: 0.95, type: 1 },
  { x: -4.5, z: -14, scale: 1.0, type: 0 },
  { x: 5, z: 44, scale: 1.1, type: 2 },
  { x: -4, z: -44, scale: 0.9, type: 0 },
  // In yards near houses
  { x: 35, z: 15, scale: 0.8, type: 1 },
  { x: 48, z: 12, scale: 0.9, type: 0 },
  { x: -32, z: 15, scale: 1.0, type: 2 },
  { x: -48, z: 12, scale: 0.85, type: 1 },
  { x: 38, z: -15, scale: 0.95, type: 0 },
  { x: -13, z: -15, scale: 0.8, type: 1 },
  { x: -46, z: -14, scale: 1.05, type: 2 },
  // Near side streets
  { x: 7, z: 30, scale: 0.9, type: 0 },
  { x: -9, z: 40, scale: 1.0, type: 1 },
  { x: 30, z: 40, scale: 0.85, type: 2 },
  { x: 22, z: -30, scale: 0.95, type: 0 },
  { x: -18, z: -40, scale: 1.0, type: 1 },
  // Edge framing
  { x: 54, z: 28, scale: 1.2, type: 2 },
  { x: -54, z: -22, scale: 1.1, type: 0 },
  { x: 28, z: 52, scale: 1.0, type: 1 },
  { x: -32, z: -52, scale: 1.15, type: 2 },
  { x: 52, z: -38, scale: 0.95, type: 0 },
];

// ── Terrain helpers ─────────────────────────────────────────────

function terrainNoise(x: number, z: number): number {
  return (
    Math.sin(x * 0.15) * Math.cos(z * 0.2) * 0.18 +
    Math.sin(x * 0.4 + z * 0.3) * 0.08 +
    Math.cos(x * 0.25 - z * 0.35) * 0.06
  );
}

/** Distance from a point to the nearest road centre-line */
function distToNearestRoad(x: number, z: number): number {
  let min = Infinity;
  // Main E-W at z=0
  if (Math.abs(x) < 58) min = Math.min(min, Math.abs(z));
  // Main N-S at x=0
  if (Math.abs(z) < 58) min = Math.min(min, Math.abs(x));
  // Side street z=25
  if (Math.abs(x) < 45) min = Math.min(min, Math.abs(z - 25));
  // Side street z=-25
  if (Math.abs(x) < 45) min = Math.min(min, Math.abs(z + 25));
  return min;
}

/** Ground height with smooth falloff near roads */
function groundHeight(x: number, z: number): number {
  const dist = distToNearestRoad(x, z);
  if (dist < ROAD_HALF) return 0;
  const t = Math.min((dist - ROAD_HALF) / TERRAIN_MARGIN, 1.0);
  return terrainNoise(x, z) * t;
}

// ── Shared materials ────────────────────────────────────────────

interface TownMaterials {
  grass: StandardMaterial;
  road: StandardMaterial;
  walls: StandardMaterial[];
  roofs: StandardMaterial[];
  door: StandardMaterial;
  window: StandardMaterial;
  carBodies: StandardMaterial[];
  carWheel: StandardMaterial;
  trunk: StandardMaterial;
  canopies: StandardMaterial[];
  shadow: StandardMaterial;
}

function makeMat(
  name: string,
  diffuse: Color3,
  scene: Scene,
  specular?: Color3,
): StandardMaterial {
  const m = new StandardMaterial(`town_${name}`, scene);
  m.diffuseColor = diffuse;
  m.specularColor = specular ?? Color3.Black();
  return m;
}

function createMaterials(scene: Scene): TownMaterials {
  const windowMat = makeMat('window', new Color3(0.55, 0.70, 0.85), scene);
  windowMat.emissiveColor = new Color3(0.08, 0.12, 0.18);

  const shadowMat = makeMat('shadow', Color3.Black(), scene);
  shadowMat.alpha = 0.25;
  shadowMat.disableLighting = true;

  return {
    grass: makeMat('grass', new Color3(0.22, 0.38, 0.15), scene),
    road: makeMat('road', new Color3(0.18, 0.18, 0.20), scene),
    walls: [
      makeMat('wall0', new Color3(0.82, 0.76, 0.62), scene),
      makeMat('wall1', new Color3(0.68, 0.76, 0.84), scene),
      makeMat('wall2', new Color3(0.88, 0.84, 0.62), scene),
      makeMat('wall3', new Color3(0.65, 0.78, 0.65), scene),
    ],
    roofs: [
      makeMat('roof0', new Color3(0.55, 0.18, 0.12), scene),
      makeMat('roof1', new Color3(0.32, 0.34, 0.38), scene),
      makeMat('roof2', new Color3(0.42, 0.28, 0.18), scene),
    ],
    door: makeMat('door', new Color3(0.42, 0.26, 0.14), scene),
    window: windowMat,
    carBodies: [
      makeMat('car0', new Color3(0.72, 0.15, 0.12), scene),
      makeMat('car1', new Color3(0.18, 0.30, 0.65), scene),
      makeMat('car2', new Color3(0.85, 0.85, 0.82), scene),
      makeMat('car3', new Color3(0.15, 0.45, 0.20), scene),
      makeMat('car4', new Color3(0.60, 0.62, 0.65), scene),
    ],
    carWheel: makeMat('carWheel', new Color3(0.10, 0.10, 0.10), scene),
    trunk: makeMat('trunk', new Color3(0.38, 0.25, 0.12), scene),
    canopies: [
      makeMat('canopy0', new Color3(0.15, 0.40, 0.12), scene),
      makeMat('canopy1', new Color3(0.25, 0.52, 0.18), scene),
      makeMat('canopy2', new Color3(0.18, 0.35, 0.10), scene),
    ],
    shadow: shadowMat,
  };
}

// ── Ground creation ─────────────────────────────────────────────

function createGround(scene: Scene, mats: TownMaterials): void {
  const ground = MeshBuilder.CreateGround('town_ground', {
    width: GROUND_SIZE,
    height: GROUND_SIZE,
    subdivisions: GROUND_SUBS,
    updatable: true,
  }, scene);

  const positions = ground.getVerticesData(VertexBuffer.PositionKind);
  const indices = ground.getIndices();

  if (positions && indices) {
    for (let i = 0; i < positions.length; i += 3) {
      positions[i + 1] = groundHeight(positions[i], positions[i + 2]);
    }
    ground.updateVerticesData(VertexBuffer.PositionKind, positions);

    const normals = new Float32Array(positions.length);
    VertexData.ComputeNormals(positions, indices, normals);
    ground.updateVerticesData(VertexBuffer.NormalKind, normals);
  }

  ground.material = mats.grass;
  ground.isPickable = false;
  debugLog.info(TAG, 'Ground created');
}

// ── Road creation ───────────────────────────────────────────────

function createRoads(scene: Scene, mats: TownMaterials): void {
  for (const rd of ROADS) {
    const road = MeshBuilder.CreateGround(`town_road_${rd.name}`, {
      width: rd.w,
      height: rd.d,
    }, scene);
    road.position = new Vector3(rd.cx, ROAD_Y, rd.cz);
    road.material = mats.road;
    road.isPickable = false;
  }
  debugLog.info(TAG, `${ROADS.length} road segments created`);
}

// ── House creation ──────────────────────────────────────────────

function placeHouse(
  scene: Scene,
  mats: TownMaterials,
  def: HouseDef,
  idx: number,
): void {
  const root = new TransformNode(`town_house_${idx}`, scene);
  root.position = new Vector3(def.x, 0, def.z);
  root.rotation.y = def.rot;

  const { w, h, d, wallIdx, roofIdx } = def;

  // Wall body
  const wall = MeshBuilder.CreateBox(`town_hw_${idx}`, { width: w, height: h, depth: d }, scene);
  wall.position.y = h / 2;
  wall.material = mats.walls[wallIdx];
  wall.isPickable = false;
  wall.parent = root;

  // Pyramid roof (4-sided cone)
  const roofH = h * 0.55;
  const roof = MeshBuilder.CreateCylinder(`town_hr_${idx}`, {
    height: roofH,
    diameterTop: 0,
    diameterBottom: Math.max(w, d) * 1.55,
    tessellation: 4,
  }, scene);
  roof.position.y = h + roofH / 2;
  roof.rotation.y = Math.PI / 4;
  roof.material = mats.roofs[roofIdx];
  roof.isPickable = false;
  roof.parent = root;

  // Door (on +Z local face)
  const door = MeshBuilder.CreateBox(`town_hd_${idx}`, {
    width: 0.8, height: 1.6, depth: 0.1,
  }, scene);
  door.position = new Vector3(0, 0.8, d / 2 + 0.05);
  door.material = mats.door;
  door.isPickable = false;
  door.parent = root;

  // Front windows
  const winW = 0.7;
  const winH = 0.7;
  for (const side of [-1, 1]) {
    const win = MeshBuilder.CreateBox(`town_hwin_${idx}_${side}`, {
      width: winW, height: winH, depth: 0.08,
    }, scene);
    win.position = new Vector3(side * w * 0.3, h * 0.6, d / 2 + 0.04);
    win.material = mats.window;
    win.isPickable = false;
    win.parent = root;
  }

  // Fake ground shadow
  const shadow = MeshBuilder.CreateDisc(`town_hs_${idx}`, {
    radius: Math.max(w, d) * 0.7,
    tessellation: 8,
  }, scene);
  shadow.position = new Vector3(def.x, 0.01, def.z);
  shadow.rotation.x = Math.PI / 2;
  shadow.material = mats.shadow;
  shadow.isPickable = false;
}

function createHouses(scene: Scene, mats: TownMaterials): void {
  for (let i = 0; i < HOUSES.length; i++) {
    placeHouse(scene, mats, HOUSES[i], i);
  }
  debugLog.info(TAG, `${HOUSES.length} houses created`);
}

// ── Car creation ────────────────────────────────────────────────

function placeCar(
  scene: Scene,
  mats: TownMaterials,
  def: CarDef,
  idx: number,
): void {
  const root = new TransformNode(`town_car_${idx}`, scene);
  root.position = new Vector3(def.x, 0, def.z);
  root.rotation.y = def.rot;

  const bodyMat = mats.carBodies[def.colorIdx];

  // Body
  const body = MeshBuilder.CreateBox(`town_cb_${idx}`, {
    width: 1.7, height: 0.8, depth: 3.8,
  }, scene);
  body.position.y = 0.5;
  body.material = bodyMat;
  body.isPickable = false;
  body.parent = root;

  // Cabin
  const cabin = MeshBuilder.CreateBox(`town_cc_${idx}`, {
    width: 1.5, height: 0.55, depth: 1.6,
  }, scene);
  cabin.position = new Vector3(0, 1.08, -0.3);
  cabin.material = bodyMat;
  cabin.isPickable = false;
  cabin.parent = root;

  // Wheels
  const wheelPositions: [number, number][] = [
    [0.85, 1.2], [-0.85, 1.2], [0.85, -1.2], [-0.85, -1.2],
  ];
  for (let wi = 0; wi < wheelPositions.length; wi++) {
    const [wx, wz] = wheelPositions[wi];
    const wheel = MeshBuilder.CreateCylinder(`town_cw_${idx}_${wi}`, {
      height: 0.2, diameter: 0.5, tessellation: 8,
    }, scene);
    wheel.position = new Vector3(wx, 0.25, wz);
    wheel.rotation.z = Math.PI / 2;
    wheel.material = mats.carWheel;
    wheel.isPickable = false;
    wheel.parent = root;
  }
}

function createCars(scene: Scene, mats: TownMaterials): void {
  for (let i = 0; i < CARS.length; i++) {
    placeCar(scene, mats, CARS[i], i);
  }
  debugLog.info(TAG, `${CARS.length} cars created`);
}

// ── Tree creation (with instances) ──────────────────────────────

function createTrees(scene: Scene, mats: TownMaterials): void {
  if (TREES.length === 0) return;

  // Source trunk mesh (unit height = 1, scaled per instance)
  const trunkSrc = MeshBuilder.CreateCylinder('town_trunk_src', {
    height: 1.0, diameter: 0.4, tessellation: 6,
  }, scene);
  trunkSrc.material = mats.trunk;
  trunkSrc.isPickable = false;

  // Source canopy meshes: 0,1 = deciduous (sphere), 2 = conifer (cone)
  const canopySrcs: Mesh[] = [];
  for (let ci = 0; ci < 3; ci++) {
    let src: Mesh;
    if (ci < 2) {
      src = MeshBuilder.CreateSphere(`town_canopy_src_${ci}`, {
        diameter: 1.0, segments: 8,
      }, scene);
    } else {
      src = MeshBuilder.CreateCylinder(`town_canopy_src_${ci}`, {
        height: 1.0, diameterTop: 0, diameterBottom: 0.7, tessellation: 8,
      }, scene);
    }
    src.material = mats.canopies[ci];
    src.isPickable = false;
    // Hide until first tree of this type is placed
    src.position.y = -100;
    canopySrcs.push(src);
  }

  // Track whether each source has been positioned
  let trunkPlaced = false;
  const canopyPlaced = [false, false, false];

  for (let i = 0; i < TREES.length; i++) {
    const t = TREES[i];
    const s = t.scale;
    const isConifer = t.type === 2;
    const trunkH = isConifer ? 3.0 : 2.0;
    const canopyDiam = isConifer ? 2.5 : 3.0;
    const canopyH = isConifer ? 4.0 : canopyDiam;
    const canopyY = trunkH + canopyH * 0.4;

    // Trunk
    if (!trunkPlaced) {
      trunkSrc.position = new Vector3(t.x, (trunkH * s) / 2, t.z);
      trunkSrc.scaling = new Vector3(s, trunkH * s, s);
      trunkPlaced = true;
    } else {
      const inst = trunkSrc.createInstance(`town_trunk_${i}`);
      inst.position = new Vector3(t.x, (trunkH * s) / 2, t.z);
      inst.scaling = new Vector3(s, trunkH * s, s);
      inst.isPickable = false;
    }

    // Canopy
    const ci = t.type;
    if (!canopyPlaced[ci]) {
      canopySrcs[ci].position = new Vector3(t.x, canopyY * s, t.z);
      canopySrcs[ci].scaling = new Vector3(
        canopyDiam * s,
        canopyH * s,
        canopyDiam * s,
      );
      canopyPlaced[ci] = true;
    } else {
      const inst = canopySrcs[ci].createInstance(`town_canopy_${ci}_${i}`);
      inst.position = new Vector3(t.x, canopyY * s, t.z);
      inst.scaling = new Vector3(
        canopyDiam * s,
        canopyH * s,
        canopyDiam * s,
      );
      inst.isPickable = false;
    }
  }

  debugLog.info(TAG, `${TREES.length} trees created (instanced)`);
}

// ── Main export ─────────────────────────────────────────────────

/**
 * Creates the complete small-town environment around the playable area.
 * Includes ground with terrain variation, roads, houses, cars, and trees.
 * All meshes are non-pickable and optimised for mobile (shared materials,
 * instanced trees, low polygon counts, no dynamic shadows).
 */
export function createTownEnvironment(scene: Scene): void {
  debugLog.info(TAG, 'Creating town environment...');
  const mats = createMaterials(scene);
  createGround(scene, mats);
  createRoads(scene, mats);
  createHouses(scene, mats);
  createCars(scene, mats);
  createTrees(scene, mats);
  debugLog.info(TAG, 'Town environment complete');
}
