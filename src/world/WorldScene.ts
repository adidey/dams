import * as THREE from 'three';
import { AudioManager } from '../game/AudioManager';
import { CORE_MEMORY_IDS } from '../game/config/locationsConfig';
import { InteriorSystem } from '../game/InteriorSystem';
import { LandmarkDecorSystem } from '../game/LandmarkDecorSystem';
import { SpriteActorSystem } from '../game/SpriteActorSystem';
import {
  ActiveInteriorId,
  GameTelemetry,
  InteriorInteractablePrompt,
  PointOfInterest,
} from '../game/types';
import { BuildingSystem } from './BuildingSystem';
import { CameraController } from './CameraController';
import { DistrictManager } from './DistrictManager';
import { EnvironmentAssets } from './EnvironmentAssets';
import { LightingSystem } from './LightingSystem';
import { WorldMaterialLibrary } from './Materials';
import { PedestrianSystem } from './PedestrianSystem';
import { ProceduralTextureLibrary } from './ProceduralTextures';
import { RoadNetwork } from './RoadNetwork';
import { TerrainSystem } from './TerrainSystem';
import { TrafficSystem } from './TrafficSystem';
import { TramSystem } from './TramSystem';
import {
  DistrictId,
  LightingPreset,
  ObstacleBox2D,
  ProjectedMarker,
  SpriteWorldAPI,
  TramStatusSnapshot,
} from './types';
import { VegetationSystem } from './VegetationSystem';

export interface SceneTelemetry {
  activeDistrict: DistrictId;
  targetX: number;
  targetZ: number;
  zoom: number;
  markers: ProjectedMarker[];
  trams: TramStatusSnapshot[];
  followingTramId: string | null;
  game: GameTelemetry;
}

export interface WorldSceneCallbacks {
  onTelemetry?: (data: SceneTelemetry) => void;
  onInteractPOI?: (poi: PointOfInterest) => void;
  onInteractInterior?: (
    actionType: InteriorInteractablePrompt['actionType']
  ) => void;
  onPetSunny?: () => void;
}

/**
 * Master Three.js orchestrator for MELBOURNE DREAMLAND.
 * Preserves 100% of the approved Melbourne 2.5D city and layers the Milestone 2
 * playable relationship adventure (Adi, Damini, Sunny, POIs, Tram Travel, Vinyl Cafe & Arcade)
 * cleanly on top.
 */
export class WorldScene {
  public scene: THREE.Scene;
  public renderer: THREE.WebGLRenderer;
  public cameraController: CameraController;
  public districtManager: DistrictManager;
  public audio: AudioManager;
  public actorSystem: SpriteActorSystem;
  public interiorSystem: InteriorSystem;
  public landmarkDecor: LandmarkDecorSystem;

  private textures: ProceduralTextureLibrary;
  private materials: WorldMaterialLibrary;
  private lighting: LightingSystem;
  private terrain: TerrainSystem;
  private roads: RoadNetwork;
  private buildings: BuildingSystem;
  private vegetation: VegetationSystem;
  private envAssets: EnvironmentAssets;
  public tramSystem: TramSystem;
  private trafficSystem: TrafficSystem;
  private pedestrianSystem: PedestrianSystem;

  public spriteCharacterLayer = new THREE.Group();

  private obstacles: ObstacleBox2D[] = [];
  private isSoftwareGl: boolean;
  private clock = new THREE.Clock();
  private frameId = 0;
  private disposed = false;
  private showMarkers = false;
  private followingTramId: string | null = null;
  private pinnedDistrict: DistrictId | null = null;
  private completedMemoryIds: string[] = [];
  private prevInterior: ActiveInteriorId = null;
  private hudTimer = 0;
  private callbacks: WorldSceneCallbacks;

