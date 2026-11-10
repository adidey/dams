import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import { ObstacleBox2D } from './types';

/**
 * Global mathematical geography functions for Melbourne Dreamland.
 * Ensures 100% flush grounding for every building, kerb, road, tree, pedestrian, and future 2D sprite.
 */
export function getYarraCenterZ(x: number): number {
  // Gently meandering Yarra River centred around Z = 28 at Princes Bridge (X = 0)
  return 28 + Math.sin(x * 0.02) * 4.2 + Math.sin(x * 0.048) * 1.1;
}

export function getYarraHalfWidth(x: number): number {
  return 13.0 + Math.cos(x * 0.026) * 1.4;
}

export function isInsideYarra(x: number, z: number, margin = 0): boolean {
  const cz = getYarraCenterZ(x);
  const hw = getYarraHalfWidth(x) + margin;
  return Math.abs(z - cz) < hw;
}

export function getBotanicLakeFactor(x: number, z: number): number {
  // Organic twin-lobed Ornamental Lake in the Royal Botanic Gardens (SE District: X ~ 88, Z ~ 84)
  const dx1 = (x - 84) / 18;
  const dz1 = (z - 82) / 11.5;
  const d1 = dx1 * dx1 + dz1 * dz1;

  const dx2 = (x - 101) / 14.5;
  const dz2 = (z - 88) / 10.5;
  const d2 = dx2 * dx2 + dz2 * dz2;

  const minD = Math.min(d1, d2);
  if (minD >= 1.0) return 0;
  return THREE.MathUtils.smoothstep(1.0 - minD, 0, 0.45);
}

/**
 * Exact ground elevation at (x, z) across all 5 districts and outer horizon hills.
 */
export function groundHeightAt(x: number, z: number): number {
  // 1. Yarra River channel carving
  const yarraCz = getYarraCenterZ(x);
  const yarraHw = getYarraHalfWidth(x);
  const distRiver = Math.abs(z - yarraCz);
  if (distRiver < yarraHw + 1.8) {
    const bankT = THREE.MathUtils.smoothstep(distRiver, yarraHw - 1.2, yarraHw + 1.8);
    const bedDepth = -2.9;
    return THREE.MathUtils.lerp(bedDepth, 0.0, bankT);
  }

  // 2. Botanic Gardens Ornamental Lake & gently undulating lawns (South-East: X > 28, Z > 45)
  if (x > 24 && z > 44) {
    const gardenBlendX = THREE.MathUtils.smoothstep(x, 24, 38);
    const gardenBlendZ = THREE.MathUtils.smoothstep(z, 44, 54);
    const gardenMask = gardenBlendX * gardenBlendZ;

    const lakeF = getBotanicLakeFactor(x, z);
    // Gentle romantic hills around the Gardens
    const hill =
      (Math.sin((x - 40) * 0.045) * Math.cos((z - 55) * 0.05) * 0.95 +
        Math.sin((x + z) * 0.032) * 0.65 +
        0.75) *
      gardenMask;

    // Flatten slightly along the main winding garden loop & rotunda knoll
    const hillHeight = Math.max(0, hill * (1.0 - lakeF * 1.15));
    const lakeCarve = lakeF * -1.45;
    return hillHeight + lakeCarve;
  }

  // 3. Outer horizon perimeter hills (outside playable ±138m × ±118m zone, natural non-boxed boundary)
  const edgeX = Math.max(0, Math.abs(x) - 138);
  const edgeZ = Math.max(0, Math.abs(z) - 116);
  const edgeDist = Math.hypot(edgeX, edgeZ);
  if (edgeDist > 0) {
    const rise = THREE.MathUtils.smoothstep(edgeDist, 0, 75) * 6.5;
    const ripple =
      Math.sin(x * 0.04) * Math.cos(z * 0.04) * 1.4 * Math.min(1, edgeDist / 25);
    return Math.max(0, rise + ripple);
  }

  // 4. Urban districts (Parkville, CBD, Arcade Quarter, Southbank) sit cleanly around Y = 0
  // with subtle organic lawn swells inside Parkville University Quad
  if (x > -98 && x < -52 && z > -98 && z < -66) {
    const qx = 1 - Math.abs((x + 75) / 23);
    const qz = 1 - Math.abs((z + 82) / 16);
    if (qx > 0 && qz > 0) {
      return Math.sin(qx * Math.PI) * Math.sin(qz * Math.PI) * 0.22;
    }
  }

  return 0;
}

