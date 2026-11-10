import * as THREE from 'three';
import { WorldMaterialLibrary } from '../world/Materials';
import { groundHeightAt } from '../world/TerrainSystem';
import { TramSystem } from '../world/TramSystem';
import { ObstacleBox2D } from '../world/types';
import { AudioManager } from './AudioManager';
import { CHARACTERS_CONFIG, INITIAL_SPAWN } from './config/charactersConfig';
import {
  CORE_MEMORY_IDS,
  POINTS_OF_INTEREST,
  TRAM_DESTINATIONS,
} from './config/locationsConfig';
import { InteriorSystem } from './InteriorSystem';
import { PixelSpriteFactory, SpriteSheetBundle } from './PixelSpriteFactory';
import {
  ActiveInteriorId,
  GameTelemetry,
  InteriorInteractablePrompt,
  PointOfInterest,
  ProjectedPOI,
  TramRideState,
} from './types';

interface SpriteActor {
  id: 'adi' | 'damini' | 'sunny';
  root: THREE.Group;
  billboard: THREE.Mesh;
  shadow: THREE.Mesh;
  texture: THREE.Texture;
  facingLeft: boolean;
  frameIndex: number;
  animTimer: number;
  velocity: THREE.Vector2;
  isMoving: boolean;
}

const _camRight = new THREE.Vector3();
const _camForward = new THREE.Vector3();
const _proj = new THREE.Vector3();

/**
 * Manages 2D pixel-art character sprites (Adi, Damini, Sunny) inside the 3D Melbourne world:
 * - Camera-relative isometric WASD/Arrow movement with obstacle sliding & bridge deck grounding
 * - Natural obstacle-avoiding companion AI for Damini & Sunny
 * - Petting interaction with Sunny
 * - Non-instant animated Melbourne Tram ride choreography along TramSystem.mainLoopCurve
 * - Seamless entry/exit into 2.5D Vinyl Cafe & Starlight Arcade cutaway interiors
 */
export class SpriteActorSystem {
  public group = new THREE.Group();
  private spriteFactory = new PixelSpriteFactory();
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private clonedTextures: THREE.Texture[] = [];

  public portraits!: {
    adi: SpriteSheetBundle['portraitDataUrls'];
    damini: SpriteSheetBundle['portraitDataUrls'];
    sunny: SpriteSheetBundle['portraitDataUrls'];
  };

  private adi!: SpriteActor;
  private damini!: SpriteActor;
  private sunny!: SpriteActor;

  private keys = new Set<string>();
  public inputBlocked = false;
  public inDialogue = false;

  public activeInterior: ActiveInteriorId = null;
  private sunnyIdleTimer = 0;
  private sunnyPlayfulTimer = 0;
  private petTimer = 0;
  private sunnyState: GameTelemetry['sunnyState'] = 'following';

  // Non-instant Tram Ride state
  private tramRide: {
    state: TramRideState;
    tramIndex: number;
    startProgress: number;
    endProgress: number;
    deltaProgress: number;
    phaseTimer: number;
    exitPosition: [number, number, number];
  } | null = null;

  private completedMemoryIds: string[] = [];

  // Callbacks to React UI layer
  public onInteractPOI?: (poi: PointOfInterest) => void;
  public onInteractInterior?: (
    actionType: InteriorInteractablePrompt['actionType']
  ) => void;
  public onPetSunny?: () => void;

  constructor(
    worldMaterials: WorldMaterialLibrary,
    private worldObstacles: ObstacleBox2D[],
    private tramSystem: TramSystem,
    private interiorSystem: InteriorSystem,
    private audio: AudioManager
  ) {
    this.group.name = 'PlayablePixelCharacters';

    const adiBundle = this.spriteFactory.createAdiBundle();
    const daminiBundle = this.spriteFactory.createDaminiBundle();
    const sunnyBundle = this.spriteFactory.createSunnyBundle();

    this.portraits = {
      adi: adiBundle.portraitDataUrls,
      damini: daminiBundle.portraitDataUrls,
      sunny: sunnyBundle.portraitDataUrls,
    };

    this.adi = this.createActor(
      'adi',
      adiBundle.texture,
      INITIAL_SPAWN.adi,
      worldMaterials
    );
    this.damini = this.createActor(
      'damini',
      daminiBundle.texture,
      INITIAL_SPAWN.damini,
      worldMaterials
    );
    this.sunny = this.createActor(
      'sunny',
      sunnyBundle.texture,
      INITIAL_SPAWN.sunny,
      worldMaterials
    );

    window.addEventListener('keydown', this.onKeyDown);
    window.addEventListener('keyup', this.onKeyUp);
  }

