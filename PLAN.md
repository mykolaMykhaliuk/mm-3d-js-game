# Alien Shooter 3D - Technical Plan

A proof-of-concept 3D alien shooter built with Babylon.js. Minimal scope, browser-based,
multiplatform (desktop + mobile). Age rating 8+ — abstract visuals, no violence beyond
simple shooting mechanics.

---

## 1. High-Level Architecture

The game is structured around five core systems with clear separation of responsibilities:

```
┌─────────────────────────────────────────────────────┐
│                    Game (main.ts)                    │
│  Bootstraps engine, scene, and the game loop.       │
│  Owns the top-level state machine.                  │
├──────────┬──────────┬───────────┬───────────────────┤
│  Input   │  Scene   │  Entity   │    UI / HUD       │
│  Manager │  Manager │  Manager  │    Manager        │
└──────────┴──────────┴───────────┴───────────────────┘
```

### 1.1 Game Loop

Babylon.js provides `engine.runRenderLoop(...)` which fires every frame. Inside this
callback we:

1. Read input state (already collected by event listeners).
2. Update all entities (player, aliens, projectiles) via delta-time.
3. Run hit detection.
4. Update HUD (score, health).
5. Check win/lose conditions.
6. Render the scene (`scene.render()`).

A simple top-level state machine drives the flow:

```
MENU → PLAYING → GAME_OVER
              ↘ WIN
```

State transitions happen in the game loop; each state determines which update logic runs.

### 1.2 Scene Management

For this PoC there is a **single scene**. No scene switching or loading screens are
needed. The scene is created once at startup and reused (entities are cleared/reset on
replay). This avoids complexity around scene disposal and recreation.

### 1.3 Input Manager

A single `InputManager` class that abstracts platform differences:

- **Desktop**: Listens to `keydown`/`keyup` for movement (WASD / arrow keys) and
  `pointerdown`/`pointermove` for aiming and shooting.
- **Mobile**: Renders two virtual touch zones — left half of the screen for a virtual
  joystick (movement), right half for aiming/shooting via tap.
- Exposes a unified API: `getMovement(): Vector2`, `getAimDirection(): Vector3`,
  `isShooting(): boolean`.

Babylon.js pointer events are already unified across mouse and touch, so we build on
`scene.onPointerObservable`.

### 1.4 Entity Manager

Manages the lifecycle of all game objects (player, aliens, projectiles). Responsibilities:

- Spawning and despawning entities.
- Calling `update(dt)` on each active entity every frame.
- Providing lookup methods for hit detection.

This is a simple flat array — no ECS framework needed for this scope.

### 1.5 UI / HUD Manager

Uses Babylon.js `GUI` (the `@babylonjs/gui` AdvancedDynamicTexture) for all 2D overlays:

- Score display.
- Health bar or health counter.
- Wave counter.
- Start screen ("Tap to Play").
- Game Over / Win screen with a "Play Again" button.

GUI is resolution-independent and works on both desktop and mobile out of the box.

---

## 2. Project & Folder Structure

```
mm-3d-js-game/
├── index.html              # Single HTML page with canvas
├── package.json            # Dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
├── PLAN.md                 # This file
├── README.md
├── LICENSE
└── src/
    ├── main.ts             # Entry point: creates Engine, Scene, starts game loop
    ├── game.ts             # Game state machine, top-level orchestration
    ├── scene-setup.ts      # Camera, lights, ground, skybox/background
    ├── input-manager.ts    # Unified input handling (keyboard, mouse, touch)
    ├── entity-manager.ts   # Spawning, updating, and removing entities
    ├── hud-manager.ts      # All GUI / 2D overlay elements
    ├── entities/
    │   ├── player.ts       # Player mesh, movement, health
    │   ├── alien.ts        # Alien mesh, AI movement, health
    │   └── projectile.ts   # Projectile mesh, movement, lifetime
    ├── systems/
    │   ├── spawner.ts      # Alien wave spawning logic and timing
    │   ├── collision.ts    # Hit detection between projectiles and aliens/player
    │   └── scoring.ts      # Score tracking and wave progression
    └── utils/
        ├── constants.ts    # All tunable game parameters in one place
        └── helpers.ts      # Small shared utility functions
```