  constructor(
    container: HTMLElement,
    callbacks: WorldSceneCallbacks = {},
    initialMuted = false,
    initialMood: Parameters<AudioManager['setMood']>[0] = 'fitzroy-gold',
    initialCompletedMemories: string[] = []
  ) {
    this.callbacks = callbacks;
    this.completedMemoryIds = initialCompletedMemories;

    // 1. Software-WebGL guard per Three.js studio directive
    this.isSoftwareGl = (() => {
      const probeCanvas = document.createElement('canvas');
      const gl = probeCanvas.getContext('webgl2');
      if (!gl) return true;
      const ext = gl.getExtension('WEBGL_debug_renderer_info');
      const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
      const gpu = String(gl.getParameter(param));
      gl.getExtension('WEBGL_lose_context')?.loseContext();
      return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
    })();

    const width = container.clientWidth || window.innerWidth;
    const height = container.clientHeight || window.innerHeight;

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.08;
    this.renderer.setPixelRatio(
      this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 1.25)
    );
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    this.renderer.domElement.style.cursor = 'grab';
    container.appendChild(this.renderer.domElement);

    this.renderer.domElement.addEventListener('webglcontextlost', (e) => {
      e.preventDefault();
    });

    // 2. Scene & Camera Controller
    this.scene = new THREE.Scene();
    this.cameraController = new CameraController(
      this.renderer.domElement,
      width,
      height
    );
    this.districtManager = new DistrictManager();
    this.audio = new AudioManager(initialMuted, initialMood);

    // 3. Modular Melbourne Environment Systems (100% preserved!)
    this.textures = new ProceduralTextureLibrary(this.renderer);
    this.materials = new WorldMaterialLibrary(this.textures, this.isSoftwareGl);
    this.lighting = new LightingSystem(
      this.scene,
      this.renderer,
      this.isSoftwareGl
    );
    this.scene.add(this.lighting.group);

    this.terrain = new TerrainSystem(this.materials, this.obstacles);
    this.scene.add(this.terrain.group);

    this.roads = new RoadNetwork(this.materials);
    this.scene.add(this.roads.group);

    this.buildings = new BuildingSystem(this.materials, this.obstacles);
    this.scene.add(this.buildings.group);

    this.envAssets = new EnvironmentAssets(this.materials, this.obstacles);
    this.scene.add(this.envAssets.group);

    this.vegetation = new VegetationSystem(this.materials, this.obstacles);
    this.scene.add(this.vegetation.group);

    this.tramSystem = new TramSystem(this.materials);
    this.scene.add(this.tramSystem.group);

    this.trafficSystem = new TrafficSystem(
      this.materials,
      this.obstacles,
      this.isSoftwareGl
    );
    this.scene.add(this.trafficSystem.group);

    this.pedestrianSystem = new PedestrianSystem(this.materials);
    this.scene.add(this.pedestrianSystem.group);

    // 4. Additive Milestone 2 Playable Adventure Layer
    this.landmarkDecor = new LandmarkDecorSystem(this.materials, this.renderer);
    this.scene.add(this.landmarkDecor.group);

    this.interiorSystem = new InteriorSystem(this.materials, this.renderer);
    this.scene.add(this.interiorSystem.group);

    this.spriteCharacterLayer.name = 'PlayablePixelSpriteLayer';
    this.scene.add(this.spriteCharacterLayer);

    this.actorSystem = new SpriteActorSystem(
      this.materials,
      this.obstacles,
      this.tramSystem,
      this.interiorSystem,
      this.audio
    );
    this.actorSystem.setCompletedMemories(this.completedMemoryIds);
    this.actorSystem.onInteractPOI = (poi) => this.callbacks.onInteractPOI?.(poi);
    this.actorSystem.onInteractInterior = (act) =>
      this.callbacks.onInteractInterior?.(act);
    this.actorSystem.onPetSunny = () => this.callbacks.onPetSunny?.();
    this.spriteCharacterLayer.add(this.actorSystem.group);

    // Frame Adi, Damini & Sunny in Parkville near International House on launch
    const startPos = this.actorSystem.getAdiWorldPosition();
    this.cameraController.trackCharacter(startPos, true);
    this.cameraController.desiredZoom = 1.78;
    this.cameraController.currentZoom = 1.78;
    this.cameraController.camera.zoom = 1.78;
    this.cameraController.camera.updateProjectionMatrix();