  public setCompletedMemories(ids: string[]): void {
    this.completedMemoryIds = ids;
  }

  private createActor(
    id: 'adi' | 'damini' | 'sunny',
    sheetTexture: THREE.Texture,
    spawn: [number, number, number],
    worldMaterials: WorldMaterialLibrary
  ): SpriteActor {
    const cfg = CHARACTERS_CONFIG[id];
    const root = new THREE.Group();
    const gy = this.getSurfaceHeight(spawn[0], spawn[2]);
    root.position.set(spawn[0], gy, spawn[2]);

    // Clone texture header so each character slices independent UV frames from its sprite sheet
    const tex = sheetTexture.clone();
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.ClampToEdgeWrapping;
    tex.repeat.set(1 / 8, 1);
    tex.offset.set(0, 0);
    tex.needsUpdate = true;
    this.clonedTextures.push(tex);

    // Grounded bottom-center plane so feet sit flush on ground at Y = 0
    const planeGeo = new THREE.PlaneGeometry(
      cfg.worldWidthMeters,
      cfg.worldHeightMeters
    );
    planeGeo.translate(0, cfg.worldHeightMeters * 0.5, 0);
    this.geometries.push(planeGeo);

    const spriteMat = new THREE.MeshStandardMaterial({
      map: tex,
      alphaTest: 0.45,
      side: THREE.DoubleSide,
      roughness: 0.86,
      metalness: 0.0,
      emissive: new THREE.Color(0xfff0d8),
      emissiveMap: tex,
      emissiveIntensity: 0.12,
    });
    this.materials.push(spriteMat);

    const depthMat = new THREE.MeshDepthMaterial({
      depthPacking: THREE.RGBADepthPacking,
      map: tex,
      alphaTest: 0.45,
    });
    this.materials.push(depthMat);

    const billboard = new THREE.Mesh(planeGeo, spriteMat);
    billboard.customDepthMaterial = depthMat;
    billboard.castShadow = true;
    billboard.receiveShadow = false;
    root.add(billboard);

    // Grounded contact shadow disc
    const shadowGeo = new THREE.PlaneGeometry(
      cfg.shadowRadius * 2.1,
      cfg.shadowRadius * 1.45
    );
    shadowGeo.rotateX(-Math.PI / 2);
    this.geometries.push(shadowGeo);
    const shadow = new THREE.Mesh(shadowGeo, worldMaterials.contactShadow);
    shadow.position.y = 0.03;
    root.add(shadow);

    this.group.add(root);

    return {
      id,
      root,
      billboard,
      shadow,
      texture: tex,
      facingLeft: false,
      frameIndex: 0,
      animTimer: 0,
      velocity: new THREE.Vector2(),
      isMoving: false,
    };
  }

  private setActorFrame(actor: SpriteActor, frame: number, flipLeft: boolean): void {
    const f = ((frame % 8) + 8) % 8;
    if (actor.frameIndex === f && actor.facingLeft === flipLeft) return;
    actor.frameIndex = f;
    actor.facingLeft = flipLeft;
    const step = 1 / 8;
    if (flipLeft) {
      actor.texture.repeat.set(-step, 1);
      actor.texture.offset.set((f + 1) * step, 0);
    } else {
      actor.texture.repeat.set(step, 1);
      actor.texture.offset.set(f * step, 0);
    }
  }

  /**
   * Exact walkable surface elevation including Melbourne bridges & cutaway interiors.
   */
  public getSurfaceHeight(x: number, z: number): number {
    if (this.activeInterior) {
      return 0.02;
    }

    // 1. Princes Bridge over Yarra River (X ∈ [-9.8, 9.8], Z ∈ [12.8, 43.2])
    if (x >= -9.8 && x <= 9.8 && z >= 12.8 && z <= 43.2) {
      return Math.abs(x) > 7.1 ? 0.16 : 0.09;
    }

    // 2. Evan Walker Pedestrian Bridge (X ∈ [-54.1, -49.9], Z ∈ [13.2, 42.8])
    if (x >= -54.1 && x <= -49.9 && z >= 13.2 && z <= 42.8) {
      const t = THREE.MathUtils.clamp((z - 13.5) / 29.0, 0, 1);
      return 0.19 + Math.sin(t * Math.PI) * 0.85;
    }

    // 3. Botanic Gardens Curved Timber Bridge over Ornamental Lake (X ∈ [90.7, 93.3], Z ∈ [73.6, 96.4])
    if (x >= 90.7 && x <= 93.3 && z >= 73.6 && z <= 96.4) {
      const t = THREE.MathUtils.clamp((z - 74.0) / 22.0, 0, 1);
      return -0.04 + Math.sin(t * Math.PI) * 1.35;
    }

    return Math.max(0, groundHeightAt(x, z));
  }