### Module roles at a glance

| Module | Responsibility |
|---|---|
| `main.ts` | Creates the Babylon.js `Engine` and `Scene`, wires up all managers, starts the render loop. |
| `game.ts` | Owns the state machine (`MENU`, `PLAYING`, `GAME_OVER`, `WIN`). Delegates to managers based on current state. |
| `scene-setup.ts` | One-time scene initialization: camera, lights, ground plane, background color. |
| `input-manager.ts` | Listens to DOM/Babylon events, exposes `getMovement()`, `getAimDirection()`, `isShooting()`. |
| `entity-manager.ts` | Flat array of active entities. Provides `add()`, `remove()`, `update(dt)`, `getByType()`. |
| `hud-manager.ts` | Creates and updates all GUI controls. Listens for button clicks (start, retry). |
| `player.ts` | Player entity. Reads input, moves on the ground plane, tracks health. |
| `alien.ts` | Alien entity. Moves toward the player at a configurable speed. Removed on hit. |
| `projectile.ts` | Moves in a straight line from spawn position along aim direction. Removed on hit or timeout. |
| `spawner.ts` | Controls when and where aliens appear. Simple wave system with increasing difficulty. |
| `collision.ts` | Each frame, checks distances between projectiles and aliens (sphere-sphere). |
| `scoring.ts` | Tracks score and wave state. Determines win condition (all waves cleared). |
| `constants.ts` | Single source of truth for all magic numbers: speeds, health, spawn rates, etc. |
| `helpers.ts` | Small utilities, e.g. random position on a ring around the player. |

---

## 3. Core Gameplay Loop

### 3.1 Overview (plain English)

> You control a small spaceship (or turret) that sits near the center of a flat arena.
> Aliens — simple colored shapes — spawn at the edges and walk toward you. You aim and
> shoot projectiles at them. Each alien you hit earns a point and the alien disappears
> in a brief flash. If an alien reaches you, you lose a health point. Survive all waves
> to win; lose all health to lose.

### 3.2 Player Movement

- The player moves on the XZ ground plane (Y is up).
- Movement speed is a constant (e.g. 8 units/sec), applied as
  `position += direction * speed * deltaTime`.
- The player is clamped inside the arena bounds (a square or circular area).
- On desktop: WASD or arrow keys set the movement direction vector.
- On mobile: a virtual joystick in the left screen zone sets the direction.

### 3.3 Aiming & Shooting

- **Desktop**: A raycast from the camera through the mouse pointer intersects the ground
  plane. The direction from the player to that intersection point is the aim direction.
  Clicking fires a projectile.
- **Mobile**: Tapping the right half of the screen fires a projectile toward the nearest
  alien, or in the player's facing direction if no alien is in range. Alternatively, the
  tap position can be raycast onto the ground plane (same as desktop).
- Projectiles are small spheres that travel at a fixed speed (e.g. 30 units/sec).
- A fire rate cooldown prevents spamming (e.g. 0.25 seconds between shots).
- Projectiles are removed when they hit an alien, leave the arena bounds, or after a
  maximum lifetime (e.g. 2 seconds).

### 3.4 Alien Spawning

The `spawner.ts` module manages waves:

```
Wave 1: 5 aliens, spawn interval 1.5s, speed 3
Wave 2: 8 aliens, spawn interval 1.2s, speed 3.5
Wave 3: 12 aliens, spawn interval 1.0s, speed 4
...
```

- Aliens spawn at random positions on a circle around the arena center (outside camera
  view).
- Each alien moves directly toward the player's current position at its configured speed.
- When all aliens in a wave are defeated, a short delay occurs, then the next wave starts.

