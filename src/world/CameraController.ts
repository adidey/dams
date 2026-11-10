import * as THREE from 'three';

const _forward = new THREE.Vector3();
const _right = new THREE.Vector3();

/**
 * Elevated Three-Quarter Orthographic Isometric Camera Controller.
 * Preserves the exact isometric Melbourne angle & smooth damping while freeing
 * WASD / Arrow keys and E for Adi's movement and world interactions:
 * - Smoothly follows Adi during exploration & tram rides
 * - Supports mouse-drag peeking around the city (auto-resumes following when Adi walks)
 * - Scroll-wheel zoom + `[` / `]` (or `Q`) 45° isometric rotation steps
 */
export class CameraController {
  public camera: THREE.OrthographicCamera;
  public currentTarget = new THREE.Vector3(-21, 0, -83.2);
  public desiredTarget = new THREE.Vector3(-21, 0, -83.2);

  public currentZoom = 1.72;
  public desiredZoom = 1.72;
  public readonly minZoom = 0.46;
  public readonly maxZoom = 3.6;

  public currentAzimuth = Math.PI * 0.235; // ~42.3° classic three-quarter isometric angle
  public desiredAzimuth = Math.PI * 0.235;
  public readonly elevationRad = THREE.MathUtils.degToRad(34.5);
  public readonly cameraDistance = 175;
  public readonly baseFrustumHeight = 76;

  public followPlayer = true;
  public interiorMode = false;

  // Adjustable exterior world bounds
  public bounds = {
    minX: -128,
    maxX: 128,
    minZ: -108,
    maxZ: 108,
  };

  private isDragging = false;
  private lastPointerX = 0;
  private lastPointerY = 0;
  private domElement: HTMLElement;

  constructor(domElement: HTMLElement, width: number, height: number) {
    this.domElement = domElement;
    const aspect = width / Math.max(1, height);
    const halfH = this.baseFrustumHeight * 0.5;
    const halfW = halfH * aspect;

    this.camera = new THREE.OrthographicCamera(
      -halfW,
      halfW,
      halfH,
      -halfH,
      -120,
      460
    );
    this.camera.zoom = this.currentZoom;
    this.syncCameraTransform();
    this.attachEvents();
  }

  private attachEvents(): void {
    window.addEventListener('keydown', this.onKeyDown);
    this.domElement.addEventListener('pointerdown', this.onPointerDown);
    window.addEventListener('pointermove', this.onPointerMove);
    window.addEventListener('pointerup', this.onPointerUp);
    this.domElement.addEventListener('wheel', this.onWheel, { passive: false });
    this.domElement.addEventListener('contextmenu', this.onContextMenu);
  }

  private onContextMenu = (e: Event): void => {
    e.preventDefault();
  };

