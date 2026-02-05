import { Scene } from '@babylonjs/core/scene';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import '@babylonjs/core/Culling/ray';
import { isMobile } from './utils/helpers';
import { debugLog } from './utils/debug-logger';

const TAG = 'InputManager';

/** Joystick config */
const JOYSTICK_RADIUS = 120; // Max drag radius in CSS pixels
const JOYSTICK_DEAD_ZONE = 15; // Minimum drag before registering movement

/**
 * Unified input state exposed to game logic
 */
export interface InputState {
  /** Normalized movement direction (0,0) when idle */
  movement: Vector2;
  /** World-space aim point on the ground plane */
  aimPoint: Vector3;
  /** True when the player wants to shoot */
  shooting: boolean;
}

/**
 * Tracked touch pointer for multi-touch handling
 */
interface TrackedPointer {
  id: number;
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  role: 'joystick' | 'shoot';
}

/**
 * Manages all input (keyboard, mouse, touch) with a unified API.
 * On mobile, uses raw DOM pointer events for reliable multi-touch:
 *   - Bottom-left joystick zone controls movement
 *   - Any touch outside the joystick triggers shooting
 *   - Multiple simultaneous touches are fully supported
 */
export class InputManager {
  private scene: Scene;
  private mobile: boolean;

  // Keyboard state (desktop only)
  private keys: Set<string> = new Set();

  // Desktop mouse state
  private mouseDown: boolean = false;
  private mousePosition: Vector2 = Vector2.Zero();

  // Multi-touch state (mobile only)
  private pointers: Map<number, TrackedPointer> = new Map();
  private joystickPointerId: number = -1;

  // Joystick visual state (read by HUDManager)
  joystickVisible: boolean = false;
  joystickBaseX: number = 0;
  joystickBaseY: number = 0;
  joystickKnobX: number = 0;
  joystickKnobY: number = 0;

  // Shooting flash state (read by HUDManager)
  shootFlashTimer: number = 0;

  // Cached input state
  private inputState: InputState = {
    movement: Vector2.Zero(),
    aimPoint: Vector3.Zero(),
    shooting: false,
  };

  // Last shoot touch position for aim direction
  private lastShootScreenPos: Vector2 | null = null;

  constructor(scene: Scene) {
    this.scene = scene;
    this.mobile = isMobile();

    debugLog.info(TAG, `Mobile detected: ${this.mobile}`);
    debugLog.info(
      TAG,
      `Touch support: ontouchstart=${'ontouchstart' in window}, maxTouchPoints=${navigator.maxTouchPoints}`
    );

    this.setupEventListeners();
    debugLog.info(TAG, 'Event listeners registered');
  }