### 3.5 Win / Lose Conditions

- **Lose**: Player health reaches zero. Display "Game Over" screen with score and
  "Play Again" button.
- **Win**: All waves cleared. Display "You Win!" screen with score and "Play Again"
  button.

---

## 4. Babylon.js Implementation Decisions

### 4.1 Engine & Scene Initialization

```ts
const canvas = document.getElementById("renderCanvas") as HTMLCanvasElement;
const engine = new Engine(canvas, true); // antialias = true
const scene = new Scene(engine);

// Responsive resize
window.addEventListener("resize", () => engine.resize());
```

`Engine` constructor receives the canvas and enables antialiasing. The `engine.resize()`
call on window resize keeps the rendering responsive.

### 4.2 Camera

Use an **ArcRotateCamera** locked to a fixed top-down-ish angle (e.g. ~60 degrees from
vertical). This provides:

- A clear view of the arena.
- Built-in pointer handling for raycasting.
- Easy to lock: disable user rotation by setting `camera.lowerAlpha = camera.upperAlpha`
  and `camera.lowerBeta = camera.upperBeta`.

```ts
const camera = new ArcRotateCamera(
  "camera",
  -Math.PI / 2,           // alpha: horizontal rotation
  Math.PI / 3,            // beta: ~60 degrees from top
  30,                     // radius: distance from target
  Vector3.Zero(),         // target: arena center
  scene
);
camera.lowerRadiusLimit = 30;
camera.upperRadiusLimit = 30;
// Lock rotation so player can't orbit
camera.lowerAlphaLimit = camera.alpha;
camera.upperAlphaLimit = camera.alpha;
camera.lowerBetaLimit = camera.beta;
camera.upperBetaLimit = camera.beta;
```

The camera target follows the player position (smoothly) so the view stays centered.

### 4.3 Lighting

Minimal two-light setup:

```ts
// Main directional light (sun-like)
const light = new DirectionalLight("sun", new Vector3(-1, -2, -1), scene);
light.intensity = 0.8;

// Ambient fill so nothing is pitch black
const ambient = new HemisphericLight("ambient", new Vector3(0, 1, 0), scene);
ambient.intensity = 0.4;
```

No shadows. Shadows are expensive and unnecessary for this PoC.

### 4.4 Meshes

All meshes are created from **Babylon.js built-in primitives**. No external model files.

| Entity | Geometry | Visual |
|---|---|---|
| Player | `MeshBuilder.CreateBox` or `MeshBuilder.CreateCylinder` | A small colored box or low cylinder representing a turret/ship |
| Alien | `MeshBuilder.CreateSphere` with slight scale distortion | Colored spheres (different colors per wave) |
| Projectile | `MeshBuilder.CreateSphere` (small radius ~0.2) | Bright emissive material so it glows |
| Ground | `MeshBuilder.CreateGround` | Large flat plane with a simple grid material or solid color |

Materials use `StandardMaterial` with `diffuseColor` and optionally `emissiveColor` for
projectiles. No textures.

For alien "destruction", the mesh is simply disposed and optionally a brief particle burst
is played (Babylon's `ParticleSystem` with a very low particle count, ~20 particles,
short lifetime).

### 4.5 Hit Detection (Collisions)

**Sphere-sphere distance checks** — the simplest and cheapest approach:

```ts
function checkHit(a: AbstractMesh, b: AbstractMesh, threshold: number): boolean {
  return Vector3.Distance(a.position, b.position) < threshold;
}
```

Each frame, iterate all active projectiles against all active aliens. With the small
entity counts in this PoC (< 50 entities total), this brute-force O(n*m) approach runs
well within budget.

No physics engine is used. Babylon.js physics (Ammo.js / Havok) would be overkill for
simple distance checks and constant-velocity movement.

---

## 5. Multiplatform Considerations

### 5.1 Responsive Canvas