  private isOnBridgeDeck(x: number, z: number): boolean {
    if (x >= -9.6 && x <= 9.6 && z >= 12.6 && z <= 43.4) return true;
    if (x >= -54.0 && x <= -50.0 && z >= 13.3 && z <= 42.7) return true;
    if (x >= 90.8 && x <= 93.2 && z >= 73.6 && z <= 96.4) return true;
    return false;
  }

  public isPositionWalkable(x: number, z: number, radius = 0.42): boolean {
    if (this.activeInterior) {
      const def = this.interiorSystem.interiors[this.activeInterior];
      if (
        x < def.bounds.minX + radius ||
        x > def.bounds.maxX - radius ||
        z < def.bounds.minZ + radius ||
        z > def.bounds.maxZ - radius
      ) {
        return false;
      }
      for (const o of def.obstacles) {
        if (
          x > o.minX - radius &&
          x < o.maxX + radius &&
          z > o.minZ - radius &&
          z < o.maxZ + radius
        ) {
          return false;
        }
      }
      return true;
    }

    // Exterior world bounds
    if (x < -124 || x > 125 || z < -105 || z > 106) return false;

    const onBridge = this.isOnBridgeDeck(x, z);

    for (let i = 0; i < this.worldObstacles.length; i++) {
      const o = this.worldObstacles[i];
      if (onBridge && o.tag === 'water') continue;
      if (
        x > o.minX - radius &&
        x < o.maxX + radius &&
        z > o.minZ - radius &&
        z < o.maxZ + radius
      ) {
        return false;
      }
    }
    return true;
  }

  private moveWithSlide(
    actor: SpriteActor,
    dx: number,
    dz: number,
    radius: number
  ): boolean {
    const startX = actor.root.position.x;
    const startZ = actor.root.position.z;
    let nextX = startX + dx;
    let nextZ = startZ + dz;

    if (this.isPositionWalkable(nextX, nextZ, radius)) {
      actor.root.position.x = nextX;
      actor.root.position.z = nextZ;
    } else if (this.isPositionWalkable(nextX, startZ, radius)) {
      actor.root.position.x = nextX;
    } else if (this.isPositionWalkable(startX, nextZ, radius)) {
      actor.root.position.z = nextZ;
    } else {
      return false;
    }

    actor.root.position.y = this.getSurfaceHeight(
      actor.root.position.x,
      actor.root.position.z
    );
    return (
      Math.hypot(
        actor.root.position.x - startX,
        actor.root.position.z - startZ
      ) > 0.001
    );
  }

  private onKeyDown = (e: KeyboardEvent): void => {
    if (
      e.target instanceof HTMLInputElement ||
      e.target instanceof HTMLTextAreaElement
    ) {
      return;
    }
    const k = e.key.toLowerCase();
    this.keys.add(k);

    if (
      k === 'w' ||
      k === 'a' ||
      k === 's' ||
      k === 'd' ||
      k.startsWith('arrow')
    ) {
      this.audio.unlockOnUserGesture();
    }

    if (k === 'e' && !e.repeat && !this.inputBlocked && !this.tramRide) {
      this.triggerContextualInteraction();
    }
  };

  private onKeyUp = (e: KeyboardEvent): void => {
    this.keys.delete(e.key.toLowerCase());
  };

  public triggerContextualInteraction(): void {
    if (this.tramRide) return;

    // 1. Inside an interior venue (Vinyl Cafe or Starlight Arcade)
    if (this.activeInterior) {
      const def = this.interiorSystem.interiors[this.activeInterior];
      let best: (typeof def.interactables)[number] | null = null;
      let bestD = Infinity;
      for (const item of def.interactables) {
        const d = Math.hypot(
          this.adi.root.position.x - item.position.x,
          this.adi.root.position.z - item.position.z
        );
        if (d <= item.radius && d < bestD) {
          best = item;
          bestD = d;
        }
      }
      if (best) {
        this.audio.playInteractChime();
        if (best.actionType === 'exit-interior') {
          this.exitInterior();
        } else {
          this.onInteractInterior?.(best.actionType);
        }
        return;
      }
    }

    // 2. Check nearby exterior POI first
    const allCoreDone = CORE_MEMORY_IDS.every((id) =>
      this.completedMemoryIds.includes(id)
    );
    let nearestPOI: PointOfInterest | null = null;
    let nearestDist = Infinity;

    if (!this.activeInterior) {
      for (const poi of POINTS_OF_INTEREST) {
        if (poi.requiresAllCoreMemories && !allCoreDone) continue;
        const d = Math.hypot(
          this.adi.root.position.x - poi.position[0],
          this.adi.root.position.z - poi.position[2]
        );
        if (d <= poi.radius && d < nearestDist) {
          nearestPOI = poi;
          nearestDist = d;
        }
      }
    }

    if (nearestPOI) {
      this.audio.playInteractChime();
      if (nearestPOI.category === 'vinyl-cafe') {
        this.enterInterior('vinyl-cafe');
        return;
      }
      if (nearestPOI.category === 'arcade') {
        this.enterInterior('arcade');
        return;
      }
      this.onInteractPOI?.(nearestPOI);
      return;
    }

    // 3. Otherwise pet Sunny if close by!
    const distToSunny = Math.hypot(
      this.adi.root.position.x - this.sunny.root.position.x,
      this.adi.root.position.z - this.sunny.root.position.z
    );
    if (distToSunny <= 3.1) {
      this.petSunnyNow();
    }
  }