  /**
   * Set up DOM event listeners
   */
  private setupEventListeners(): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) {
      debugLog.warn(TAG, 'No canvas found for event listeners');
      return;
    }

    if (this.mobile) {
      // Mobile: use raw DOM pointer events for reliable multi-touch
      canvas.addEventListener('pointerdown', (e: PointerEvent) => this.onTouchStart(e), { passive: false });
      canvas.addEventListener('pointermove', (e: PointerEvent) => this.onTouchMove(e), { passive: false });
      canvas.addEventListener('pointerup', (e: PointerEvent) => this.onTouchEnd(e), { passive: false });
      canvas.addEventListener('pointercancel', (e: PointerEvent) => this.onTouchEnd(e), { passive: false });

      // Prevent context menu on long press
      canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());

      debugLog.info(TAG, 'Mobile pointer event listeners added');
    } else {
      // Desktop: keyboard + mouse
      window.addEventListener('keydown', (e) => this.onKeyDown(e));
      window.addEventListener('keyup', (e) => this.onKeyUp(e));
      canvas.addEventListener('pointerdown', (e: PointerEvent) => this.onMouseDown(e));
      canvas.addEventListener('pointerup', (e: PointerEvent) => this.onMouseUp(e));
      canvas.addEventListener('pointermove', (e: PointerEvent) => this.onMouseMove(e));
      canvas.addEventListener('contextmenu', (e: Event) => e.preventDefault());

      debugLog.info(TAG, 'Desktop keyboard + mouse event listeners added');
    }
  }

  // ─── Desktop handlers ──────────────────────────────────────

  private onKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code);
  }

  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }

  private onMouseDown(event: PointerEvent): void {
    this.mouseDown = true;
    this.updateMousePosition(event);
  }

  private onMouseUp(_event: PointerEvent): void {
    this.mouseDown = false;
  }

  private onMouseMove(event: PointerEvent): void {
    this.updateMousePosition(event);
  }

  private updateMousePosition(event: PointerEvent): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    this.mousePosition = new Vector2(event.clientX - rect.left, event.clientY - rect.top);
  }

  // ─── Mobile multi-touch handlers ───────────────────────────

  /**
   * Determine if a screen position is within the joystick activation zone.
   * The zone is the bottom-left quadrant of the screen.
   */
  private isInJoystickZone(x: number, y: number): boolean {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return false;
    const rect = canvas.getBoundingClientRect();
    // Bottom-left quadrant: left 40% of screen, bottom 50%
    return x < rect.width * 0.4 && y > rect.height * 0.5;
  }

  private onTouchStart(event: PointerEvent): void {
    event.preventDefault();

    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    // Capture this pointer so we get move/up even if finger leaves canvas
    canvas.setPointerCapture(event.pointerId);

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    // Determine role: joystick if in zone and no joystick pointer active
    const isJoystick = this.joystickPointerId === -1 && this.isInJoystickZone(x, y);

    const pointer: TrackedPointer = {
      id: event.pointerId,
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      role: isJoystick ? 'joystick' : 'shoot',
    };

    this.pointers.set(event.pointerId, pointer);

    if (isJoystick) {
      this.joystickPointerId = event.pointerId;
      this.joystickVisible = true;
      this.joystickBaseX = x;
      this.joystickBaseY = y;
      this.joystickKnobX = x;
      this.joystickKnobY = y;
    } else {
      // Shoot touch — record screen position for aim calculation
      this.lastShootScreenPos = new Vector2(x, y);
    }
  }

  private onTouchMove(event: PointerEvent): void {
    event.preventDefault();

    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;

    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    pointer.currentX = event.clientX - rect.left;
    pointer.currentY = event.clientY - rect.top;

    if (pointer.role === 'joystick') {
      // Clamp joystick knob to max radius
      const dx = pointer.currentX - pointer.startX;
      const dy = pointer.currentY - pointer.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist > JOYSTICK_RADIUS) {
        const scale = JOYSTICK_RADIUS / dist;
        this.joystickKnobX = pointer.startX + dx * scale;
        this.joystickKnobY = pointer.startY + dy * scale;
      } else {
        this.joystickKnobX = pointer.currentX;
        this.joystickKnobY = pointer.currentY;
      }
    } else {
      // Update shoot aim position while dragging
      this.lastShootScreenPos = new Vector2(pointer.currentX, pointer.currentY);
    }
  }

  private onTouchEnd(event: PointerEvent): void {
    const pointer = this.pointers.get(event.pointerId);
    if (!pointer) return;

    if (pointer.role === 'joystick') {
      this.joystickPointerId = -1;
      this.joystickVisible = false;
    }

    this.pointers.delete(event.pointerId);
  }

  // ─── Per-frame update ──────────────────────────────────────

  /**
   * Update input state (called each frame)
   */
  update(deltaTime: number): void {
    this.inputState.movement = this.getMovementDirection();
    this.inputState.aimPoint = this.getAimPoint();
    this.inputState.shooting = this.getShootingState();

    // Decay shoot flash
    if (this.shootFlashTimer > 0) {
      this.shootFlashTimer -= deltaTime;
      if (this.shootFlashTimer < 0) this.shootFlashTimer = 0;
    }
  }

  /**
   * Trigger the muzzle flash effect (called by Game when a shot fires)
   */
  triggerShootFlash(): void {
    this.shootFlashTimer = 0.08;
  }

  /**
   * Get movement direction from keyboard or virtual joystick
   */
  private getMovementDirection(): Vector2 {
    if (this.mobile) {
      if (this.joystickPointerId === -1) return Vector2.Zero();

      const pointer = this.pointers.get(this.joystickPointerId);
      if (!pointer) return Vector2.Zero();

      const dx = pointer.currentX - pointer.startX;
      const dy = pointer.currentY - pointer.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < JOYSTICK_DEAD_ZONE) return Vector2.Zero();

      // Normalize and apply magnitude scaling (clamped to 1.0)
      const magnitude = Math.min(dist / JOYSTICK_RADIUS, 1.0);
      const nx = dx / dist;
      const ny = dy / dist;

      // Map screen coordinates to game: x→x (right), y→-z (up on screen = forward)
      return new Vector2(nx * magnitude, -ny * magnitude);
    } else {
      // Keyboard (WASD or arrow keys)
      let x = 0;
      let y = 0;

      if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y += 1;
      if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y -= 1;
      if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
      if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;

      if (x !== 0 || y !== 0) {
        return new Vector2(x, y).normalize();
      }
      return Vector2.Zero();
    }
  }

  /**
   * Determine if the player should be shooting this frame
   */
  private getShootingState(): boolean {
    if (this.mobile) {
      // Any active pointer with role 'shoot' means shooting
      for (const pointer of this.pointers.values()) {
        if (pointer.role === 'shoot') return true;
      }
      return false;
    } else {
      return this.mouseDown;
    }
  }

  /**
   * Raycast from camera through pointer to find aim point on ground plane
   */
  private getAimPoint(): Vector3 {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return Vector3.Zero();

    const camera = this.scene.activeCamera;
    if (!camera) return Vector3.Zero();

    let screenPos: Vector2;

    if (this.mobile) {
      // Use last shoot touch position, or screen center as fallback
      if (this.lastShootScreenPos) {
        screenPos = this.lastShootScreenPos;
      } else {
        const rect = canvas.getBoundingClientRect();
        screenPos = new Vector2(rect.width / 2, rect.height / 2);
      }
    } else {
      screenPos = this.mousePosition;
    }

    // Create a ray from the camera through the screen position
    const ray = this.scene.createPickingRay(
      screenPos.x,
      screenPos.y,
      null,
      camera
    );

    // Intersect with the ground plane (y = 0)
    const groundY = 0;
    const t = (groundY - ray.origin.y) / ray.direction.y;

    if (t > 0) {
      return ray.origin.add(ray.direction.scale(t));
    }

    return Vector3.Zero();
  }

  /**
   * Get the current input state
   */
  getState(): InputState {
    return this.inputState;
  }
}