```html
<canvas id="renderCanvas" style="width: 100%; height: 100%; touch-action: none;"></canvas>
```

- `touch-action: none` prevents browser gestures (scroll, pinch-zoom) from interfering.
- `engine.resize()` is called on `window.resize` events.
- CSS ensures the canvas fills the viewport: `html, body { margin: 0; overflow: hidden; }`.

### 5.2 Input Abstraction

The `InputManager` exposes the same API regardless of platform:

```ts
interface InputState {
  movement: Vector2;      // normalized direction, (0,0) when idle
  aimPoint: Vector3;      // world-space point on the ground plane
  shooting: boolean;      // true on the frame the player fires
}
```

Detection of mobile vs. desktop:

```ts
const isMobile = "ontouchstart" in window || navigator.maxTouchPoints > 0;
```

On mobile, a simple virtual joystick is rendered using Babylon GUI (a transparent circle
with a draggable inner thumb). The right side of the screen acts as the fire zone.

### 5.3 Performance on Mobile

- **Mesh count**: Keep total mesh count under ~100. Dispose projectiles and aliens
  promptly.
- **No shadows, no post-processing**.
- **Hardware scaling**: If frame rate drops, `engine.setHardwareScalingLevel(2)` renders
  at half resolution. Can be toggled automatically based on measured FPS.
- **Object pooling** (optional optimization): Reuse disposed meshes from a pool instead
  of creating/destroying frequently. Implement only if profiling shows GC pressure.
- **Particle effects**: Keep particle counts very low (10-20 per burst) with short
  lifetimes (0.3s).

---

## 6. Code Quality Guidelines

- **TypeScript** throughout (strict mode enabled in `tsconfig.json`).
- **No `any` types** unless interfacing with untyped libraries.
- **Descriptive names**: `alienSpeed`, not `spd`; `handlePlayerMovement`, not `hpm`.
- **Small functions**: Each function does one thing. Aim for < 30 lines per function.
- **Constants file**: All tunable parameters live in `constants.ts` — no magic numbers
  scattered in logic.
- **JSDoc comments** on every exported function and class describing purpose and
  parameters.
- **Consistent formatting**: Enforced via Prettier (configured in `package.json`).
- **Linting**: ESLint with a standard TypeScript config.
- **No premature optimization**: Write clear code first. Optimize only where profiling
  shows a bottleneck.

---

## 7. Tooling & Dependencies

| Tool | Purpose |
|---|---|
| **Vite** | Dev server with HMR and production bundling. Fast, zero-config for TypeScript. |
| **TypeScript** | Type safety, better IDE support, self-documenting code. |
| **@babylonjs/core** | Core rendering, scene, meshes, materials, cameras, lights. |
| **@babylonjs/gui** | 2D GUI overlays (HUD, menus). |
| **ESLint** | Code linting. |
| **Prettier** | Code formatting. |

No other runtime dependencies. The total bundle size of a tree-shaken Babylon.js core
import is manageable (< 1 MB gzipped for the features we use).

---

## 8. Implementation Milestones

Each milestone produces a **runnable version** that can be tested in a browser.

### Phase 1: Scaffold & Render (Day 1)

**Goal**: Window opens, 3D scene renders, camera shows a ground plane.

- [ ] Initialize project: `npm init`, install dependencies, configure Vite + TypeScript.
- [ ] Create `index.html` with a full-viewport canvas.
- [ ] Implement `main.ts`: create Engine, Scene, call `scene-setup.ts`.
- [ ] Implement `scene-setup.ts`: ArcRotateCamera (locked), two lights, ground mesh.
- [ ] Verify it runs on desktop and mobile browsers.

**Deliverable**: A static 3D scene with a ground plane, camera, and lighting.

---

### Phase 2: Player & Input (Day 1-2)

**Goal**: Player mesh moves around the arena via keyboard and touch.