  private onKeyDown = (e: KeyboardEvent): void => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    const k = e.key.toLowerCase();
    // Use [ and ] (plus Q) for camera rotation so E and WASD never conflict with gameplay!
    if (k === '[' || k === 'q') {
      this.desiredAzimuth -= Math.PI * 0.25;
    } else if (k === ']') {
      this.desiredAzimuth += Math.PI * 0.25;
    } else if (k === 'r') {
      this.followPlayer = true;
      this.desiredAzimuth = Math.PI * 0.235;
      this.desiredZoom = this.interiorMode ? 2.35 : 1.75;
    }
  };

  private onPointerDown = (e: PointerEvent): void => {
    if (e.button !== 0 && e.button !== 2) return;
    this.isDragging = true;
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;
    this.domElement.style.cursor = 'grabbing';
  };

  private onPointerMove = (e: PointerEvent): void => {
    if (!this.isDragging || this.interiorMode) return;
    const dx = e.clientX - this.lastPointerX;
    const dy = e.clientY - this.lastPointerY;
    if (Math.hypot(dx, dy) > 2) {
      this.followPlayer = false;
    }
    this.lastPointerX = e.clientX;
    this.lastPointerY = e.clientY;

    const viewportH = Math.max(1, this.domElement.clientHeight);
    const worldUnitsPerPixel =
      this.baseFrustumHeight / (viewportH * this.currentZoom);

    _right.set(Math.cos(this.currentAzimuth), 0, -Math.sin(this.currentAzimuth));
    _forward.set(-Math.sin(this.currentAzimuth), 0, -Math.cos(this.currentAzimuth));

    const elevComp = 1 / Math.sin(this.elevationRad);
    this.desiredTarget.addScaledVector(_right, -dx * worldUnitsPerPixel);
    this.desiredTarget.addScaledVector(_forward, dy * worldUnitsPerPixel * elevComp);
    this.clampDesiredTarget();
  };

  private onPointerUp = (): void => {
    if (this.isDragging) {
      this.isDragging = false;
      this.domElement.style.cursor = 'grab';
    }
  };

  private onWheel = (e: WheelEvent): void => {
    e.preventDefault();
    const factor = Math.exp(-e.deltaY * 0.0012);
    this.desiredZoom = THREE.MathUtils.clamp(
      this.desiredZoom * factor,
      this.minZoom,
      this.maxZoom
    );
  };

  private clampDesiredTarget(): void {
    if (this.interiorMode) return;
    this.desiredTarget.x = THREE.MathUtils.clamp(
      this.desiredTarget.x,
      this.bounds.minX,
      this.bounds.maxX
    );
    this.desiredTarget.z = THREE.MathUtils.clamp(
      this.desiredTarget.z,
      this.bounds.minZ,
      this.bounds.maxZ
    );
  }

  public trackCharacter(pos: THREE.Vector3, snapImmediately = false): void {
    this.desiredTarget.set(pos.x, pos.y, pos.z);
    this.clampDesiredTarget();
    if (snapImmediately) {
      this.currentTarget.copy(this.desiredTarget);
      this.syncCameraTransform();
    }
  }

  public flyTo(
    x: number,
    y: number,
    z: number,
    zoom: number,
    azimuthDeg?: number
  ): void {
    this.followPlayer = false;
    this.desiredTarget.set(x, y, z);
    this.clampDesiredTarget();
    this.desiredZoom = THREE.MathUtils.clamp(zoom, this.minZoom, this.maxZoom);
    if (azimuthDeg !== undefined) {
      this.desiredAzimuth = THREE.MathUtils.degToRad(azimuthDeg);
    }
  }

  public resetToDefault(): void {
    this.followPlayer = true;
    this.desiredZoom = this.interiorMode ? 2.35 : 1.75;
    this.desiredAzimuth = Math.PI * 0.235;
  }

  public zoomStep(multiplier: number): void {
    this.desiredZoom = THREE.MathUtils.clamp(
      this.desiredZoom * multiplier,
      this.minZoom,
      this.maxZoom
    );
  }

  public resize(width: number, height: number): void {
    const aspect = width / Math.max(1, height);
    const halfH = this.baseFrustumHeight * 0.5;
    const halfW = halfH * aspect;
    this.camera.left = -halfW;
    this.camera.right = halfW;
    this.camera.top = halfH;
    this.camera.bottom = -halfH;
    this.camera.updateProjectionMatrix();
  }

  public update(delta: number): void {
    const dt = Math.min(delta, 0.9);

    const dampLambda = 9.5;
    this.currentTarget.x = THREE.MathUtils.damp(
      this.currentTarget.x,
      this.desiredTarget.x,
      dampLambda,
      dt
    );
    this.currentTarget.y = THREE.MathUtils.damp(
      this.currentTarget.y,
      this.desiredTarget.y,
      dampLambda,
      dt
    );
    this.currentTarget.z = THREE.MathUtils.damp(
      this.currentTarget.z,
      this.desiredTarget.z,
      dampLambda,
      dt
    );

    const prevZoom = this.currentZoom;
    this.currentZoom = THREE.MathUtils.damp(
      this.currentZoom,
      this.desiredZoom,
      8.5,
      dt
    );
    this.currentAzimuth = THREE.MathUtils.damp(
      this.currentAzimuth,
      this.desiredAzimuth,
      7.5,
      dt
    );

    if (Math.abs(this.currentZoom - prevZoom) > 0.0001) {
      this.camera.zoom = this.currentZoom;
      this.camera.updateProjectionMatrix();
    }

    this.syncCameraTransform();
  }

  private syncCameraTransform(): void {
    const horizDist = Math.cos(this.elevationRad) * this.cameraDistance;
    const vertDist = Math.sin(this.elevationRad) * this.cameraDistance;

    this.camera.position.set(
      this.currentTarget.x + Math.sin(this.currentAzimuth) * horizDist,
      this.currentTarget.y + vertDist,
      this.currentTarget.z + Math.cos(this.currentAzimuth) * horizDist
    );
    this.camera.lookAt(this.currentTarget);
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    this.domElement.removeEventListener('pointerdown', this.onPointerDown);
    window.removeEventListener('pointermove', this.onPointerMove);
    window.removeEventListener('pointerup', this.onPointerUp);
    this.domElement.removeEventListener('wheel', this.onWheel);
    this.domElement.removeEventListener('contextmenu', this.onContextMenu);
  }
}
