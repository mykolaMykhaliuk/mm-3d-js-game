import { Scene } from '@babylonjs/core/scene';
import { Vector2, Vector3 } from '@babylonjs/core/Maths/math.vector';
import { PointerEventTypes } from '@babylonjs/core/Events/pointerEvents';
import { isMobile } from './utils/helpers';
import { debugLog } from './utils/debug-logger';

const TAG = 'InputManager';

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
 * Manages all input (keyboard, mouse, touch) with a unified API
 */
export class InputManager {
  private scene: Scene;
  private mobile: boolean;

  // Keyboard state
  private keys: Set<string> = new Set();

  // Mouse/Touch state
  private pointerPosition: Vector2 = Vector2.Zero();
  private pointerDown: boolean = false;

  // Virtual joystick (mobile only)
  private joystickActive: boolean = false;
  private joystickOrigin: Vector2 = Vector2.Zero();
  private joystickCurrent: Vector2 = Vector2.Zero();

  // Cached input state
  private inputState: InputState = {
    movement: Vector2.Zero(),
    aimPoint: Vector3.Zero(),
    shooting: false,
  };

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
   * Set up DOM and Babylon event listeners
   */
  private setupEventListeners(): void {
    // Keyboard events (desktop)
    if (!this.mobile) {
      window.addEventListener('keydown', (e) => this.onKeyDown(e));
      window.addEventListener('keyup', (e) => this.onKeyUp(e));
      debugLog.info(TAG, 'Keyboard event listeners added (desktop mode)');
    } else {
      debugLog.info(TAG, 'Skipping keyboard listeners (mobile mode)');
    }

    // Pointer events (mouse and touch)
    this.scene.onPointerObservable.add((pointerInfo) => {
      const event = pointerInfo.event as PointerEvent;

      switch (pointerInfo.type) {
        case PointerEventTypes.POINTERDOWN:
          this.onPointerDown(event);
          break;
        case PointerEventTypes.POINTERUP:
          this.onPointerUp(event);
          break;
        case PointerEventTypes.POINTERMOVE:
          this.onPointerMove(event);
          break;
      }
    });
    debugLog.info(TAG, 'Pointer observable registered');
  }

  /**
   * Handle keydown events
   */
  private onKeyDown(event: KeyboardEvent): void {
    this.keys.add(event.code);
  }

  /**
   * Handle keyup events
   */
  private onKeyUp(event: KeyboardEvent): void {
    this.keys.delete(event.code);
  }

  /**
   * Handle pointer down events
   */
  private onPointerDown(event: PointerEvent): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;

    if (this.mobile) {
      // Mobile: left half is joystick, right half is fire
      if (x < rect.width / 2) {
        // Start virtual joystick
        this.joystickActive = true;
        this.joystickOrigin = new Vector2(x, y);
        this.joystickCurrent = new Vector2(x, y);
      } else {
        // Fire button
        this.pointerDown = true;
      }
    } else {
      // Desktop: any click is fire
      this.pointerDown = true;
    }

    this.updatePointerPosition(event);
  }

  /**
   * Handle pointer up events
   */
  private onPointerUp(_event: PointerEvent): void {
    this.pointerDown = false;
    this.joystickActive = false;
  }

  /**
   * Handle pointer move events
   */
  private onPointerMove(event: PointerEvent): void {
    this.updatePointerPosition(event);

    // Update virtual joystick on mobile
    if (this.mobile && this.joystickActive) {
      const canvas = this.scene.getEngine().getRenderingCanvas();
      if (!canvas) return;

      const rect = canvas.getBoundingClientRect();
      const x = event.clientX - rect.left;
      const y = event.clientY - rect.top;
      this.joystickCurrent = new Vector2(x, y);
    }
  }

  /**
   * Update cached pointer position for raycasting
   */
  private updatePointerPosition(event: PointerEvent): void {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    this.pointerPosition = new Vector2(event.clientX - rect.left, event.clientY - rect.top);
  }

  /**
   * Update input state (called each frame)
   */
  update(): void {
    // Update movement direction
    this.inputState.movement = this.getMovementDirection();

    // Update aim point via raycasting
    this.inputState.aimPoint = this.getAimPoint();

    // Update shooting state
    this.inputState.shooting = this.pointerDown;

    // Reset one-frame states
    this.pointerDown = false;
  }

  /**
   * Get the current movement direction
   */
  private getMovementDirection(): Vector2 {
    if (this.mobile && this.joystickActive) {
      // Virtual joystick
      const delta = this.joystickCurrent.subtract(this.joystickOrigin);
      const length = delta.length();
      if (length > 10) {
        // Dead zone
        return delta.normalize();
      }
      return Vector2.Zero();
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
   * Raycast from camera through pointer to find aim point on ground plane
   */
  private getAimPoint(): Vector3 {
    const canvas = this.scene.getEngine().getRenderingCanvas();
    if (!canvas) return Vector3.Zero();

    const camera = this.scene.activeCamera;
    if (!camera) return Vector3.Zero();

    // Create a ray from the camera through the pointer position
    const ray = this.scene.createPickingRay(
      this.pointerPosition.x,
      this.pointerPosition.y,
      null,
      camera
    );

    // Intersect with the ground plane (y = 0)
    const groundY = 0;
    const t = (groundY - ray.origin.y) / ray.direction.y;

    if (t > 0) {
      const intersection = ray.origin.add(ray.direction.scale(t));
      return intersection;
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
