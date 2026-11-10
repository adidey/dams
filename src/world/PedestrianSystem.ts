import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import { getYarraCenterZ, getYarraHalfWidth, groundHeightAt } from './TerrainSystem';

interface WalkingAgent {
  root: THREE.Group;
  leftLeg: THREE.Mesh;
  rightLeg: THREE.Mesh;
  leftArm: THREE.Mesh;
  rightArm: THREE.Mesh;
  curve: THREE.CatmullRomCurve3;
  curveLen: number;
  progress: number;
  direction: 1 | -1;
  walkSpeed: number;
  stridePhase: number;
  pauseTimer: number;
}

interface LakeDuck {
  mesh: THREE.Group;
  cx: number;
  cz: number;
  rx: number;
  rz: number;
  speed: number;
  phase: number;
}

/**
 * Environmental Melbourne Pedestrians & Ambient Wildlife ONLY.
 * (Strictly no playable story characters Adi or Damini — environment remains cleanly independent.)
 * Features articulated multi-part indie figures walking along pavements, laneways, bridges,
 * riverfront & gardens, waiting at tram stops, sitting on benches, and ducks on Botanic Lake!
 */
export class PedestrianSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private walkers: WalkingAgent[] = [];
  private ducks: LakeDuck[] = [];

  constructor(worldMats: WorldMaterialLibrary) {
    this.group.name = 'PedestrianSystem';
    this.spawnPathWalkers(worldMats);
    this.spawnStationaryAndSeatedCrowd(worldMats);
    this.spawnBotanicDucks(worldMats);
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

  private createStylisedPedestrian(
    coatHex: number,
    trouserHex: number,
    skinHex: number,
    hairHex: number,
    heightScale: number,
    hasBag: boolean,
    worldMats: WorldMaterialLibrary,
    seated = false
  ): {
    root: THREE.Group;
    leftLeg: THREE.Mesh;
    rightLeg: THREE.Mesh;
    leftArm: THREE.Mesh;
    rightArm: THREE.Mesh;
  } {
    const root = new THREE.Group();
    root.scale.setScalar(heightScale);

    const coatMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: coatHex, roughness: 0.82 })
    );
    const trouserMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: trouserHex, roughness: 0.86 })
    );
    const skinMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: skinHex, roughness: 0.78 })
    );
    const hairMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: hairHex, roughness: 0.85 })
    );

    // Contact shadow
    if (!seated) {
      const sh = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(0.68, 0.68)),
        worldMats.contactShadow
      );
      sh.rotation.x = -Math.PI / 2;
      sh.position.y = 0.02;
      root.add(sh);
    }

    // Legs (pivoted at hip Y = 0.72)
    const legGeo = this.trackGeo(new THREE.BoxGeometry(0.16, 0.68, 0.18));
    legGeo.translate(0, -0.34, 0);
    const leftLeg = new THREE.Mesh(legGeo, trouserMat);
    leftLeg.position.set(-0.11, 0.7, 0);
    leftLeg.castShadow = true;

    const rightLeg = new THREE.Mesh(legGeo, trouserMat);
    rightLeg.position.set(0.11, 0.7, 0);
    rightLeg.castShadow = true;

    if (seated) {
      leftLeg.rotation.x = -Math.PI / 2.3;
      rightLeg.rotation.x = -Math.PI / 2.3;
      leftLeg.position.y = 0.52;
      rightLeg.position.y = 0.52;
    }
    root.add(leftLeg, rightLeg);

    // Torso / Melbourne Coat
    const torso = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.44, 0.64, 0.26)),
      coatMat
    );
    torso.position.y = seated ? 0.82 : 1.02;
    torso.castShadow = true;
    root.add(torso);

    // Arms (pivoted at shoulder)
    const armGeo = this.trackGeo(new THREE.BoxGeometry(0.13, 0.54, 0.14));
    armGeo.translate(0, -0.24, 0);
    const leftArm = new THREE.Mesh(armGeo, coatMat);
    leftArm.position.set(-0.29, seated ? 1.06 : 1.26, 0);
    const rightArm = new THREE.Mesh(armGeo, coatMat);
    rightArm.position.set(0.29, seated ? 1.06 : 1.26, 0);
    root.add(leftArm, rightArm);

    // Head + Hair / Beanie
    const headY = seated ? 1.32 : 1.52;
    const head = new THREE.Mesh(
      this.trackGeo(new THREE.SphereGeometry(0.19, 10, 8)),
      skinMat
    );
    head.position.y = headY;
    head.castShadow = true;
    root.add(head);

    const hair = new THREE.Mesh(
      this.trackGeo(
        new THREE.SphereGeometry(0.205, 10, 8, 0, Math.PI * 2, 0, Math.PI * 0.58)
      ),
      hairMat
    );
    hair.position.set(0, headY + 0.02, -0.02);
    root.add(hair);

    // Optional canvas tote bag or student backpack
    if (hasBag) {
      const bag = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.3, 0.38, 0.16)),
        worldMats.warmTimber
      );
      bag.position.set(0, seated ? 0.84 : 1.04, -0.2);
      root.add(bag);
    }

    return { root, leftLeg, rightLeg, leftArm, rightArm };
  }

  private spawnPathWalkers(worldMats: WorldMaterialLibrary): void {
    const rand = this.seededRand(707);

    // Safe footpath, laneway, bridge, promenade & garden pedestrian routes (never clipping buildings/cars!)
    const pedestrianRoutes: THREE.Vector3[][] = [
      // 1. Swanston St West Footpath (Parkville -> CBD -> Princes Bridge West Footpath -> Southbank)
      [
        new THREE.Vector3(-8.8, 0, -96),
        new THREE.Vector3(-8.8, 0, -62),
        new THREE.Vector3(-8.8, 0, -32),
        new THREE.Vector3(-8.8, 0, 0),
        new THREE.Vector3(-8.8, 0, 28),
        new THREE.Vector3(-8.8, 0, 52),
      ],
      // 2. Swanston St East Footpath (Parkville -> CBD -> Princes Bridge East Footpath -> Botanic Gate)
      [
        new THREE.Vector3(8.8, 0, -92),
        new THREE.Vector3(8.8, 0, -45),
        new THREE.Vector3(8.8, 0, -8),
        new THREE.Vector3(8.8, 0, 28),
        new THREE.Vector3(8.8, 0, 68),
        new THREE.Vector3(24, 0, 66),
      ],
      // 3. Degraves / Hosier Laneway Stroll (CBD West Coffee & Street Art Lane)
      [
        new THREE.Vector3(-28.0, 0, -35),
        new THREE.Vector3(-27.6, 0, -20),
        new THREE.Vector3(-28.2, 0, -4),
        new THREE.Vector3(-18, 0, 1.2),
      ],
      // 4. Centre Place & Flinders Lane Stroll (CBD East)
      [
        new THREE.Vector3(26.0, 0, -35),
        new THREE.Vector3(25.8, 0, -16),
        new THREE.Vector3(26.2, 0, 2),
        new THREE.Vector3(48, 0, 1.2),
      ],
      // 5. Southbank Waterfront Promenade & Evan Walker Footbridge Loop!
      [
        new THREE.Vector3(-108, 0, getYarraCenterZ(-108) + getYarraHalfWidth(-108) + 4.8),
        new THREE.Vector3(-72, 0, getYarraCenterZ(-72) + getYarraHalfWidth(-72) + 4.8),
        new THREE.Vector3(-52, 0, getYarraCenterZ(-52) + getYarraHalfWidth(-52) + 2.0),
        new THREE.Vector3(-52, 0.75, getYarraCenterZ(-52)), // Across Evan Walker Footbridge!
        new THREE.Vector3(-52, 0, getYarraCenterZ(-52) - getYarraHalfWidth(-52) - 2.4),
        new THREE.Vector3(-24, 0, getYarraCenterZ(-24) - getYarraHalfWidth(-24) - 2.6),
      ],
      // 6. Southbank Promenade East Stroll
      [
        new THREE.Vector3(-48, 0, 46),
        new THREE.Vector3(-22, 0, 46.5),
        new THREE.Vector3(4, 0, 46),
        new THREE.Vector3(26, 0, 48),
      ],
      // 7. Royal Botanic Gardens Scenic Lake & Timber Bridge Walk
      [
        new THREE.Vector3(32, 0, 65),
        new THREE.Vector3(58, 0, 63),
        new THREE.Vector3(88, 0, 67),
        new THREE.Vector3(92, 0, 74),
        new THREE.Vector3(92, 1.15, 85), // Over Romantic Botanic Lake Bridge!
        new THREE.Vector3(92, 0, 96),
        new THREE.Vector3(96, 0, 105),
        new THREE.Vector3(68, 0, 102),
      ],
      // 8. Entertainment & Arcade Quarter Alley Stroll
      [
        new THREE.Vector3(66, 0, -33.5),
        new THREE.Vector3(92, 0, -33.5),
        new THREE.Vector3(91.5, 0, -18),
        new THREE.Vector3(92.2, 0, 1.2),
        new THREE.Vector3(114, 0, 1.2),
      ],
      // 9. Parkville University Quad & Faraday St Walk
      [
        new THREE.Vector3(-90, 0, -82),
        new THREE.Vector3(-75, 0, -82),
        new THREE.Vector3(-60, 0, -82),
        new THREE.Vector3(-49, 0, -76),
        new THREE.Vector3(-49, 0, -48),
      ],
    ];

    // Melbourne autumn/spring fashion palette
    const coats = [
      0xb85a44, 0x3d5a6c, 0xcf9b52, 0x526b56, 0x7a4b58, 0xd8ccb8, 0x3b3d42, 0x9e6342,
    ];
    const trousers = [0x2a2f38, 0x45413c, 0x394b59, 0x5e5044, 0x252629];
    const skins = [0xf2ccb0, 0xe0ac8b, 0xc68b63, 0x8d583b, 0xf6d8c0];
    const hairs = [0x261d18, 0x593a27, 0x8c5835, 0xc99653, 0x1c1c20];

    for (let rIdx = 0; rIdx < pedestrianRoutes.length; rIdx++) {
      const curve = new THREE.CatmullRomCurve3(pedestrianRoutes[rIdx], false);
      const len = curve.getLength();
      const agentsOnRoute = rIdx === 2 || rIdx === 4 || rIdx === 7 ? 7 : 6;

      for (let a = 0; a < agentsOnRoute; a++) {
        const fig = this.createStylisedPedestrian(
          coats[(rIdx * 3 + a) % coats.length],
          trousers[(rIdx + a) % trousers.length],
          skins[(rIdx * 2 + a) % skins.length],
          hairs[(rIdx + a * 2) % hairs.length],
          0.88 + rand() * 0.22,
          rand() > 0.45,
          worldMats,
          false
        );

        this.group.add(fig.root);
        const agent: WalkingAgent = {
          ...fig,
          curve,
          curveLen: len,
          progress: (a + 0.15) / agentsOnRoute,
          direction: a % 2 === 0 ? 1 : -1,
          walkSpeed: 1.35 + rand() * 0.55,
          stridePhase: rand() * Math.PI * 2,
          pauseTimer: 0,
        };
        this.positionWalker(agent);
        this.walkers.push(agent);
      }
    }
  }

  private positionWalker(w: WalkingAgent): void {
    const t = THREE.MathUtils.clamp(w.progress, 0.002, 0.998);
    const p = w.curve.getPointAt(t);
    const dt = w.direction > 0 ? 0.01 : -0.01;
    const pNext = w.curve.getPointAt(THREE.MathUtils.clamp(t + dt, 0, 1));

    // Respect elevated bridge decks (when p.y > 0.2) vs terrain/footpath height
    const terrainY = groundHeightAt(p.x, p.z) + 0.12;
    const finalY = p.y > 0.25 ? p.y + 0.1 : Math.max(0.08, terrainY);

    w.root.position.set(p.x, finalY, p.z);
    if (pNext.distanceToSquared(p) > 0.00001) {
      w.root.rotation.y = Math.atan2(pNext.x - p.x, pNext.z - p.z);
    }
  }

  private spawnStationaryAndSeatedCrowd(worldMats: WorldMaterialLibrary): void {
    // Passengers waiting at the 4 Tram Stops + Patrons admiring Street Art & Vinyl Shop + Seated on Benches
    const standingSpots: Array<[number, number, number, number]> = [
      // Tram Stop 1 Parkville
      [3.5, -79.2, -Math.PI / 2, 0xc86448],
      [3.5, -76.8, -Math.PI / 2, 0x3e5c70],
      // Tram Stop 5 Bourke St
      [-3.5, -25.2, Math.PI / 2, 0xd49f4e],
      [-3.5, -22.8, Math.PI / 2, 0x526e58],
      // Tram Stop 13 Flinders St
      [3.5, -4.8, -Math.PI / 2, 0x9c4840],
      [3.5, -2.2, -Math.PI / 2, 0x424852],
      // Tram Stop 14 Arts Precinct
      [3.5, 68.0, -Math.PI / 2, 0x6b5278],
      // Admiring Hosier/Degraves Mural & Wax & Groove Vinyl Window
      [-26.2, -25.0, -Math.PI / 2, 0xd99b42],
      [98.4, -22.0, Math.PI / 2, 0xc95644],
      [86.5, -16.5, -Math.PI / 2, 0x3b7a6c],
    ];

    standingSpots.forEach(([sx, sz, rotY, coat], i) => {
      const fig = this.createStylisedPedestrian(
        coat,
        0x2e323b,
        i % 2 === 0 ? 0xf0c8ab : 0xc68b63,
        0x362419,
        0.95,
        i % 2 === 0,
        worldMats,
        false
      );
      fig.root.position.set(sx, groundHeightAt(sx, sz) + 0.16, sz);
      fig.root.rotation.y = rotY;
      this.group.add(fig.root);
    });

    // Seated Melbourne locals on Southbank Waterfront & Botanic Gardens benches
    const seatedSpots: Array<[number, number, number, number]> = [
      [-64, getYarraCenterZ(-64) + getYarraHalfWidth(-64) + 2.1, Math.PI, 0xd17a48],
      [-32, getYarraCenterZ(-32) + getYarraHalfWidth(-32) + 2.1, Math.PI, 0x4a6b7c],
      [78, 69, 0.1, 0xba5648],
      [-75, -72, 0, 0x547058],
    ];

    seatedSpots.forEach(([bx, bz, rotY, coat], idx) => {
      const fig = this.createStylisedPedestrian(
        coat,
        0x353840,
        idx % 2 === 0 ? 0xebbfa0 : 0xa66e4a,
        0x2a1d16,
        0.94,
        false,
        worldMats,
        true
      );
      fig.root.position.set(bx, groundHeightAt(bx, bz) + 0.08, bz);
      fig.root.rotation.y = rotY;
      this.group.add(fig.root);
    });
  }

  private spawnBotanicDucks(_worldMats: WorldMaterialLibrary): void {
    // Charming Pacific Black Ducks / Mallards gliding gently across the Botanic Ornamental Lake
    const bodyMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x5c4636, roughness: 0.8 })
    );
    const headMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0x275946, roughness: 0.65 })
    );
    const beakMat = this.trackMat(
      new THREE.MeshStandardMaterial({ color: 0xe3a83b, roughness: 0.6 })
    );

    const loops = [
      { cx: 83, cz: 83, rx: 5.5, rz: 3.6, speed: 0.24, phase: 0 },
      { cx: 83, cz: 83, rx: 4.8, rz: 3.1, speed: 0.24, phase: -0.35 },
      { cx: 101, cz: 88, rx: 4.6, rz: 3.2, speed: -0.21, phase: 1.4 },
      { cx: 99, cz: 87, rx: 3.8, rz: 2.6, speed: -0.21, phase: 1.05 },
    ];

    for (const l of loops) {
      const duck = new THREE.Group();
      const body = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.24, 8, 6)),
        bodyMat
      );
      body.scale.set(0.85, 0.65, 1.35);
      duck.add(body);

      const head = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.13, 8, 6)),
        headMat
      );
      head.position.set(0, 0.18, 0.22);
      duck.add(head);

      const beak = new THREE.Mesh(
        this.trackGeo(new THREE.ConeGeometry(0.055, 0.14, 5)),
        beakMat
      );
      beak.rotation.x = Math.PI / 2;
      beak.position.set(0, 0.17, 0.36);
      duck.add(beak);

      this.group.add(duck);
      this.ducks.push({ mesh: duck, ...l });
    }
  }

  public update(delta: number, elapsedTime: number): void {
    const dt = Math.min(delta, 0.08);

    for (const w of this.walkers) {
      if (w.pauseTimer > 0) {
        w.pauseTimer -= dt;
        w.leftLeg.rotation.x = THREE.MathUtils.damp(w.leftLeg.rotation.x, 0, 8, dt);
        w.rightLeg.rotation.x = THREE.MathUtils.damp(w.rightLeg.rotation.x, 0, 8, dt);
        continue;
      }

      w.progress += (w.direction * w.walkSpeed * dt) / w.curveLen;
      if (w.progress >= 0.995) {
        w.progress = 0.995;
        w.direction = -1;
        w.pauseTimer = 1.2;
      } else if (w.progress <= 0.005) {
        w.progress = 0.005;
        w.direction = 1;
        w.pauseTimer = 1.2;
      }

      this.positionWalker(w);

      // Crisp indie-style articulated limb swing + subtle vertical bounce
      w.stridePhase += dt * w.walkSpeed * 5.2;
      const swing = Math.sin(w.stridePhase) * 0.48;
      w.leftLeg.rotation.x = swing;
      w.rightLeg.rotation.x = -swing;
      w.leftArm.rotation.x = -swing * 0.65;
      w.rightArm.rotation.x = swing * 0.65;
      w.root.position.y += Math.abs(Math.cos(w.stridePhase)) * 0.03;
    }

    for (const d of this.ducks) {
      const a = elapsedTime * d.speed + d.phase;
      const nx = d.cx + Math.cos(a) * d.rx;
      const nz = d.cz + Math.sin(a) * d.rz;
      const tx = -Math.sin(a) * d.rx * Math.sign(d.speed);
      const tz = Math.cos(a) * d.rz * Math.sign(d.speed);
      d.mesh.position.set(nx, -0.49 + Math.sin(elapsedTime * 2.5 + d.phase) * 0.015, nz);
      d.mesh.rotation.y = Math.atan2(tx, tz);
    }
  }

  public dispose(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.geometries = [];
    this.materials = [];
  }
}