- [ ] Implement `input-manager.ts` with keyboard listeners (WASD / arrows).
- [ ] Create `player.ts`: box/cylinder mesh, movement logic, arena bounds clamping.
- [ ] Wire input into the game loop: read input, update player position.
- [ ] Camera target follows the player smoothly.
- [ ] Add basic mobile virtual joystick (GUI circle + thumb).
- [ ] Test on desktop (keyboard) and mobile (touch).

**Deliverable**: A movable player on a ground plane.

---

### Phase 3: Shooting (Day 2)

**Goal**: Player can aim and fire projectiles.

- [ ] Implement ground-plane raycasting for aim direction (mouse and touch).
- [ ] Implement `projectile.ts`: small sphere, linear movement, lifetime/bounds removal.
- [ ] Add fire-rate cooldown logic.
- [ ] Wire shooting into the game loop via `InputManager.isShooting()`.
- [ ] Test that projectiles spawn, travel, and despawn correctly.

**Deliverable**: Player moves and shoots projectiles across the arena.

---

### Phase 4: Aliens & Collision (Day 2-3)

**Goal**: Aliens spawn, move toward the player, and can be destroyed by projectiles.

- [ ] Implement `alien.ts`: sphere mesh, moves toward player position each frame.
- [ ] Implement `spawner.ts`: timed spawning at random edge positions.
- [ ] Implement `collision.ts`: sphere-sphere distance checks each frame.
- [ ] On projectile-alien collision: remove both, increment score.
- [ ] On alien-player collision: remove alien, decrement player health.
- [ ] Add simple destruction effect (optional: tiny particle burst).

**Deliverable**: A playable combat loop — shoot aliens before they reach you.

---

### Phase 5: HUD, Scoring & Game States (Day 3)

**Goal**: Full game flow from start screen to win/lose.

- [ ] Implement `hud-manager.ts`: score display, health display, wave counter.
- [ ] Implement `scoring.ts`: score tracking, wave progression.
- [ ] Implement `game.ts` state machine: MENU → PLAYING → GAME_OVER / WIN.
- [ ] Add start screen with "Tap / Click to Play".
- [ ] Add game-over screen with final score and "Play Again" button.
- [ ] Add win screen.
- [ ] Reset logic: clear all entities, reset score/health, restart spawner.

**Deliverable**: A complete, playable proof-of-concept game loop.

---

### Phase 6: Polish & Mobile QA (Day 4)

**Goal**: Tighten feel, fix mobile issues, clean up code.

- [ ] Tune constants: alien speed, spawn rates, fire rate, player speed.
- [ ] Test on multiple mobile devices / browsers (Chrome, Safari, Firefox).
- [ ] Add `engine.setHardwareScalingLevel()` fallback for low-end devices.
- [ ] Add simple sound effects (optional, using Babylon.js `Sound`): shoot, hit,
      game-over jingle.
- [ ] Final code review: consistent naming, JSDoc coverage, no dead code.
- [ ] Write README with setup instructions and gameplay description.

**Deliverable**: A polished, tested PoC ready for review.

---

## 9. Summary

| Aspect | Decision |
|---|---|
| Framework | Babylon.js (core + GUI) |
| Language | TypeScript (strict) |
| Bundler | Vite |
| Camera | ArcRotateCamera, locked angle, follows player |
| Lighting | DirectionalLight + HemisphericLight, no shadows |
| Meshes | Built-in primitives only (Box, Sphere, Cylinder, Ground) |
| Hit detection | Sphere-sphere distance check, no physics engine |
| Input | Unified InputManager abstracting keyboard/mouse/touch |
| GUI | Babylon.js AdvancedDynamicTexture for all HUD/menus |
| State management | Simple state machine in `game.ts` |
| Target timeline | ~4 working days for a single developer |
| External models/textures | None |
| Backend | None |

This plan produces a minimal, clean, playable 3D alien shooter that runs in any modern
browser on desktop and mobile, built with maintainable TypeScript code and no unnecessary
dependencies.
