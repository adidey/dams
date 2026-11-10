import * as THREE from 'three';
import { WorldMaterialLibrary } from './Materials';
import { TramSystem } from './TramSystem';
import { ObstacleBox2D } from './types';

type VehicleArchetype = 'sedan' | 'hatchback' | 'van';

interface MovingCar {
  mesh: THREE.Group;
  curve: THREE.CatmullRomCurve3;
  curveLength: number;
  progress: number;
  speed: number;
  maxSpeed: number;
}

/**
 * Melbourne Traffic & Parked Vehicle System (Australian Left-Hand Traffic!).
 * Features multi-part procedural Sedans, Hatchbacks, and Delivery Vans with
 * clearcoat paintwork, cabin glass, wheels, headlights, brake lights, and contact shadows.
 */
export class TrafficSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private movingCars: MovingCar[] = [];

  constructor(
    worldMats: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[],
    isSoftwareGl: boolean
  ) {
    this.group.name = 'TrafficSystem';
    this.placeParkedVehicles(worldMats, obstacles, isSoftwareGl);
    this.spawnMovingTraffic(worldMats, isSoftwareGl);
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private createPaintMaterial(
    hex: number,
    isSoftwareGl: boolean
  ): THREE.MeshPhysicalMaterial {
    return this.trackMat(
      new THREE.MeshPhysicalMaterial({
        color: hex,
        roughness: 0.34,
        metalness: 0.38,
        clearcoat: isSoftwareGl ? 0 : 0.8,
        clearcoatRoughness: 0.16,
      })
    );
  }

  public createVehicleModel(
    type: VehicleArchetype,
    colorHex: number,
    worldMats: WorldMaterialLibrary,
    isSoftwareGl: boolean
  ): THREE.Group {
    const car = new THREE.Group();
    const paint = this.createPaintMaterial(colorHex, isSoftwareGl);

    const isVan = type === 'van';
    const isHatch = type === 'hatchback';
    const w = isVan ? 1.96 : 1.82;
    const len = isVan ? 4.85 : isHatch ? 3.85 : 4.45;
    const bodyH = isVan ? 0.85 : 0.66;

    // 1. Soft radial contact shadow flush on asphalt
    const shadow = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(w + 0.65, len + 0.7)),
      worldMats.contactShadow
    );
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;
    car.add(shadow);

    // 2. Lower sculpted body hull
    const hull = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(w, bodyH, len)),
      paint
    );
    hull.position.y = 0.32 + bodyH * 0.5;
    hull.castShadow = true;
    hull.receiveShadow = true;
    car.add(hull);

    // Front & Rear Bumpers
    for (const sz of [-1, 1]) {
      const bumper = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(w + 0.05, 0.22, 0.18)),
        worldMats.charcoalIron
      );
      bumper.position.set(0, 0.36, sz * (len * 0.5 + 0.03));
      car.add(bumper);
    }

    // 3. Upper Cabin / Cargo Box
    if (isVan) {
      const cargo = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(w - 0.06, 1.15, len * 0.76)),
        paint
      );
      cargo.position.set(0, 0.32 + bodyH + 0.56, -len * 0.08);
      cargo.castShadow = true;
      car.add(cargo);

      const cabWind = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(w - 0.14, 0.68, 1.05)),
        worldMats.architecturalGlass
      );
      cabWind.position.set(0, 1.46, len * 0.26);
      car.add(cabWind);
    } else {
      const cabinLen = isHatch ? len * 0.62 : len * 0.54;
      const cabinOffset = isHatch ? -len * 0.08 : -len * 0.04;
      const cabin = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(w - 0.22, 0.58, cabinLen)),
        paint
      );
      cabin.position.set(0, 0.32 + bodyH + 0.28, cabinOffset);
      cabin.castShadow = true;
      car.add(cabin);

      const glassWrap = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(w - 0.18, 0.44, cabinLen - 0.16)),
        worldMats.architecturalGlass
      );
      glassWrap.position.set(0, 0.32 + bodyH + 0.26, cabinOffset);
      car.add(glassWrap);
    }

    // 4. Four Wheels + Alloy Hubs
    const wheelZ = len * 0.31;
    const wheelGeo = this.trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.22, 12));
    wheelGeo.rotateZ(Math.PI / 2);
    const hubGeo = this.trackGeo(new THREE.CylinderGeometry(0.18, 0.18, 0.24, 8));
    hubGeo.rotateZ(Math.PI / 2);

    for (const wx of [-w * 0.48, w * 0.48]) {
      for (const wz of [-wheelZ, wheelZ]) {
        const tire = new THREE.Mesh(wheelGeo, worldMats.rubberTire);
        tire.position.set(wx, 0.32, wz);
        tire.castShadow = true;
        car.add(tire);

        const hub = new THREE.Mesh(hubGeo, worldMats.steelRail);
        hub.position.set(wx, 0.32, wz);
        car.add(hub);
      }
    }

    // 5. Warm Headlights (+Z front) & Crisp Red Taillights (-Z rear)
    for (const lx of [-w * 0.34, w * 0.34]) {
      const head = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.28, 0.15, 0.06)),
        worldMats.lampGlowWarm
      );
      head.position.set(lx, 0.68, len * 0.5 + 0.03);
      car.add(head);

      const tail = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(0.3, 0.14, 0.06)),
        worldMats.trafficRed
      );
      tail.position.set(lx, 0.7, -len * 0.5 - 0.03);
      car.add(tail);
    }

    return car;
  }

  private placeParkedVehicles(
    worldMats: WorldMaterialLibrary,
    obstacles: ObstacleBox2D[],
    isSoftwareGl: boolean
  ): void {
    // Muted tasteful Melbourne car palette (sage, slate blue, warm cream, charcoal, burgundy, ochre)
    const palette = [
      0x4e6472, 0xdbd3c5, 0x8f4338, 0x3b4046, 0x5d7260, 0xc79248, 0x6f6860,
    ];

    const parkedSpots: Array<{
      x: number;
      z: number;
      rotY: number;
      type: VehicleArchetype;
    }> = [
      // Parkville Faraday St & Grattan St curbside parked cars
      { x: -46.4, z: -92, rotY: 0, type: 'hatchback' },
      { x: -46.4, z: -83, rotY: 0, type: 'sedan' },
      { x: -41.6, z: -55, rotY: Math.PI, type: 'sedan' },
      { x: -78, z: -71.2, rotY: Math.PI / 2, type: 'hatchback' },
      { x: -64, z: -71.2, rotY: Math.PI / 2, type: 'van' },
      { x: -24, z: -64.8, rotY: -Math.PI / 2, type: 'sedan' },

      // CBD Bourke St, Flinders St & Russell St curbside bays + delivery vans near laneways
      { x: -68, z: -41.4, rotY: Math.PI / 2, type: 'sedan' },
      { x: -56, z: -41.4, rotY: Math.PI / 2, type: 'van' }, // Delivery van near CBD West laneway
      { x: 36, z: -34.6, rotY: -Math.PI / 2, type: 'hatchback' },
      { x: 74, z: -34.6, rotY: -Math.PI / 2, type: 'sedan' },
      { x: 54.8, z: -22, rotY: 0, type: 'van' }, // Delivery van outside Arcade Quarter
      { x: 61.2, z: -48, rotY: Math.PI, type: 'hatchback' },
      { x: -76, z: 2.4, rotY: Math.PI / 2, type: 'sedan' },
      { x: 82, z: 9.6, rotY: -Math.PI / 2, type: 'sedan' },

      // Southbank Boulevard curbside parked cars
      { x: -82, z: 54.6, rotY: Math.PI / 2, type: 'sedan' },
      { x: -58, z: 61.4, rotY: -Math.PI / 2, type: 'hatchback' },
      { x: -26, z: 61.4, rotY: -Math.PI / 2, type: 'sedan' },
    ];

    parkedSpots.forEach((spot, idx) => {
      const car = this.createVehicleModel(
        spot.type,
        palette[idx % palette.length],
        worldMats,
        isSoftwareGl
      );
      car.position.set(spot.x, 0.06, spot.z);
      car.rotation.y = spot.rotY;
      this.group.add(car);

      obstacles.push({
        minX: spot.x - 2.3,
        maxX: spot.x + 2.3,
        minZ: spot.z - 2.3,
        maxZ: spot.z + 2.3,
        tag: 'prop',
      });
    });
  }

  private spawnMovingTraffic(
    worldMats: WorldMaterialLibrary,
    isSoftwareGl: boolean
  ): void {
    // Australian Left-Hand Drive closed continuous road circuits!
    // Circuit 1: Inner-City Loop (Bourke St Z=-38 Eastbound at Z=-39.8 -> Russell St X=58 Southbound at X=59.8 -> Flinders St Z=6 Westbound at Z=7.8 -> Faraday/West return)
    const cbdCircuit = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(-42.2, 0.06, -39.8),
        new THREE.Vector3(0, 0.06, -39.8),
        new THREE.Vector3(56.5, 0.06, -39.8),
        new THREE.Vector3(59.8, 0.06, -36.5),
        new THREE.Vector3(59.8, 0.06, 4.2),
        new THREE.Vector3(56.5, 0.06, 7.8),
        new THREE.Vector3(0, 0.06, 7.8),
        new THREE.Vector3(-40.5, 0.06, 7.8),
        new THREE.Vector3(-44.0, 0.06, 4.0),
        new THREE.Vector3(-45.8, 0.06, -16),
        new THREE.Vector3(-45.8, 0.06, -36.5),
      ],
      true,
      'catmullrom',
      0.16
    );

    // Circuit 2: Grand Cross-River Loop (Swanston/Princes Bridge outer vehicle lanes X = ±5.65, clear of tram super-stops!)
    const bridgeCircuit = new THREE.CatmullRomCurve3(
      [
        new THREE.Vector3(5.65, 0.06, -64),
        new THREE.Vector3(5.65, 0.06, -38),
        new THREE.Vector3(5.65, 0.06, 6),
        new THREE.Vector3(5.65, 0.08, 28), // Princes Bridge Southbound outer lane
        new THREE.Vector3(5.65, 0.06, 55.5),
        new THREE.Vector3(1.5, 0.06, 59.8),
        new THREE.Vector3(-92, 0.06, 59.8),
        new THREE.Vector3(-96, 0.06, 58.0),
        new THREE.Vector3(-92, 0.06, 56.2),
        new THREE.Vector3(-7.0, 0.06, 56.2),
        new THREE.Vector3(-5.65, 0.06, 52.0),
        new THREE.Vector3(-5.65, 0.08, 28), // Princes Bridge Northbound outer lane
        new THREE.Vector3(-5.65, 0.06, 6),
        new THREE.Vector3(-5.65, 0.06, -38),
        new THREE.Vector3(-5.65, 0.06, -64.5),
        new THREE.Vector3(0, 0.06, -68),
      ],
      true,
      'catmullrom',
      0.15
    );

    const specs: Array<{
      curve: THREE.CatmullRomCurve3;
      t: number;
      type: VehicleArchetype;
      color: number;
      speed: number;
    }> = [
      { curve: cbdCircuit, t: 0.05, type: 'sedan', color: 0xd99b38, speed: 8.4 },
      { curve: cbdCircuit, t: 0.32, type: 'hatchback', color: 0x4b6b7a, speed: 8.2 },
      { curve: cbdCircuit, t: 0.58, type: 'van', color: 0xeae2d3, speed: 7.6 },
      { curve: cbdCircuit, t: 0.83, type: 'sedan', color: 0x9c483b, speed: 8.5 },
      { curve: bridgeCircuit, t: 0.12, type: 'sedan', color: 0x566e5d, speed: 8.8 },
      { curve: bridgeCircuit, t: 0.44, type: 'hatchback', color: 0xc96b4b, speed: 8.5 },
      { curve: bridgeCircuit, t: 0.76, type: 'sedan', color: 0x3f4650, speed: 8.6 },
    ];

    for (const s of specs) {
      const mesh = this.createVehicleModel(s.type, s.color, worldMats, isSoftwareGl);
      this.group.add(mesh);
      const car: MovingCar = {
        mesh,
        curve: s.curve,
        curveLength: s.curve.getLength(),
        progress: s.t,
        speed: s.speed,
        maxSpeed: s.speed,
      };
      this.positionCar(car);
      this.movingCars.push(car);
    }
  }

  private positionCar(car: MovingCar): void {
    const t = ((car.progress % 1) + 1) % 1;
    const p = car.curve.getPointAt(t);
    const pAhead = car.curve.getPointAt((t + 0.008) % 1);
    car.mesh.position.copy(p);
    car.mesh.rotation.y = Math.atan2(pAhead.x - p.x, pAhead.z - p.z);
  }

  public update(delta: number, tramSystem: TramSystem): void {
    const dt = Math.min(delta, 0.08);

    for (let i = 0; i < this.movingCars.length; i++) {
      const car = this.movingCars[i];
      let targetSpeed = car.maxSpeed;

      // 1. Respect spacing with vehicles ahead on same circuit & cross-traffic at junctions
      for (let j = 0; j < this.movingCars.length; j++) {
        if (i === j) continue;
        const other = this.movingCars[j];
        if (other.curve === car.curve) {
          let diff = other.progress - car.progress;
          if (diff < 0) diff += 1;
          const dist = diff * car.curveLength;
          if (dist < 11) targetSpeed = 0;
          else if (dist < 19) targetSpeed = Math.min(targetSpeed, other.speed * 0.75);
        } else {
          // Cross-circuit intersection yield check
          const dSq = car.mesh.position.distanceToSquared(other.mesh.position);
          if (dSq < 64 && i > j) {
            targetSpeed = 0;
          }
        }
      }

      // 2. Yield to Melbourne Trams at intersections!
      for (const tram of tramSystem.trams) {
        const dx = tram.mesh.position.x - car.mesh.position.x;
        const dz = tram.mesh.position.z - car.mesh.position.z;
        const distSq = dx * dx + dz * dz;
        // Only yield when crossing tram tracks perpendicularly (car not in parallel lane)
        if (distSq < 115 && Math.abs(car.mesh.position.x) > 4.2 && Math.abs(car.mesh.position.x) < 13) {
          targetSpeed = 0;
        }
      }

      car.speed = THREE.MathUtils.damp(car.speed, targetSpeed, 5.0, dt);
      car.progress = (car.progress + (car.speed * dt) / car.curveLength) % 1;
      this.positionCar(car);
    }
  }

  public dispose(): void {
    for (const g of this.geometries) g.dispose();
    for (const m of this.materials) m.dispose();
    this.geometries = [];
    this.materials = [];
  }
}
