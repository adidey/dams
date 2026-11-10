import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import {
  getBotanicLakeFactor,
  getYarraCenterZ,
  getYarraHalfWidth,
  groundHeightAt,
  isInsideYarra,
} from './TerrainSystem';
import { ObstacleBox2D } from './types';

type TreeArchetype = 'plane' | 'fig' | 'eucalypt' | 'ornamental' | 'willow';

interface TreePlacement {
  x: number;
  z: number;
  type: TreeArchetype;
  scale: number;
  rotY: number;
  tintShift: number;
}

/**
 * Handcrafted multi-layered Melbourne vegetation & landscaping system.
 * Uses InstancedMesh with sculpted organic icosahedral canopy clusters, tapered multi-branch
 * trunks, colour variation, flower beds, hedges, planters, and lake lily pads.
 * Strictly avoids primitive single-sphere "lollipop" trees.
 */
export class VegetationSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];

  constructor(worldMaterials: WorldMaterialLibrary, obstacles: ObstacleBox2D[]) {
    this.group.name = 'VegetationSystem';
    const placements = this.planTrees(obstacles);
    this.buildInstancedTrees(placements);
    this.buildFlowerBedsHedgesAndPlanters(worldMaterials, obstacles);
    this.buildLakeLilyPadsAndReeds();
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private seededRand(seed: number): () => number {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  private isClearOfObstacles(
    x: number,
    z: number,
    obstacles: ObstacleBox2D[],
    pad = 1.6
  ): boolean {
    if (isInsideYarra(x, z, 2.2)) return false;
    if (getBotanicLakeFactor(x, z) > 0.12) return false;
    for (const o of obstacles) {
      if (
        x > o.minX - pad &&
        x < o.maxX + pad &&
        z > o.minZ - pad &&
        z < o.maxZ + pad
      ) {
        return false;
      }
    }
    return true;
  }

  private planTrees(obstacles: ObstacleBox2D[]): TreePlacement[] {
    const rand = this.seededRand(2026);
    const list: TreePlacement[] = [];

    const addTree = (
      x: number,
      z: number,
      type: TreeArchetype,
      baseScale = 1.0,
      force = false
    ) => {
      if (!force && !this.isClearOfObstacles(x, z, obstacles, 1.3)) return;
      list.push({
        x,
        z,
        type,
        scale: baseScale * (0.86 + rand() * 0.3),
        rotY: rand() * Math.PI * 2,
        tintShift: (rand() - 0.5) * 2,
      });
    };

    // 1. London Plane Street Trees along Swanston St, St Kilda Rd, Flinders St, Bourke St & Grattan St
    for (let z = -110; z <= 110; z += 15) {
      if (z > 8 && z < 46) continue; // Skip Princes Bridge
      if (Math.abs(z - 6) < 8 || Math.abs(z + 38) < 8 || Math.abs(z + 68) < 8 || Math.abs(z - 58) < 8)
        continue;
      addTree(-9.3, z, 'plane', 0.92, true);
      addTree(9.3, z, 'plane', 0.92, true);
    }

    // Grattan St & Faraday St leafy Parkville avenue trees
    for (let x = -118; x <= 46; x += 14) {
      if (Math.abs(x) < 10 || Math.abs(x + 44) < 8) continue;
      addTree(x, -74.6, 'plane', 1.05);
      addTree(x, -61.4, 'plane', 1.0);
    }
    for (let z = -110; z <= -46; z += 13) {
      if (Math.abs(z + 68) < 8) continue;
      addTree(-50.2, z, 'ornamental', 0.95);
    }

    // Parkville University Quad Hero Trees
    addTree(-83, -78, 'fig', 1.25, true);
    addTree(-67, -86, 'eucalypt', 1.15, true);

    // 2. Southbank Promenade & Northbank Riverfront Avenue Trees
    for (let x = -120; x <= 24; x += 13.5) {
      if (Math.abs(x) < 12 || Math.abs(x + 52) < 6) continue;
      const sz = getYarraCenterZ(x) + getYarraHalfWidth(x) + 3.8;
      addTree(x, sz, 'plane', 1.05, true);

      const nz = getYarraCenterZ(x) - getYarraHalfWidth(x) - 3.4;
      addTree(x + 4, nz, 'eucalypt', 0.98, true);
    }

    // 3. DISTRICT D — ROYAL BOTANIC GARDENS (Grand Moreton Bay Figs, River Red Gums, Weeping Willows, Blossom Trees)
    // Weeping Willows gracing the Ornamental Lake shoreline
    const willowSpots: Array<[number, number]> = [
      [71, 77],
      [81, 71],
      [104, 76],
      [112, 88],
      [99, 98],
      [76, 93],
    ];
    for (const [wx, wz] of willowSpots) {
      addTree(wx, wz, 'willow', 1.2, true);
    }

    // Grand Spreading Moreton Bay Figs & Eucalypts across the Garden Hills
    const botanicHeroSpots: Array<[number, number, TreeArchetype, number]> = [
      [36, 56, 'fig', 1.45],
      [58, 50, 'eucalypt', 1.35],
      [76, 52, 'fig', 1.5],
      [102, 54, 'eucalypt', 1.3],
      [124, 66, 'fig', 1.4],
      [128, 96, 'eucalypt', 1.35],
      [112, 108, 'fig', 1.45],
      [82, 110, 'eucalypt', 1.3],
      [54, 106, 'fig', 1.4],
      [34, 86, 'ornamental', 1.15],
      [60, 84, 'ornamental', 1.18],
      [42, 108, 'eucalypt', 1.25],
      [18, 82, 'plane', 1.15],
      [20, 98, 'fig', 1.3],
    ];
    for (const [bx, bz, bt, bs] of botanicHeroSpots) {
      addTree(bx, bz, bt, bs);
    }

    // Additional organic park & outer perimeter woodland groves (frames world naturally!)
    for (let i = 0; i < 85; i++) {
      const angle = (i / 85) * Math.PI * 2;
      const dist = 128 + (i % 4) * 14;
      const px = Math.cos(angle) * dist * 1.08;
      const pz = Math.sin(angle) * dist * 0.92;
      if (isInsideYarra(px, pz, 4)) continue;
      const types: TreeArchetype[] = ['eucalypt', 'fig', 'plane', 'ornamental'];
      addTree(px, pz, types[i % types.length], 1.2 + (i % 3) * 0.2, true);
    }

    // Parkville Western Parkland Grove (X = -124..-104, Z = -108..-48)
    for (let x = -122; x <= -106; x += 11) {
      for (let z = -104; z <= -48; z += 13) {
        addTree(
          x + (rand() - 0.5) * 4,
          z + (rand() - 0.5) * 4,
          rand() > 0.4 ? 'eucalypt' : 'fig',
          1.15
        );
      }
    }

    return list;
  }

  /**
   * Builds sculpted organic low-poly faceted foliage geometry (slightly flattened & jittered icosahedron)
   * so trees have rich painterly planes rather than smooth plastic spheres.
   */
  private createOrganicCanopyGeometry(
    rx: number,
    ry: number,
    rz: number
  ): THREE.BufferGeometry {
    const geo = new THREE.IcosahedronGeometry(1, 1);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const vx = pos.getX(i);
      const vy = pos.getY(i);
      const vz = pos.getZ(i);
      const wobble =
        1.0 +
        Math.sin(vx * 3.7 + vy * 2.3) * 0.11 +
        Math.cos(vz * 4.1 - vx * 2.1) * 0.09;
      pos.setXYZ(i, vx * rx * wobble, vy * ry * wobble, vz * rz * wobble);
    }
    geo.computeVertexNormals();
    return this.trackGeo(geo);
  }

  private buildInstancedTrees(placements: TreePlacement[]): void {
    const count = placements.length;
    if (count === 0) return;

    // Trunk + Primary Boughs Geometry (tapered trunk + 2 angled upper limbs merged via instancing)
    const trunkGeo = this.trackGeo(new THREE.CylinderGeometry(0.18, 0.36, 2.7, 7));
    trunkGeo.translate(0, 1.35, 0);

    const boughGeoL = this.trackGeo(new THREE.CylinderGeometry(0.09, 0.16, 1.6, 6));
    boughGeoL.rotateZ(0.55);
    boughGeoL.translate(-0.48, 2.85, 0);

    const boughGeoR = this.trackGeo(new THREE.CylinderGeometry(0.09, 0.16, 1.5, 6));
    boughGeoR.rotateZ(-0.5);
    boughGeoR.rotateY(1.1);
    boughGeoR.translate(0.32, 2.95, 0.32);

    const barkMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.9,
        metalness: 0.02,
      })
    );

    const foliageMat = this.trackMat(
      new THREE.MeshStandardMaterial({
        color: 0xffffff,
        roughness: 0.84,
        metalness: 0.02,
        flatShading: true,
      })
    );

    const trunkInst = new THREE.InstancedMesh(trunkGeo, barkMat, count);
    const boughLInst = new THREE.InstancedMesh(boughGeoL, barkMat, count);
    const boughRInst = new THREE.InstancedMesh(boughGeoR, barkMat, count);
    trunkInst.castShadow = true;
    trunkInst.receiveShadow = true;
    boughLInst.castShadow = true;
    boughRInst.castShadow = true;

    // 5 Distinct Layered Canopy Puff Sub-Clusters per tree!
    // Gives multi-tiered organic silhouettes (lower skirt, left lobe, right lobe, back lobe, sunlit crown)
    const puffGeos = [
      this.createOrganicCanopyGeometry(1.65, 1.05, 1.55), // Central main canopy
      this.createOrganicCanopyGeometry(1.25, 0.88, 1.25), // Left lower bough cluster
      this.createOrganicCanopyGeometry(1.2, 0.85, 1.25), // Right mid bough cluster
      this.createOrganicCanopyGeometry(1.15, 0.82, 1.15), // Back/side cluster
      this.createOrganicCanopyGeometry(1.05, 0.78, 1.05), // Upper sunlit crown
    ];

    const puffOffsets: Array<[number, number, number]> = [
      [0, 3.65, 0],
      [-1.05, 3.25, 0.35],
      [1.0, 3.45, -0.3],
      [0.2, 3.3, 0.95],
      [0.05, 4.45, -0.1],
    ];

    const puffInsts = puffGeos.map((g) => {
      const im = new THREE.InstancedMesh(g, foliageMat, count);
      im.castShadow = true;
      im.receiveShadow = true;
      return im;
    });

    const dummy = new THREE.Object3D();
    const barkColor = new THREE.Color();
    const leafBase = new THREE.Color();
    const leafTint = new THREE.Color();

    for (let i = 0; i < count; i++) {
      const p = placements[i];
      const gy = groundHeightAt(p.x, p.z);

      // Archetype proportions & authentic Melbourne foliage palette
      let widthMul = 1.0;
      let heightMul = 1.0;

      if (p.type === 'fig') {
        // Grand Moreton Bay Fig: broad spreading umbrella canopy & stout trunk
        widthMul = 1.48;
        heightMul = 1.08;
        barkColor.setHex(0x5c5048);
        leafBase.setHex(0x3f683c);
      } else if (p.type === 'eucalypt') {
        // River Red Gum / Melbourne Eucalypt: pale cream-grey smooth bark & sage-olive canopy
        widthMul = 1.05;
        heightMul = 1.28;
        barkColor.setHex(0x9c9284);
        leafBase.setHex(0x5d7c58);
      } else if (p.type === 'willow') {
        // Weeping Willow by the Lake: drooping golden-sage foliage
        widthMul = 1.32;
        heightMul = 0.95;
        barkColor.setHex(0x635342);
        leafBase.setHex(0x7c964c);
      } else if (p.type === 'ornamental') {
        // Warm Autumnal / Blossom Parkville & CBD street accent tree
        widthMul = 0.85;
        heightMul = 0.9;
        barkColor.setHex(0x584438);
        leafBase.setHex(p.tintShift > 0.15 ? 0xc67849 : 0xd69c4e);
      } else {
        // London Plane Street Tree: classic dappled Melbourne boulevard green with golden-hour warmth
        widthMul = 1.06;
        heightMul = 1.12;
        barkColor.setHex(0x786e60);
        leafBase.setHex(0x567d46);
      }

      leafBase.offsetHSL(p.tintShift * 0.025, p.tintShift * 0.04, p.tintShift * 0.04);

      dummy.position.set(p.x, gy, p.z);
      dummy.rotation.set(0, p.rotY, 0);
      dummy.scale.set(
        p.scale * (p.type === 'fig' ? 1.4 : 1.0),
        p.scale * heightMul,
        p.scale * (p.type === 'fig' ? 1.4 : 1.0)
      );
      dummy.updateMatrix();

      trunkInst.setMatrixAt(i, dummy.matrix);
      trunkInst.setColorAt(i, barkColor);
      boughLInst.setMatrixAt(i, dummy.matrix);
      boughLInst.setColorAt(i, barkColor);
      boughRInst.setMatrixAt(i, dummy.matrix);
      boughRInst.setColorAt(i, barkColor);

      for (let pi = 0; pi < puffInsts.length; pi++) {
        const [ox, oy, oz] = puffOffsets[pi];
        const rx = ox * Math.cos(p.rotY) - oz * Math.sin(p.rotY);
        const rz = ox * Math.sin(p.rotY) + oz * Math.cos(p.rotY);

        dummy.position.set(
          p.x + rx * p.scale * widthMul,
          gy + oy * p.scale * heightMul,
          p.z + rz * p.scale * widthMul
        );
        dummy.rotation.set(0, p.rotY + pi * 0.9, 0);
        dummy.scale.set(
          p.scale * widthMul,
          p.scale * (p.type === 'willow' ? 1.25 : 0.95),
          p.scale * widthMul
        );
        dummy.updateMatrix();
        puffInsts[pi].setMatrixAt(i, dummy.matrix);

        // Crown puff gets slightly warmer golden-hour sunlight tint; lower puffs get deeper cool shade
        leafTint.copy(leafBase);
        if (pi === 4) leafTint.offsetHSL(-0.015, 0.05, 0.06);
        else if (pi === 1 || pi === 3) leafTint.offsetHSL(0.01, -0.02, -0.04);
        puffInsts[pi].setColorAt(i, leafTint);
      }
    }

    for (const inst of [trunkInst, boughLInst, boughRInst, ...puffInsts]) {
      inst.instanceMatrix.needsUpdate = true;
      if (inst.instanceColor) inst.instanceColor.needsUpdate = true;
      inst.computeBoundingSphere();
      this.group.add(inst);
    }
  }

  private buildFlowerBedsHedgesAndPlanters(
    worldMaterials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // 1. Curated Perennial Flower Beds in Royal Botanic Gardens & Parkville Quad
    const flowerLocations: Array<[number, number, number]> = [
      // Around Botanic Fountain & Rotunda Path
      [42, 72, 0.3],
      [54, 72, -0.3],
      [48, 83, 0.0],
      [68, 63, 0.2],
      [84, 64, -0.15],
      [108, 66, 0.4],
      [112, 98, -0.5],
      [78, 103, 0.1],
      // Parkville Quad Perennial Borders
      [-84, -94, 0],
      [-66, -94, 0],
      [-84, -79, 0],
      [-66, -79, 0],
    ];

    const flowerColors = [0xd96b52, 0xe8b44c, 0x8d6bb8, 0xf2dfd0, 0xd45b7a];
    const shrubMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x486e3f, roughness: 0.88 })
    );

    for (let i = 0; i < flowerLocations.length; i++) {
      const [fx, fz, rot] = flowerLocations[i];
      const fy = groundHeightAt(fx, fz);
      const bed = new THREE.Group();
      bed.position.set(fx, fy, fz);
      bed.rotation.y = rot;

      // Sandstone garden border edging
      const border = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(4.4, 0.24, 1.9)),
        worldMaterials.sandstone
      );
      border.position.y = 0.12;
      border.castShadow = true;
      border.receiveShadow = true;
      bed.add(border);

      const soil = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(4.0, 0.26, 1.5)),
        worldMaterials.darkTimber
      );
      soil.position.y = 0.13;
      bed.add(soil);

      // Sculpted shrubs + colourful flower clusters
      for (let s = -1.4; s <= 1.4; s += 0.7) {
        const bush = new THREE.Mesh(
          this.trackGeo(new THREE.DodecahedronGeometry(0.42, 0)),
          shrubMat
        );
        bush.position.set(s, 0.42, (s % 1.4 === 0 ? 0.2 : -0.2));
        bush.scale.set(1.1, 0.75, 1.0);
        bush.castShadow = true;
        bed.add(bush);

        const bloomMat = this.trackMat(
          new THREE.MeshStandardMaterial({
            color: flowerColors[(i + Math.abs(Math.round(s * 2))) % flowerColors.length],
            roughness: 0.75,
          })
        );
        const bloom = new THREE.Mesh(
          this.trackGeo(new THREE.DodecahedronGeometry(0.22, 0)),
          bloomMat
        );
        bloom.position.set(s + 0.12, 0.68, 0);
        bed.add(bloom);
      }

      this.group.add(bed);
      obstacles.push({
        minX: fx - 2.2,
        maxX: fx + 2.2,
        minZ: fz - 1.1,
        maxZ: fz + 1.1,
        tag: 'prop',
      });
    }

    // 2. Street & Laneway Timber Planter Boxes (CBD Laneways, Southbank, Arcade Quarter)
    const planterSpots: Array<[number, number]> = [
      [-26.2, -10],
      [-29.8, -22],
      [24.2, -12],
      [27.8, -26],
      [89.8, -14],
      [94.2, -36],
      [-42, 48],
      [-26, 48],
      [-8, 48],
    ];
    for (const [px, pz] of planterSpots) {
      const py = groundHeightAt(px, pz) + 0.06;
      const planter = new THREE.Group();
      planter.position.set(px, py, pz);

      const box = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.4, 0.55, 0.75)),
        worldMaterials.warmTimber
      );
      box.position.y = 0.275;
      box.castShadow = true;
      planter.add(box);

      for (const sx of [-0.38, 0, 0.38]) {
        const fern = new THREE.Mesh(
          this.trackGeo(new THREE.DodecahedronGeometry(0.32, 0)),
          shrubMat
        );
        fern.position.set(sx, 0.68, 0);
        fern.castShadow = true;
        planter.add(fern);
      }
      this.group.add(planter);
    }
  }

  private buildLakeLilyPadsAndReeds(): void {
    const padMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x4d7d47, roughness: 0.7 })
    );
    const lotusMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xf2c6cf, roughness: 0.6 })
    );

    const lilyClusters: Array<[number, number]> = [
      [78, 80],
      [80, 82],
      [77, 83],
      [103, 84],
      [105, 86],
      [99, 91],
      [85, 88],
    ];

    for (let i = 0; i < lilyClusters.length; i++) {
      const [lx, lz] = lilyClusters[i];
      const pad = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.55, 0.55, 0.04, 10, 1, false, 0, Math.PI * 1.85)),
        padMat
      );
      pad.position.set(lx, -0.49, lz);
      pad.rotation.y = i * 1.2;
      this.group.add(pad);

      if (i % 2 === 0) {
        const flower = new THREE.Mesh(
          this.trackGeo(new THREE.ConeGeometry(0.16, 0.2, 6)),
          lotusMat
        );
        flower.position.set(lx, -0.38, lz);
        flower.rotation.x = Math.PI;
        this.group.add(flower);
      }
    }
  }

  public dispose(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.geometries = [];
    this.materials = [];
  }
}
