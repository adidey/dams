import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { WorldMaterialLibrary } from './Materials';
import { LightingPreset } from './types';

/**
 * Warm Cinematic Golden-Hour Melbourne Lighting & Atmosphere System.
 * - Studio IBL via RoomEnvironment + PMREMGenerator
 * - Dynamic camera-tracking PCFSoftShadowMap Sun Rig (keeps street-level shadows razor-sharp across the entire 280m world!)
 * - Warm/Cool HemisphereLight + Cool Rim Fill + Warm Laneway & Arcade Point Lights + Horizon Fog
 */
export class LightingSystem {
  public group = new THREE.Group();
  public sunLight!: THREE.DirectionalLight;
  public hemiLight!: THREE.HemisphereLight;
  public rimLight!: THREE.DirectionalLight;
  public lanewayPointLights: THREE.PointLight[] = [];
  private envMapTexture: THREE.Texture | null = null;
  private sunOffset = new THREE.Vector3(-68, 76, 54);
  private currentPreset: LightingPreset = 'golden-hour';

  constructor(
    scene: THREE.Scene,
    renderer: THREE.WebGLRenderer,
    isSoftwareGl: boolean
  ) {
    this.group.name = 'LightingSystem';

    // 1. Zero-dependency PBR Environment Reflections (Three.js skill best practice)
    const pmrem = new THREE.PMREMGenerator(renderer);
    this.envMapTexture = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = this.envMapTexture;
    scene.environmentIntensity = 0.55;
    pmrem.dispose();

    // 2. Golden-Hour Directional Sun Light (Primary Shadow Caster)
    this.sunLight = new THREE.DirectionalLight(0xffcf8c, 2.35);
    this.sunLight.position.copy(this.sunOffset);
    this.sunLight.castShadow = !isSoftwareGl;
    this.sunLight.shadow.mapSize.set(1024, 1024);

    const d = 78;
    this.sunLight.shadow.camera.left = -d;
    this.sunLight.shadow.camera.right = d;
    this.sunLight.shadow.camera.top = d;
    this.sunLight.shadow.camera.bottom = -d;
    this.sunLight.shadow.camera.near = 8;
    this.sunLight.shadow.camera.far = 230;
    this.sunLight.shadow.bias = -0.00045;
    this.sunLight.shadow.normalBias = 0.025;
    this.sunLight.shadow.radius = 2.4;

    this.group.add(this.sunLight);
    this.group.add(this.sunLight.target);

    // 3. Sky-to-Terracotta-Earth Hemisphere Fill Light
    this.hemiLight = new THREE.HemisphereLight(0x9dc2e6, 0x8a5b3e, 0.85);
    this.hemiLight.position.set(0, 80, 0);
    this.group.add(this.hemiLight);

    // 4. Subtle Cool Rim / Backlight to separate roof silhouettes & foliage canopies
    this.rimLight = new THREE.DirectionalLight(0xaad0f0, 0.45);
    this.rimLight.position.set(65, 50, -60);
    this.group.add(this.rimLight);

    // 5. Intimate Warm Point Lights inside Degraves Lane, Centre Place, Arcade Alley & Southbank Dining
    const warmSpots: Array<[number, number, number, number, number]> = [
      [-28, 3.8, -18, 0xffb459, 14], // Degraves Lane espresso glow
      [26, 3.8, -18, 0xffb459, 14], // Centre Place glow
      [92, 4.4, -22, 0xff9a5c, 22], // Starlight Arcade & Vinyl Alley warm neon pool
      [92, 4.2, -50, 0xffaa5e, 18], // Entertainment Bistro paper-lantern pool
      [-42, 3.6, 48, 0xffbe6b, 18], // Southbank Riverside Al Fresco glow
      [-15, 4.5, -2.5, 0xffc878, 18], // Flinders Heritage Station Concourse glow
    ];

    for (const [lx, ly, lz, hex, dist] of warmSpots) {
      const pl = new THREE.PointLight(hex, 3.2, dist, 1.6);
      pl.position.set(lx, ly, lz);
      this.group.add(pl);
      this.lanewayPointLights.push(pl);
    }

    // 6. Horizon Sky Background & Matching Atmospheric Depth Fog
    scene.background = new THREE.Color(0xe8c79e);
    scene.fog = new THREE.FogExp2(0xe8c79e, 0.0022);
  }

  public applyPreset(
    preset: LightingPreset,
    scene: THREE.Scene,
    materials: WorldMaterialLibrary
  ): void {
    this.currentPreset = preset;
    materials.setEmissiveMood(preset);

    if (preset === 'golden-hour') {
      this.sunOffset.set(-76, 56, 54);
      this.sunLight.color.setHex(0xffb969);
      this.sunLight.intensity = 2.55;
      this.hemiLight.color.setHex(0x9abde0);
      this.hemiLight.groundColor.setHex(0x8f5536);
      this.hemiLight.intensity = 0.82;
      this.rimLight.color.setHex(0xa8ccf0);
      this.rimLight.intensity = 0.42;
      scene.environmentIntensity = 0.42;
      scene.background = new THREE.Color(0xe6be90);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(0xe6be90);
        scene.fog.density = 0.0022;
      }
      for (const pl of this.lanewayPointLights) pl.intensity = 4.2;
    } else {
      // Laneway Dusk — Warm twilight glow where shop windows, trams, arcade neon & lanterns shine!
      this.sunOffset.set(-88, 30, 62);
      this.sunLight.color.setHex(0xe87348);
      this.sunLight.intensity = 0.72;
      this.hemiLight.color.setHex(0x4f6496);
      this.hemiLight.groundColor.setHex(0x38251e);
      this.hemiLight.intensity = 0.58;
      this.rimLight.color.setHex(0x637cb5);
      this.rimLight.intensity = 0.35;
      scene.environmentIntensity = 0.16;
      scene.background = new THREE.Color(0x2f334a);
      if (scene.fog instanceof THREE.FogExp2) {
        scene.fog.color.setHex(0x2f334a);
        scene.fog.density = 0.0026;
      }
      for (const pl of this.lanewayPointLights) pl.intensity = 11.5;
    }
  }

  /**
   * Keeps the DirectionalLight shadow camera centered on the current viewport ground target,
   * quantized to shadow-map texel increments so shadows stay crisp and shimmer-free everywhere!
   */
  public syncShadowTarget(cameraTarget: THREE.Vector3): void {
    const texelStep = (78 * 2) / 2048;
    const sx = Math.round(cameraTarget.x / texelStep) * texelStep;
    const sz = Math.round(cameraTarget.z / texelStep) * texelStep;

    this.sunLight.target.position.set(sx, 0, sz);
    this.sunLight.target.updateMatrixWorld();
    this.sunLight.position.set(
      sx + this.sunOffset.x,
      this.sunOffset.y,
      sz + this.sunOffset.z
    );
  }

  public getPreset(): LightingPreset {
    return this.currentPreset;
  }

  public dispose(): void {
    if (this.envMapTexture) {
      this.envMapTexture.dispose();
      this.envMapTexture = null;
    }
  }
}
