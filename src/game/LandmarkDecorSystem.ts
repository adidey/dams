import * as THREE from 'three';
import { WorldMaterialLibrary } from '../world/Materials';
import { groundHeightAt } from '../world/TerrainSystem';
import { POINTS_OF_INTEREST } from './config/locationsConfig';

/**
 * Purely additive 3D landmark signage, romantic memory props, and subtle ground rings
 * placed on top of the existing Melbourne environment at each relationship location.
 * Preserves 100% of existing city geometry.
 */
export class LandmarkDecorSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];
  private markerRings: Map<string, THREE.Mesh> = new Map();
  private finalLanternGroup = new THREE.Group();

  constructor(
    worldMaterials: WorldMaterialLibrary,
    renderer: THREE.WebGLRenderer
  ) {
    this.group.name = 'RelationshipLandmarkDecor';
    const maxAniso = renderer.capabilities.getMaxAnisotropy();

    this.buildInternationalHouseDecor(worldMaterials, maxAniso);
    this.build11InchPizzaDecor(worldMaterials, maxAniso);
    this.buildBibiJiDecor(worldMaterials, maxAniso);
    this.buildBotanicBirthdayPicnic(worldMaterials, maxAniso);
    this.buildBlackPrinceDecor(worldMaterials, maxAniso);
    this.buildFinalYarraOverlook(worldMaterials, maxAniso);
    this.buildVintagePhotoBoothDecor(worldMaterials, maxAniso);
    this.buildPOIGroundRings();
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private createSignMaterial(
    title: string,
    subtitle: string,
    bgHex: string,
    fgHex: string,
    borderHex: string,
    anisotropy: number
  ): THREE.MeshStandardMaterial {
    const c = document.createElement('canvas');
    c.width = 512;
    c.height = 192;
    const ctx = c.getContext('2d')!;

    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, c.width, c.height);

    ctx.strokeStyle = borderHex;
    ctx.lineWidth = 8;
    ctx.strokeRect(10, 10, c.width - 20, c.height - 20);

    ctx.fillStyle = fgHex;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.font = '700 44px Georgia, serif';
    ctx.fillText(title, c.width / 2, 76);

    ctx.fillStyle = borderHex;
    ctx.font = '600 24px sans-serif';
    ctx.fillText(subtitle, c.width / 2, 134);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = anisotropy;
    this.textures.push(tex);

    return this.trackMat(
      new THREE.MeshStandardMaterial({
        map: tex,
        emissive: new THREE.Color(0xffdfa8),
        emissiveMap: tex,
        emissiveIntensity: 0.36,
        roughness: 0.4,
        metalness: 0.12,
      })
    );
  }

  private buildInternationalHouseDecor(
    wm: WorldMaterialLibrary,
    aniso: number
  ): void {
    const g = new THREE.Group();
    const x = -76.5;
    const z = -88.2;
    g.position.set(x, groundHeightAt(x, z), z);

    // Sandstone & brass campus heritage plinth
    const base = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.2, 0.42, 0.72)),
      wm.sandstone
    );
    base.position.y = 0.21;
    base.castShadow = true;
    g.add(base);

    const wall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.85, 1.35, 0.44)),
      wm.brickRed
    );
    wall.position.y = 1.08;
    wall.castShadow = true;
    g.add(wall);

    const cap = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.05, 0.16, 0.56)),
      wm.heritageTrimCream
    );
    cap.position.y = 1.82;
    g.add(cap);

    const signMat = this.createSignMaterial(
      'INTERNATIONAL HOUSE',
      'PARKVILLE · CHAPTER I',
      '#24382f',
      '#f7ecd8',
      '#e0b465',
      aniso
    );
    const plaque = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(2.45, 0.88)),
      signMat
    );
    plaque.position.set(0, 1.12, 0.24);
    g.add(plaque);

    // Warm courtyard lamp posts flanking the plinth
    for (const sx of [-2.1, 2.1]) {
      const post = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.06, 0.09, 2.7, 8)),
        wm.charcoalIron
      );
      post.position.set(sx, 1.35, 0.2);
      post.castShadow = true;
      g.add(post);

      const lantern = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.2, 10, 8)),
        wm.lampGlowWarm
      );
      lantern.position.set(sx, 2.8, 0.2);
      g.add(lantern);
    }

    this.group.add(g);
  }

  private build11InchPizzaDecor(
    wm: WorldMaterialLibrary,
    aniso: number
  ): void {
    const g = new THREE.Group();
    const x = -15.4;
    const z = -47.0;
    g.position.set(x, groundHeightAt(x, z), z);

    const signMat = this.createSignMaterial(
      '11 INCH PIZZA',
      'WOODFIRED SLICES & GNOCCHI',
      '#5e241f',
      '#fff2df',
      '#f2b66d',
      aniso
    );
    const fascia = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.5, 0.95, 0.16)),
      signMat
    );
    fascia.position.set(0, 3.35, 0);
    g.add(fascia);

    // Cosy outdoor table for two with a miniature pizza & pillowy gnocchi dish!
    const tableTop = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.06, 14)),
      wm.heritageTrimCream
    );
    tableTop.position.set(1.65, 0.78, 0.85);
    tableTop.castShadow = true;
    g.add(tableTop);

    const tablePed = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.06, 0.22, 0.76, 8)),
      wm.charcoalIron
    );
    tablePed.position.set(1.65, 0.38, 0.85);
    g.add(tablePed);

    // Mini pizza wooden board + golden gnocchi bowl + candle
    const pizza = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.2, 0.2, 0.03, 12)),
      wm.stuccoTerracotta
    );
    pizza.position.set(1.5, 0.83, 0.82);
    g.add(pizza);

    const gnocchiBowl = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.14, 0.1, 0.07, 10)),
      wm.neonCream
    );
    gnocchiBowl.position.set(1.82, 0.84, 0.9);
    g.add(gnocchiBowl);

    this.group.add(g);
  }

  private buildBibiJiDecor(wm: WorldMaterialLibrary, aniso: number): void {
    const g = new THREE.Group();
    const x = 16.4;
    const z = -2.65;
    g.position.set(x, groundHeightAt(x, z), z);

    const signMat = this.createSignMaterial(
      'BIBI JI',
      'INDIAN DINING & BAR',
      '#4a1f2c',
      '#ffefd6',
      '#f5ae52',
      aniso
    );
    const fascia = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.4, 0.95, 0.16)),
      signMat
    );
    fascia.position.set(0, 3.4, 0);
    g.add(fascia);

    // Warm marigold-amber lantern sconces flanking entrance
    for (const sx of [-1.95, 1.95]) {
      const lantern = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.16, 0.12, 0.36, 8)),
        wm.neonAmber
      );
      lantern.position.set(sx, 2.55, 0.18);
      g.add(lantern);
    }

    this.group.add(g);
  }

  private buildBotanicBirthdayPicnic(
    wm: WorldMaterialLibrary,
    aniso: number
  ): void {
    // Sunlit floral birthday picnic spot beside the Ornamental Lake
    const g = new THREE.Group();
    const x = 83.5;
    const z = 68.4;
    g.position.set(x, groundHeightAt(x, z), z);

    // Woven gingham-inspired cream & dusty-rose picnic blanket flush on lawn
    const rugMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xf6ead8,
        roughness: 0.9,
        polygonOffset: true,
        polygonOffsetFactor: -1,
        polygonOffsetUnits: -1,
      })
    );
    const rug = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.7, 0.04, 2.2)),
      rugMat
    );
    rug.position.y = 0.03;
    rug.rotation.y = 0.22;
    rug.receiveShadow = true;
    g.add(rug);

    const borderTrim = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.4, 0.045, 1.9)),
      this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0xe39ca9,
          roughness: 0.88,
        })
      )
    );
    borderTrim.position.y = 0.035;
    borderTrim.rotation.y = 0.22;
    g.add(borderTrim);

    // Wicker picnic basket + miniature birthday cake with warm glowing candle!
    const basket = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.62, 0.38, 0.44)),
      wm.warmTimber
    );
    basket.position.set(-0.55, 0.23, -0.25);
    basket.rotation.y = -0.3;
    basket.castShadow = true;
    g.add(basket);

    const cake = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.2, 14)),
      wm.heritageTrimCream
    );
    cake.position.set(0.35, 0.14, 0.15);
    cake.castShadow = true;
    g.add(cake);

    const candleGlow = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.06, 8, 8)),
      wm.lampGlowWarm
    );
    candleGlow.position.set(0.35, 0.32, 0.15);
    g.add(candleGlow);

    // Small wooden garden sign
    const signMat = this.createSignMaterial(
      'BOTANIC LAKE LAWN',
      'ADI’S BIRTHDAY PICNIC',
      '#284534',
      '#fbf3e4',
      '#ebadc0',
      aniso
    );
    const post = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.05, 0.06, 1.25, 6)),
      wm.darkTimber
    );
    post.position.set(-1.95, 0.62, -0.8);
    post.castShadow = true;
    g.add(post);

    const board = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.55, 0.54, 0.08)),
      signMat
    );
    board.position.set(-1.95, 1.18, -0.8);
    board.rotation.y = 0.35;
    g.add(board);

    // Blooming floral clusters around the picnic spot
    const petalColors = [0xf2a7b8, 0xf7d488, 0xe87a90, 0xfff0d6];
    for (let i = 0; i < 12; i++) {
      const ang = (i / 12) * Math.PI * 2;
      const r = 1.9 + (i % 3) * 0.35;
      const fx = Math.cos(ang) * r;
      const fz = Math.sin(ang) * r;
      const bloom = new THREE.Mesh(
        this.trackGeo(new THREE.DodecahedronGeometry(0.2, 0)),
        this.trackMat(
          new THREE.MeshStandardMaterial({
            color: petalColors[i % petalColors.length],
            roughness: 0.75,
          })
        )
      );
      bloom.position.set(fx, 0.16, fz);
      g.add(bloom);
    }

    this.group.add(g);
  }

  private buildBlackPrinceDecor(wm: WorldMaterialLibrary, aniso: number): void {
    const g = new THREE.Group();
    const x = -41.5;
    const z = -2.65;
    g.position.set(x, groundHeightAt(x, z), z);

    const signMat = this.createSignMaterial(
      'THE BLACK PRINCE',
      'DINING ROOM & CELLAR',
      '#1e2622',
      '#f7ebd2',
      '#d9a855',
      aniso
    );
    const fascia = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.8, 0.96, 0.16)),
      signMat
    );
    fascia.position.set(0, 3.4, 0);
    g.add(fascia);

    // Heritage brass lamps flanking doorway
    for (const sx of [-2.2, 2.2]) {
      const sconce = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.16, 8, 8)),
        wm.lampGlowWarm
      );
      sconce.position.set(sx, 2.55, 0.2);
      g.add(sconce);
    }

    this.group.add(g);
  }

  private buildFinalYarraOverlook(
    wm: WorldMaterialLibrary,
    aniso: number
  ): void {
    const x = -26.0;
    const z = 43.2;
    this.finalLanternGroup.position.set(x, groundHeightAt(x, z), z);

    // Timber & brass waterfront arch + glowing twilight lanterns
    for (const sx of [-2.1, 2.1]) {
      const post = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.07, 0.09, 3.1, 8)),
        wm.charcoalIron
      );
      post.position.set(sx, 1.55, 0);
      post.castShadow = true;
      this.finalLanternGroup.add(post);
    }

    const crossBar = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(4.5, 0.1, 0.1)),
      wm.brassGold
    );
    crossBar.position.set(0, 3.05, 0);
    this.finalLanternGroup.add(crossBar);

    for (let lx = -1.6; lx <= 1.6; lx += 0.8) {
      const bulb = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.13, 8, 8)),
        wm.lampGlowWarm
      );
      bulb.position.set(lx, 2.86 - Math.cos(lx) * 0.08, 0);
      this.finalLanternGroup.add(bulb);
    }

    const signMat = this.createSignMaterial(
      'YARRA TWILIGHT OVERLOOK',
      'OUR MELBOURNE DREAMLAND',
      '#22353d',
      '#fff3dc',
      '#f0be6e',
      aniso
    );
    const plaque = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.4, 0.55, 0.08)),
      signMat
    );
    plaque.position.set(0, 3.35, 0);
    this.finalLanternGroup.add(plaque);

    this.group.add(this.finalLanternGroup);
  }

  private buildVintagePhotoBoothDecor(
    wm: WorldMaterialLibrary,
    aniso: number
  ): void {
    const bx = 82.5;
    const bz = -16.5;
    const by = groundHeightAt(bx, bz);

    const booth = new THREE.Group();
    booth.name = 'VintagePhotoBoothModel';
    booth.position.set(bx, by, bz);

    // 1. Dark contact shadow on pavers
    const shadowGeo = this.trackGeo(new THREE.PlaneGeometry(2.6, 2.0));
    shadowGeo.rotateX(-Math.PI / 2);
    const shadowMat = this.trackMat(
      new THREE.MeshBasicMaterial({
        color: 0x140f0c,
        transparent: true,
        opacity: 0.45,
        depthWrite: false,
      })
    );
    const shadow = new THREE.Mesh(shadowGeo, shadowMat);
    shadow.position.set(0, 0.02, 0);
    booth.add(shadow);

    // 2. Booth Walls & Cabin (Cream with rich burgundy trims)
    const cabinMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xeee0ce,
        roughness: 0.65,
        metalness: 0.05,
      })
    );
    const trimMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x6e2434, // Vintage deep crimson / rosewood
        roughness: 0.4,
        metalness: 0.15,
      })
    );
    const brassMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xd4af37,
        roughness: 0.3,
        metalness: 0.75,
      })
    );
    const curtainMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0x8a233b, // Velvet drape
        roughness: 0.85,
        metalness: 0.0,
      })
    );

    // Back wall
    const backWall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.2, 2.6, 0.12)),
      cabinMat
    );
    backWall.position.set(0, 1.3, -0.74);
    booth.add(backWall);

    // Left wall
    const leftWall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.12, 2.6, 1.48)),
      cabinMat
    );
    leftWall.position.set(-1.04, 1.3, 0);
    booth.add(leftWall);

    // Right wall
    const rightWall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.12, 2.6, 1.48)),
      cabinMat
    );
    rightWall.position.set(1.04, 1.3, 0);
    booth.add(rightWall);

    // Roof canopy
    const roof = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.36, 0.16, 1.68)),
      trimMat
    );
    roof.position.set(0, 2.68, 0);
    booth.add(roof);

    // Front lintel / header beam
    const headerBeam = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.24, 0.4, 0.12)),
      trimMat
    );
    headerBeam.position.set(0, 2.4, 0.74);
    booth.add(headerBeam);

    // Velvet side curtains (pleated boxes)
    const curtainLeft = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.42, 2.05, 0.1)),
      curtainMat
    );
    curtainLeft.position.set(-0.82, 1.05, 0.7);
    booth.add(curtainLeft);

    const curtainRight = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.42, 2.05, 0.1)),
      curtainMat
    );
    curtainRight.position.set(0.82, 1.05, 0.7);
    booth.add(curtainRight);

    // Swivel Brass Stool inside booth
    const stoolBase = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.24, 0.28, 0.08, 16)),
      brassMat
    );
    stoolBase.position.set(0, 0.04, 0.0);
    booth.add(stoolBase);

    const stoolStem = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.04, 0.04, 0.54, 12)),
      brassMat
    );
    stoolStem.position.set(0, 0.31, 0.0);
    booth.add(stoolStem);

    const stoolSeat = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.28, 0.28, 0.12, 16)),
      curtainMat
    );
    stoolSeat.position.set(0, 0.6, 0.0);
    booth.add(stoolSeat);

    // Soft Interior Warm Glow Lamp
    const interiorBulb = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.12, 12, 12)),
      wm.lampGlowWarm
    );
    interiorBulb.position.set(0, 2.15, 0.0);
    booth.add(interiorBulb);

    // Marquee Sign: "PHOTO BOOTH" with "4-SHOT B&W STRIPS"
    const signMat = this.createSignMaterial(
      'PHOTO BOOTH',
      '4-SHOT B&W STRIPS · KEEPSAKES',
      '#421820',
      '#fff6eb',
      '#f5ca7a',
      aniso
    );
    const marqueeSign = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.1, 0.58, 0.1)),
      signMat
    );
    marqueeSign.position.set(0, 3.08, 0.74);
    booth.add(marqueeSign);

    // Decorative Festoon Bulbs along marquee top edge
    for (let i = 0; i < 7; i++) {
      const bxPos = -0.9 + i * 0.3;
      const bulb = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.06, 8, 8)),
        wm.lampGlowWarm
      );
      bulb.position.set(bxPos, 3.42, 0.76);
      booth.add(bulb);
    }

    this.group.add(booth);
  }

  private buildPOIGroundRings(): void {
    const ringGeo = this.trackGeo(new THREE.RingGeometry(0.95, 1.22, 28));
    ringGeo.rotateX(-Math.PI / 2);

    for (const poi of POINTS_OF_INTEREST) {
      const color =
        poi.category === 'memory'
          ? 0xf2b880
          : poi.category === 'final-memory'
            ? 0xf5cf76
            : poi.category === 'tram-stop'
              ? 0x6ec995
              : 0xe896ab;

      const mat = this.trackMat(
        new THREE.MeshBasicMaterial({
          color,
          transparent: true,
          opacity: 0.62,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -2,
          polygonOffsetUnits: -2,
        })
      );

      const mesh = new THREE.Mesh(ringGeo, mat);
      const gy = groundHeightAt(poi.position[0], poi.position[2]);
      mesh.position.set(poi.position[0], Math.max(0.05, gy + 0.06), poi.position[2]);
      this.markerRings.set(poi.id, mesh);
      this.group.add(mesh);
    }
  }

  public update(
    elapsed: number,
    completedMemoryIds: string[],
    allCoreDone: boolean
  ): void {
    this.finalLanternGroup.visible = true;
    const s = 1 + Math.sin(elapsed * 2.4) * 0.06;

    for (const poi of POINTS_OF_INTEREST) {
      const ring = this.markerRings.get(poi.id);
      if (!ring) continue;
      if (poi.requiresAllCoreMemories && !allCoreDone) {
        ring.visible = false;
        continue;
      }
      ring.visible = true;
      ring.scale.set(s, 1, s);
      const mat = ring.material as THREE.MeshBasicMaterial;
      const done = completedMemoryIds.includes(poi.id);
      mat.opacity = done ? 0.28 : 0.65;
    }
  }

  public dispose(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    for (const t of this.textures) t.dispose();
    this.geometries = [];
    this.materials = [];
    this.textures = [];
  }
}
