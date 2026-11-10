import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import { getYarraCenterZ, getYarraHalfWidth, groundHeightAt } from './TerrainSystem';
import { ObstacleBox2D } from './types';

/**
 * Reusable library of handcrafted 3–12 part procedural Melbourne street furniture,
 * riverfront props, boats, public art, rotunda pavilion, cafe dining sets, and lighting fixtures.
 */
export class EnvironmentAssets {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  public animatedBoats: Array<{
    mesh: THREE.Group;
    baseY: number;
    baseX: number;
    baseZ: number;
    phase: number;
    driftRange: number;
  }> = [];

  constructor(materials: WorldMaterialLibrary, obstacles: ObstacleBox2D[]) {
    this.group.name = 'EnvironmentAssets';
    this.populateStreetlights(materials);
    this.populateTrafficLightsAndSigns(materials);
    this.populateBenchesBinsAndBikes(materials);
    this.populateCafeDiningAndLanewayProps(materials);
    this.populateRiverRailingsBoatsAndPublicArt(materials, obstacles);
    this.populateBotanicRotundaAndFountains(materials, obstacles);
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  public createHeritageStreetlight(materials: WorldMaterialLibrary): THREE.Group {
    const g = new THREE.Group();
    // 1. Fluted cast-iron base plinth
    const plinth = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.18, 0.26, 0.75, 8)),
      materials.charcoalIron
    );
    plinth.position.y = 0.375;
    plinth.castShadow = true;
    g.add(plinth);

    // 2. Decorative collar ring
    const ring = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.21, 0.21, 0.1, 8)),
      materials.brassGold
    );
    ring.position.y = 0.78;
    g.add(ring);

    // 3. Tapered column
    const post = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.07, 0.13, 3.1, 8)),
      materials.charcoalIron
    );
    post.position.y = 2.3;
    post.castShadow = true;
    g.add(post);

    // 4. Curved crook arm + lantern cage + glowing warm glass globe
    const arm = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.65, 0.07, 0.07)),
      materials.charcoalIron
    );
    arm.position.set(0.28, 3.82, 0);
    g.add(arm);

    const lanternCap = new THREE.Mesh(
      this.trackGeo(new THREE.ConeGeometry(0.26, 0.22, 6)),
      materials.charcoalIron
    );
    lanternCap.position.set(0.55, 4.02, 0);
    g.add(lanternCap);

    const lanternGlass = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.2, 0.14, 0.36, 6)),
      materials.lampGlowWarm
    );
    lanternGlass.position.set(0.55, 3.74, 0);
    g.add(lanternGlass);

    return g;
  }

  public createTrafficLight(materials: WorldMaterialLibrary): THREE.Group {
    const g = new THREE.Group();
    const pole = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.08, 0.1, 3.6, 8)),
      materials.charcoalIron
    );
    pole.position.y = 1.8;
    pole.castShadow = true;
    g.add(pole);

    const box = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.36, 1.05, 0.32)),
      materials.charcoalIron
    );
    box.position.set(0, 3.25, 0.14);
    box.castShadow = true;
    g.add(box);

    const lights = [
      { y: 3.56, mat: materials.trafficRed },
      { y: 3.25, mat: materials.trafficAmber },
      { y: 2.94, mat: materials.trafficGreen },
    ];
    for (const l of lights) {
      const lens = new THREE.Mesh(
        this.trackGeo(new THREE.SphereGeometry(0.09, 8, 8)),
        l.mat
      );
      lens.position.set(0, l.y, 0.28);
      g.add(lens);
    }
    return g;
  }

  public createMelbourneBench(materials: WorldMaterialLibrary): THREE.Group {
    const g = new THREE.Group();
    // Cast-iron legs + armrests
    for (const sx of [-0.82, 0.82]) {
      const legF = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.09, 0.46, 0.55)),
        materials.charcoalIron
      );
      legF.position.set(sx, 0.23, 0);
      legF.castShadow = true;
      g.add(legF);

      const backSupport = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.08, 0.52, 0.08)),
        materials.charcoalIron
      );
      backSupport.position.set(sx, 0.68, -0.22);
      backSupport.rotation.x = -0.15;
      g.add(backSupport);
    }

    // Timber seat slats & backrest slats
    for (let s = 0; s < 3; s++) {
      const seatSlat = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.86, 0.06, 0.14)),
        materials.warmTimber
      );
      seatSlat.position.set(0, 0.47, -0.16 + s * 0.16);
      seatSlat.castShadow = true;
      g.add(seatSlat);
    }
    for (let b = 0; b < 2; b++) {
      const backSlat = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.86, 0.13, 0.05)),
        materials.warmTimber
      );
      backSlat.position.set(0, 0.66 + b * 0.17, -0.23 - b * 0.03);
      backSlat.rotation.x = -0.15;
      backSlat.castShadow = true;
      g.add(backSlat);
    }
    return g;
  }

  public createCafeTableSet(
    materials: WorldMaterialLibrary,
    withUmbrella: boolean,
    umbrellaColor: number
  ): THREE.Group {
    const g = new THREE.Group();
    // Pedestal base + round bistro tabletop
    const base = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.28, 0.32, 0.06, 10)),
      materials.charcoalIron
    );
    base.position.y = 0.03;
    g.add(base);

    const stem = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.05, 0.05, 0.74, 8)),
      materials.charcoalIron
    );
    stem.position.y = 0.4;
    g.add(stem);

    const top = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.58, 0.58, 0.06, 14)),
      materials.heritageTrimCream
    );
    top.position.y = 0.78;
    top.castShadow = true;
    top.receiveShadow = true;
    g.add(top);

    // Tiny flat-white ceramic coffee cups on table
    for (const [cx, cz] of [
      [-0.18, 0.12],
      [0.2, -0.14],
    ]) {
      const cup = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.06, 0.045, 0.09, 8)),
        materials.stuccoTerracotta
      );
      cup.position.set(cx, 0.85, cz);
      g.add(cup);
    }

    // 2 or 3 Bistro Chairs around table
    const chairAngles = [0.4, 2.5, 4.4];
    for (let i = 0; i < 2 + (withUmbrella ? 1 : 0); i++) {
      const a = chairAngles[i];
      const ch = new THREE.Group();
      ch.position.set(Math.cos(a) * 0.85, 0, Math.sin(a) * 0.85);
      ch.rotation.y = -a + Math.PI / 2;

      const seat = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.24, 0.24, 0.05, 10)),
        materials.warmTimber
      );
      seat.position.y = 0.46;
      seat.castShadow = true;
      ch.add(seat);

      const chairBack = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.42, 0.36, 0.05)),
        materials.darkTimber
      );
      chairBack.position.set(0, 0.68, -0.2);
      chairBack.castShadow = true;
      ch.add(chairBack);

      const leg = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.04, 0.16, 0.45, 6)),
        materials.charcoalIron
      );
      leg.position.y = 0.225;
      ch.add(leg);
      g.add(ch);
    }

    if (withUmbrella) {
      const pole = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.035, 0.035, 2.35, 8)),
        materials.warmTimber
      );
      pole.position.y = 1.25;
      g.add(pole);

      const canopyMat = new THREE.MeshStandardMaterial({
        color: umbrellaColor,
        roughness: 0.85,
      });
      const canopy = new THREE.Mesh(
        this.trackGeo(new THREE.ConeGeometry(1.45, 0.52, 8)),
        canopyMat
      );
      canopy.position.y = 2.38;
      canopy.castShadow = true;
      g.add(canopy);
    }

    return g;
  }

  private createBicycleRackWithBikes(materials: WorldMaterialLibrary): THREE.Group {
    const g = new THREE.Group();
    const frameColors = [0xc85a44, 0x3b7355, 0xd99b38];
    for (let i = 0; i < 3; i++) {
      const x = (i - 1) * 0.72;
      // Stainless hoop
      const hoop = new THREE.Mesh(
        this.trackGeo(new THREE.TorusGeometry(0.36, 0.035, 6, 14, Math.PI)),
        materials.steelRail
      );
      hoop.position.set(x, 0.42, 0);
      hoop.rotation.y = Math.PI / 2;
      hoop.castShadow = true;
      g.add(hoop);

      if (i !== 1) {
        // Multi-part Bicycle leaning next to hoop
        const bike = new THREE.Group();
        bike.position.set(x + 0.14, 0, 0);
        bike.rotation.z = 0.08;
        const wheelGeo = this.trackGeo(new THREE.TorusGeometry(0.28, 0.035, 6, 14));
        for (const wz of [-0.42, 0.42]) {
          const w = new THREE.Mesh(wheelGeo, materials.rubberTire);
          w.rotation.y = Math.PI / 2;
          w.position.set(0, 0.31, wz);
          w.castShadow = true;
          bike.add(w);
        }
        const fMat = new THREE.MeshStandardMaterial({
          color: frameColors[i],
          roughness: 0.4,
          metalness: 0.45,
        });
        const bar = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 0.82, 6)),
          fMat
        );
        bar.rotation.x = Math.PI / 2;
        bar.position.set(0, 0.56, 0);
        bike.add(bar);

        const handlebar = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(0.42, 0.04, 0.04)),
          materials.steelRail
        );
        handlebar.position.set(0, 0.78, 0.36);
        bike.add(handlebar);

        const saddle = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(0.14, 0.06, 0.24)),
          materials.darkTimber
        );
        saddle.position.set(0, 0.74, -0.24);
        bike.add(saddle);

        g.add(bike);
      }
    }
    return g;
  }

  private populateStreetlights(materials: WorldMaterialLibrary): void {
    const placements: Array<[number, number, number]> = [];

    // Along Swanston St & St Kilda Rd
    for (let z = -104; z <= 104; z += 22) {
      if (z > 10 && z < 45) continue; // Princes Bridge has its own twin-globe lamps
      placements.push([-8.5, z, 0]);
      placements.push([8.5, z, Math.PI]);
    }

    // Along Flinders St
    for (let x = -112; x <= 114; x += 24) {
      if (Math.abs(x) < 10 || Math.abs(x - 58) < 8) continue;
      placements.push([x, -1.2, Math.PI / 2]);
      placements.push([x, 13.2, -Math.PI / 2]);
    }

    // Along Bourke St & Grattan St (Parkville)
    for (let x = -108; x <= 114; x += 26) {
      if (Math.abs(x) < 10 || Math.abs(x + 44) < 7 || Math.abs(x - 58) < 8) continue;
      placements.push([x, -44.8, Math.PI / 2]);
      if (x < 48) placements.push([x, -61.5, -Math.PI / 2]);
    }

    // Along Southbank Promenade
    for (let x = -116; x <= 20; x += 20) {
      const sz = getYarraCenterZ(x) + getYarraHalfWidth(x) + 2.2;
      placements.push([x, sz, -Math.PI / 2]);
    }

    for (const [x, z, rotY] of placements) {
      const lamp = this.createHeritageStreetlight(materials);
      lamp.position.set(x, groundHeightAt(x, z) + 0.12, z);
      lamp.rotation.y = rotY;
      this.group.add(lamp);
    }

    // Overhead warm festoon string lights across Melbourne CBD Laneways & Entertainment Alley!
    const festoonLanes = [
      { x: -28, z1: -34, z2: 2, spanW: 5.8 }, // Degraves / Hosier Lane
      { x: 26, z1: -34, z2: 2, spanW: 5.6 }, // Centre Place
      { x: 92, z1: -70, z2: 2, spanW: 6.4 }, // Arcade Entertainment Alley
    ];

    for (const lane of festoonLanes) {
      for (let z = lane.z1; z <= lane.z2; z += 5.5) {
        const cablePts = [
          new THREE.Vector3(lane.x - lane.spanW * 0.5, 4.9, z),
          new THREE.Vector3(lane.x, 4.35, z + 1.2),
          new THREE.Vector3(lane.x + lane.spanW * 0.5, 4.9, z + 2.4),
        ];
        const curve = new THREE.CatmullRomCurve3(cablePts);
        const wire = new THREE.Mesh(
          this.trackGeo(new THREE.TubeGeometry(curve, 10, 0.02, 4, false)),
          materials.charcoalIron
        );
        this.group.add(wire);

        for (let b = 1; b <= 4; b++) {
          const bp = curve.getPoint(b / 5);
          const bulb = new THREE.Mesh(
            this.trackGeo(new THREE.SphereGeometry(0.095, 6, 6)),
            materials.lampGlowWarm
          );
          bulb.position.set(bp.x, bp.y - 0.08, bp.z);
          this.group.add(bulb);
        }
      }
    }
  }

  private populateTrafficLightsAndSigns(materials: WorldMaterialLibrary): void {
    const junctions: Array<[number, number]> = [
      [0, 6], // Flinders & Swanston
      [0, -38], // Bourke & Swanston
      [0, -68], // Grattan & Swanston
      [58, -38], // Russell & Bourke
      [58, 6], // Russell & Flinders
      [0, 58], // St Kilda Rd & Southbank Blvd
    ];

    for (const [jx, jz] of junctions) {
      const xOff = jx === 0 ? 8.6 : 7.0;
      const corners: Array<[number, number, number]> = [
        [-xOff, -7.0, 0],
        [xOff, 7.0, Math.PI],
        [-xOff, 7.0, Math.PI / 2],
        [xOff, -7.0, -Math.PI / 2],
      ];
      for (const [ox, oz, ry] of corners) {
        const tl = this.createTrafficLight(materials);
        tl.position.set(jx + ox, 0.14, jz + oz);
        tl.rotation.y = ry;
        this.group.add(tl);

        // Melbourne green-and-cream street blade sign attached to corner post
        const blade = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(1.15, 0.24, 0.05)),
          materials.tramGreen
        );
        blade.position.set(jx + ox + 0.45, 2.65, jz + oz);
        this.group.add(blade);
      }
    }
  }

  private populateBenchesBinsAndBikes(materials: WorldMaterialLibrary): void {
    // Southbank waterfront benches facing Yarra
    for (let x = -112; x <= 18; x += 16) {
      if (Math.abs(x + 52) < 6 || Math.abs(x) < 11) continue;
      const z = getYarraCenterZ(x) + getYarraHalfWidth(x) + 2.1;
      const bench = this.createMelbourneBench(materials);
      bench.position.set(x, 0.08, z);
      bench.rotation.y = Math.PI; // Face North toward Yarra & CBD skyline
      this.group.add(bench);
    }

    // Botanic Gardens path benches
    const gardenBenches: Array<[number, number, number]> = [
      [52, 64, 0.2],
      [78, 69, 0.1],
      [106, 71, -0.5],
      [104, 102, 2.8],
      [68, 99, 2.9],
      [-75, -72, 0], // Parkville Quad bench
      [-64, -82, -Math.PI / 2], // Parkville Quad bench
    ];
    for (const [bx, bz, ry] of gardenBenches) {
      const bench = this.createMelbourneBench(materials);
      bench.position.set(bx, groundHeightAt(bx, bz) + 0.04, bz);
      bench.rotation.y = ry;
      this.group.add(bench);
    }

    // Melbourne council green-top rubbish/recycling bin pairs + bicycle hoops
    const bikeSpots: Array<[number, number, number]> = [
      [-37, -64, 0], // Parkville Faraday Cafe corner
      [-8, -22, Math.PI / 2], // CBD Swanston St
      [8, -50, Math.PI / 2], // CBD North
      [51, -24, Math.PI / 2], // Arcade Quarter entrance
      [-24, 52, 0], // Southbank Promenade
    ];
    for (const [rx, rz, ry] of bikeSpots) {
      const rack = this.createBicycleRackWithBikes(materials);
      rack.position.set(rx, groundHeightAt(rx, rz) + 0.14, rz);
      rack.rotation.y = ry;
      this.group.add(rack);

      // Rubbish bin next to bike rack
      const bin = new THREE.Group();
      const body = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.28, 0.25, 0.85, 8)),
        materials.charcoalIron
      );
      body.position.y = 0.425;
      body.castShadow = true;
      bin.add(body);
      const hood = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.29, 0.29, 0.18, 8)),
        materials.tramGreen
      );
      hood.position.y = 0.92;
      bin.add(hood);
      bin.position.set(rx + 1.8, groundHeightAt(rx + 1.8, rz) + 0.14, rz);
      this.group.add(bin);
    }

    // Cast-iron heritage bollards at laneway mouths
    const lanewayMouths: Array<[number, number]> = [
      [-28, 1.5],
      [-28, -33.5],
      [26, 1.5],
      [26, -33.5],
      [92, 1.5],
      [92, -72],
    ];
    for (const [mx, mz] of lanewayMouths) {
      for (const dx of [-1.2, 1.2]) {
        const bollard = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.1, 0.13, 0.86, 8)),
          materials.charcoalIron
        );
        bollard.position.set(mx + dx, 0.46, mz);
        bollard.castShadow = true;
        this.group.add(bollard);
      }
    }
  }

  private populateCafeDiningAndLanewayProps(materials: WorldMaterialLibrary): void {
    // 1. Degraves / Centre Place intimate laneway espresso tables (no umbrellas, tight European/Melbourne vibe)
    for (const laneX of [-28, 26]) {
      for (let z = -30; z <= -2; z += 6.5) {
        if (Math.abs(z + 16) < 4) continue;
        const side = z % 2 === 0 ? -1.45 : 1.45;
        const set = this.createCafeTableSet(materials, false, 0xc56b4e);
        set.position.set(laneX + side, 0.08, z);
        this.group.add(set);

        // A-Frame Chalkboard menu outside cafe
        const board = new THREE.Group();
        const panel1 = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(0.55, 0.85, 0.05)),
          materials.darkTimber
        );
        panel1.position.set(0, 0.42, 0.14);
        panel1.rotation.x = -0.22;
        board.add(panel1);
        const panel2 = panel1.clone();
        panel2.position.set(0, 0.42, -0.14);
        panel2.rotation.x = 0.22;
        board.add(panel2);
        board.position.set(laneX - side * 0.85, 0.08, z + 2.2);
        board.rotation.y = 0.4;
        this.group.add(board);
      }
    }

    // 2. Southbank Waterfront Umbrella-Shaded Al Fresco Restaurant Dining!
    const umbrellaPalette = [0xc45c43, 0xdba34b, 0x3b6e57, 0xe8dcc4];
    let uIdx = 0;
    for (let x = -104; x <= -14; x += 9.5) {
      if (Math.abs(x + 52) < 7) continue;
      const z = getYarraCenterZ(x) + getYarraHalfWidth(x) + 6.8;
      const set = this.createCafeTableSet(
        materials,
        true,
        umbrellaPalette[uIdx++ % umbrellaPalette.length]
      );
      set.position.set(x, 0.08, z);
      this.group.add(set);
    }

    // 3. Parkville Corner Cafe & Arcade Quarter Outdoor Tables
    const extraTables: Array<[number, number, boolean, number]> = [
      [-37.5, -59.5, true, 0x3b6e57],
      [-34.5, -59.5, true, 0xc45c43],
      [94.2, -24, false, 0xdba34b],
      [94.2, -30, false, 0xc45c43],
      [89.8, -48, false, 0x3b6e57],
      [89.8, -54, false, 0xdba34b],
    ];
    for (const [tx, tz, umb, col] of extraTables) {
      const set = this.createCafeTableSet(materials, umb, col);
      set.position.set(tx, 0.1, tz);
      this.group.add(set);
    }
  }

  private populateRiverRailingsBoatsAndPublicArt(
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // 1. Riverfront Safety Railings along Southbank & Northbank (skipping bridges)
    for (const side of [-1, 1] as const) {
      for (let x = -124; x <= 46; x += 3.2) {
        if (Math.abs(x) < 10.2) continue; // Princes Bridge
        if (Math.abs(x + 52) < 3.6) continue; // Evan Walker Footbridge
        if (side === 1 && x > 28) continue; // Botanic riverbank transition

        const rz = getYarraCenterZ(x) + side * (getYarraHalfWidth(x) + 0.55);
        const post = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.05, 0.06, 1.02, 6)),
          materials.charcoalIron
        );
        post.position.set(x, 0.62, rz);
        this.group.add(post);

        const rail = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(3.25, 0.07, 0.07)),
          materials.charcoalIron
        );
        rail.position.set(x + 1.6, 1.08, rz);
        this.group.add(rail);

        const midRail = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(3.25, 0.04, 0.04)),
          materials.steelRail
        );
        midRail.position.set(x + 1.6, 0.72, rz);
        this.group.add(midRail);
      }
    }

    // 2. Melbourne Yarra Sightseeing Ferry & Classic Wooden Rowing Sculls
    const ferry = this.createYarraFerry(materials);
    const ferryX = -26;
    const ferryZ = getYarraCenterZ(ferryX) + 3.2;
    ferry.position.set(ferryX, -1.22, ferryZ);
    this.group.add(ferry);
    this.animatedBoats.push({
      mesh: ferry,
      baseX: ferryX,
      baseY: -1.22,
      baseZ: ferryZ,
      phase: 0.3,
      driftRange: 4.5,
    });

    const rowBoatSpots = [
      { x: 34, zOff: -2.4, phase: 1.4 },
      { x: -78, zOff: 1.8, phase: 2.7 },
    ];
    for (const rb of rowBoatSpots) {
      const boat = this.createRowingBoat(materials);
      const bz = getYarraCenterZ(rb.x) + rb.zOff;
      boat.position.set(rb.x, -1.24, bz);
      this.group.add(boat);
      this.animatedBoats.push({
        mesh: boat,
        baseX: rb.x,
        baseY: -1.24,
        baseZ: bz,
        phase: rb.phase,
        driftRange: 6.0,
      });
    }

    // 3. Iconic Melbourne Public Art Sculpture on Southbank Plaza (inspired by Vault / Red Beams)
    const artGroup = new THREE.Group();
    artGroup.position.set(-18, 0.06, 49.5);
    const artMat = new THREE.MeshStandardMaterial({
      color: 0xd96043,
      roughness: 0.38,
      metalness: 0.35,
    });
    const artMatGold = new THREE.MeshStandardMaterial({
      color: 0xe3a846,
      roughness: 0.35,
      metalness: 0.4,
    });

    const plinth = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(2.3, 2.5, 0.26, 16)),
      materials.bluestone
    );
    plinth.position.y = 0.13;
    artGroup.add(plinth);

    const beam1 = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.65, 4.4, 0.65)),
      artMat
    );
    beam1.position.set(-0.5, 2.1, 0);
    beam1.rotation.set(0.28, 0.4, -0.32);
    beam1.castShadow = true;
    artGroup.add(beam1);

    const beam2 = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.55, 3.8, 0.55)),
      artMatGold
    );
    beam2.position.set(0.55, 1.85, 0.35);
    beam2.rotation.set(-0.35, -0.25, 0.38);
    beam2.castShadow = true;
    artGroup.add(beam2);

    const ring = new THREE.Mesh(
      this.trackGeo(new THREE.TorusGeometry(1.15, 0.18, 10, 24)),
      artMat
    );
    ring.position.set(0.1, 2.2, -0.2);
    ring.rotation.y = 0.6;
    ring.castShadow = true;
    artGroup.add(ring);

    this.group.add(artGroup);
    obstacles.push({ minX: -20.6, maxX: -15.4, minZ: 47.0, maxZ: 52.0, tag: 'prop' });
  }

  private createYarraFerry(materials: WorldMaterialLibrary): THREE.Group {
    const g = new THREE.Group();
    // Hull
    const hullShape = new THREE.Shape();
    hullShape.moveTo(-5.8, -1.6);
    hullShape.lineTo(4.6, -1.6);
    hullShape.quadraticCurveTo(6.6, 0, 4.6, 1.6);
    hullShape.lineTo(-5.8, 1.6);
    hullShape.quadraticCurveTo(-6.4, 0, -5.8, -1.6);

    const hullGeo = this.trackGeo(
      new THREE.ExtrudeGeometry(hullShape, {
        depth: 1.05,
        bevelEnabled: true,
        bevelSize: 0.12,
        bevelThickness: 0.12,
        bevelSegments: 2,
      })
    );
    hullGeo.rotateX(Math.PI / 2);
    const hull = new THREE.Mesh(hullGeo, materials.tramGreen);
    hull.position.y = 0.72;
    hull.castShadow = true;
    g.add(hull);

    // Cream passenger cabin with warm glowing windows
    const cabin = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(7.2, 1.45, 2.45)),
      materials.tramCream
    );
    cabin.position.set(-0.4, 1.48, 0);
    cabin.castShadow = true;
    g.add(cabin);

    const glassBand = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(6.6, 0.72, 2.52)),
      materials.windowWarmLit
    );
    glassBand.position.set(-0.4, 1.56, 0);
    g.add(glassBand);

    const roof = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(7.8, 0.2, 2.75)),
      materials.warmTimber
    );
    roof.position.set(-0.4, 2.28, 0);
    roof.castShadow = true;
    g.add(roof);

    // Lifebuoy accent
    const buoy = new THREE.Mesh(
      this.trackGeo(new THREE.TorusGeometry(0.28, 0.08, 6, 14)),
      materials.stuccoTerracotta
    );
    buoy.position.set(-4.1, 1.45, 1.28);
    g.add(buoy);

    return g;
  }

  private createRowingBoat(materials: WorldMaterialLibrary): THREE.Group {
    const g = new THREE.Group();
    const hull = new THREE.Mesh(
      this.trackGeo(new THREE.CapsuleGeometry(0.55, 3.2, 4, 10)),
      materials.warmTimber
    );
    hull.rotation.z = Math.PI / 2;
    hull.scale.set(1, 1, 0.55);
    hull.position.y = 0.25;
    hull.castShadow = true;
    g.add(hull);

    for (const ox of [-0.6, 0.6]) {
      const seat = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.32, 0.08, 0.85)),
        materials.heritageTrimCream
      );
      seat.position.set(ox, 0.48, 0);
      g.add(seat);
    }

    // Oars
    for (const side of [-1, 1]) {
      const oar = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.03, 0.04, 2.4, 6)),
        materials.heritageTrimCream
      );
      oar.position.set(0, 0.52, side * 1.15);
      oar.rotation.x = side * 1.38;
      oar.rotation.z = 0.2;
      g.add(oar);
    }
    return g;
  }

  private populateBotanicRotundaAndFountains(
    materials: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[]
  ): void {
    // Heritage Victorian Temple of the Winds / Garden Rotunda Pavilion on Scenic Rise (X = 118, Z = 88)
    const rx = 118;
    const rz = 88;
    const ry = groundHeightAt(rx, rz);
    const rotunda = new THREE.Group();
    rotunda.position.set(rx, ry, rz);

    // Stepped sandstone octagonal base
    const step1 = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(4.6, 4.9, 0.35, 8)),
      materials.sandstone
    );
    step1.position.y = 0.175;
    step1.receiveShadow = true;
    rotunda.add(step1);

    const step2 = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(4.0, 4.2, 0.32, 8)),
      materials.heritageTrimCream
    );
    step2.position.y = 0.5;
    step2.receiveShadow = true;
    rotunda.add(step2);

    // 8 Classical Columns
    for (let i = 0; i < 8; i++) {
      const a = (i / 8) * Math.PI * 2;
      const col = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.18, 0.22, 3.2, 10)),
        materials.heritageTrimCream
      );
      col.position.set(Math.cos(a) * 3.35, 2.25, Math.sin(a) * 3.35);
      col.castShadow = true;
      rotunda.add(col);
    }

    // Verdigris Copper Domed Roof + Brass Finial
    const ring = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(3.85, 3.85, 0.38, 8)),
      materials.sandstone
    );
    ring.position.y = 4.02;
    ring.castShadow = true;
    rotunda.add(ring);

    const dome = new THREE.Mesh(
      this.trackGeo(
        new THREE.SphereGeometry(3.75, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.48)
      ),
      materials.verdigrisCopper
    );
    dome.position.y = 4.12;
    dome.castShadow = true;
    rotunda.add(dome);

    const finial = new THREE.Mesh(
      this.trackGeo(new THREE.ConeGeometry(0.24, 0.95, 8)),
      materials.brassGold
    );
    finial.position.y = 8.1;
    rotunda.add(finial);

    this.group.add(rotunda);
    obstacles.push({ minX: rx - 4.5, maxX: rx + 4.5, minZ: rz - 4.5, maxZ: rz + 4.5, tag: 'building' });

    // Tiered Stone Garden Fountain at Entrance Plaza (X = 48, Z = 62)
    const fx = 48;
    const fz = 76;
    const fy = groundHeightAt(fx, fz);
    const fountain = new THREE.Group();
    fountain.position.set(fx, fy, fz);

    const basinRim = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(3.1, 3.3, 0.55, 16)),
      materials.sandstone
    );
    basinRim.position.y = 0.275;
    basinRim.castShadow = true;
    basinRim.receiveShadow = true;
    fountain.add(basinRim);

    const basinWater = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(2.75, 2.75, 0.12, 16)),
      materials.lakeWater
    );
    basinWater.position.y = 0.52;
    fountain.add(basinWater);

    const tier1 = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(1.15, 0.45, 0.9, 12)),
      materials.sandstone
    );
    tier1.position.y = 0.95;
    tier1.castShadow = true;
    fountain.add(tier1);

    const tier2 = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.55, 0.22, 0.75, 10)),
      materials.heritageTrimCream
    );
    tier2.position.y = 1.72;
    tier2.castShadow = true;
    fountain.add(tier2);

    this.group.add(fountain);
    obstacles.push({ minX: fx - 3.3, maxX: fx + 3.3, minZ: fz - 3.3, maxZ: fz + 3.3, tag: 'prop' });
  }

  public update(elapsedTime: number): void {
    for (const b of this.animatedBoats) {
      b.mesh.position.x = b.baseX + Math.sin(elapsedTime * 0.28 + b.phase) * b.driftRange;
      b.mesh.position.y = b.baseY + Math.sin(elapsedTime * 1.4 + b.phase) * 0.045;
      b.mesh.rotation.z = Math.sin(elapsedTime * 1.1 + b.phase) * 0.025;
      b.mesh.rotation.x = Math.cos(elapsedTime * 0.9 + b.phase) * 0.018;
    }
  }

  public dispose(): void {
    for (const g of this.geometries) {
      g.dispose();
    }
    this.geometries = [];
  }
}