  public petSunnyNow(): void {
    this.petTimer = 1.85;
    this.sunnyState = 'petted';
    this.audio.playSunnyBark();
    const dx = this.sunny.root.position.x - this.adi.root.position.x;
    this.setActorFrame(this.adi, 7, dx < 0);
    this.setActorFrame(this.sunny, 7, dx > 0);
    this.onPetSunny?.();
  }

  public enterInterior(id: Exclude<ActiveInteriorId, null>): void {
    this.activeInterior = id;
    const def = this.interiorSystem.interiors[id];
    this.teleportParty(def.spawnAdi, def.spawnDamini, def.spawnSunny);
  }

  public exitInterior(): void {
    if (!this.activeInterior) return;
    const def = this.interiorSystem.interiors[this.activeInterior];
    this.activeInterior = null;
    const [ex, , ez] = def.exitExteriorPos;
    this.teleportParty([ex, 0, ez], [ex - 1.5, 0, ez + 1.0], [ex + 1.4, 0, ez + 1.1]);
  }

  public teleportParty(
    adiPos: [number, number, number],
    daminiPos?: [number, number, number],
    sunnyPos?: [number, number, number]
  ): void {
    const ax = adiPos[0];
    const az = adiPos[2];
    const dx = daminiPos ? daminiPos[0] : ax - 1.8;
    const dz = daminiPos ? daminiPos[2] : az - 0.8;
    const sx = sunnyPos ? sunnyPos[0] : ax + 1.6;
    const sz = sunnyPos ? sunnyPos[2] : az - 1.0;

    this.adi.root.position.set(ax, this.getSurfaceHeight(ax, az), az);
    this.damini.root.position.set(dx, this.getSurfaceHeight(dx, dz), dz);
    this.sunny.root.position.set(sx, this.getSurfaceHeight(sx, sz), sz);
  }

  /**
   * Starts an authentic non-instant Melbourne Tram journey from originStopId to destStopId!
   */
  public startTramRide(originStopId: string, destStopId: string): void {
    if (originStopId === destStopId) return;
    const originStop = this.tramSystem.stops.find((s) => s.id === originStopId);
    const destStop = this.tramSystem.stops.find((s) => s.id === destStopId);
    const destMeta = TRAM_DESTINATIONS.find((d) => d.stopId === destStopId);
    const originMeta = TRAM_DESTINATIONS.find((d) => d.stopId === originStopId);
    if (!originStop || !destStop || !destMeta) return;

    // Use Tram 0 as our chartered couple tram along the exact Melbourne loop!
    const tramIdx = 0;
    const tram = this.tramSystem.trams[tramIdx];
    const approachStart = (originStop.routeProgress - 0.022 + 1) % 1;
    tram.progress = approachStart;
    tram.waitTimer = 15; // Pause autonomous AI while chartered

    let deltaP = destStop.routeProgress - originStop.routeProgress;
    if (deltaP <= 0) deltaP += 1;

    this.audio.playTramBell();

    this.tramRide = {
      state: {
        active: true,
        phase: 'approaching',
        originTitle: originMeta?.title ?? originStop.name,
        destinationTitle: destMeta.title,
        routeBadge: destMeta.routeBadge,
        progress01: 0,
      },
      tramIndex: tramIdx,
      startProgress: originStop.routeProgress,
      endProgress: destStop.routeProgress,
      deltaProgress: deltaP,
      phaseTimer: 0,
      exitPosition: destMeta.exitPosition,
    };
  }

