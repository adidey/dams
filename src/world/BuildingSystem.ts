import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import { getYarraCenterZ, getYarraHalfWidth, groundHeightAt } from './TerrainSystem';
import { ObstacleBox2D } from './types';

interface VictorianSpec {
  x: number;
  z: number;
  w: number;
  d: number;
  floors: number;
  wallMat: THREE.Material;
  awningSide?: 'north' | 'south' | 'east' | 'west' | 'none';
  shopType?: 'cafe' | 'retail' | 'warm';
  hasPediment?: boolean;
  muralEast?: THREE.Material;
  muralWest?: THREE.Material;
}

/**
 * Modular, handcrafted Melbourne architectural library across all 5 districts.
 * Zero plain cubes: every building is an articulated multi-part composition with
 * plinths, recessed shopfronts, awnings, cornices, mullioned windows, balconies, and rooftop details.
 */
export class BuildingSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  public spinningSigns: THREE.Object3D[] = [];

  constructor(materials: WorldMaterialLibrary, obstacles: ObstacleBox2D[]) {
    this.group.name = 'BuildingSystem';
    this.buildParkvilleDistrict(materials, obstacles);
    this.buildMelbourneCBD(materials, obstacles);
    this.buildArcadeEntertainmentQuarter(materials, obstacles);
    this.buildSouthbankDistrict(materials, obstacles);
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private registerFootprint(
    obstacles: ObstacleBox2D[],
    x: number,
    z: number,
    w: number,
    d: number
  ): void {
    obstacles.push({
      minX: x - w * 0.5 - 0.35,
      maxX: x + w * 0.5 + 0.35,
      minZ: z - d * 0.5 - 0.35,
      maxZ: z + d * 0.5 + 0.35,
      tag: 'building',
    });
  }

  /**
   * Builds a richly detailed Victorian / Heritage Melbourne shopfront & commercial building.
   */
  private createVictorianBuilding(
    spec: VictorianSpec,
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): THREE.Group {
    const b = new THREE.Group();
    const baseY = groundHeightAt(spec.x, spec.z);
    b.position.set(spec.x, baseY, spec.z);

    const groundFloorH = 4.1;
    const upperFloorH = 3.35;
    const totalH = groundFloorH + (spec.floors - 1) * upperFloorH;

    // 1. Bluestone base plinth
    const plinth = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(spec.w + 0.16, 0.55, spec.d + 0.16)),
      materials.bluestone
    );
    plinth.position.y = 0.275;
    plinth.castShadow = true;
    plinth.receiveShadow = true;
    b.add(plinth);

    // 2. Ground-floor timber/iron shopfront core
    const gfCore = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(spec.w - 0.12, groundFloorH - 0.5, spec.d - 0.12)),
      materials.darkTimber
    );
    gfCore.position.y = 0.55 + (groundFloorH - 0.5) * 0.5;
    gfCore.castShadow = true;
    gfCore.receiveShadow = true;
    b.add(gfCore);

    // Glowing ground-floor display windows on street-facing sides
    const winMat =
      spec.shopType === 'cafe' ? materials.cafeWindow : materials.windowWarmLit;
    const gfWinH = 2.55;
    // North & South shop windows
    for (const sz of [-1, 1]) {
      const paneW = Math.max(1.8, spec.w - 1.4);
      const pane = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(paneW, gfWinH)),
        winMat
      );
      pane.position.set(0, 2.05, sz * (spec.d * 0.5 - 0.04));
      if (sz < 0) pane.rotation.y = Math.PI;
      b.add(pane);
    }
    // East & West shop windows (unless covered by street art mural)
    for (const sx of [-1, 1]) {
      if ((sx < 0 && spec.muralWest) || (sx > 0 && spec.muralEast)) continue;
      const paneD = Math.max(1.8, spec.d - 1.6);
      const pane = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(paneD, gfWinH)),
        winMat
      );
      pane.position.set(sx * (spec.w * 0.5 - 0.04), 2.05, 0);
      pane.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
      b.add(pane);
    }

    // 3. Upper floors masonry mass
    if (spec.floors > 1) {
      const upperH = (spec.floors - 1) * upperFloorH;
      const upper = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(spec.w, upperH, spec.d)),
        spec.wallMat
      );
      upper.position.y = groundFloorH + upperH * 0.5;
      upper.castShadow = true;
      upper.receiveShadow = true;
      b.add(upper);

      // Moulded horizontal stringcourses between every floor
      for (let f = 1; f < spec.floors; f++) {
        const y = groundFloorH + (f - 1) * upperFloorH;
        const band = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(spec.w + 0.26, 0.22, spec.d + 0.26)),
          materials.heritageTrimCream
        );
        band.position.y = y;
        band.castShadow = true;
        b.add(band);

        // Recessed upper-floor windows + sandstone sills across facades
        const colsX = Math.max(2, Math.floor(spec.w / 3.1));
        for (let c = 0; c < colsX; c++) {
          const wx = -spec.w * 0.5 + (spec.w / colsX) * (c + 0.5);
          const wy = y + upperFloorH * 0.52;
          const isWarm = (c + f) % 3 === 0;
          for (const sz of [-1, 1]) {
            const wMesh = new THREE.Mesh(
              this.trackGeo(new THREE.PlaneGeometry(1.35, 1.95)),
              isWarm ? materials.windowWarmLit : materials.windowDaylight
            );
            wMesh.position.set(wx, wy, sz * (spec.d * 0.5 + 0.02));
            if (sz < 0) wMesh.rotation.y = Math.PI;
            b.add(wMesh);

            const sill = new THREE.Mesh(
              this.trackGeo(new THREE.BoxGeometry(1.55, 0.14, 0.22)),
              materials.heritageTrimCream
            );
            sill.position.set(wx, wy - 1.02, sz * (spec.d * 0.5 + 0.06));
            b.add(sill);
          }
        }

        const colsZ = Math.max(2, Math.floor(spec.d / 3.2));
        for (let c = 0; c < colsZ; c++) {
          const wz = -spec.d * 0.5 + (spec.d / colsZ) * (c + 0.5);
          const wy = y + upperFloorH * 0.52;
          const isWarm = (c + f + 1) % 3 === 0;
          for (const sx of [-1, 1]) {
            const wMesh = new THREE.Mesh(
              this.trackGeo(new THREE.PlaneGeometry(1.35, 1.95)),
              isWarm ? materials.windowWarmLit : materials.windowDaylight
            );
            wMesh.position.set(sx * (spec.w * 0.5 + 0.02), wy, wz);
            wMesh.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
            b.add(wMesh);
          }
        }
      }
    }

    // 4. Laneway Street-Art Murals on Brick Flanks!
    if (spec.muralEast) {
      const mW = Math.min(spec.d - 1.2, 9.5);
      const mural = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(mW, 3.8)),
        spec.muralEast
      );
      mural.position.set(spec.w * 0.5 + 0.03, 2.45, 0);
      mural.rotation.y = Math.PI / 2;
      b.add(mural);
    }
    if (spec.muralWest) {
      const mW = Math.min(spec.d - 1.2, 9.5);
      const mural = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(mW, 3.8)),
        spec.muralWest
      );
      mural.position.set(-spec.w * 0.5 - 0.03, 2.45, 0);
      mural.rotation.y = -Math.PI / 2;
      b.add(mural);
    }

    // 5. Ornate Victorian Parapet Cornice + Pediment + Recessed Roof Deck + Chimney / Water Tank
    const cornice = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(spec.w + 0.48, 0.46, spec.d + 0.48)),
      materials.heritageTrimCream
    );
    cornice.position.y = totalH + 0.2;
    cornice.castShadow = true;
    b.add(cornice);

    const parapet = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(spec.w + 0.1, 0.65, spec.d + 0.1)),
      spec.wallMat
    );
    parapet.position.y = totalH + 0.72;
    parapet.castShadow = true;
    b.add(parapet);

    const roofDeck = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(spec.w - 0.7, 0.2, spec.d - 0.7)),
      materials.roofSlate
    );
    roofDeck.position.y = totalH + 0.98;
    roofDeck.receiveShadow = true;
    b.add(roofDeck);

    if (spec.hasPediment) {
      const ped = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(1.6, 1.6, 0.42, 3)),
        materials.heritageTrimCream
      );
      ped.rotation.x = Math.PI / 2;
      ped.position.set(0, totalH + 1.35, spec.d * 0.5 - 0.05);
      ped.castShadow = true;
      b.add(ped);
    }

    // Rooftop skylight + brick chimney pots
    const skylight = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(spec.w * 0.32, 0.55, spec.d * 0.28)),
      materials.architecturalGlass
    );
    skylight.position.set(-spec.w * 0.15, totalH + 1.28, 0);
    b.add(skylight);

    const chimney = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.85, 1.45, 0.85)),
      materials.brickRed
    );
    chimney.position.set(spec.w * 0.28, totalH + 1.55, -spec.d * 0.24);
    chimney.castShadow = true;
    b.add(chimney);

    // 6. Cantilevered Melbourne Verandah / Street Awning
    if (spec.awningSide && spec.awningSide !== 'none') {
      const awDepth = 2.1;
      const isNS = spec.awningSide === 'north' || spec.awningSide === 'south';
      const awW = isNS ? spec.w + 0.2 : awDepth;
      const awD = isNS ? awDepth : spec.d + 0.2;
      const awning = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(awW, 0.16, awD)),
        materials.verdigrisCopper
      );
      const ax =
        spec.awningSide === 'east'
          ? spec.w * 0.5 + awDepth * 0.5
          : spec.awningSide === 'west'
            ? -spec.w * 0.5 - awDepth * 0.5
            : 0;
      const az =
        spec.awningSide === 'south'
          ? spec.d * 0.5 + awDepth * 0.5
          : spec.awningSide === 'north'
            ? -spec.d * 0.5 - awDepth * 0.5
            : 0;
      awning.position.set(ax, 3.65, az);
      awning.castShadow = true;
      b.add(awning);

      // Hanging vintage blade shop sign under awning
      const sign = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.85, 0.42, 0.08)),
        materials.stuccoTerracotta
      );
      sign.position.set(ax * 0.85, 3.28, az * 0.85);
      if (!isNS) sign.rotation.y = Math.PI / 2;
      b.add(sign);
    }

    this.registerFootprint(obstacles, spec.x, spec.z, spec.w, spec.d);
    this.group.add(b);
    return b;
  }

  /**
   * Builds a sleek contemporary glass, architectural concrete & recessed-balcony building.
   */
  private createContemporaryBuilding(
    x: number,
    z: number,
    w: number,
    d: number,
    floors: number,
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[],
    hasRiversidePodium = false
  ): void {
    const g = new THREE.Group();
    g.position.set(x, groundHeightAt(x, z), z);

    const podiumH = hasRiversidePodium ? 4.8 : 4.2;
    const floorH = 3.25;
    const towerH = (floors - 1) * floorH;

    // Warm ground-floor retail / restaurant podium
    const podium = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w, podiumH, d)),
      materials.modernDarkMullion
    );
    podium.position.y = podiumH * 0.5;
    podium.castShadow = true;
    podium.receiveShadow = true;
    g.add(podium);

    // Glowing restaurant / lobby glazing around podium
    for (const sz of [-1, 1]) {
      const glass = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(w - 1.2, podiumH - 1.2)),
        hasRiversidePodium ? materials.cafeWindow : materials.windowWarmLit
      );
      glass.position.set(0, podiumH * 0.5, sz * (d * 0.5 + 0.03));
      if (sz < 0) glass.rotation.y = Math.PI;
      g.add(glass);
    }

    // Main glazed upper volume (slightly set back on tall Southbank towers)
    const tw = floors >= 6 ? w * 0.86 : w * 0.94;
    const td = floors >= 6 ? d * 0.86 : d * 0.94;
    const core = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(tw, towerH, td)),
      materials.architecturalGlass
    );
    core.position.y = podiumH + towerH * 0.5;
    core.castShadow = true;
    core.receiveShadow = true;
    g.add(core);

    // Architectural concrete slab bands + cantilevered balconies per floor
    for (let f = 0; f <= floors - 1; f++) {
      const fy = podiumH + f * floorH;
      const slab = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(tw + 0.55, 0.26, td + 0.55)),
        materials.modernConcrete
      );
      slab.position.y = fy;
      slab.castShadow = true;
      slab.receiveShadow = true;
      g.add(slab);

      if (f < floors - 1 && f % 2 === 1) {
        const balc = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(tw * 0.52, 0.95, 1.15)),
          materials.modernDarkMullion
        );
        balc.position.set(
          f % 4 === 1 ? -tw * 0.16 : tw * 0.16,
          fy + 0.52,
          -td * 0.5 - 0.42
        );
        balc.castShadow = true;
        g.add(balc);
      }
    }

    // Vertical architectural fins
    for (const fx of [-tw * 0.34, 0, tw * 0.34]) {
      const fin = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.28, towerH, td + 0.42)),
        materials.modernConcrete
      );
      fin.position.set(fx, podiumH + towerH * 0.5, 0);
      fin.castShadow = true;
      g.add(fin);
    }

    // Rooftop mechanical crown & timber pergola
    const crown = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(tw * 0.54, 1.9, td * 0.5)),
      materials.modernConcrete
    );
    crown.position.y = podiumH + towerH + 0.95;
    crown.castShadow = true;
    g.add(crown);

    this.registerFootprint(obstacles, x, z, w, d);
    this.group.add(g);
  }

  /**
   * DISTRICT A — PARKVILLE (Inner-north university quadrangle, Victorian filigree terraces, student housing & corner cafe)
   */
  private buildParkvilleDistrict(
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // 1. Heritage Sandstone & Brick University Quadrangle + Clocktower Hall (centred around X=-75, Z=-82)
    const uniMain = new THREE.Group();
    const ux = -75;
    const uz = -103;
    uniMain.position.set(ux, groundHeightAt(ux, uz), uz);

    // Main Sandstone Collegiate Hall
    const hallBody = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(36, 10.5, 11)),
      materials.sandstone
    );
    hallBody.position.y = 5.25;
    hallBody.castShadow = true;
    hallBody.receiveShadow = true;
    uniMain.add(hallBody);

    // Steeply pitched heritage slate roof
    const roofPrism = new THREE.Mesh(
      this.trackGeo(new THREE.ConeGeometry(8.2, 4.6, 4)),
      materials.roofSlate
    );
    roofPrism.rotation.y = Math.PI / 4;
    roofPrism.scale.set(3.2, 1, 1.0);
    roofPrism.position.y = 12.8;
    roofPrism.castShadow = true;
    uniMain.add(roofPrism);

    // Arched Cloister Buttresses & Tall Mullioned Windows along south courtyard face
    for (let bx = -15; bx <= 15; bx += 5) {
      const buttress = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.65, 10.2, 1.2)),
        materials.heritageTrimCream
      );
      buttress.position.set(bx, 5.1, 5.6);
      buttress.castShadow = true;
      uniMain.add(buttress);

      if (Math.abs(bx) > 2.5 && bx < 15) {
        const win = new THREE.Mesh(
          this.trackGeo(new THREE.PlaneGeometry(1.7, 4.2)),
          bx % 10 === 0 ? materials.windowWarmLit : materials.windowDaylight
        );
        win.position.set(bx + 2.5, 6.2, 5.55);
        uniMain.add(win);
      }
    }

    // Iconic University Sandstone Clocktower
    const tower = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(6.2, 21.5, 6.2)),
      materials.sandstone
    );
    tower.position.set(0, 10.75, 2.2);
    tower.castShadow = true;
    uniMain.add(tower);

    // Glowing heritage clock faces on all 4 sides
    for (let i = 0; i < 4; i++) {
      const cf = new THREE.Mesh(
        this.trackGeo(new THREE.CircleGeometry(1.25, 16)),
        materials.neonCream
      );
      const angle = (i * Math.PI) / 2;
      cf.position.set(
        Math.sin(angle) * 3.14,
        17.6,
        2.2 + Math.cos(angle) * 3.14
      );
      cf.rotation.y = angle;
      uniMain.add(cf);
    }

    // 4 Corner Pinnacles + Slate Spire
    for (const [px, pz] of [
      [-2.6, -0.4],
      [2.6, -0.4],
      [-2.6, 4.8],
      [2.6, 4.8],
    ]) {
      const pin = new THREE.Mesh(
        this.trackGeo(new THREE.ConeGeometry(0.55, 3.2, 4)),
        materials.heritageTrimCream
      );
      pin.position.set(px, 23.1, pz);
      uniMain.add(pin);
    }

    this.registerFootprint(obstacles, ux, uz, 36, 12);
    this.group.add(uniMain);

    // East & West Red-Brick Academic Wings framing the Quad
    for (const wx of [-98, -55]) {
      this.createVictorianBuilding(
        {
          x: wx,
          z: -84,
          w: 9.5,
          d: 22,
          floors: 3,
          wallMat: materials.brickRed,
          hasPediment: true,
        },
        materials,
        obstacles
      );
    }

    // 2. Classic Parkville Double-Storey Victorian Filigree Terrace Rowhouses (along Faraday St West & Grattan St)
    const terraceColors = [
      materials.stuccoCream,
      materials.brickRed,
      materials.stuccoSage,
      materials.brickOchre,
      materials.stuccoTerracotta,
    ];
    for (let i = 0; i < 5; i++) {
      const tx = -30 + i * 5.2;
      const tz = -84;
      this.createParkvilleTerraceHouse(
        tx,
        tz,
        terraceColors[i % terraceColors.length],
        materials,
        obstacles
      );
    }

    // Second row of Parkville Terraces south of Grattan St (Z = -53)
    for (let i = 0; i < 4; i++) {
      const tx = -88 + i * 5.6;
      this.createParkvilleTerraceHouse(
        tx,
        -53,
        terraceColors[(i + 2) % terraceColors.length],
        materials,
        obstacles
      );
    }

    // 3. Modern Brick & Timber Student Accommodation ("Ormond Commons", X = -22, Z = -98)
    this.createContemporaryBuilding(
      -21,
      -98,
      18,
      11,
      4,
      materials,
      obstacles,
      false
    );

    // 4. Faraday Corner Espresso Cafe (X = -32, Z = -54)
    this.createVictorianBuilding(
      {
        x: -33,
        z: -54,
        w: 9.2,
        d: 9.5,
        floors: 2,
        wallMat: materials.brickRed,
        awningSide: 'north',
        shopType: 'cafe',
        hasPediment: true,
      },
      materials,
      obstacles
    );
  }

  private createParkvilleTerraceHouse(
    x: number,
    z: number,
    wallMat: THREE.Material,
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    const t = new THREE.Group();
    t.position.set(x, groundHeightAt(x, z), z);
    const w = 4.9;
    const d = 9.6;
    const h = 6.9;

    const body = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w, h, d)),
      wallMat
    );
    body.position.y = h * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    t.add(body);

    // Party walls extending above roofline (signature Melbourne Victorian terrace silhouette!)
    for (const sx of [-w * 0.5, w * 0.5]) {
      const partyWall = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.28, h + 1.15, d + 0.4)),
        materials.heritageTrimCream
      );
      partyWall.position.set(sx, (h + 1.15) * 0.5, 0.1);
      partyWall.castShadow = true;
      t.add(partyWall);
    }

    // Front double-storey cast-iron lacework verandah & bullnose corrugated awning
    const verandaRoof = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w - 0.2, 0.16, 1.7)),
      materials.corrugatedIron
    );
    verandaRoof.position.set(0, 6.2, d * 0.5 + 0.8);
    verandaRoof.rotation.x = 0.16;
    verandaRoof.castShadow = true;
    t.add(verandaRoof);

    const balconyDeck = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w - 0.2, 0.18, 1.65)),
      materials.darkTimber
    );
    balconyDeck.position.set(0, 3.35, d * 0.5 + 0.78);
    balconyDeck.castShadow = true;
    t.add(balconyDeck);

    // Wrought-iron filigree balustrade
    const laceRail = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w - 0.3, 0.85, 0.08)),
      materials.charcoalIron
    );
    laceRail.position.set(0, 3.85, d * 0.5 + 1.55);
    t.add(laceRail);

    // Windows & arched front door
    const door = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.05, 2.25, 0.1)),
      materials.stuccoTerracotta
    );
    door.position.set(-1.1, 1.2, d * 0.5 + 0.03);
    t.add(door);

    const winGround = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(1.45, 1.9)),
      materials.windowWarmLit
    );
    winGround.position.set(1.0, 1.55, d * 0.5 + 0.04);
    t.add(winGround);

    const winUpper = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(2.4, 2.0)),
      materials.windowDaylight
    );
    winUpper.position.set(0, 4.75, d * 0.5 + 0.04);
    t.add(winUpper);

    // Chimney pot
    const chim = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.65, 1.4, 0.65)),
      materials.brickRed
    );
    chim.position.set(1.3, h + 0.7, -1.8);
    chim.castShadow = true;
    t.add(chim);

    this.registerFootprint(obstacles, x, z, w, d + 1.6);
    this.group.add(t);
  }

  /**
   * DISTRICT B — MELBOURNE CBD (Iconic Flinders Dome, Victorian Shopfronts, Degraves & Centre Place Laneways, Modern Mid-rises)
   */
  private buildMelbourneCBD(
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // 1. ICONIC FLINDERS HERITAGE DOMED LANDMARK (SW of Swanston & Flinders / overlooking Princes Bridge, X=-16, Z=-6.5)
    // Wait: Flinders St is Z = -2.8 .. +14.8, Degraves Lane is X = -32.2 .. -23.8, Swanston is X = -9.2 .. +9.2, Flinders Lane is Z = -20.4 .. -11.6.
    // Let's place the Grand Edwardian Domed Station/Concourse Heritage Building right on the Riverfront North-West of Princes Bridge (X = -27, Z = 14.5? Wait: Flinders St is Z = 6, Northbank walk is Z ≈ 13..18! Even better: right on the prime Flinders & Swanston NW corner block X = -16.5, Z = -6.8 AND an arched heritage riverfront concourse wing at X = -28, Z = 16.5? No, Flinders St goes from Z = -2.8 to +14.8, so the prime corner block is X = -16.5, Z = -6.8 (between X=-23.8 and -9.2, Z=-11.6 and -2.8)! Let's make it a magnificent multi-storey domed corner landmark there!)
    this.buildFlindersDomedCornerLandmark(-17.4, -7.0, 12.0, 8.2, materials, obstacles);

    // 2. CBD WEST LANEWAY BLOCK (Framing Degraves / Hosier Lane at X = -28)
    // East side of Degraves Lane (X = -17.4, Z = -25.0) — with vibrant street-art mural facing West into Degraves Lane!
    this.createVictorianBuilding(
      {
        x: -17.4,
        z: -25.0,
        w: 11.8,
        d: 8.4,
        floors: 4,
        wallMat: materials.brickRed,
        awningSide: 'none',
        shopType: 'cafe',
        hasPediment: true,
        muralWest: materials.muralLanewayA,
      },
      materials,
      obstacles
    );

    // West side of Degraves Lane — South parcel (X = -42, Z = -7.0) with mural facing East into Degraves Lane!
    this.createVictorianBuilding(
      {
        x: -41.5,
        z: -7.0,
        w: 16.0,
        d: 8.2,
        floors: 3,
        wallMat: materials.brickOchre,
        awningSide: 'south',
        shopType: 'cafe',
        muralEast: materials.muralLanewayB,
      },
      materials,
      obstacles
    );

    // West side of Degraves Lane — North parcel (X = -39, Z = -25.0) + Contemporary Tower next door (X = -54, Z = -25.0)
    this.createVictorianBuilding(
      {
        x: -38.5,
        z: -25.0,
        w: 10.2,
        d: 8.4,
        floors: 3,
        wallMat: materials.stuccoCream,
        awningSide: 'north',
        shopType: 'cafe',
        muralEast: materials.muralLanewayA,
      },
      materials,
      obstacles
    );

    this.createContemporaryBuilding(-53.5, -25.0, 13.5, 8.6, 6, materials, obstacles);

    // 3. CBD EAST BLOCK (Framing Centre Place Laneway at X = +26)
    // West of Centre Place — Swanston East Shopfronts:
    this.createVictorianBuilding(
      {
        x: 16.4,
        z: -7.0,
        w: 10.4,
        d: 8.2,
        floors: 3,
        wallMat: materials.stuccoTerracotta,
        awningSide: 'south',
        shopType: 'cafe',
        hasPediment: true,
        muralEast: materials.muralLanewayB,
      },
      materials,
      obstacles
    );

    this.createVictorianBuilding(
      {
        x: 16.4,
        z: -25.0,
        w: 10.4,
        d: 8.4,
        floors: 4,
        wallMat: materials.brickBrown,
        awningSide: 'none',
        shopType: 'retail',
        muralEast: materials.muralLanewayA,
      },
      materials,
      obstacles
    );

    // East of Centre Place (between X = 30.2 and Russell St X = 50.2):
    this.createContemporaryBuilding(40.2, -7.0, 17.5, 8.2, 5, materials, obstacles);

    this.createVictorianBuilding(
      {
        x: 40.2,
        z: -25.0,
        w: 17.5,
        d: 8.4,
        floors: 3,
        wallMat: materials.stuccoSage,
        awningSide: 'north',
        shopType: 'cafe',
        hasPediment: true,
        muralWest: materials.muralLanewayB,
      },
      materials,
      obstacles
    );

    // 4. CBD NORTH BLOCKS (Between Bourke St Z=-46.4 and Grattan St Z=-60.2)
    // West of Hardware Lane (X = -35.5, Z = -53.2)
    this.createVictorianBuilding(
      {
        x: -15.4,
        z: -53.2,
        w: 8.8,
        d: 11.4,
        floors: 4,
        wallMat: materials.brickOchre,
        awningSide: 'south',
        shopType: 'cafe',
        muralWest: materials.muralLanewayA,
      },
      materials,
      obstacles
    );

    // CBD North-East (State Library / Heritage Commercial Block + Contemporary Office, X = 18..44, Z = -53.2)
    this.createVictorianBuilding(
      {
        x: 18.5,
        z: -53.2,
        w: 15.5,
        d: 11.6,
        floors: 3,
        wallMat: materials.sandstone,
        awningSide: 'south',
        hasPediment: true,
      },
      materials,
      obstacles
    );
    this.createContemporaryBuilding(39.5, -53.2, 17.5, 11.6, 6, materials, obstacles);
  }

  private buildFlindersDomedCornerLandmark(
    x: number,
    z: number,
    w: number,
    d: number,
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // Inspired by Flinders Street Station's unmistakable golden-ochre & red-brick Edwardian architecture + copper dome
    const g = new THREE.Group();
    g.position.set(x, groundHeightAt(x, z), z);

    const h = 11.8;
    const base = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w, h, d)),
      materials.brickOchre
    );
    base.position.y = h * 0.5;
    base.castShadow = true;
    base.receiveShadow = true;
    g.add(base);

    // Alternating red-brick horizontal Edwardian "blood-and-bandages" banding!
    for (const by of [2.4, 5.4, 8.6, 11.2]) {
      const band = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(w + 0.25, 0.52, d + 0.25)),
        materials.brickRed
      );
      band.position.y = by;
      band.castShadow = true;
      g.add(band);
    }

    // Grand Arched Entrance Portal facing Swanston & Flinders intersection (+X, +Z)
    const archDrum = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(5.6, 13.2, 5.6)),
      materials.sandstone
    );
    archDrum.position.set(w * 0.5 - 2.4, 6.6, d * 0.5 - 2.4);
    archDrum.castShadow = true;
    g.add(archDrum);

    // Row of illuminated heritage arrival clocks above the entrance!
    for (let ci = -1; ci <= 1; ci++) {
      const clock = new THREE.Mesh(
        this.trackGeo(new THREE.CircleGeometry(0.45, 12)),
        materials.neonCream
      );
      clock.position.set(w * 0.5 - 2.4 + ci * 1.35, 5.1, d * 0.5 + 0.45);
      g.add(clock);
    }

    // Ribbed Verdigris Copper Dome + Lantern Cupola
    const drumOct = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(3.1, 3.3, 2.2, 12)),
      materials.heritageTrimCream
    );
    drumOct.position.set(w * 0.5 - 2.4, 14.1, d * 0.5 - 2.4);
    drumOct.castShadow = true;
    g.add(drumOct);

    const dome = new THREE.Mesh(
      this.trackGeo(
        new THREE.SphereGeometry(3.05, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.52)
      ),
      materials.verdigrisCopper
    );
    dome.position.set(w * 0.5 - 2.4, 15.1, d * 0.5 - 2.4);
    dome.castShadow = true;
    g.add(dome);

    const cupola = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.65, 0.75, 1.6, 8)),
      materials.lampGlowWarm
    );
    cupola.position.set(w * 0.5 - 2.4, 18.4, d * 0.5 - 2.4);
    g.add(cupola);

    const spire = new THREE.Mesh(
      this.trackGeo(new THREE.ConeGeometry(0.75, 2.1, 8)),
      materials.verdigrisCopper
    );
    spire.position.set(w * 0.5 - 2.4, 20.1, d * 0.5 - 2.4);
    g.add(spire);

    // Cantilevered heritage concourse verandah
    const canopy = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w + 1.4, 0.24, 2.2)),
      materials.verdigrisCopper
    );
    canopy.position.set(0.5, 3.7, d * 0.5 + 1.0);
    canopy.castShadow = true;
    g.add(canopy);

    // Warm arched concourse windows
    for (let wx = -w * 0.35; wx <= w * 0.15; wx += 2.8) {
      const win = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(1.7, 2.6)),
        materials.windowWarmLit
      );
      win.position.set(wx, 2.2, d * 0.5 + 0.04);
      g.add(win);
      const winUpper = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(1.5, 2.3)),
        materials.windowWarmLit
      );
      winUpper.position.set(wx, 7.1, d * 0.5 + 0.04);
      g.add(winUpper);
    }

    this.registerFootprint(obstacles, x, z, w, d);
    this.group.add(g);
  }

  /**
   * DISTRICT E — MELBOURNE ENTERTAINMENT & ARCADE QUARTER (East of Russell St X=58, centred around Arcade Alley X=92)
   * Includes Starlight Coin-Op Arcade, Wax & Groove Vinyl Record Store, Roxy Music Shop, Laneway Izakaya, & Decorative Archway!
   */
  private buildArcadeEntertainmentQuarter(
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // 1. STARLIGHT ARCADE (West of Arcade Alley: X = 76.5, Z = -16.5)
    const arcade = new THREE.Group();
    const ax = 76.5;
    const az = -16.5;
    arcade.position.set(ax, groundHeightAt(ax, az), az);
    const aw = 18.0;
    const ad = 21.0;
    const ah = 10.6;

    const body = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(aw, ah, ad)),
      materials.brickBrown
    );
    body.position.y = ah * 0.5;
    body.castShadow = true;
    body.receiveShadow = true;
    arcade.add(body);

    // Art-Deco stepped facade facing Arcade Alley (+X)
    const decoTower = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.4, ah + 3.2, 8.5)),
      materials.stuccoTerracotta
    );
    decoTower.position.set(aw * 0.5 - 0.3, (ah + 3.2) * 0.5, 0);
    decoTower.castShadow = true;
    arcade.add(decoTower);

    const decoCap = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.65, 0.28, 8.75)),
      materials.heritageTrimCream
    );
    decoCap.position.set(aw * 0.5 - 0.3, ah + 3.34, 0);
    arcade.add(decoCap);

    // Parapet cornice, recessed slate roof deck, glazed skylight & rooftop HVAC units
    const aCornice = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(aw + 0.4, 0.45, ad + 0.4)),
      materials.heritageTrimCream
    );
    aCornice.position.set(0, ah + 0.2, 0);
    arcade.add(aCornice);

    const aRoof = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(aw - 0.7, 0.16, ad - 0.7)),
      materials.roofSlate
    );
    aRoof.position.set(0, ah + 0.46, 0);
    aRoof.receiveShadow = true;
    arcade.add(aRoof);

    const aSkylight = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(4.2, 0.82, 6.4)),
      materials.windowWarmLit
    );
    aSkylight.position.set(-2.2, ah + 0.9, 0);
    aSkylight.castShadow = true;
    arcade.add(aSkylight);

    for (const rz of [-6.2, 6.2]) {
      const hvac = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.8, 0.95, 1.6)),
        materials.modernConcrete
      );
      hvac.position.set(-4.8, ah + 0.98, rz);
      hvac.castShadow = true;
      arcade.add(hvac);
    }

    // Glowing Marquee Entrance Canopy + Neon Tubing
    const marquee = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.6, 0.85, 9.2)),
      materials.charcoalIron
    );
    marquee.position.set(aw * 0.5 + 1.1, 3.85, 0);
    marquee.castShadow = true;
    arcade.add(marquee);

    const marqueeGlow = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.14, 0.55, 8.8)),
      materials.neonAmber
    );
    marqueeGlow.position.set(aw * 0.5 + 2.42, 3.85, 0);
    arcade.add(marqueeGlow);

    // Vertical Vintage Neon Fin Sign ("ARCADE")
    const finBack = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.5, 5.4, 0.28)),
      materials.charcoalIron
    );
    finBack.position.set(aw * 0.5 + 0.9, 8.2, 0);
    arcade.add(finBack);

    const finTube1 = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.15, 4.9, 0.34)),
      materials.neonCoral
    );
    finTube1.position.set(aw * 0.5 + 0.9, 8.2, 0);
    arcade.add(finTube1);

    const finTube2 = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.45, 4.4, 0.38)),
      materials.neonTeal
    );
    finTube2.position.set(aw * 0.5 + 0.9, 8.2, 0);
    arcade.add(finTube2);

    // Glowing Pixel-Art Arcade Cabinet Windows along Alley
    for (const wz of [-6.2, 0, 6.2]) {
      const win = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(4.2, 2.8)),
        materials.arcadeWindow
      );
      win.position.set(aw * 0.5 + 0.04, 2.0, wz);
      win.rotation.y = Math.PI / 2;
      arcade.add(win);
    }

    // Cosmic Pixel-Art Mural on North Flank facing Bourke St
    const mural = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(11.0, 4.5)),
      materials.muralArcade
    );
    mural.position.set(0, 5.8, -ad * 0.5 - 0.04);
    mural.rotation.y = Math.PI;
    arcade.add(mural);

    this.registerFootprint(obstacles, ax, az, aw, ad);
    this.group.add(arcade);

    // 2. WAX & GROOVE VINYL RECORD STORE (East of Arcade Alley: X = 107.5, Z = -20.5)
    const vinyl = new THREE.Group();
    const vx = 107.5;
    const vz = -20.5;
    vinyl.position.set(vx, groundHeightAt(vx, vz), vz);
    const vw = 16.5;
    const vd = 14.0;
    const vh = 8.4;

    const vBody = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(vw, vh, vd)),
      materials.brickRed
    );
    vBody.position.y = vh * 0.5;
    vBody.castShadow = true;
    vBody.receiveShadow = true;
    vinyl.add(vBody);

    const vCornice = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(vw + 0.4, 0.45, vd + 0.4)),
      materials.heritageTrimCream
    );
    vCornice.position.y = vh + 0.2;
    vinyl.add(vCornice);

    const vRoof = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(vw - 0.7, 0.16, vd - 0.7)),
      materials.roofSlate
    );
    vRoof.position.set(0, vh + 0.46, 0);
    vRoof.receiveShadow = true;
    vinyl.add(vRoof);

    const vSkylight = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.8, 0.74, 4.6)),
      materials.windowWarmLit
    );
    vSkylight.position.set(0.4, vh + 0.86, 0);
    vSkylight.castShadow = true;
    vinyl.add(vSkylight);

    const vChimney = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.95, 1.55, 0.95)),
      materials.brickRed
    );
    vChimney.position.set(vw * 0.3, vh + 1.18, -vd * 0.28);
    vChimney.castShadow = true;
    vinyl.add(vChimney);

    // Record Shop Display Windows facing West into Arcade Alley
    for (const wz of [-3.6, 3.6]) {
      const vWin = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(4.4, 2.75)),
        materials.vinylWindow
      );
      vWin.position.set(-vw * 0.5 - 0.04, 1.95, wz);
      vWin.rotation.y = -Math.PI / 2;
      vinyl.add(vWin);
    }

    // Giant Spinning 3D Vinyl Record Blade Sign hanging over the Alley!
    const discPivot = new THREE.Group();
    discPivot.position.set(-vw * 0.5 - 1.15, 5.2, 0);
    const disc = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(1.25, 1.25, 0.1, 20)),
      materials.charcoalIron
    );
    disc.rotation.z = Math.PI / 2;
    discPivot.add(disc);
    const label = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.46, 0.46, 0.13, 16)),
      materials.neonCoral
    );
    label.rotation.z = Math.PI / 2;
    discPivot.add(label);
    vinyl.add(discPivot);
    this.spinningSigns.push(discPivot);

    // Neon trim band above Vinyl Storefront
    const vNeon = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.14, 0.18, vd - 1.2)),
      materials.neonTeal
    );
    vNeon.position.set(-vw * 0.5 - 0.1, 3.7, 0);
    vinyl.add(vNeon);

    this.registerFootprint(obstacles, vx, vz, vw, vd);
    this.group.add(vinyl);

    // 3. ROXY MUSIC & GUITAR SHOP (East of Arcade Alley South: X = 107.5, Z = -6.0)
    const musicShop = this.createVictorianBuilding(
      {
        x: 107.5,
        z: -6.2,
        w: 16.5,
        d: 9.2,
        floors: 3,
        wallMat: materials.brickOchre,
        awningSide: 'west',
        shopType: 'cafe',
        hasPediment: true,
      },
      materials,
      obstacles
    );
    const musicNeon = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.16, 0.22, 7.6)),
      materials.neonAmber
    );
    musicNeon.position.set(-8.35, 4.1, 0);
    musicShop.add(musicNeon);

    // 4. LATE-NIGHT GYOZA & JAZZ BISTRO BLOCKS (North of Bourke St in Entertainment Quarter, Z = -51.5)
    const bistroW = this.createVictorianBuilding(
      {
        x: 76.5,
        z: -51.8,
        w: 17.5,
        d: 9.6,
        floors: 3,
        wallMat: materials.brickRed,
        awningSide: 'east',
        shopType: 'cafe',
        muralEast: materials.muralArcade,
      },
      materials,
      obstacles
    );
    // Warm glowing paper lanterns under Bistro awning!
    for (let lz = -3.6; lz <= 3.6; lz += 1.8) {
      const lantern = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.28, 10, 8)),
        lz % 3.6 === 0 ? materials.neonCoral : materials.neonAmber
      );
      lantern.scale.set(1, 1.35, 1);
      lantern.position.set(10.1, 3.25, lz);
      bistroW.add(lantern);
    }

    this.createVictorianBuilding(
      {
        x: 107.5,
        z: -51.8,
        w: 16.5,
        d: 9.6,
        floors: 3,
        wallMat: materials.stuccoTerracotta,
        awningSide: 'west',
        shopType: 'cafe',
      },
      materials,
      obstacles
    );

    // 5. Iconic Illuminated Entertainment Quarter Gateway Arch spanning Arcade Alley at Z = -3.2!
    const archGate = new THREE.Group();
    archGate.position.set(92, 0.08, -3.2);
    for (const sx of [-3.4, 3.4]) {
      const col = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.26, 0.32, 6.2, 10)),
        materials.stuccoTerracotta
      );
      col.position.set(sx, 3.1, 0);
      col.castShadow = true;
      archGate.add(col);
    }
    const lintel = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(8.2, 1.05, 0.85)),
      materials.darkTimber
    );
    lintel.position.set(0, 6.2, 0);
    lintel.castShadow = true;
    archGate.add(lintel);

    const roofCap = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(9.1, 0.35, 1.45)),
      materials.verdigrisCopper
    );
    roofCap.position.set(0, 6.85, 0);
    archGate.add(roofCap);

    const gateGlow = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(6.8, 0.48, 0.92)),
      materials.neonAmber
    );
    gateGlow.position.set(0, 6.2, 0);
    archGate.add(gateGlow);

    this.group.add(archGate);
  }

  /**
   * DISTRICT C — SOUTHBANK & YARRA RIVERFRONT (Waterfront pavilions, restaurants, contemporary towers & Arts Spire)
   */
  private buildSouthbankDistrict(
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // 1. Low-slung Waterfront Restaurant Pavilions along Southbank Promenade (between River & Southbank Blvd Z=58)
    const pavilions = [
      { x: -92, w: 18, d: 6.4 },
      { x: -68, w: 16, d: 6.2 },
      { x: -34, w: 17, d: 6.4 },
    ];
    for (const p of pavilions) {
      const pz = getYarraCenterZ(p.x) + getYarraHalfWidth(p.x) + 11.2;
      const pav = new THREE.Group();
      pav.position.set(p.x, 0.06, pz);

      const frame = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(p.w, 4.1, p.d)),
        materials.darkTimber
      );
      frame.position.y = 2.05;
      frame.castShadow = true;
      frame.receiveShadow = true;
      pav.add(frame);

      const glassFront = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(p.w - 1.4, 3.0)),
        materials.cafeWindow
      );
      glassFront.position.set(0, 1.9, -p.d * 0.5 - 0.03);
      glassFront.rotation.y = Math.PI;
      pav.add(glassFront);

      const overhang = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(p.w + 2.2, 0.28, p.d + 2.8)),
        materials.modernConcrete
      );
      overhang.position.set(0, 4.22, -0.8);
      overhang.castShadow = true;
      pav.add(overhang);

      const warmStrip = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(p.w + 1.6, 0.08, 0.22)),
        materials.lampGlowWarm
      );
      warmStrip.position.set(0, 4.05, -p.d * 0.5 - 1.6);
      pav.add(warmStrip);

      this.registerFootprint(obstacles, p.x, pz, p.w, p.d);
      this.group.add(pav);
    }

    // 2. Southbank Contemporary Residential & Arts Towers south of Southbank Blvd (Z = 75..82)
    const towers = [
      { x: -98, z: 76, w: 20, d: 15, floors: 8 },
      { x: -68, z: 77, w: 19, d: 15, floors: 10 },
      { x: -38, z: 76, w: 21, d: 15, floors: 7 },
    ];
    for (const t of towers) {
      this.createContemporaryBuilding(
        t.x,
        t.z,
        t.w,
        t.d,
        t.floors,
        materials,
        obstacles,
        true
      );
    }

    // 3. Iconic Melbourne Arts Centre Lattice Spire Pavilion (Southbank East near St Kilda Rd, X = -19.5, Z = 76)
    const arts = new THREE.Group();
    arts.position.set(-19.5, 0.04, 76);

    const baseDrum = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(8.2, 9.0, 6.2, 16)),
      materials.modernConcrete
    );
    baseDrum.position.y = 3.1;
    baseDrum.castShadow = true;
    baseDrum.receiveShadow = true;
    arts.add(baseDrum);

    const copperSkirt = new THREE.Mesh(
      this.trackGeo(new THREE.ConeGeometry(9.6, 5.2, 12, 1, true)),
      materials.heritageTrimCream
    );
    copperSkirt.position.y = 8.4;
    copperSkirt.castShadow = true;
    arts.add(copperSkirt);

    // Lattice tapered spire soaring above Southbank!
    const spireLattice = new THREE.Mesh(
      this.trackGeo(new THREE.ConeGeometry(3.8, 19.5, 8, 4, true)),
      new THREE.MeshStandardMaterial({
        color: 0xf2ece1,
        roughness: 0.4,
        metalness: 0.6,
        wireframe: true,
      })
    );
    spireLattice.position.y = 19.5;
    arts.add(spireLattice);

    const spireTip = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.08, 0.35, 8.5, 8)),
      materials.brassGold
    );
    spireTip.position.y = 31.5;
    arts.add(spireTip);

    const beacon = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.32, 8, 8)),
      materials.neonAmber
    );
    beacon.position.y = 35.9;
    arts.add(beacon);

    this.registerFootprint(obstacles, -19.5, 76, 17, 17);
    this.group.add(arts);
  }

  public update(delta: number): void {
    for (const s of this.spinningSigns) {
      s.rotation.y += delta * 0.85;
    }
  }

  public dispose(): void {
    for (const g of this.geometries) {
      g.dispose();
    }
    this.geometries = [];
  }
}