/**
 * Builds the multi-zone terrain, Yarra riverbanks, Southbank terraced promenade,
 * animated Yarra River & Botanic Ornamental Lake water surfaces, and distant Melbourne horizon silhouette.
 */
export class TerrainSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];

  constructor(materials: WorldMaterialLibrary, obstacles: ObstacleBox2D[]) {
    this.group.name = 'TerrainSystem';
    this.buildBaseTerrain(materials);
    this.buildYarraEmbankmentsAndPromenade(materials, obstacles);
    this.buildWaterBodies(materials, obstacles);
    this.buildDistrictGroundZones(materials);
    this.buildDistantSkylineSilhouette(materials);
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private buildBaseTerrain(materials: WorldMaterialLibrary): void {
    // High-resolution organic terrain mesh extending well past camera bounds into horizon fog
    const sizeX = 460;
    const sizeZ = 420;
    const segX = 184;
    const segZ = 168;
    const geo = this.trackGeo(new THREE.PlaneGeometry(sizeX, sizeZ, segX, segZ));
    geo.rotateX(-Math.PI / 2);

    const pos = geo.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const cGrassLush = new THREE.Color(0x98b57c);
    const cGrassWarm = new THREE.Color(0xb2bc84);
    const cUrbanEarth = new THREE.Color(0x8c857b);
    const cRiverBed = new THREE.Color(0x3a4744);
    const cTemp = new THREE.Color();

    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vz = pos.getZ(i);
      const vy = groundHeightAt(vx, vz);
      pos.setY(i, vy);

      // Subtle vertex tinting for organic landscape variation (avoids flat single-tone grass)
      if (vy < -0.35) {
        cTemp.copy(cRiverBed);
      } else if (vx > 24 && vz > 42) {
        // Botanic Gardens lush undulating lawns
        const mix = (Math.sin(vx * 0.06) * Math.cos(vz * 0.06) + 1) * 0.5;
        cTemp.copy(cGrassLush).lerp(cGrassWarm, mix * 0.45);
      } else if (vx < -14 && vz < -38) {
        // Parkville leafy lawns & nature strips
        cTemp.copy(cGrassLush).lerp(cGrassWarm, 0.25);
      } else if (Math.abs(vx) < 132 && vz > -108 && vz < 105) {
        // Urban base under blocks/parks
        cTemp.copy(cUrbanEarth).lerp(cGrassLush, 0.35);
      } else {
        cTemp.copy(cGrassWarm).lerp(cGrassLush, 0.5);
      }

      colors[i * 3] = cTemp.r;
      colors[i * 3 + 1] = cTemp.g;
      colors[i * 3 + 2] = cTemp.b;
    }

    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    geo.computeVertexNormals();

    const terrainMat = materials.grass.clone();
    terrainMat.vertexColors = true;
    const terrainMesh = new THREE.Mesh(geo, terrainMat);
    terrainMesh.receiveShadow = true;
    this.group.add(terrainMesh);
  }

  private buildYarraEmbankmentsAndPromenade(
    materials: WorldMaterialLibrary,
    _obstacles: ObstacleBox2D[]
  ): void {
    // Sculpted bluestone river walls + coping ledges along both North Bank (CBD) and Southbank,
    // split cleanly around Princes Bridge (X = -10.8..+10.8) so bridge roadway & tram tracks stay flush
    const wallSpans: Array<[number, number, number]> = [
      [-165, -10.8, 52],
      [10.8, 165, 52],
    ];

    for (const side of [-1, 1] as const) {
      for (const [x0, x1, segs] of wallSpans) {
        const points: THREE.Vector3[] = [];
        for (let i = 0; i <= segs; i++) {
          const x = THREE.MathUtils.lerp(x0, x1, i / segs);
          const cz = getYarraCenterZ(x);
          const hw = getYarraHalfWidth(x);
          points.push(new THREE.Vector3(x, -0.65, cz + side * (hw + 0.35)));
        }
        const curve = new THREE.CatmullRomCurve3(points);

        const wallShape = new THREE.Shape();
        wallShape.moveTo(-0.7, -1.35);
        wallShape.lineTo(0.7, -1.35);
        wallShape.lineTo(0.7, 0.72);
        wallShape.lineTo(-0.7, 0.72);
        wallShape.closePath();

        const wallGeo = this.trackGeo(
          new THREE.ExtrudeGeometry(wallShape, {
            steps: segs,
            bevelEnabled: false,
            extrudePath: curve,
          })
        );
        const wallMesh = new THREE.Mesh(wallGeo, materials.bluestone);
        wallMesh.castShadow = true;
        wallMesh.receiveShadow = true;
        this.group.add(wallMesh);

        const capPoints = points.map((p) => new THREE.Vector3(p.x, 0.08, p.z));
        const capCurve = new THREE.CatmullRomCurve3(capPoints);
        const capGeo = this.trackGeo(
          new THREE.TubeGeometry(capCurve, segs, 0.4, 6, false)
        );
        capGeo.scale(1, 0.32, 1);
        const capMesh = new THREE.Mesh(capGeo, materials.sandstone);
        capMesh.receiveShadow = true;
        this.group.add(capMesh);
      }
    }

    // Southbank Wide Waterfront Promenade West of Princes Bridge (X: -128..-10.6)
    {
      const promL: THREE.Vector3[] = [];
      const promR: THREE.Vector3[] = [];
      for (let i = 0; i <= 44; i++) {
        const x = THREE.MathUtils.lerp(-128, -10.6, i / 44);
        const southEdge = getYarraCenterZ(x) + getYarraHalfWidth(x) + 0.6;
        promL.push(new THREE.Vector3(x, 0.04, southEdge));
        promR.push(new THREE.Vector3(x, 0.04, southEdge + 11.2));
      }
      this.addRibbonSurface(promL, promR, materials.herringboneBrick, 0.06);
    }

    // Botanic Riverwalk Gravel Promenade East of Princes Bridge (X: 10.6..126) connecting seamlessly into the Gardens!
    {
      const botPromL: THREE.Vector3[] = [];
      const botPromR: THREE.Vector3[] = [];
      for (let i = 0; i <= 42; i++) {
        const x = THREE.MathUtils.lerp(10.6, 126, i / 42);
        const southEdge = getYarraCenterZ(x) + getYarraHalfWidth(x) + 0.8;
        const gy = Math.max(0, groundHeightAt(x, southEdge + 2.2));
        botPromL.push(new THREE.Vector3(x, gy + 0.04, southEdge));
        botPromR.push(new THREE.Vector3(x, gy + 0.04, southEdge + 4.2));
      }
      this.addRibbonSurface(botPromL, botPromR, materials.gardenPath, 0.05);
    }

    // Stepped lower timber floating boardwalk along Southbank river edge (X: -46..-13)
    const deckRibbonPtsL: THREE.Vector3[] = [];
    const deckRibbonPtsR: THREE.Vector3[] = [];
    for (let i = 0; i <= 18; i++) {
      const x = THREE.MathUtils.lerp(-46, -13, i / 18);
      const southEdge = getYarraCenterZ(x) + getYarraHalfWidth(x) + 0.6;
      deckRibbonPtsL.push(new THREE.Vector3(x, -0.62, southEdge - 3.0));
      deckRibbonPtsR.push(new THREE.Vector3(x, -0.62, southEdge + 0.1));
    }
    this.addRibbonSurface(deckRibbonPtsL, deckRibbonPtsR, materials.timberDeck, 0.12);

    // Northbank River Walk split around Princes Bridge
    for (const [nx0, nx1, nSegs] of [
      [-125, -10.6, 42],
      [10.6, 52, 18],
    ] as const) {
      const northL: THREE.Vector3[] = [];
      const northR: THREE.Vector3[] = [];
      for (let i = 0; i <= nSegs; i++) {
        const x = THREE.MathUtils.lerp(nx0, nx1, i / nSegs);
        const northEdge = getYarraCenterZ(x) - getYarraHalfWidth(x) - 0.6;
        northL.push(new THREE.Vector3(x, 0.035, northEdge - 4.4));
        northR.push(new THREE.Vector3(x, 0.035, northEdge));
      }
      this.addRibbonSurface(northL, northR, materials.footpathConcrete, 0.05);
    }
  }

  private addRibbonSurface(
    leftPts: THREE.Vector3[],
    rightPts: THREE.Vector3[],
    material: THREE.Material,
    thickness = 0.06
  ): void {
    const n = leftPts.length;
    const positions: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];

    let accLen = 0;
    for (let i = 0; i < n; i++) {
      if (i > 0) accLen += leftPts[i].distanceTo(leftPts[i - 1]);
      const l = leftPts[i];
      const r = rightPts[i];
      const w = l.distanceTo(r);
      positions.push(l.x, l.y + thickness * 0.5, l.z);
      positions.push(r.x, r.y + thickness * 0.5, r.z);
      uvs.push(accLen * 0.18, 0);
      uvs.push(accLen * 0.18, w * 0.18);

      if (i < n - 1) {
        const a = i * 2;
        const b = i * 2 + 1;
        const c = (i + 1) * 2;
        const d = (i + 1) * 2 + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    const geo = this.trackGeo(new THREE.BufferGeometry());
    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mesh = new THREE.Mesh(geo, material);
    mesh.receiveShadow = true;
    this.group.add(mesh);
  }

  private buildWaterBodies(
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // 1. Yarra River Water Mesh following exact meandering channel
    const samplesX = 110;
    const samplesZ = 18;
    const positions: number[] = [];
    const colors: number[] = [];
    const uvs: number[] = [];
    const indices: number[] = [];
    const cDeep = new THREE.Color(0xd2ecee);
    const cShallow = new THREE.Color(0x9fc2b2);
    const cTmp = new THREE.Color();

    for (let ix = 0; ix <= samplesX; ix++) {
      const x = THREE.MathUtils.lerp(-180, 180, ix / samplesX);
      const cz = getYarraCenterZ(x);
      const hw = getYarraHalfWidth(x) + 0.5;
      for (let iz = 0; iz <= samplesZ; iz++) {
        const tz = iz / samplesZ;
        const z = THREE.MathUtils.lerp(cz - hw, cz + hw, tz);
        positions.push(x, -1.25, z);
        uvs.push((ix / samplesX) * 10, tz * 1.5);
        const centerFactor = Math.sin(tz * Math.PI);
        cTmp.copy(cShallow).lerp(cDeep, centerFactor);
        colors.push(cTmp.r, cTmp.g, cTmp.b);
      }
    }

    const stride = samplesZ + 1;
    for (let ix = 0; ix < samplesX; ix++) {
      for (let iz = 0; iz < samplesZ; iz++) {
        const a = ix * stride + iz;
        const b = a + 1;
        const c = (ix + 1) * stride + iz;
        const d = c + 1;
        indices.push(a, b, c, b, d, c);
      }
    }

    const riverGeo = this.trackGeo(new THREE.BufferGeometry());
    riverGeo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    riverGeo.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
    riverGeo.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
    riverGeo.setIndex(indices);
    riverGeo.computeVertexNormals();

    const riverMesh = new THREE.Mesh(riverGeo, materials.yarraWater);
    riverMesh.receiveShadow = true;
    this.group.add(riverMesh);

    // Register river collision slabs (except across Princes Bridge X=-8..8 and Footbridge X=-55..-49)
    obstacles.push(
      { minX: -150, maxX: -56, minZ: 12, maxZ: 40, tag: 'water' },
      { minX: -48, maxX: -9, minZ: 13, maxZ: 41, tag: 'water' },
      { minX: 9, maxX: 150, minZ: 14, maxZ: 43, tag: 'water' }
    );

    // 2. Royal Botanic Gardens Ornamental Lake Water Surface (with vertex color attribute)
    const lakeGeo = this.trackGeo(new THREE.PlaneGeometry(52, 34, 36, 28));
    lakeGeo.rotateX(-Math.PI / 2);
    lakeGeo.translate(92, -0.52, 85);
    const lPos = lakeGeo.attributes.position;
    const lCols = new Float32Array(lPos.count * 3);
    for (let i = 0; i < lPos.count; i++) {
      lCols[i * 3] = 0.85;
      lCols[i * 3 + 1] = 0.96;
      lCols[i * 3 + 2] = 0.94;
    }
    lakeGeo.setAttribute('color', new THREE.BufferAttribute(lCols, 3));
    const lakeMesh = new THREE.Mesh(lakeGeo, materials.lakeWater);
    lakeMesh.receiveShadow = true;
    this.group.add(lakeMesh);

    obstacles.push({ minX: 69, maxX: 113, minZ: 73, maxZ: 97, tag: 'water' });
  }

  private buildDistrictGroundZones(materials: WorldMaterialLibrary): void {
    // Urban block paved bases so CBD, Arcade Quarter, and Southbank blocks have crisp concrete/brick courtyards
    const urbanPads: Array<{
      x: number;
      z: number;
      w: number;
      d: number;
      mat: THREE.Material;
      y?: number;
    }> = [
      // CBD West block & CBD East block paved aprons
      { x: -34, z: -16, w: 48, d: 38, mat: materials.footpathConcrete, y: 0.02 },
      { x: 32, z: -16, w: 44, d: 38, mat: materials.footpathConcrete, y: 0.02 },
      { x: -34, z: -56, w: 46, d: 24, mat: materials.footpathConcrete, y: 0.02 },
      { x: 32, z: -56, w: 44, d: 24, mat: materials.footpathConcrete, y: 0.02 },
      // Entertainment & Arcade Quarter paved bluestone/brick courtyard
      { x: 92, z: -38, w: 56, d: 68, mat: materials.bluestone, y: 0.022 },
      // Southbank Arts & Dining urban plaza
      { x: -48, z: 74, w: 124, d: 38, mat: materials.footpathConcrete, y: 0.02 },
      // Parkville Sandstone University Quad Courtyard Paths
      { x: -75, z: -82, w: 52, d: 38, mat: materials.gardenPath, y: 0.02 },
      // Parkville Quad central lawn
      { x: -75, z: -82, w: 34, d: 24, mat: materials.grass, y: 0.035 },
    ];

    for (const pad of urbanPads) {
      const g = this.trackGeo(new THREE.BoxGeometry(pad.w, 0.06, pad.d));
      const m = new THREE.Mesh(g, pad.mat);
      m.position.set(pad.x, (pad.y ?? 0.02) - 0.02, pad.z);
      m.receiveShadow = true;
      this.group.add(m);
    }
  }

  private buildDistantSkylineSilhouette(materials: WorldMaterialLibrary): void {
    // Distant Melbourne architectural skyline towers beyond the Northern & Western outer avenues
    // Gives authentic sense of scale from Southbank & Botanic Gardens without cluttering playable streets
    const skylineMat1 = new THREE.MeshStandardMaterial({
      color: 0x6d7582,
      roughness: 0.65,
      metalness: 0.2,
    });
    const skylineMat2 = new THREE.MeshStandardMaterial({
      color: 0x7c7b78,
      roughness: 0.72,
      metalness: 0.12,
    });

    const towers = [
      { x: -158, z: -135, w: 16, h: 42, d: 14, spire: true },
      { x: -132, z: -148, w: 18, h: 54, d: 16, spire: false },
      { x: -95, z: -154, w: 14, h: 38, d: 14, spire: false },
      { x: -48, z: -152, w: 20, h: 62, d: 18, spire: true },
      { x: -12, z: -156, w: 17, h: 48, d: 15, spire: false },
      { x: 28, z: -150, w: 22, h: 58, d: 16, spire: true },
      { x: 68, z: -146, w: 16, h: 44, d: 15, spire: false },
      { x: 112, z: -142, w: 15, h: 36, d: 14, spire: false },
      // Southbank distant sculptural tower (Eureka-inspired gold crown accent on far SW)
      { x: -148, z: 86, w: 18, h: 64, d: 16, goldCrown: true },
    ];

    for (let i = 0; i < towers.length; i++) {
      const t = towers[i];
      const baseY = groundHeightAt(t.x, t.z);
      const towerGroup = new THREE.Group();
      towerGroup.position.set(t.x, baseY, t.z);

      const mainGeo = this.trackGeo(new THREE.BoxGeometry(t.w, t.h, t.d));
      const mainMesh = new THREE.Mesh(mainGeo, i % 2 === 0 ? skylineMat1 : skylineMat2);
      mainMesh.position.y = t.h * 0.5;
      towerGroup.add(mainMesh);

      // Stepped architectural crown
      const crownH = t.h * 0.16;
      const crownGeo = this.trackGeo(new THREE.BoxGeometry(t.w * 0.76, crownH, t.d * 0.76));
      const crownMesh = new THREE.Mesh(
        crownGeo,
        t.goldCrown ? materials.brassGold : materials.architecturalGlass
      );
      crownMesh.position.y = t.h + crownH * 0.5;
      towerGroup.add(crownMesh);

      if (t.spire) {
        const spireGeo = this.trackGeo(new THREE.CylinderGeometry(0.15, 0.55, 11, 6));
        const spire = new THREE.Mesh(spireGeo, materials.charcoalIron);
        spire.position.y = t.h + crownH + 5.5;
        towerGroup.add(spire);
      }

      this.group.add(towerGroup);
    }
  }

  public dispose(): void {
    for (const g of this.geometries) {
      g.dispose();
    }
    this.geometries = [];
  }
}