  private updateTramRide(dt: number): void {
    if (!this.tramRide) return;
    const r = this.tramRide;
    const tram = this.tramSystem.trams[r.tramIndex];
    tram.waitTimer = 10;
    r.phaseTimer += dt;

    if (r.state.phase === 'approaching') {
      const t = Math.min(1, r.phaseTimer / 0.95);
      const ease = 1 - Math.pow(1 - t, 3);
      const fromP = r.startProgress - 0.022;
      tram.progress = ((fromP + 0.022 * ease) % 1 + 1) % 1;
      r.state.progress01 = t * 0.15;

      if (t >= 1) {
        r.state.phase = 'boarding';
        r.phaseTimer = 0;
      }
    } else if (r.state.phase === 'boarding') {
      tram.progress = r.startProgress;
      r.state.progress01 = 0.15 + Math.min(1, r.phaseTimer / 0.75) * 0.1;

      if (r.phaseTimer >= 0.35) {
        this.adi.root.visible = false;
        this.damini.root.visible = false;
        this.sunny.root.visible = false;
      }

      if (r.phaseTimer >= 0.75) {
        r.state.phase = 'riding';
        r.phaseTimer = 0;
        this.audio.playTramBell();
      }
    } else if (r.state.phase === 'riding') {
      const rideDuration = THREE.MathUtils.clamp(r.deltaProgress * 7.2, 2.4, 4.4);
      const t = Math.min(1, r.phaseTimer / rideDuration);
      // Smooth ease-in-out S-curve along the Melbourne tram tracks
      const smooth = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      tram.progress = (r.startProgress + r.deltaProgress * smooth) % 1;
      r.state.progress01 = 0.25 + t * 0.65;

      // Keep party coordinates synced under the moving tram so camera tracks seamlessly
      const pt = this.tramSystem.mainLoopCurve.getPointAt(tram.progress);
      this.adi.root.position.set(pt.x, pt.y, pt.z);

      if (t >= 1) {
        r.state.phase = 'arriving';
        r.phaseTimer = 0;
        this.audio.playTramBell();
      }
    } else if (r.state.phase === 'arriving') {
      tram.progress = r.endProgress;
      r.state.progress01 = 0.9 + Math.min(1, r.phaseTimer / 0.7) * 0.1;

      if (r.phaseTimer >= 0.25 && !this.adi.root.visible) {
        this.adi.root.visible = true;
        this.damini.root.visible = true;
        this.sunny.root.visible = true;
        const [ex, , ez] = r.exitPosition;
        const sideSign = ex >= 0 ? 1 : -1;
        this.teleportParty(
          [ex, 0, ez],
          [ex + sideSign * 1.35, 0, ez - 1.15],
          [ex + sideSign * 1.15, 0, ez + 1.25]
        );
      }

      if (r.phaseTimer >= 0.75) {
        tram.waitTimer = 2.0;
        this.tramRide = null;
      }
    }
  }

