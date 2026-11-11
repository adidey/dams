import * as THREE from 'three';
import { ProceduralTextureLibrary } from './ProceduralTextures';

export interface WaterUniforms {
  uTime: { value: number };
}

/**
 * Reusable PBR material palette tuned for a warm golden-hour Melbourne indie diorama:
 * Calibrated roughness contrast, normal relief maps on masonry & cobbles, filigree lacework,
 * warm interior window emission, Melbourne signage, and animated Yarra water.
 */
export class WorldMaterialLibrary {
  private materials: THREE.Material[] = [];
  public waterUniforms: WaterUniforms = { uTime: { value: 0 } };

  // Terrain & Paving
  public asphalt!: THREE.MeshStandardMaterial;
  public footpathConcrete!: THREE.MeshStandardMaterial;
  public bluestone!: THREE.MeshStandardMaterial;
  public herringboneBrick!: THREE.MeshStandardMaterial;
  public gardenPath!: THREE.MeshStandardMaterial;
  public grass!: THREE.MeshStandardMaterial;
  public grassBotanic!: THREE.MeshStandardMaterial;
  public kerbStone!: THREE.MeshStandardMaterial;
  public roadMarkingCream!: THREE.MeshStandardMaterial;
  public roadMarkingYellow!: THREE.MeshStandardMaterial;
  public timberDeck!: THREE.MeshStandardMaterial;

  // Architecture
  public brickRed!: THREE.MeshStandardMaterial;
  public brickOchre!: THREE.MeshStandardMaterial;
  public brickBrown!: THREE.MeshStandardMaterial;
  public brickCream!: THREE.MeshStandardMaterial;
  public sandstone!: THREE.MeshStandardMaterial;
  public stuccoCream!: THREE.MeshStandardMaterial;
  public stuccoTerracotta!: THREE.MeshStandardMaterial;
  public stuccoSage!: THREE.MeshStandardMaterial;
  public heritageTrimCream!: THREE.MeshStandardMaterial;
  public charcoalIron!: THREE.MeshStandardMaterial;
  public filigreeIron!: THREE.MeshStandardMaterial;
  public galvanizedSteel!: THREE.MeshStandardMaterial;
  public verdigrisCopper!: THREE.MeshStandardMaterial;
  public roofSlate!: THREE.MeshStandardMaterial;
  public terracottaRoof!: THREE.MeshStandardMaterial;
  public corrugatedIron!: THREE.MeshStandardMaterial;
  public modernConcrete!: THREE.MeshStandardMaterial;
  public modernDarkMullion!: THREE.MeshStandardMaterial;
  public architecturalGlass!: THREE.MeshPhysicalMaterial;
  public brassGold!: THREE.MeshStandardMaterial;
  public warmTimber!: THREE.MeshStandardMaterial;
  public darkTimber!: THREE.MeshStandardMaterial;
  public awningStripedGreen!: THREE.MeshStandardMaterial;
  public awningBurgundy!: THREE.MeshStandardMaterial;

  // Windows, Murals & Signage
  public windowWarmLit!: THREE.MeshStandardMaterial;
  public windowAmberCurtain!: THREE.MeshStandardMaterial;
  public windowDaylight!: THREE.MeshStandardMaterial;
  public cafeWindow!: THREE.MeshStandardMaterial;
  public bookshopWindow!: THREE.MeshStandardMaterial;
  public vinylWindow!: THREE.MeshStandardMaterial;
  public arcadeWindow!: THREE.MeshStandardMaterial;
  public muralLanewayA!: THREE.MeshStandardMaterial;
  public muralLanewayB!: THREE.MeshStandardMaterial;
  public muralLanewayC!: THREE.MeshStandardMaterial;
  public muralArcade!: THREE.MeshStandardMaterial;
  public signEspresso!: THREE.MeshStandardMaterial;
  public signBookshop!: THREE.MeshStandardMaterial;
  public signBakery!: THREE.MeshStandardMaterial;
  public signRecords!: THREE.MeshStandardMaterial;
  public signBistro!: THREE.MeshStandardMaterial;
  public tramSign96!: THREE.MeshStandardMaterial;
  public tramSign1!: THREE.MeshStandardMaterial;
  public tramSign35!: THREE.MeshStandardMaterial;

  // Emissives (Shopfronts, Streetlamps, Tasteful Vintage Neon)
  public lampGlowWarm!: THREE.MeshStandardMaterial;
  public neonAmber!: THREE.MeshStandardMaterial;
  public neonCoral!: THREE.MeshStandardMaterial;
  public neonTeal!: THREE.MeshStandardMaterial;
  public neonCream!: THREE.MeshStandardMaterial;
  public trafficRed!: THREE.MeshStandardMaterial;
  public trafficAmber!: THREE.MeshStandardMaterial;
  public trafficGreen!: THREE.MeshStandardMaterial;