    window.addEventListener('resize', this.onResize);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.cameraController.camera);
    }

    this.clock.start();
    this.tick();
  }

  public syncCompletedMemories(ids: string[]): void {
    this.completedMemoryIds = ids;
    this.actorSystem.setCompletedMemories(ids);
    this.hudTimer = 1;
  }

  public setModalOpen(isOpen: boolean, inDialogue = false): void {
    this.actorSystem.inputBlocked = isOpen;
    this.actorSystem.inDialogue = inDialogue;
  }

  private onResize = (): void => {
    if (this.disposed) return;
    const parent = this.renderer.domElement.parentElement;
    const w = parent ? parent.clientWidth : window.innerWidth;
    const h = parent ? parent.clientHeight : window.innerHeight;
    this.cameraController.resize(w, h);
    this.renderer.setSize(w, h);
  };

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl || typeof gl.fenceSync !== 'function') {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync && gl.getSyncParameter(sync, gl.SYNC_STATUS);
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  private tick = (): void => {
    if (this.disposed) return;

    const rawDelta = this.clock.getDelta();
    const simDelta = Math.min(rawDelta, 0.1);
    const camDelta = Math.min(rawDelta, this.isSoftwareGl ? 0.9 : 0.18);
    const elapsed = this.clock.elapsedTime;

    const allCoreDone = CORE_MEMORY_IDS.every((id) =>
      this.completedMemoryIds.includes(id)
    );

    // Advance dynamic Melbourne city & playable character systems
    this.materials.update(elapsed, this.textures);
    this.buildings.update(simDelta);
    this.envAssets.update(elapsed);
    this.tramSystem.update(simDelta);
    this.trafficSystem.update(simDelta, this.tramSystem);
    this.pedestrianSystem.update(simDelta, elapsed);
    this.landmarkDecor.update(elapsed, this.completedMemoryIds, allCoreDone);
    this.interiorSystem.update(elapsed);

    this.actorSystem.update(
      simDelta,
      this.cameraController.camera,
      this.cameraController.currentAzimuth
    );

    // Handle smooth camera transition when entering/exiting 2.5D cutaway interiors
    const curInterior = this.actorSystem.activeInterior;
    if (curInterior !== this.prevInterior) {
      this.prevInterior = curInterior;
      this.cameraController.interiorMode = curInterior !== null;
      this.cameraController.followPlayer = true;
      if (curInterior) {
        const def = this.interiorSystem.interiors[curInterior];
        this.cameraController.desiredAzimuth = Math.PI * 0.235;
        this.cameraController.desiredZoom = 3.05;
        this.cameraController.currentZoom = 3.05;
        this.cameraController.camera.zoom = 3.05;
        this.cameraController.camera.updateProjectionMatrix();
        this.cameraController.trackCharacter(def.center, true);
      } else {
        this.cameraController.desiredZoom = 1.85;
        this.cameraController.currentZoom = 1.85;
        this.cameraController.camera.zoom = 1.85;
        this.cameraController.camera.updateProjectionMatrix();
        this.cameraController.trackCharacter(
          this.actorSystem.getAdiWorldPosition(),
          true
        );
      }
    }

    // Resume following Adi automatically whenever the player walks or boards a tram
    if (this.actorSystem.isPlayerMoving() || this.actorSystem.isRidingTram()) {
      this.followingTramId = null;
      this.pinnedDistrict = null;
      this.cameraController.followPlayer = true;
    }

    if (curInterior) {
      const def = this.interiorSystem.interiors[curInterior];
      this.cameraController.trackCharacter(def.center, false);
    } else if (this.followingTramId) {
      const tram = this.tramSystem.trams.find(
        (t) => t.id === this.followingTramId
      );
      if (tram) {
        this.cameraController.desiredTarget.set(
          tram.mesh.position.x,
          0,
          tram.mesh.position.z
        );
      }
    } else if (this.cameraController.followPlayer) {
      this.cameraController.trackCharacter(
        this.actorSystem.getAdiWorldPosition(),
        false
      );
    }

    this.cameraController.update(camDelta);
    this.lighting.syncShadowTarget(this.cameraController.currentTarget);

    this.renderer.render(this.scene, this.cameraController.camera);

    // Emit HUD & game telemetry smoothly (~16 Hz)
    this.hudTimer += simDelta;
    if (this.hudTimer >= 0.06 && this.callbacks.onTelemetry) {
      this.hudTimer = 0;
      const w = this.renderer.domElement.clientWidth;
      const h = this.renderer.domElement.clientHeight;
      const ct = this.cameraController.currentTarget;
      const cz = this.cameraController.currentZoom;

      this.callbacks.onTelemetry({
        activeDistrict:
          curInterior !== null
            ? 'arcade'
            : this.pinnedDistrict ??
              this.districtManager.detectDistrictAt(ct.x, ct.z, cz),
        targetX: ct.x,
        targetZ: ct.z,
        zoom: cz,
        markers:
          this.showMarkers && !curInterior
            ? this.districtManager.projectMarkers(
                this.cameraController.camera,
                w,
                h
              )
            : [],
        trams: this.tramSystem.getSnapshots(),
        followingTramId: this.followingTramId,
        game: this.actorSystem.buildTelemetry(
          this.cameraController.camera,
          w,
          h
        ),
      });
    }

    if (this.isSoftwareGl) {
      this.afterDraw(this.tick);
    } else {
      this.frameId = requestAnimationFrame(this.tick);
    }
  };

  public focusCharacter(): void {
    this.followingTramId = null;
    this.pinnedDistrict = null;
    this.cameraController.followPlayer = true;
    if (!this.actorSystem.activeInterior) {
      this.cameraController.desiredZoom = Math.max(
        1.65,
        this.cameraController.desiredZoom
      );
      this.cameraController.trackCharacter(
        this.actorSystem.getAdiWorldPosition(),
        false
      );
    }
  }

  public selectDistrict(id: DistrictId): void {
    if (this.actorSystem.activeInterior) {
      this.actorSystem.exitInterior();
    }
    this.followingTramId = null;
    this.pinnedDistrict = id;
    const preset = this.districtManager.getPreset(id);
    this.cameraController.flyTo(
      preset.target[0],
      preset.target[1],
      preset.target[2],
      preset.zoom,
      preset.azimuthDeg
    );
  }

  public focusPosition(x: number, z: number, zoom = 1.9): void {
    if (this.actorSystem.activeInterior) {
      this.actorSystem.exitInterior();
    }
    this.followingTramId = null;
    this.pinnedDistrict = null;
    this.cameraController.flyTo(x, 0, z, zoom);
  }

  public travelToPosition(x: number, z: number): void {
    if (this.actorSystem.activeInterior) {
      this.actorSystem.exitInterior();
    }
    this.actorSystem.teleportParty([x, 0, z]);
    this.focusCharacter();
  }

  public setLightingPreset(preset: LightingPreset): void {
    this.lighting.applyPreset(preset, this.scene, this.materials);
  }

  public setShowMarkers(visible: boolean): void {
    this.showMarkers = visible;
    this.hudTimer = 1;
  }

  public resetCamera(): void {
    this.followingTramId = null;
    this.cameraController.resetToDefault();
  }

  public zoomBy(factor: number): void {
    this.cameraController.zoomStep(factor);
  }

  public rotateCameraStep(direction: -1 | 1): void {
    this.cameraController.desiredAzimuth += direction * Math.PI * 0.25;
  }

  public getSpriteWorldAPI(): SpriteWorldAPI {
    return {
      getGroundHeight: (x: number, z: number) =>
        this.actorSystem.getSurfaceHeight(x, z),
      isWalkableForSprite: (x: number, z: number, radius = 0.42) =>
        this.actorSystem.isPositionWalkable(x, z, radius),
      getCameraQuaternion: () => this.cameraController.camera.quaternion.clone(),
      attachSpriteLayer: (group: THREE.Group) => {
        this.spriteCharacterLayer.add(group);
      },
    };
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    window.removeEventListener('resize', this.onResize);

    this.audio.dispose();
    this.actorSystem.dispose();
    this.interiorSystem.dispose();
    this.landmarkDecor.dispose();
    this.cameraController.dispose();
    this.textures.dispose();
    this.materials.dispose();
    this.lighting.dispose();
    this.terrain.dispose();
    this.roads.dispose();
    this.buildings.dispose();
    this.vegetation.dispose();
    this.envAssets.dispose();
    this.tramSystem.dispose();
    this.trafficSystem.dispose();
    this.pedestrianSystem.dispose();

    this.renderer.dispose();
    if (this.renderer.domElement.parentElement) {
      this.renderer.domElement.parentElement.removeChild(
        this.renderer.domElement
      );
    }
  }
}