  public update(
    delta: number,
    camera: THREE.OrthographicCamera,
    cameraAzimuth: number
  ): void {
    const dt = Math.min(delta, 0.08);

    // 1. Handle active Melbourne Tram Ride sequence
    if (this.tramRide) {
      this.updateTramRide(dt);
      this.billboardSpritesToCamera(camera);
      return;
    }

    // Camera-aligned right & forward vectors for intuitive isometric WASD controls
    _camRight.set(Math.cos(cameraAzimuth), 0, -Math.sin(cameraAzimuth));
    _camForward.set(-Math.sin(cameraAzimuth), 0, -Math.cos(cameraAzimuth));

    // 2. Player movement for Adi
    let inputX = 0;
    let inputZ = 0;
    if (!this.inputBlocked && !this.inDialogue && this.petTimer <= 0) {
      if (this.keys.has('w') || this.keys.has('arrowup')) inputZ += 1;
      if (this.keys.has('s') || this.keys.has('arrowdown')) inputZ -= 1;
      if (this.keys.has('d') || this.keys.has('arrowright')) inputX += 1;
      if (this.keys.has('a') || this.keys.has('arrowleft')) inputX -= 1;
    }

    if (this.petTimer > 0) {
      this.petTimer -= dt;
      if (this.petTimer <= 0) {
        this.sunnyState = 'following';
      }
    }

    if (inputX !== 0 || inputZ !== 0) {
      const len = Math.hypot(inputX, inputZ);
      inputX /= len;
      inputZ /= len;

      const moveSpeed = this.activeInterior ? 6.8 : 9.6;
      const worldDx =
        (_camRight.x * inputX + _camForward.x * inputZ) * moveSpeed * dt;
      const worldDz =
        (_camRight.z * inputX + _camForward.z * inputZ) * moveSpeed * dt;

      const moved = this.moveWithSlide(this.adi, worldDx, worldDz, 0.42);
      this.adi.isMoving = moved;

      // Determine left/right facing in screen space
      const screenDot = worldDx * _camRight.x + worldDz * _camRight.z;
      const flipLeft =
        Math.abs(screenDot) > 0.001 ? screenDot < 0 : this.adi.facingLeft;

      if (moved) {
        this.adi.animTimer += dt * 9.5;
        const walkFrame = 2 + (Math.floor(this.adi.animTimer) % 4);
        this.setActorFrame(this.adi, walkFrame, flipLeft);
      } else {
        this.setActorFrame(this.adi, 0, flipLeft);
      }
    } else {
      this.adi.isMoving = false;
      if (this.petTimer > 0) {
        const dx = this.sunny.root.position.x - this.adi.root.position.x;
        const screenDot = dx * _camRight.x + (this.sunny.root.position.z - this.adi.root.position.z) * _camRight.z;
        this.setActorFrame(this.adi, 7, screenDot < 0);
      } else if (this.inDialogue) {
        const dx = this.damini.root.position.x - this.adi.root.position.x;
        const dz = this.damini.root.position.z - this.adi.root.position.z;
        const screenDot = dx * _camRight.x + dz * _camRight.z;
        this.adi.animTimer += dt * 2.2;
        this.setActorFrame(
          this.adi,
          Math.floor(this.adi.animTimer) % 2 === 0 ? 0 : 6,
          screenDot < 0
        );
      } else {
        this.adi.animTimer += dt * 1.9;
        const idleFrame = Math.floor(this.adi.animTimer) % 2;
        this.setActorFrame(this.adi, idleFrame, this.adi.facingLeft);
      }
    }

    // 3. Companion AI for Damini (natural following, obstacle steering, personal space)
    this.updateDaminiCompanion(dt);

    // 4. Golden Retriever AI for Sunny (following, tail wagging, sitting, playful bounce)
    this.updateSunnyCompanion(dt);

    // 5. Camera-facing sprite billboarding
    this.billboardSpritesToCamera(camera);
  }

  private updateDaminiCompanion(dt: number): void {
    const ax = this.adi.root.position.x;
    const az = this.adi.root.position.z;
    const dx = ax - this.damini.root.position.x;
    const dz = az - this.damini.root.position.z;
    const dist = Math.hypot(dx, dz);

    // Emergency catch-up only if very far behind (never teleports constantly)
    if (dist > 22) {
      const tx = ax - _camRight.x * 1.8;
      const tz = az - _camRight.z * 1.8;
      if (this.isPositionWalkable(tx, tz, 0.4)) {
        this.damini.root.position.set(tx, this.getSurfaceHeight(tx, tz), tz);
        return;
      }
    }

    if (this.inDialogue) {
      // Turn warmly toward Adi during conversations
      const screenDot = dx * _camRight.x + dz * _camRight.z;
      this.damini.animTimer += dt * 2.4;
      const talkFrame = Math.floor(this.damini.animTimer) % 2 === 0 ? 0 : 7;
      this.setActorFrame(this.damini, talkFrame, screenDot < 0);
      this.damini.isMoving = false;
      return;
    }

    const comfortDist = 2.05;
    if (dist > comfortDist) {
      const baseAngle = Math.atan2(dz, dx);
      const speed =
        dist > 4.5
          ? (this.activeInterior ? 7.2 : 10.2)
          : (this.activeInterior ? 6.2 : 8.9);
      const stepLen = Math.min(dist - comfortDist + 0.05, speed * dt);

      // Multi-angle obstacle steering so Damini routes smoothly around corners/planters
      const steerOffsets = [0, 0.45, -0.45, 0.9, -0.9, 1.35, -1.35];
      let moved = false;
      let moveVx = 0;
      let moveVz = 0;

      for (const angOff of steerOffsets) {
        const ang = baseAngle + angOff;
        const tryDx = Math.cos(ang) * stepLen;
        const tryDz = Math.sin(ang) * stepLen;
        if (this.moveWithSlide(this.damini, tryDx, tryDz, 0.38)) {
          moved = true;
          moveVx = tryDx;
          moveVz = tryDz;
          break;
        }
      }

      this.damini.isMoving = moved;
      if (moved) {
        const screenDot = moveVx * _camRight.x + moveVz * _camRight.z;
        const flipLeft =
          Math.abs(screenDot) > 0.0005 ? screenDot < 0 : this.damini.facingLeft;
        this.damini.animTimer += dt * 9.2;
        const walkFrame = 2 + (Math.floor(this.damini.animTimer) % 4);
        this.setActorFrame(this.damini, walkFrame, flipLeft);
      }
    } else {
      this.damini.isMoving = false;
      const screenDot = dx * _camRight.x + dz * _camRight.z;
      this.damini.animTimer += dt * 1.8;
      const idleFrame = Math.floor(this.damini.animTimer) % 2;
      this.setActorFrame(this.damini, idleFrame, screenDot < 0);
    }
  }