  // Tram & Vehicles
  public tramGreen!: THREE.MeshPhysicalMaterial;
  public tramCream!: THREE.MeshPhysicalMaterial;
  public tramRoofTan!: THREE.MeshStandardMaterial;
  public steelRail!: THREE.MeshStandardMaterial;
  public rubberTire!: THREE.MeshStandardMaterial;

  // Water & Ambient-Occlusion Grounding Shadows
  public yarraWater!: THREE.MeshPhysicalMaterial;
  public lakeWater!: THREE.MeshPhysicalMaterial;
  public contactShadow!: THREE.MeshBasicMaterial;
  public buildingAoSkirt!: THREE.MeshBasicMaterial;

  constructor(tex: ProceduralTextureLibrary, isSoftwareGl: boolean) {
    this.init(tex, isSoftwareGl);
  }

  private track<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private init(tex: ProceduralTextureLibrary, isSoftwareGl: boolean): void {
    this.asphalt = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.asphalt,
        roughness: 0.88,
        metalness: 0.04,
      })
    );

    this.footpathConcrete = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.footpathConcrete,
        roughness: 0.82,
        metalness: 0.04,
      })
    );

    this.bluestone = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.bluestoneCobble,
        normalMap: tex.bluestoneNormal,
        normalScale: new THREE.Vector2(0.45, 0.45),
        roughness: 0.72,
        metalness: 0.08,
      })
    );

    this.herringboneBrick = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.herringboneBrick,
        roughness: 0.8,
        metalness: 0.04,
      })
    );

    this.gardenPath = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.gardenGravel,
        roughness: 0.92,
        metalness: 0.02,
      })
    );

    this.grass = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.grassPainterly,
        roughness: 0.94,
        metalness: 0.0,
      })
    );

    this.grassBotanic = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.grassBotanicLush,
        roughness: 0.9,
        metalness: 0.0,
      })
    );

    this.kerbStone = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x52565e,
        normalMap: tex.sandstoneNormal,
        normalScale: new THREE.Vector2(0.2, 0.2),
        roughness: 0.76,
        metalness: 0.06,
      })
    );

    this.roadMarkingCream = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf0e6d2,
        roughness: 0.68,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );

    this.roadMarkingYellow = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xe3ac4b,
        roughness: 0.66,
        metalness: 0.04,
        polygonOffset: true,
        polygonOffsetFactor: -2,
        polygonOffsetUnits: -2,
      })
    );

    this.timberDeck = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.timberDeck,
        roughness: 0.74,
        metalness: 0.04,
      })
    );

    // Architecture with Relief Normals & Roughness Contrast
    this.brickRed = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.brickRed,
        normalMap: tex.brickNormal,
        normalScale: new THREE.Vector2(0.38, 0.38),
        roughness: 0.84,
        metalness: 0.03,
      })
    );

    this.brickOchre = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.brickOchre,
        normalMap: tex.brickNormal,
        normalScale: new THREE.Vector2(0.36, 0.36),
        roughness: 0.82,
        metalness: 0.03,
      })
    );

    this.brickBrown = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.brickBrown,
        normalMap: tex.brickNormal,
        normalScale: new THREE.Vector2(0.38, 0.38),
        roughness: 0.85,
        metalness: 0.04,
      })
    );

    this.brickCream = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.brickCreamPainted,
        normalMap: tex.brickNormal,
        normalScale: new THREE.Vector2(0.3, 0.3),
        roughness: 0.8,
        metalness: 0.03,
      })
    );

    this.sandstone = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.sandstone,
        normalMap: tex.sandstoneNormal,
        normalScale: new THREE.Vector2(0.34, 0.34),
        roughness: 0.8,
        metalness: 0.03,
      })
    );

    this.stuccoCream = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xeadbc5,
        roughness: 0.76,
        metalness: 0.02,
      })
    );

    this.stuccoTerracotta = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc4694c,
        roughness: 0.78,
        metalness: 0.03,
      })
    );

    this.stuccoSage = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x7b907a,
        roughness: 0.78,
        metalness: 0.03,
      })
    );

    this.heritageTrimCream = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xf4ead7,
        roughness: 0.64,
        metalness: 0.05,
      })
    );

    this.charcoalIron = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x292c32,
        roughness: 0.4,
        metalness: 0.75,
      })
    );

    this.filigreeIron = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x262a30,
        alphaMap: tex.filigreeLaceAlpha,
        alphaTest: 0.42,
        side: THREE.DoubleSide,
        roughness: 0.42,
        metalness: 0.72,
      })
    );

    this.galvanizedSteel = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x9aa0a6,
        roughness: 0.46,
        metalness: 0.65,
      })
    );

    this.verdigrisCopper = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x589482,
        roughness: 0.48,
        metalness: 0.42,
      })
    );

    this.roofSlate = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.heritageRoofSlate,
        roughness: 0.7,
        metalness: 0.14,
      })
    );

    this.terracottaRoof = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.terracottaTile,
        roughness: 0.74,
        metalness: 0.06,
      })
    );

    this.corrugatedIron = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.corrugatedIron,
        roughness: 0.5,
        metalness: 0.58,
      })
    );

    this.modernConcrete = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xc9c1b5,
        roughness: 0.74,
        metalness: 0.06,
      })
    );

    this.modernDarkMullion = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x23272d,
        roughness: 0.34,
        metalness: 0.78,
      })
    );

    this.architecturalGlass = this.track(
      new THREE.MeshPhysicalMaterial({
        color: 0x6f94a8,
        roughness: 0.13,
        metalness: 0.2,
        clearcoat: isSoftwareGl ? 0 : 0.88,
        clearcoatRoughness: 0.12,
        envMapIntensity: 1.35,
      })
    );

    this.brassGold = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xd9a855,
        roughness: 0.28,
        metalness: 0.86,
      })
    );

    this.warmTimber = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x9b6842,
        roughness: 0.7,
        metalness: 0.04,
      })
    );

    this.darkTimber = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x523422,
        roughness: 0.74,
        metalness: 0.04,
      })
    );

    this.awningStripedGreen = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x2f6148,
        roughness: 0.82,
        metalness: 0.04,
      })
    );

    this.awningBurgundy = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x7d342c,
        roughness: 0.82,
        metalness: 0.04,
      })
    );

    // Windows, Signage & Murals
    this.windowWarmLit = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.windowWarmLit,
        emissive: new THREE.Color(0xffb457),
        emissiveMap: tex.windowWarmLit,
        emissiveIntensity: 0.68,
        roughness: 0.22,
        metalness: 0.12,
      })
    );

    this.windowAmberCurtain = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.windowAmberCurtain,
        emissive: new THREE.Color(0xf29f46),
        emissiveMap: tex.windowAmberCurtain,
        emissiveIntensity: 0.54,
        roughness: 0.26,
        metalness: 0.1,
      })
    );

    this.windowDaylight = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.windowDaylight,
        roughness: 0.18,
        metalness: 0.28,
        envMapIntensity: 1.2,
      })
    );

    this.cafeWindow = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.cafeWindowDisplay,
        emissive: new THREE.Color(0xffbe6b),
        emissiveMap: tex.cafeWindowDisplay,
        emissiveIntensity: 0.75,
        roughness: 0.22,
      })
    );

    this.bookshopWindow = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.bookshopWindowDisplay,
        emissive: new THREE.Color(0xffbd66),
        emissiveMap: tex.bookshopWindowDisplay,
        emissiveIntensity: 0.66,
        roughness: 0.24,
      })
    );

    this.vinylWindow = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.vinylShopWindow,
        emissive: new THREE.Color(0xffb866),
        emissiveMap: tex.vinylShopWindow,
        emissiveIntensity: 0.68,
        roughness: 0.24,
      })
    );

    this.arcadeWindow = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.arcadeCabinetWindow,
        emissive: new THREE.Color(0xff9e66),
        emissiveMap: tex.arcadeCabinetWindow,
        emissiveIntensity: 0.88,
        roughness: 0.2,
      })
    );

    this.muralLanewayA = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.muralLanewayA,
        normalMap: tex.brickNormal,
        normalScale: new THREE.Vector2(0.25, 0.25),
        roughness: 0.82,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );

    this.muralLanewayB = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.muralLanewayB,
        normalMap: tex.brickNormal,
        normalScale: new THREE.Vector2(0.25, 0.25),
        roughness: 0.82,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );

    this.muralLanewayC = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.muralLanewayC,
        normalMap: tex.brickNormal,
        normalScale: new THREE.Vector2(0.25, 0.25),
        roughness: 0.82,
        metalness: 0.02,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );

    this.muralArcade = this.track(
      new THREE.MeshStandardMaterial({
        map: tex.muralArcade,
        emissive: new THREE.Color(0x3a2630),
        emissiveIntensity: 0.28,
        roughness: 0.78,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );

    // Shopfront Signage & Tram Rollsigns
    const makeSignMat = (map: THREE.Texture, glow = 0.22) =>
      this.track(
        new THREE.MeshStandardMaterial({
          map,
          emissive: new THREE.Color(0xffe2ad),
          emissiveMap: map,
          emissiveIntensity: glow,
          roughness: 0.42,
          metalness: 0.1,
        })
      );

    this.signEspresso = makeSignMat(tex.shopSignEspresso, 0.26);
    this.signBookshop = makeSignMat(tex.shopSignBookshop, 0.24);
    this.signBakery = makeSignMat(tex.shopSignBakery, 0.26);
    this.signRecords = makeSignMat(tex.shopSignRecords, 0.34);
    this.signBistro = makeSignMat(tex.shopSignBistro, 0.36);
    this.tramSign96 = makeSignMat(tex.tramSign96, 0.95);
    this.tramSign1 = makeSignMat(tex.tramSign1, 0.95);
    this.tramSign35 = makeSignMat(tex.tramSign35, 0.95);

    // Emissives
    this.lampGlowWarm = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfff2cf,
        emissive: new THREE.Color(0xffc76b),
        emissiveIntensity: 1.8,
        roughness: 0.2,
      })
    );

    this.neonAmber = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xffd17a,
        emissive: new THREE.Color(0xffa938),
        emissiveIntensity: 2.1,
        roughness: 0.2,
      })
    );

    this.neonCoral = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xff9580,
        emissive: new THREE.Color(0xeb5a44),
        emissiveIntensity: 2.0,
        roughness: 0.2,
      })
    );

    this.neonTeal = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x8ce8dc,
        emissive: new THREE.Color(0x2fb3a3),
        emissiveIntensity: 1.9,
        roughness: 0.2,
      })
    );

    this.neonCream = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xfff6e0,
        emissive: new THREE.Color(0xffe0a3),
        emissiveIntensity: 1.7,
        roughness: 0.25,
      })
    );

    this.trafficRed = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xff5a47,
        emissive: new THREE.Color(0xe63928),
        emissiveIntensity: 1.8,
      })
    );
    this.trafficAmber = this.track(
      new THREE.MeshStandardMaterial({
        color: 0xffc145,
        emissive: new THREE.Color(0xf29f24),
        emissiveIntensity: 1.6,
      })
    );
    this.trafficGreen = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x67d98b,
        emissive: new THREE.Color(0x3ab864),
        emissiveIntensity: 1.7,
      })
    );

    // Melbourne Tram Livery (Classic Heritage Forest Green & Warm Cream)
    this.tramGreen = this.track(
      new THREE.MeshPhysicalMaterial({
        color: 0x215738,
        roughness: 0.32,
        metalness: 0.16,
        clearcoat: isSoftwareGl ? 0 : 0.72,
        clearcoatRoughness: 0.18,
      })
    );

    this.tramCream = this.track(
      new THREE.MeshPhysicalMaterial({
        color: 0xf3e5c8,
        roughness: 0.36,
        metalness: 0.08,
        clearcoat: isSoftwareGl ? 0 : 0.58,
        clearcoatRoughness: 0.2,
      })
    );

    this.tramRoofTan = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x7d6c59,
        roughness: 0.72,
        metalness: 0.12,
      })
    );

    this.steelRail = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x8e959e,
        roughness: 0.26,
        metalness: 0.88,
      })
    );

    this.rubberTire = this.track(
      new THREE.MeshStandardMaterial({
        color: 0x222326,
        roughness: 0.86,
        metalness: 0.06,
      })
    );

    // Animated Yarra Water & Botanic Lake Water (PBR + multi-layered wave ripples & golden sun shimmer)
    this.yarraWater = this.createAnimatedWaterMaterial(
      0x31626b,
      tex.waterNormal,
      isSoftwareGl,
      0.085
    );
    this.lakeWater = this.createAnimatedWaterMaterial(
      0x377074,
      tex.waterNormal,
      isSoftwareGl,
      0.042
    );

    this.contactShadow = this.track(
      new THREE.MeshBasicMaterial({
        map: tex.radialShadow,
        transparent: true,
        depthWrite: false,
        opacity: 0.56,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );

    this.buildingAoSkirt = this.track(
      new THREE.MeshBasicMaterial({
        map: tex.softBoxShadow,
        transparent: true,
        depthWrite: false,
        opacity: 0.52,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
  }

  private createAnimatedWaterMaterial(
    hexColor: number,
    normalMap: THREE.Texture,
    isSoftwareGl: boolean,
    waveAmp: number
  ): THREE.MeshPhysicalMaterial {
    const mat = new THREE.MeshPhysicalMaterial({
      color: hexColor,
      roughness: 0.16,
      metalness: 0.12,
      normalMap,
      normalScale: new THREE.Vector2(0.22, 0.22),
      clearcoat: isSoftwareGl ? 0 : 0.9,
      clearcoatRoughness: 0.14,
      transparent: true,
      opacity: 0.94,
      envMapIntensity: 1.35,
      vertexColors: true,
    });

    const uniforms = this.waterUniforms;
    mat.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = uniforms.uTime;
      shader.vertexShader =
        `uniform float uTime;\nvarying vec3 vWorldWaterPos;\n` +
        shader.vertexShader;
      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `#include <begin_vertex>
        vec4 wp = modelMatrix * vec4(transformed, 1.0);
        float w1 = sin(wp.x * 0.21 + uTime * 1.12) * cos(wp.z * 0.27 - uTime * 0.82);
        float w2 = sin(wp.x * 0.54 - wp.z * 0.43 + uTime * 1.52) * 0.42;
        float w3 = cos(wp.x * 0.88 + wp.z * 0.72 - uTime * 2.1) * 0.18;
        transformed.y += (w1 + w2 + w3) * ${waveAmp.toFixed(3)};
        vWorldWaterPos = wp.xyz;
        `
      );
      shader.fragmentShader =
        `uniform float uTime;\nvarying vec3 vWorldWaterPos;\n` +
        shader.fragmentShader;
      shader.fragmentShader = shader.fragmentShader.replace(
        '#include <color_fragment>',
        `#include <color_fragment>
        float shimmer = sin(vWorldWaterPos.x * 0.48 + vWorldWaterPos.z * 0.34 + uTime * 1.65)
                      * cos(vWorldWaterPos.z * 0.58 - vWorldWaterPos.x * 0.18 - uTime * 1.25);
        float sunGlint = smoothstep(0.52, 0.97, shimmer);
        float rippleBand = smoothstep(0.15, 0.85, sin(vWorldWaterPos.z * 0.8 + uTime * 0.9) * 0.5 + 0.5);
        diffuseColor.rgb += vec3(0.065, 0.055, 0.032) * sunGlint + vec3(0.014, 0.024, 0.024) * rippleBand;
        `
      );
    };
    mat.customProgramCacheKey = () => `melbourne-water-v3-${waveAmp}`;
    return this.track(mat);
  }

  public update(elapsedTime: number, tex: ProceduralTextureLibrary): void {
    this.waterUniforms.uTime.value = elapsedTime;
    tex.waterNormal.offset.x = (elapsedTime * 0.02) % 1;
    tex.waterNormal.offset.y = (elapsedTime * 0.012) % 1;
  }

  public setEmissiveMood(preset: 'golden-hour' | 'laneway-dusk'): void {
    const windowScale = preset === 'laneway-dusk' ? 1.38 : 0.75;
    const neonScale = preset === 'laneway-dusk' ? 2.65 : 1.85;
    const lampScale = preset === 'laneway-dusk' ? 2.55 : 1.6;
    const signScale = preset === 'laneway-dusk' ? 0.82 : 0.3;

    this.windowWarmLit.emissiveIntensity = windowScale;
    this.windowAmberCurtain.emissiveIntensity = windowScale * 0.82;
    this.cafeWindow.emissiveIntensity = windowScale * 1.12;
    this.bookshopWindow.emissiveIntensity = windowScale * 1.0;
    this.vinylWindow.emissiveIntensity = windowScale * 1.06;
    this.arcadeWindow.emissiveIntensity = windowScale * 1.32;

    this.signEspresso.emissiveIntensity = signScale;
    this.signBookshop.emissiveIntensity = signScale;
    this.signBakery.emissiveIntensity = signScale;
    this.signRecords.emissiveIntensity = signScale * 1.25;
    this.signBistro.emissiveIntensity = signScale * 1.3;

    this.neonAmber.emissiveIntensity = neonScale;
    this.neonCoral.emissiveIntensity = neonScale * 0.95;
    this.neonTeal.emissiveIntensity = neonScale * 0.9;
    this.neonCream.emissiveIntensity = neonScale * 0.85;
    this.lampGlowWarm.emissiveIntensity = lampScale;
  }

  public dispose(): void {
    for (const m of this.materials) {
      m.dispose();
    }
    this.materials = [];
  }
}
