import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import { getYarraCenterZ, getYarraHalfWidth, groundHeightAt } from './TerrainSystem';

export interface RoadSegmentSpec {
  id: string;
  x1: number;
  z1: number;
  x2: number;
  z2: number;
  roadWidth: number;
  footpathWidth: number;
  surface: 'asphalt' | 'bluestone' | 'brick';
  hasCentreLine?: boolean;
  hasTramCorridor?: boolean;
  skipBridgeSpan?: boolean;
}

/**
 * Connected Melbourne road, bluestone laneway, kerb, footpath, pedestrian crossing,
 * Princes Bridge, Evan Walker Footbridge, and Royal Botanic Gardens path network.
 */
export class RoadNetwork {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  public segments: RoadSegmentSpec[] = [];

  constructor(materials: WorldMaterialLibrary) {
    this.group.name = 'RoadNetwork';
    this.defineNetwork();
    this.buildUrbanRoadsAndLaneways(materials);
    this.buildIntersectionsAndCrossings(materials);
    this.buildPrincesBridge(materials);
    this.buildEvanWalkerFootbridge(materials);
    this.buildBotanicGardenPaths(materials);
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private defineNetwork(): void {
    this.segments = [
      // 1. SWANSTON / ROYAL PARADE / ST KILDA RD SPINE (X = 0, North-South arterial + Tram corridor)
      // North of Yarra (Parkville -> CBD -> Flinders St)
      {
        id: 'swanston-north',
        x1: 0,
        z1: -116,
        x2: 0,
        z2: 14.0,
        roadWidth: 14.4,
        footpathWidth: 3.1,
        surface: 'asphalt',
        hasCentreLine: false,
        hasTramCorridor: true,
      },
      // South of Yarra (Princes Bridge South -> St Kilda Rd / Southbank / Botanic Gardens border)
      {
        id: 'stkilda-rd',
        x1: 0,
        z1: 42.0,
        x2: 0,
        z2: 114,
        roadWidth: 14.4,
        footpathWidth: 3.2,
        surface: 'asphalt',
        hasCentreLine: false,
        hasTramCorridor: true,
      },

      // 2. GRATTAN STREET — PARKVILLE (Z = -68, West-East boulevard)
      {
        id: 'grattan-st',
        x1: -126,
        z1: -68,
        x2: 56,
        z2: -68,
        roadWidth: 9.2,
        footpathWidth: 3.0,
        surface: 'asphalt',
        hasCentreLine: true,
        hasTramCorridor: true,
      },

      // 3. PARKVILLE RESIDENTIAL TERRACE STREET — FARADAY ST (X = -44, Z = -114..-40)
      {
        id: 'faraday-st',
        x1: -44,
        z1: -114,
        x2: -44,
        z2: -38,
        roadWidth: 7.4,
        footpathWidth: 2.6,
        surface: 'asphalt',
        hasCentreLine: true,
      },

      // 4. BOURKE / LITTLE BOURKE ARTERIAL (Z = -38, connects Parkville edge -> CBD -> Arcade Quarter)
      {
        id: 'bourke-st',
        x1: -118,
        z1: -38,
        x2: 126,
        z2: -38,
        roadWidth: 9.8,
        footpathWidth: 3.2,
        surface: 'asphalt',
        hasCentreLine: true,
      },

      // 5. FLINDERS STREET (Z = 6, iconic riverfront arterial running West-East across CBD & Arcade)
      {
        id: 'flinders-st',
        x1: -124,
        z1: 6,
        x2: 126,
        z2: 6,
        roadWidth: 10.6,
        footpathWidth: 3.4,
        surface: 'asphalt',
        hasCentreLine: true,
      },

      // 6. RUSSELL / EXHIBITION CONNECTOR (X = 58, divides CBD East & Arcade Entertainment Quarter)
      {
        id: 'russell-st',
        x1: 58,
        z1: -98,
        x2: 58,
        z2: 6,
        roadWidth: 8.8,
        footpathWidth: 2.8,
        surface: 'asphalt',
        hasCentreLine: true,
      },

      // 7. SOUTHBANK BOULEVARD (Z = 58, runs behind Southbank waterfront dining precinct)
      {
        id: 'southbank-blvd',
        x1: -122,
        z1: 58,
        x2: 26,
        z2: 58,
        roadWidth: 9.4,
        footpathWidth: 3.0,
        surface: 'asphalt',
        hasCentreLine: true,
      },

      // 8. SIGNATURE BLUESTONE LANEWAYS (Melbourne CBD & Entertainment Quarter)
      // Degraves / Hosier Laneway (CBD West: X = -28, Z = -38..6)
      {
        id: 'degraves-lane',
        x1: -28,
        z1: -38,
        x2: -28,
        z2: 6,
        roadWidth: 4.6,
        footpathWidth: 1.4,
        surface: 'bluestone',
      },
      // Hardware / Guildford Brick Laneway (CBD North-West: X = -24, Z = -68..-38)
      {
        id: 'hardware-lane',
        x1: -24,
        z1: -68,
        x2: -24,
        z2: -38,
        roadWidth: 4.4,
        footpathWidth: 1.3,
        surface: 'brick',
      },
      // Centre Place Laneway (CBD East: X = 26, Z = -38..6)
      {
        id: 'centre-place',
        x1: 26,
        z1: -38,
        x2: 26,
        z2: 6,
        roadWidth: 4.4,
        footpathWidth: 1.4,
        surface: 'bluestone',
      },
      // Flinders Lane Cross-Alley (CBD Mid: Z = -16, X = -62..58)
      {
        id: 'flinders-lane',
        x1: -62,
        z1: -16,
        x2: 58,
        z2: -16,
        roadWidth: 5.2,
        footpathWidth: 1.6,
        surface: 'bluestone',
      },
      // Neon Pixel / Chinatown Arcade Alley (Entertainment Quarter: X = 92, Z = -76..6)
      {
        id: 'arcade-alley',
        x1: 92,
        z1: -76,
        x2: 92,
        z2: 6,
        roadWidth: 5.4,
        footpathWidth: 1.8,
        surface: 'bluestone',
      },
      // Electric Bar Cross-Lane (Entertainment Quarter: Z = -62, X = 58..124)
      {
        id: 'electric-lane',
        x1: 58,
        z1: -62,
        x2: 124,
        z2: -62,
        roadWidth: 5.0,
        footpathWidth: 1.6,
        surface: 'brick',
      },
    ];
  }

  private buildUrbanRoadsAndLaneways(materials: WorldMaterialLibrary): void {
    for (const seg of this.segments) {
      const dx = seg.x2 - seg.x1;
      const dz = seg.z2 - seg.z1;
      const len = Math.hypot(dx, dz);
      const cx = (seg.x1 + seg.x2) * 0.5;
      const cz = (seg.z1 + seg.z2) * 0.5;
      const angle = Math.atan2(dx, dz);

      const segGroup = new THREE.Group();
      segGroup.position.set(cx, 0, cz);
      segGroup.rotation.y = angle;

      // Roadway surface (sits cleanly at Y = 0.035)
      const roadMat =
        seg.surface === 'bluestone'
          ? materials.bluestone
          : seg.surface === 'brick'
            ? materials.herringboneBrick
            : materials.asphalt;

      const roadY = seg.surface === 'asphalt' ? 0.035 : 0.045;
      const roadGeo = this.trackGeo(new THREE.BoxGeometry(seg.roadWidth, 0.05, len));
      const roadMesh = new THREE.Mesh(roadGeo, roadMat);
      roadMesh.position.y = roadY;
      roadMesh.receiveShadow = true;
      segGroup.add(roadMesh);

      // Central bluestone spoon drain in Melbourne laneways
      if (seg.surface === 'bluestone' || seg.surface === 'brick') {
        const drainGeo = this.trackGeo(new THREE.BoxGeometry(0.42, 0.055, len - 1));
        const drainMesh = new THREE.Mesh(drainGeo, materials.kerbStone);
        drainMesh.position.y = roadY + 0.004;
        drainMesh.receiveShadow = true;
        segGroup.add(drainMesh);
      }

      // Raised footpaths + bluestone kerbs on both sides
      if (seg.footpathWidth > 0) {
        for (const side of [-1, 1] as const) {
          // Bluestone kerb stone
          const kerbX = side * (seg.roadWidth * 0.5 + 0.14);
          const kerbGeo = this.trackGeo(new THREE.BoxGeometry(0.28, 0.16, len));
          const kerb = new THREE.Mesh(kerbGeo, materials.kerbStone);
          kerb.position.set(kerbX, 0.08, 0);
          kerb.castShadow = true;
          kerb.receiveShadow = true;
          segGroup.add(kerb);

          // Concrete / Brick footpath slab
          const fpX = side * (seg.roadWidth * 0.5 + 0.28 + seg.footpathWidth * 0.5);
          const fpGeo = this.trackGeo(
            new THREE.BoxGeometry(seg.footpathWidth, 0.15, len)
          );
          const fpMat =
            seg.surface === 'bluestone'
              ? materials.footpathConcrete
              : seg.id === 'grattan-st' || seg.id === 'faraday-st'
                ? materials.herringboneBrick
                : materials.footpathConcrete;
          const fp = new THREE.Mesh(fpGeo, fpMat);
          fp.position.set(fpX, 0.075, 0);
          fp.receiveShadow = true;
          segGroup.add(fp);

          // Cast-iron street drainage grates every 22m on asphalt roads
          if (seg.surface === 'asphalt') {
            const grateCount = Math.floor(len / 24);
            for (let gi = 0; gi < grateCount; gi++) {
              const gz = -len * 0.5 + 12 + gi * 24;
              const grateGeo = this.trackGeo(new THREE.BoxGeometry(0.42, 0.02, 0.75));
              const grate = new THREE.Mesh(grateGeo, materials.charcoalIron);
              grate.position.set(side * (seg.roadWidth * 0.5 - 0.3), roadY + 0.028, gz);
              segGroup.add(grate);
            }
          }
        }
      }

      // Dashed cream centre road markings & parking bay lines
      if (seg.hasCentreLine && seg.surface === 'asphalt') {
        const dashCount = Math.floor(len / 5.5);
        for (let i = 0; i < dashCount; i++) {
          const dzPos = -len * 0.5 + 3 + i * 5.5;
          const dashGeo = this.trackGeo(new THREE.PlaneGeometry(0.16, 2.4));
          dashGeo.rotateX(-Math.PI / 2);
          const dash = new THREE.Mesh(dashGeo, materials.roadMarkingCream);
          dash.position.set(0, roadY + 0.03, dzPos);
          segGroup.add(dash);
        }
      }

      // Tram safety yellow edge lines on tram corridors
      if (seg.hasTramCorridor) {
        for (const side of [-1, 1] as const) {
          const lineGeo = this.trackGeo(new THREE.PlaneGeometry(0.12, len - 2));
          lineGeo.rotateX(-Math.PI / 2);
          const line = new THREE.Mesh(lineGeo, materials.roadMarkingYellow);
          line.position.set(side * 2.55, roadY + 0.03, 0);
          segGroup.add(line);
        }
      }

      this.group.add(segGroup);
    }
  }

  private buildIntersectionsAndCrossings(materials: WorldMaterialLibrary): void {
    // Clean asphalt intersection aprons + crisp pedestrian zebra crossings
    const intersections: Array<{ x: number; z: number; sizeX: number; sizeZ: number }> = [
      { x: 0, z: -68, sizeX: 15.0, sizeZ: 10.2 }, // Swanston & Grattan (Parkville)
      { x: -44, z: -68, sizeX: 8.6, sizeZ: 9.8 }, // Faraday & Grattan (Parkville)
      { x: -44, z: -38, sizeX: 8.6, sizeZ: 10.4 }, // Faraday & Bourke
      { x: 0, z: -38, sizeX: 15.0, sizeZ: 10.6 }, // Swanston & Bourke (CBD)
      { x: 58, z: -38, sizeX: 9.8, sizeZ: 10.6 }, // Russell & Bourke (Arcade Quarter)
      { x: 0, z: 6, sizeX: 15.0, sizeZ: 11.4 }, // Swanston & Flinders (Iconic CBD Hub!)
      { x: 58, z: 6, sizeX: 9.8, sizeZ: 11.2 }, // Russell & Flinders
      { x: 0, z: 58, sizeX: 15.0, sizeZ: 10.4 }, // St Kilda Rd & Southbank Blvd
    ];

    for (const inter of intersections) {
      // Smooth asphalt junction box covering intersecting kerbs cleanly
      const boxGeo = this.trackGeo(
        new THREE.BoxGeometry(inter.sizeX + 5.2, 0.14, inter.sizeZ + 5.2)
      );
      const box = new THREE.Mesh(boxGeo, materials.asphalt);
      box.position.set(inter.x, 0.01, inter.z);
      box.receiveShadow = true;
      this.group.add(box);

      // 4 Zebra Pedestrian Crossings around major intersections
      const zebraStripes = 6;
      // North & South crossings
      for (const zSide of [-1, 1] as const) {
        const cz = inter.z + zSide * (inter.sizeZ * 0.5 + 1.45);
        for (let s = 0; s < zebraStripes; s++) {
          const sx =
            inter.x -
            inter.sizeX * 0.36 +
            (s / (zebraStripes - 1)) * (inter.sizeX * 0.72);
          const stripeGeo = this.trackGeo(new THREE.PlaneGeometry(0.48, 2.1));
          stripeGeo.rotateX(-Math.PI / 2);
          const stripe = new THREE.Mesh(stripeGeo, materials.roadMarkingCream);
          stripe.position.set(sx, 0.085, cz);
          this.group.add(stripe);
        }
      }
      // East & West crossings
      for (const xSide of [-1, 1] as const) {
        const cx = inter.x + xSide * (inter.sizeX * 0.5 + 1.45);
        for (let s = 0; s < zebraStripes; s++) {
          const sz =
            inter.z -
            inter.sizeZ * 0.36 +
            (s / (zebraStripes - 1)) * (inter.sizeZ * 0.72);
          const stripeGeo = this.trackGeo(new THREE.PlaneGeometry(2.1, 0.48));
          stripeGeo.rotateX(-Math.PI / 2);
          const stripe = new THREE.Mesh(stripeGeo, materials.roadMarkingCream);
          stripe.position.set(cx, 0.085, sz);
          this.group.add(stripe);
        }
      }
    }
  }

  private buildPrincesBridge(materials: WorldMaterialLibrary): void {
    // Iconic Melbourne Princes Bridge at X = 0 spanning Z = 13.5 .. 42.5
    const bridgeGroup = new THREE.Group();
    bridgeGroup.name = 'PrincesBridge';
    const zStart = 13.5;
    const zEnd = 42.5;
    const spanLen = zEnd - zStart;
    const zMid = (zStart + zEnd) * 0.5;

    // Roadway deck + footpaths flush with X=0 Swanston/St Kilda Rd (14.4m roadway)
    const deckGeo = this.trackGeo(new THREE.BoxGeometry(14.4, 0.55, spanLen));
    const deck = new THREE.Mesh(deckGeo, materials.asphalt);
    deck.position.set(0, -0.21, zMid);
    deck.castShadow = true;
    deck.receiveShadow = true;
    bridgeGroup.add(deck);

    for (const side of [-1, 1] as const) {
      // Footpaths
      const walkGeo = this.trackGeo(new THREE.BoxGeometry(3.2, 0.68, spanLen));
      const walk = new THREE.Mesh(walkGeo, materials.sandstone);
      walk.position.set(side * 8.8, -0.18, zMid);
      walk.castShadow = true;
      walk.receiveShadow = true;
      bridgeGroup.add(walk);

      // Ornate Victorian cast-iron & sandstone bridge parapets
      const railBaseGeo = this.trackGeo(new THREE.BoxGeometry(0.45, 0.45, spanLen));
      const railBase = new THREE.Mesh(railBaseGeo, materials.sandstone);
      railBase.position.set(side * 10.25, 0.38, zMid);
      railBase.castShadow = true;
      bridgeGroup.add(railBase);

      const topRailGeo = this.trackGeo(new THREE.BoxGeometry(0.32, 0.14, spanLen));
      const topRail = new THREE.Mesh(topRailGeo, materials.verdigrisCopper);
      topRail.position.set(side * 10.25, 1.12, zMid);
      topRail.castShadow = true;
      bridgeGroup.add(topRail);

      // Balusters + Heritage Bridge Piers & Ornate Twin Globe Lanterns
      const balusterCount = 24;
      for (let b = 0; b <= balusterCount; b++) {
        const bz = zStart + 0.6 + (b / balusterCount) * (spanLen - 1.2);
        const balGeo = this.trackGeo(new THREE.CylinderGeometry(0.08, 0.1, 0.55, 6));
        const bal = new THREE.Mesh(balGeo, materials.verdigrisCopper);
        bal.position.set(side * 10.25, 0.82, bz);
        bridgeGroup.add(bal);
      }

      // 4 Sandstone Pedestals with Victorian Twin-Globe Lamps per side
      for (let p = 0; p < 4; p++) {
        const pz = zStart + 2.2 + (p / 3) * (spanLen - 4.4);
        const pedGeo = this.trackGeo(new THREE.BoxGeometry(0.95, 1.45, 0.95));
        const ped = new THREE.Mesh(pedGeo, materials.sandstone);
        ped.position.set(side * 10.3, 0.65, pz);
        ped.castShadow = true;
        bridgeGroup.add(ped);

        const postGeo = this.trackGeo(new THREE.CylinderGeometry(0.08, 0.14, 2.6, 8));
        const post = new THREE.Mesh(postGeo, materials.charcoalIron);
        post.position.set(side * 10.3, 2.6, pz);
        post.castShadow = true;
        bridgeGroup.add(post);

        const crossBarGeo = this.trackGeo(new THREE.BoxGeometry(0.9, 0.08, 0.08));
        const crossBar = new THREE.Mesh(crossBarGeo, materials.charcoalIron);
        crossBar.position.set(side * 10.3, 3.75, pz);
        bridgeGroup.add(crossBar);

        for (const gx of [-0.38, 0.38]) {
          const globeGeo = this.trackGeo(new THREE.SphereGeometry(0.22, 10, 10));
          const globe = new THREE.Mesh(globeGeo, materials.lampGlowWarm);
          globe.position.set(side * 10.3 + gx, 3.98, pz);
          bridgeGroup.add(globe);
        }
      }
    }

    // 3 Graceful Cast-Iron & Bluestone River Arches + Stone Piers in the Yarra
    const pierZs = [zStart + 2.0, zMid - 4.6, zMid + 4.6, zEnd - 2.0];
    for (const pz of pierZs) {
      const pierGeo = this.trackGeo(new THREE.BoxGeometry(21.6, 3.6, 1.9));
      const pier = new THREE.Mesh(pierGeo, materials.bluestone);
      pier.position.set(0, -1.9, pz);
      pier.castShadow = true;
      pier.receiveShadow = true;
      bridgeGroup.add(pier);
    }

    const archCentres = [zStart + 6.4, zMid, zEnd - 6.4];
    for (const az of archCentres) {
      for (const archX of [-9.4, 0, 9.4]) {
        const archGeo = this.trackGeo(
          new THREE.TorusGeometry(4.1, 0.36, 8, 20, Math.PI)
        );
        archGeo.rotateY(Math.PI / 2);
        const arch = new THREE.Mesh(archGeo, materials.verdigrisCopper);
        arch.position.set(archX, -2.55, az);
        arch.scale.set(1, 0.55, 1.05);
        arch.castShadow = true;
        bridgeGroup.add(arch);
      }
    }

    this.group.add(bridgeGroup);
  }

  private buildEvanWalkerFootbridge(materials: WorldMaterialLibrary): void {
    // Curved contemporary timber-and-steel pedestrian bridge at X = -52 linking CBD West to Southbank
    const fx = -52;
    const cz = getYarraCenterZ(fx);
    const hw = getYarraHalfWidth(fx);
    const zNorth = cz - hw - 1.2;
    const zSouth = cz + hw + 1.2;
    const span = zSouth - zNorth;

    const fbGroup = new THREE.Group();
    fbGroup.name = 'EvanWalkerFootbridge';

    // Gracefully cambered timber deck
    const steps = 24;
    const leftPts: THREE.Vector3[] = [];
    const rightPts: THREE.Vector3[] = [];
    const archCurvePts: THREE.Vector3[] = [];

    for (let i = 0; i <= steps; i++) {
      const t = i / steps;
      const z = THREE.MathUtils.lerp(zNorth, zSouth, t);
      const camber = Math.sin(t * Math.PI) * 0.85;
      leftPts.push(new THREE.Vector3(fx - 2.3, 0.08 + camber, z));
      rightPts.push(new THREE.Vector3(fx + 2.3, 0.08 + camber, z));
      archCurvePts.push(
        new THREE.Vector3(fx + 2.55, 0.1 + Math.sin(t * Math.PI) * 4.8, z)
      );
    }

    // Build deck planks
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const z = THREE.MathUtils.lerp(zNorth, zSouth, t);
      const camber = Math.sin(t * Math.PI) * 0.85;
      const plankGeo = this.trackGeo(
        new THREE.BoxGeometry(4.6, 0.22, span / steps + 0.08)
      );
      const plank = new THREE.Mesh(plankGeo, materials.timberDeck);
      plank.position.set(fx, camber, z);
      plank.castShadow = true;
      plank.receiveShadow = true;
      fbGroup.add(plank);

      // Balustrade posts
      if (i % 2 === 0) {
        for (const s of [-2.2, 2.2]) {
          const postGeo = this.trackGeo(new THREE.BoxGeometry(0.08, 1.05, 0.08));
          const post = new THREE.Mesh(postGeo, materials.charcoalIron);
          post.position.set(fx + s, camber + 0.6, z);
          fbGroup.add(post);
        }
      }
    }

    // Sweeping white/cream sculptural steel arch + tension cables (signature Melbourne footbridge silhouette)
    const archCurve = new THREE.CatmullRomCurve3(archCurvePts);
    const archGeo = this.trackGeo(new THREE.TubeGeometry(archCurve, 32, 0.22, 8, false));
    const archMesh = new THREE.Mesh(archGeo, materials.heritageTrimCream);
    archMesh.castShadow = true;
    fbGroup.add(archMesh);

    for (let i = 2; i < steps - 1; i += 2) {
      const topPt = archCurvePts[i];
      const botPt = rightPts[i];
      const cableLen = topPt.distanceTo(botPt);
      const cableGeo = this.trackGeo(
        new THREE.CylinderGeometry(0.025, 0.025, cableLen, 5)
      );
      const cable = new THREE.Mesh(cableGeo, materials.steelRail);
      cable.position.copy(topPt).add(botPt).multiplyScalar(0.5);
      cable.lookAt(topPt);
      cable.rotateX(Math.PI / 2);
      fbGroup.add(cable);
    }

    this.group.add(fbGroup);
  }