  private updateSunnyCompanion(dt: number): void {
    if (this.petTimer > 0) {
      this.sunny.billboard.position.y = Math.abs(Math.sin(this.petTimer * 9)) * 0.08;
      const dx = this.adi.root.position.x - this.sunny.root.position.x;
      const dz = this.adi.root.position.z - this.sunny.root.position.z;
      const screenDot = dx * _camRight.x + dz * _camRight.z;
      this.setActorFrame(this.sunny, 7, screenDot < 0);
      return;
    }

    this.sunny.billboard.position.y = 0;

    // Target a happy spot slightly beside Adi & Damini so the trio never stacks on one line
    const targetX = this.adi.root.position.x + _camRight.x * 1.45 - _camForward.x * 0.9;
    const targetZ = this.adi.root.position.z + _camRight.z * 1.45 - _camForward.z * 0.9;
    const dx = targetX - this.sunny.root.position.x;
    const dz = targetZ - this.sunny.root.position.z;
    const dist = Math.hypot(dx, dz);

    if (dist > 23) {
      if (this.isPositionWalkable(targetX, targetZ, 0.35)) {
        this.sunny.root.position.set(
          targetX,
          this.getSurfaceHeight(targetX, targetZ),
          targetZ
        );
        return;
      }
    }

    if (dist > 1.35) {
      this.sunnyIdleTimer = 0;
      this.sunnyState = 'following';
      const baseAngle = Math.atan2(dz, dx);
      const speed = dist > 4.2 ? 10.6 : 8.6;
      const stepLen = Math.min(dist - 1.1, speed * dt);

      const steerOffsets = [0, 0.5, -0.5, 1.0, -1.0];
      let moved = false;
      let vx = 0;
      let vz = 0;
      for (const off of steerOffsets) {
        const ang = baseAngle + off;
        const tdx = Math.cos(ang) * stepLen;
        const tdz = Math.sin(ang) * stepLen;
        if (this.moveWithSlide(this.sunny, tdx, tdz, 0.34)) {
          moved = true;
          vx = tdx;
          vz = tdz;
          break;
        }
      }

      if (moved) {
        const screenDot = vx * _camRight.x + vz * _camRight.z;
        const flipLeft =
          Math.abs(screenDot) > 0.0005 ? screenDot < 0 : this.sunny.facingLeft;
        this.sunny.animTimer += dt * 11.5;
        const trotFrame = 2 + (Math.floor(this.sunny.animTimer) % 4);
        this.setActorFrame(this.sunny, trotFrame, flipLeft);
        return;
      }
    }

    // Idle beside Adi & Damini: wag tail, sit politely after 2.4s, occasional playful hop!
    this.sunnyIdleTimer += dt;
    this.sunnyPlayfulTimer += dt;
    const lookDx = this.adi.root.position.x - this.sunny.root.position.x;
    const lookDz = this.adi.root.position.z - this.sunny.root.position.z;
    const screenDot = lookDx * _camRight.x + lookDz * _camRight.z;
    const flipLeft = screenDot < 0;

    if (this.sunnyPlayfulTimer > 9.5 && this.sunnyPlayfulTimer < 10.3) {
      this.sunnyState = 'playful';
      this.sunny.billboard.position.y =
        Math.abs(Math.sin(this.sunnyPlayfulTimer * 12)) * 0.14;
      this.sunny.animTimer += dt * 10;
      this.setActorFrame(
        this.sunny,
        Math.floor(this.sunny.animTimer) % 2,
        flipLeft
      );
      return;
    }
    if (this.sunnyPlayfulTimer >= 10.3) {
      this.sunnyPlayfulTimer = 0;
    }

    if (this.sunnyIdleTimer > 2.4) {
      this.sunnyState = 'sitting';
      this.setActorFrame(this.sunny, 6, flipLeft);
    } else {
      this.sunnyState = 'following';
      this.sunny.animTimer += dt * 5.2; // Happy wagging tail!
      this.setActorFrame(
        this.sunny,
        Math.floor(this.sunny.animTimer) % 2,
        flipLeft
      );
    }
  }

