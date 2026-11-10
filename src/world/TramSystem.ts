import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import { TramStatusSnapshot, TramStopData } from './types';

interface ActiveTram {
  id: string;
  routeCode: string;
  destination: string;
  mesh: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  curveLength: number;
  progress: number; // 0..1 along closed loop
  speedMetersPerSec: number;
  maxSpeed: number;
  waitTimer: number;
  lastStopId: string | null;
  nearStopName: string | null;
}

/**
 * Iconic Melbourne Tram Infrastructure & Functional Tram Fleet:
 * - Embedded steel grooved twin-rails & bluestone sleepers
 * - Overhead catenary poles, span wires & contact wires
 * - 4 Sheltered Melbourne Tram Stops with illuminated route boards & seating
 * - 3 Multi-part Green-and-Cream W-Class inspired Melbourne Trams smoothly following
 *   curved tracks, stopping at stops, boarding passengers, and maintaining safe spacing!
 */
export class TramSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  public stops: TramStopData[] = [];
  public trams: ActiveTram[] = [];
  public mainLoopCurve!: THREE.CatmullRomCurve3;

  constructor(materials: WorldMaterialLibrary) {
    this.group.name = 'TramSystem';
    this.buildRouteAndTracks(materials);
    this.buildOverheadCatenary(materials);
    this.buildTramStops(materials);
    this.spawnTrams(materials);
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private buildRouteAndTracks(materials: WorldMaterialLibrary): void {
    // Grand Melbourne Tram Loop connecting:
    // Parkville (Grattan St & Swanston North) -> CBD (Bourke & Flinders) ->
    // Princes Bridge over Yarra -> Southbank & Botanic Gardens (St Kilda Rd) -> Smooth return loop!
    // We build a realistic dual-track Northbound (X = -1.65) & Southbound (X = +1.65) corridor
    // with smooth turning balloons at North Parkville (Z = -108) and South St Kilda Rd (Z = +106),
    // PLUS a Parkville Grattan Street branch track visual for authentic junction detail!
    const waypoints: THREE.Vector3[] = [
      // Southbound track (East track X = +1.65, heading South from Parkville -> CBD -> Princes Bridge -> St Kilda Rd)
      new THREE.Vector3(1.65, 0.08, -98),
      new THREE.Vector3(1.65, 0.08, -68),
      new THREE.Vector3(1.65, 0.08, -38),
      new THREE.Vector3(1.65, 0.08, -12),
      new THREE.Vector3(1.65, 0.08, 6),
      new THREE.Vector3(1.65, 0.09, 20), // Princes Bridge North
      new THREE.Vector3(1.65, 0.09, 36), // Princes Bridge South
      new THREE.Vector3(1.65, 0.08, 58), // Southbank / Arts Precinct
      new THREE.Vector3(1.65, 0.08, 86), // Botanic Gardens Gate
      new THREE.Vector3(1.65, 0.08, 102),
      // Smooth Southern Turning Loop at St Kilda Rd Terminus
      new THREE.Vector3(1.2, 0.08, 108),
      new THREE.Vector3(0.0, 0.08, 110.2),
      new THREE.Vector3(-1.2, 0.08, 108),
      // Northbound track (West track X = -1.65, heading North from St Kilda Rd -> Princes Bridge -> CBD -> Parkville)
      new THREE.Vector3(-1.65, 0.08, 102),
      new THREE.Vector3(-1.65, 0.08, 86),
      new THREE.Vector3(-1.65, 0.08, 58),
      new THREE.Vector3(-1.65, 0.09, 36),
      new THREE.Vector3(-1.65, 0.09, 20),
      new THREE.Vector3(-1.65, 0.08, 6),
      new THREE.Vector3(-1.65, 0.08, -12),
      new THREE.Vector3(-1.65, 0.08, -38),
      new THREE.Vector3(-1.65, 0.08, -68),
      new THREE.Vector3(-1.65, 0.08, -98),
      // Smooth Northern Turning Loop at Parkville University Terminus
      new THREE.Vector3(-1.2, 0.08, -104.5),
      new THREE.Vector3(0.0, 0.08, -106.8),
      new THREE.Vector3(1.2, 0.08, -104.5),
    ];

    this.mainLoopCurve = new THREE.CatmullRomCurve3(
      waypoints,
      true,
      'catmullrom',
      0.18
    );

    // Render steel twin-rails & embedded concrete/bluestone sleepers along the entire loop
    this.renderTrackRailsAndSleepers(this.mainLoopCurve, 520, materials);

    // Render Grattan St Parkville heritage spur track with curved junction into Swanston!
    const grattanSpur = new THREE.CatmullRomCurve3([
      new THREE.Vector3(-118, 0.08, -68),
      new THREE.Vector3(-55, 0.08, -68),
      new THREE.Vector3(-12, 0.08, -68),
      new THREE.Vector3(-3.5, 0.08, -66.5),
      new THREE.Vector3(-1.65, 0.08, -61),
    ]);
    this.renderTrackRailsAndSleepers(grattanSpur, 120, materials);
  }

  private renderTrackRailsAndSleepers(
    curve: THREE.CatmullRomCurve3,
    segments: number,
    materials: WorldMaterialLibrary
  ): void {
    const gaugeHalf = 0.62; // Standard gauge ~1.435m scaled cleanly to street
    const leftRailPts: THREE.Vector3[] = [];
    const rightRailPts: THREE.Vector3[] = [];

    const sleeperGeo = this.trackGeo(new THREE.BoxGeometry(1.75, 0.035, 0.24));
    const sleeperCount = Math.floor(segments / 2);
    const sleeperInst = new THREE.InstancedMesh(
      sleeperGeo,
      materials.kerbStone,
      sleeperCount
    );
    sleeperInst.receiveShadow = true;
    const dummy = new THREE.Object3D();
    let sIdx = 0;

    for (let i = 0; i <= segments; i++) {
      const t = i / segments;
      const pt = curve.getPointAt(t);
      const tan = curve.getTangentAt(t).normalize();
      const norm = new THREE.Vector3(-tan.z, 0, tan.x);

      leftRailPts.push(
        new THREE.Vector3(
          pt.x - norm.x * gaugeHalf,
          pt.y + 0.015,
          pt.z - norm.z * gaugeHalf
        )
      );
      rightRailPts.push(
        new THREE.Vector3(
          pt.x + norm.x * gaugeHalf,
          pt.y + 0.015,
          pt.z + norm.z * gaugeHalf
        )
      );

      if (i % 2 === 0 && sIdx < sleeperCount) {
        dummy.position.set(pt.x, pt.y - 0.005, pt.z);
        dummy.rotation.set(0, Math.atan2(tan.x, tan.z), 0);
        dummy.updateMatrix();
        sleeperInst.setMatrixAt(sIdx++, dummy.matrix);
      }
    }

    sleeperInst.instanceMatrix.needsUpdate = true;
    sleeperInst.computeBoundingSphere();
    this.group.add(sleeperInst);

    for (const pts of [leftRailPts, rightRailPts]) {
      const railCurve = new THREE.CatmullRomCurve3(pts, curve.closed);
      const railGeo = this.trackGeo(
        new THREE.TubeGeometry(railCurve, segments, 0.045, 5, curve.closed)
      );
      const railMesh = new THREE.Mesh(railGeo, materials.steelRail);
      railMesh.receiveShadow = true;
      this.group.add(railMesh);
    }
  }

  private buildOverheadCatenary(materials: WorldMaterialLibrary): void {
    // Overhead tram wire mast poles & span wires along the X = 0 corridor + contact wire above tracks
    const wireHeight = 5.45;
    const zPosts: number[] = [];
    for (let z = -102; z <= 104; z += 19) {
      if (z > 13 && z < 43) continue; // Princes Bridge uses central ornamental poles
      zPosts.push(z);
    }

    for (const z of zPosts) {
      // Pair of curbside traction poles + overhead cross-span cable
      for (const sx of [-7.45, 7.45]) {
        const pole = new THREE.Mesh(
          this.trackGeo(new THREE.CylinderGeometry(0.08, 0.12, wireHeight + 0.4, 8)),
          materials.charcoalIron
        );
        pole.position.set(sx, (wireHeight + 0.4) * 0.5, z);
        pole.castShadow = true;
        this.group.add(pole);
      }

      const spanGeo = this.trackGeo(new THREE.CylinderGeometry(0.018, 0.018, 14.9, 4));
      spanGeo.rotateZ(Math.PI / 2);
      const span = new THREE.Mesh(spanGeo, materials.charcoalIron);
      span.position.set(0, wireHeight, z);
      this.group.add(span);
    }

    // Ornate central median traction masts on Princes Bridge (Z = 21 and Z = 35)
    for (const bz of [21, 35]) {
      const mast = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.09, 0.14, wireHeight + 0.3, 8)),
        materials.verdigrisCopper
      );
      mast.position.set(0, (wireHeight + 0.3) * 0.5, bz);
      this.group.add(mast);

      const bracket = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(3.9, 0.07, 0.07)),
        materials.verdigrisCopper
      );
      bracket.position.set(0, wireHeight, bz);
      this.group.add(bracket);
    }

    // Continuous overhead contact wire directly over both tram tracks
    for (const tx of [-1.65, 1.65]) {
      const wireGeo = this.trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 212, 5));
      wireGeo.rotateX(Math.PI / 2);
      const wire = new THREE.Mesh(wireGeo, materials.charcoalIron);
      wire.position.set(tx, wireHeight - 0.08, 2);
      this.group.add(wire);
    }
  }

  private buildTramStops(materials: WorldMaterialLibrary): void {
    // Locate exact curve progress t for each of the 4 iconic Melbourne Tram Stops!
    const stopSpecs: Array<{
      id: string;
      name: string;
      approxPos: THREE.Vector3;
      shelterX: number;
      shelterZ: number;
      dwell: number;
    }> = [
      {
        id: 'stop-parkville',
        name: 'Stop 1 · Melbourne University',
        approxPos: new THREE.Vector3(1.65, 0.08, -78),
        shelterX: 3.55,
        shelterZ: -78,
        dwell: 4.0,
      },
      {
        id: 'stop-bourke',
        name: 'Stop 5 · Bourke St Central',
        approxPos: new THREE.Vector3(-1.65, 0.08, -24),
        shelterX: -3.55,
        shelterZ: -24,
        dwell: 4.2,
      },
      {
        id: 'stop-flinders',
        name: 'Stop 13 · Flinders Street Station',
        approxPos: new THREE.Vector3(1.65, 0.08, -3.5),
        shelterX: 3.55,
        shelterZ: -3.5,
        dwell: 4.8,
      },
      {
        id: 'stop-southbank',
        name: 'Stop 14 · Arts Precinct & Gardens',
        approxPos: new THREE.Vector3(1.65, 0.08, 69),
        shelterX: 3.55,
        shelterZ: 69,
        dwell: 4.0,
      },
    ];

    for (const spec of stopSpecs) {
      // Find closest progress along mainLoopCurve
      let bestT = 0;
      let bestDist = Infinity;
      const samples = 600;
      for (let i = 0; i < samples; i++) {
        const t = i / samples;
        const p = this.mainLoopCurve.getPointAt(t);
        const d = p.distanceToSquared(spec.approxPos);
        if (d < bestDist) {
          bestDist = d;
          bestT = t;
        }
      }

      this.stops.push({
        id: spec.id,
        name: spec.name,
        routeProgress: bestT,
        worldPos: new THREE.Vector3(spec.shelterX, 0.2, spec.shelterZ),
        platformSide: spec.shelterX > 0 ? 'right' : 'left',
        dwellSeconds: spec.dwell,
      });

      // Build Raised Accessible Tram Super-Stop Island Platform (X = ±2.90..±4.20)
      const shelter = new THREE.Group();
      shelter.position.set(spec.shelterX, 0.06, spec.shelterZ);
      const facing = spec.shelterX > 0 ? -1 : 1;

      const plat = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.32, 0.24, 9.6)),
        materials.footpathConcrete
      );
      plat.position.y = 0.12;
      plat.castShadow = true;
      plat.receiveShadow = true;
      shelter.add(plat);

      // Yellow tactile safety strip along track edge
      const tactile = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.18, 0.25, 9.4)),
        materials.roadMarkingYellow
      );
      tactile.position.set(facing * 0.54, 0.125, 0);
      shelter.add(tactile);

      // Shelter Frame + Glass Back Wall + Cantilevered Roof + Timber Bench + Illuminated Route Totem
      for (const sz of [-3.2, 0, 3.2]) {
        const post = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(0.1, 2.55, 0.1)),
          materials.charcoalIron
        );
        post.position.set(-facing * 0.52, 1.48, sz);
        post.castShadow = true;
        shelter.add(post);
      }

      const glassBack = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.06, 2.0, 6.2)),
        materials.architecturalGlass
      );
      glassBack.position.set(-facing * 0.52, 1.38, 0);
      shelter.add(glassBack);

      const roof = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.36, 0.14, 7.2)),
        materials.charcoalIron
      );
      roof.position.set(-facing * 0.04, 2.78, 0);
      roof.castShadow = true;
      shelter.add(roof);

      const lightStrip = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.95, 0.05, 5.8)),
        materials.lampGlowWarm
      );
      lightStrip.position.set(-facing * 0.04, 2.69, 0);
      shelter.add(lightStrip);

      const bench = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.36, 0.08, 3.4)),
        materials.warmTimber
      );
      bench.position.set(-facing * 0.26, 0.68, 0);
      shelter.add(bench);

      // Green & Gold Yarra Trams Totem Sign at stop end
      const totem = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.42, 2.85, 0.16)),
        materials.tramGreen
      );
      totem.position.set(0, 1.62, 4.4);
      totem.castShadow = true;
      shelter.add(totem);

      const totemDisplay = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.36, 0.55, 0.2)),
        materials.neonAmber
      );
      totemDisplay.position.set(0, 2.42, 4.4);
      shelter.add(totemDisplay);

      this.group.add(shelter);
    }
  }

  /**
   * Builds an iconic 12-part Melbourne Heritage W-Class Green-and-Cream Tram!
   * Includes tapered cab aprons, cream window band, gold pinstripe, passenger doors,
   * clerestory roof, diamond pantograph reaching up to the catenary wire, bogies/wheels,
   * brass single central headlight, and illuminated destination rollsign.
   */
  private createMelbourneTramModel(materials: WorldMaterialLibrary): THREE.Group {
    const tram = new THREE.Group();
    const length = 11.2;
    const width = 2.42;

    // 1. Dark iron underframe & dual 4-wheel bogies
    const chassis = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(width - 0.3, 0.36, length - 1.2)),
      materials.charcoalIron
    );
    chassis.position.y = 0.46;
    chassis.castShadow = true;
    tram.add(chassis);

    for (const bz of [-3.3, 3.3]) {
      const bogie = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(width - 0.55, 0.28, 2.1)),
        materials.charcoalIron
      );
      bogie.position.set(0, 0.32, bz);
      tram.add(bogie);

      for (const wz of [-0.68, 0.68]) {
        for (const wx of [-0.66, 0.66]) {
          const wheel = new THREE.Mesh(
            this.trackGeo(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 12)),
            materials.steelRail
          );
          wheel.rotation.z = Math.PI / 2;
          wheel.position.set(wx, 0.3, bz + wz);
          tram.add(wheel);
        }
      }
    }

    // 2. Lower Heritage Forest-Green Fluted Body + Tapered Front/Rear Cab Aprons
    const lowerBody = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(width, 1.15, length - 1.8)),
      materials.tramGreen
    );
    lowerBody.position.y = 1.18;
    lowerBody.castShadow = true;
    lowerBody.receiveShadow = true;
    tram.add(lowerBody);

    // Tapered front & rear driver cabs
    for (const endSign of [-1, 1]) {
      const cab = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(width * 0.48, width * 0.5, 2.32, 8)),
        materials.tramGreen
      );
      cab.scale.set(1, 1, 0.82);
      cab.position.set(0, 1.76, endSign * (length * 0.5 - 0.92));
      cab.castShadow = true;
      tram.add(cab);

      // Cream upper cab windscreen wrap
      const cabUpper = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(width * 0.485, width * 0.485, 1.02, 8)),
        materials.tramCream
      );
      cabUpper.scale.set(1, 1, 0.82);
      cabUpper.position.set(0, 2.32, endSign * (length * 0.5 - 0.92));
      tram.add(cabUpper);

      // Front/Rear Windscreen glass
      const windscreen = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(width * 0.72, 0.78, 0.15)),
        materials.windowWarmLit
      );
      windscreen.position.set(0, 2.32, endSign * (length * 0.5 - 0.08));
      tram.add(windscreen);

      // Brass central headlight + bumper fender
      const headlightCase = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.16, 12)),
        materials.brassGold
      );
      headlightCase.rotation.x = Math.PI / 2;
      headlightCase.position.set(0, 1.25, endSign * (length * 0.5 + 0.02));
      tram.add(headlightCase);

      const headlightBulb = new THREE.Mesh(
        this.trackGeo(new THREE.CircleGeometry(0.14, 10)),
        endSign > 0 ? materials.lampGlowWarm : materials.trafficRed
      );
      headlightBulb.position.set(0, 1.25, endSign * (length * 0.5 + 0.11));
      if (endSign < 0) headlightBulb.rotation.y = Math.PI;
      tram.add(headlightBulb);

      // Illuminated Destination Rollsign Box on Cab Roof Brow ("96 PARKVILLE / ST KILDA")
      const destBox = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.35, 0.34, 0.28)),
        materials.charcoalIron
      );
      destBox.position.set(0, 3.04, endSign * (length * 0.5 - 0.58));
      tram.add(destBox);

      const destScreen = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(1.2, 0.24)),
        materials.neonAmber
      );
      destScreen.position.set(0, 3.04, endSign * (length * 0.5 - 0.42));
      if (endSign < 0) destScreen.rotation.y = Math.PI;
      tram.add(destScreen);
    }

    // 3. Gold Heritage Pinstripe Belt + Warm Cream Upper Window Band
    const goldBelt = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(width + 0.04, 0.1, length - 1.7)),
      materials.brassGold
    );
    goldBelt.position.y = 1.78;
    tram.add(goldBelt);

    const upperCream = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(width - 0.02, 1.12, length - 1.8)),
      materials.tramCream
    );
    upperCream.position.y = 2.36;
    upperCream.castShadow = true;
    tram.add(upperCream);

    // 4. Warm Lit Passenger Windows & Central Drop-Centre Folding Timber Doors
    for (const sx of [-1, 1]) {
      // Central recessed drop-centre doorway
      const doorWay = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.08, 2.05, 1.85)),
        materials.darkTimber
      );
      doorWay.position.set(sx * (width * 0.5 - 0.01), 1.68, 0);
      tram.add(doorWay);

      // 6 Illuminated Passenger Windows per side
      const winZs = [-3.8, -2.6, -1.5, 1.5, 2.6, 3.8];
      for (const wz of winZs) {
        const wPane = new THREE.Mesh(
          this.trackGeo(new THREE.PlaneGeometry(0.92, 0.82)),
          materials.windowWarmLit
        );
        wPane.position.set(sx * (width * 0.5 + 0.01), 2.34, wz);
        wPane.rotation.y = sx > 0 ? Math.PI / 2 : -Math.PI / 2;
        tram.add(wPane);
      }
    }

    // 5. Arching Canvas-Tan Roof + Clerestory Monitor + Diamond Pantograph reaching Overhead Wire!
    const roof = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(width - 0.08, 0.24, length - 0.9)),
      materials.tramRoofTan
    );
    roof.position.y = 3.02;
    roof.castShadow = true;
    tram.add(roof);

    const clerestory = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(width * 0.56, 0.28, length - 3.2)),
      materials.tramGreen
    );
    clerestory.position.y = 3.24;
    clerestory.castShadow = true;
    tram.add(clerestory);

    // Diamond Pantograph Collector reaching up to Y = 5.37 overhead wire
    const pantoGroup = new THREE.Group();
    pantoGroup.position.set(0, 3.38, 0.4);
    for (const sideZ of [-1, 1]) {
      const lowerArm = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.03, 0.03, 1.15, 6)),
        materials.charcoalIron
      );
      lowerArm.position.set(0, 0.48, sideZ * 0.35);
      lowerArm.rotation.x = sideZ * 0.52;
      pantoGroup.add(lowerArm);

      const upperArm = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.025, 0.025, 1.15, 6)),
        materials.charcoalIron
      );
      upperArm.position.set(0, 1.42, sideZ * 0.35);
      upperArm.rotation.x = -sideZ * 0.52;
      pantoGroup.add(upperArm);
    }
    const collectorShoe = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.25, 0.05, 0.14)),
      materials.brassGold
    );
    collectorShoe.position.y = 1.92;
    pantoGroup.add(collectorShoe);
    tram.add(pantoGroup);

    return tram;
  }

  private spawnTrams(materials: WorldMaterialLibrary): void {
    const loopLen = this.mainLoopCurve.getLength();
    const specs = [
      {
        id: 'tram-96',
        routeCode: '96',
        destination: 'East Brunswick · St Kilda Beach',
        initialProgress: 0.06,
        maxSpeed: 8.6,
      },
      {
        id: 'tram-1',
        routeCode: '1',
        destination: 'Parkville University · South Melbourne',
        initialProgress: 0.41,
        maxSpeed: 8.2,
      },
      {
        id: 'tram-35',
        routeCode: '35',
        destination: 'City Circle Heritage Tram',
        initialProgress: 0.74,
        maxSpeed: 7.6,
      },
    ];

    for (const s of specs) {
      const mesh = this.createMelbourneTramModel(materials);
      this.group.add(mesh);
      const tram: ActiveTram = {
        id: s.id,
        routeCode: s.routeCode,
        destination: s.destination,
        mesh,
        curve: this.mainLoopCurve,
        curveLength: loopLen,
        progress: s.initialProgress,
        speedMetersPerSec: s.maxSpeed,
        maxSpeed: s.maxSpeed,
        waitTimer: 0,
        lastStopId: null,
        nearStopName: null,
      };
      this.positionTramOnCurve(tram);
      this.trams.push(tram);
    }
  }

  private positionTramOnCurve(tram: ActiveTram): void {
    const t = ((tram.progress % 1) + 1) % 1;
    const pos = tram.curve.getPointAt(t);
    const aheadT = (t + 0.006) % 1;
    const behindT = (t - 0.006 + 1) % 1;
    const pAhead = tram.curve.getPointAt(aheadT);
    const pBehind = tram.curve.getPointAt(behindT);

    tram.mesh.position.set(pos.x, pos.y, pos.z);
    tram.mesh.rotation.y = Math.atan2(pAhead.x - pBehind.x, pAhead.z - pBehind.z);
  }

  public update(delta: number): void {
    const dt = Math.min(delta, 0.08);

    for (let i = 0; i < this.trams.length; i++) {
      const tram = this.trams[i];

      // 1. Check stop boarding dwell state
      if (tram.waitTimer > 0) {
        tram.waitTimer -= dt;
        tram.speedMetersPerSec = THREE.MathUtils.damp(
          tram.speedMetersPerSec,
          0,
          10,
          dt
        );
        if (tram.waitTimer <= 0) {
          tram.waitTimer = 0;
          tram.nearStopName = null;
        }
      } else {
        let targetSpeed = tram.maxSpeed;

        // 2. Maintain safe separation from tram ahead on loop
        for (let j = 0; j < this.trams.length; j++) {
          if (i === j) continue;
          const other = this.trams[j];
          let diff = other.progress - tram.progress;
          if (diff < 0) diff += 1;
          const distAheadMeters = diff * tram.curveLength;
          if (distAheadMeters < 26) {
            targetSpeed = 0;
          } else if (distAheadMeters < 42) {
            targetSpeed = Math.min(targetSpeed, tram.maxSpeed * 0.45);
          }
        }

        // 3. Smooth deceleration approaching a Melbourne Tram Stop
        for (const stop of this.stops) {
          let stopDiff = stop.routeProgress - tram.progress;
          if (stopDiff < -0.5) stopDiff += 1;
          if (stopDiff > 0.5) stopDiff -= 1;
          const distToStop = stopDiff * tram.curveLength;

          if (Math.abs(distToStop) > 16 && tram.lastStopId === stop.id) {
            tram.lastStopId = null;
          }

          if (
            tram.lastStopId !== stop.id &&
            distToStop > -1.2 &&
            distToStop < 14
          ) {
            if (distToStop < 1.2) {
              // Arrive & open doors!
              tram.waitTimer = stop.dwellSeconds;
              tram.lastStopId = stop.id;
              tram.nearStopName = stop.name;
              targetSpeed = 0;
              break;
            } else {
              targetSpeed = Math.min(
                targetSpeed,
                Math.max(1.8, (distToStop / 14) * tram.maxSpeed)
              );
            }
          }
        }

        tram.speedMetersPerSec = THREE.MathUtils.damp(
          tram.speedMetersPerSec,
          targetSpeed,
          3.8,
          dt
        );
      }

      tram.progress =
        (tram.progress + (tram.speedMetersPerSec * dt) / tram.curveLength) % 1;
      this.positionTramOnCurve(tram);
    }
  }

  public getSnapshots(): TramStatusSnapshot[] {
    return this.trams.map((t) => ({
      id: t.id,
      routeCode: t.routeCode,
      destination: t.destination,
      state: t.waitTimer > 0.1 ? 'boarding' : 'moving',
      nearStopName: t.nearStopName,
    }));
  }

  public dispose(): void {
    for (const g of this.geometries) g.dispose();
    this.geometries = [];
  }
}