  private buildBotanicGardenPaths(materials: WorldMaterialLibrary): void {
    // Organic winding ochre sandstone gravel paths throughout District D — Royal Botanic Gardens
    const gardenCurves: THREE.Vector3[][] = [
      // Main grand entrance path from St Kilda Rd (X=6, Z=68) winding around lake North shore to Rotunda Knoll
      [
        new THREE.Vector3(6, 0, 68),
        new THREE.Vector3(26, 0, 66),
        new THREE.Vector3(48, 0, 62),
        new THREE.Vector3(72, 0, 66),
        new THREE.Vector3(96, 0, 68),
        new THREE.Vector3(118, 0, 78),
        new THREE.Vector3(120, 0, 98),
        new THREE.Vector3(96, 0, 106),
        new THREE.Vector3(66, 0, 102),
        new THREE.Vector3(40, 0, 92),
        new THREE.Vector3(26, 0, 66),
      ],
      // Fern Gully / Rivergate path from Southbank East (X=24, Z=48) into Gardens
      [
        new THREE.Vector3(22, 0, 48),
        new THREE.Vector3(44, 0, 52),
        new THREE.Vector3(66, 0, 56),
        new THREE.Vector3(88, 0, 54),
        new THREE.Vector3(112, 0, 60),
      ],
      // Ornamental Lake Cross-Path leading to the Romantic Timber Garden Bridge at (92, 85)
      [
        new THREE.Vector3(88, 0, 66),
        new THREE.Vector3(91, 0, 74),
        new THREE.Vector3(92, 0, 96),
        new THREE.Vector3(94, 0, 106),
      ],
    ];

    for (let ci = 0; ci < gardenCurves.length; ci++) {
      const rawPts = gardenCurves[ci];
      const curve = new THREE.CatmullRomCurve3(rawPts);
      const samples = ci === 0 ? 96 : 44;
      const width = ci === 2 ? 2.4 : 3.1;

      const left: THREE.Vector3[] = [];
      const right: THREE.Vector3[] = [];

      for (let i = 0; i <= samples; i++) {
        const t = i / samples;
        const p = curve.getPoint(t);
        const tangent = curve.getTangent(t).normalize();
        const normal = new THREE.Vector3(-tangent.z, 0, tangent.x);

        // Skip over lake water span on path #2 (handled by curved timber garden bridge below)
        const gy = groundHeightAt(p.x, p.z);
        if (ci === 2 && p.z > 74.5 && p.z < 95.5) continue;

        const y = Math.max(-0.2, gy) + 0.045;
        left.push(
          new THREE.Vector3(p.x - normal.x * width * 0.5, y, p.z - normal.z * width * 0.5)
        );
        right.push(
          new THREE.Vector3(p.x + normal.x * width * 0.5, y, p.z + normal.z * width * 0.5)
        );
      }

      if (left.length > 2) {
        this.addGardenPathRibbon(left, right, materials.gardenPath);
      }
    }

    // Romantic Curved Timber & Sandstone Garden Bridge spanning the Ornamental Lake Narrows (X=92, Z=74..96)
    const gbGroup = new THREE.Group();
    const z1 = 74.0;
    const z2 = 96.0;
    const steps = 18;
    for (let i = 0; i < steps; i++) {
      const t = (i + 0.5) / steps;
      const z = THREE.MathUtils.lerp(z1, z2, t);
      const archY = -0.15 + Math.sin(t * Math.PI) * 1.35;
      const plankGeo = this.trackGeo(
        new THREE.BoxGeometry(2.8, 0.18, (z2 - z1) / steps + 0.06)
      );
      const plank = new THREE.Mesh(plankGeo, materials.warmTimber);
      plank.position.set(92, archY, z);
      plank.castShadow = true;
      plank.receiveShadow = true;
      gbGroup.add(plank);

      for (const s of [-1.28, 1.28]) {
        const postGeo = this.trackGeo(new THREE.BoxGeometry(0.1, 0.85, 0.1));
        const post = new THREE.Mesh(postGeo, materials.darkTimber);
        post.position.set(92 + s, archY + 0.48, z);
        post.castShadow = true;
        gbGroup.add(post);

        const railGeo = this.trackGeo(
          new THREE.BoxGeometry(0.12, 0.09, (z2 - z1) / steps + 0.12)
        );
        const rail = new THREE.Mesh(railGeo, materials.warmTimber);
        rail.position.set(92 + s, archY + 0.88, z);
        gbGroup.add(rail);
      }
    }
    this.group.add(gbGroup);
  }

  private addGardenPathRibbon(
    left: THREE.Vector3[],
    right: THREE.Vector3[],
    material: THREE.Material
  ): void {
    const n = left.length;
    const pos: number[] = [];
    const uvs: number[] = [];
    const idx: number[] = [];
    let acc = 0;

    for (let i = 0; i < n; i++) {
      if (i > 0) acc += left[i].distanceTo(left[i - 1]);
      pos.push(left[i].x, left[i].y, left[i].z);
      pos.push(right[i].x, right[i].y, right[i].z);
      uvs.push(acc * 0.25, 0);
      uvs.push(acc * 0.25, 1);
      if (i < n - 1) {
        const a = i * 2;
        const b = a + 1;
        const c = a + 2;
        const d = a + 3;
        idx.push(a, b, c, b, d, c);
      }
    }

    const geo = this.trackGeo(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(idx);
    geo.computeVertexNormals();
    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  public dispose(): void {
    for (const g of this.geometries) {
      g.dispose();
    }
    this.geometries = [];
  }
}