  private billboardSpritesToCamera(camera: THREE.Camera): void {
    this.adi.billboard.quaternion.copy(camera.quaternion);
    this.damini.billboard.quaternion.copy(camera.quaternion);
    this.sunny.billboard.quaternion.copy(camera.quaternion);
  }

  public getAdiWorldPosition(): THREE.Vector3 {
    return this.adi.root.position;
  }

  public isPlayerMoving(): boolean {
    return this.adi.isMoving;
  }

  public isRidingTram(): boolean {
    return this.tramRide !== null;
  }

  public buildTelemetry(
    camera: THREE.Camera,
    viewportW: number,
    viewportH: number
  ): GameTelemetry {
    const allCoreDone = CORE_MEMORY_IDS.every((id) =>
      this.completedMemoryIds.includes(id)
    );
    const projectedPOIs: ProjectedPOI[] = [];
    let nearbyPOI: ProjectedPOI | null = null;

    if (!this.activeInterior && !this.tramRide) {
      for (const poi of POINTS_OF_INTEREST) {
        const locked = Boolean(poi.requiresAllCoreMemories && !allCoreDone);
        const gy = this.getSurfaceHeight(poi.position[0], poi.position[2]);
        _proj.set(poi.position[0], gy + 2.35, poi.position[2]);
        _proj.project(camera);

        const sx = (_proj.x * 0.5 + 0.5) * viewportW;
        const sy = (-_proj.y * 0.5 + 0.5) * viewportH;
        const visible =
          !locked &&
          _proj.z >= -1 &&
          _proj.z <= 1 &&
          sx > -60 &&
          sx < viewportW + 60 &&
          sy > -60 &&
          sy < viewportH + 60;

        const dist = Math.hypot(
          this.adi.root.position.x - poi.position[0],
          this.adi.root.position.z - poi.position[2]
        );
        const inRange = !locked && dist <= poi.radius;
        const item: ProjectedPOI = {
          id: poi.id,
          title: poi.title,
          subtitle: poi.subtitle,
          category: poi.category,
          promptLabel: poi.promptLabel,
          x: sx,
          y: sy,
          visible,
          inRange,
          completed: this.completedMemoryIds.includes(poi.id),
          locked,
          distance: dist,
        };
        projectedPOIs.push(item);

        if (inRange && (!nearbyPOI || dist < nearbyPOI.distance)) {
          nearbyPOI = item;
        }
      }
    }

    const interiorPrompts = this.interiorSystem.projectPrompts(
      this.activeInterior,
      this.adi.root.position,
      camera,
      viewportW,
      viewportH
    );

    // Project Sunny petting prompt when Adi is close to Sunny and no higher-priority POI is active
    let nearbySunnyPrompt: GameTelemetry['nearbySunnyPrompt'] = null;
    const distSunny = Math.hypot(
      this.adi.root.position.x - this.sunny.root.position.x,
      this.adi.root.position.z - this.sunny.root.position.z
    );
    const anyInteriorActive = interiorPrompts.some((p) => p.inRange);
    if (
      !this.tramRide &&
      !nearbyPOI &&
      !anyInteriorActive &&
      distSunny <= 2.95 &&
      this.petTimer <= 0
    ) {
      _proj.set(
        this.sunny.root.position.x,
        this.sunny.root.position.y + 1.75,
        this.sunny.root.position.z
      );
      _proj.project(camera);
      nearbySunnyPrompt = {
        x: (_proj.x * 0.5 + 0.5) * viewportW,
        y: (-_proj.y * 0.5 + 0.5) * viewportH,
        visible: _proj.z >= -1 && _proj.z <= 1,
      };
    }

    return {
      adiPos: [
        this.adi.root.position.x,
        this.adi.root.position.y,
        this.adi.root.position.z,
      ],
      daminiPos: [
        this.damini.root.position.x,
        this.damini.root.position.y,
        this.damini.root.position.z,
      ],
      sunnyPos: [
        this.sunny.root.position.x,
        this.sunny.root.position.y,
        this.sunny.root.position.z,
      ],
      sunnyState: this.sunnyState,
      activeInterior: this.activeInterior,
      nearbyPOI,
      nearbySunnyPrompt,
      projectedPOIs,
      interiorPrompts,
      tramRide: this.tramRide ? { ...this.tramRide.state } : null,
      isMoving: this.adi.isMoving,
    };
  }

  public dispose(): void {
    window.removeEventListener('keydown', this.onKeyDown);
    window.removeEventListener('keyup', this.onKeyUp);
    this.spriteFactory.dispose();
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    for (const t of this.clonedTextures) t.dispose();
    this.geometries = [];
    this.materials = [];
    this.clonedTextures = [];
  }
}
