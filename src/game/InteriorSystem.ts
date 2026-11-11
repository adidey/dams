import * as THREE from 'three';
import { WorldMaterialLibrary } from '../world/Materials';
import { ObstacleBox2D } from '../world/types';
import { ActiveInteriorId, InteriorInteractablePrompt } from './types';

export interface InteriorDefinition {
  id: Exclude<ActiveInteriorId, null>;
  center: THREE.Vector3;
  spawnAdi: [number, number, number];
  spawnDamini: [number, number, number];
  spawnSunny: [number, number, number];
  exitExteriorPos: [number, number, number];
  bounds: { minX: number; maxX: number; minZ: number; maxZ: number };
  obstacles: ObstacleBox2D[];
  interactables: Array<{
    id: string;
    label: string;
    subtitle: string;
    actionType: InteriorInteractablePrompt['actionType'];
    position: THREE.Vector3;
    radius: number;
  }>;
}

const _projVec = new THREE.Vector3();

/**
 * Handcrafted 2.5D isometric cutaway interiors for:
 * 1. Wax & Groove Vinyl Cafe (vinyl shelves, spinning turntable, espresso counter, cafe tables, warm posters, plants)
 * 2. Starlight Coin-Op Arcade (3 distinct retro arcade cabinets, neon signs, festoon lighting, prize counter, props)
 */
export class InteriorSystem {
  public group = new THREE.Group();
  private geometries: THREE.BufferGeometry[] = [];
  private materials: THREE.Material[] = [];
  private textures: THREE.Texture[] = [];

  public interiors: Record<Exclude<ActiveInteriorId, null>, InteriorDefinition>;
  private vinylPlatterMesh!: THREE.Mesh;
  private clawHeadGroup!: THREE.Group;

  constructor(
    worldMaterials: WorldMaterialLibrary,
    renderer: THREE.WebGLRenderer
  ) {
    this.group.name = 'CutawayInteriors';
    const aniso = renderer.capabilities.getMaxAnisotropy();

    const cafeDef = this.buildVinylCafeInterior(worldMaterials, aniso);
    const arcadeDef = this.buildArcadeInterior(worldMaterials, aniso);

    this.interiors = {
      'vinyl-cafe': cafeDef,
      arcade: arcadeDef,
    };
  }

  private trackGeo<T extends THREE.BufferGeometry>(g: T): T {
    this.geometries.push(g);
    return g;
  }

  private trackMat<T extends THREE.Material>(m: T): T {
    this.materials.push(m);
    return m;
  }

  private makePosterMat(
    topText: string,
    subText: string,
    bgHex: string,
    accentHex: string,
    aniso: number
  ): THREE.MeshStandardMaterial {
    const c = document.createElement('canvas');
    c.width = 256;
    c.height = 320;
    const ctx = c.getContext('2d')!;
    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 256, 320);

    // Stylized vinyl disc artwork
    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(128, 132, 68, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#1b1618';
    ctx.beginPath();
    ctx.arc(128, 132, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = accentHex;
    ctx.beginPath();
    ctx.arc(128, 132, 14, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#fff5e6';
    ctx.textAlign = 'center';
    ctx.font = '700 22px Georgia, serif';
    ctx.fillText(topText, 128, 246);
    ctx.fillStyle = accentHex;
    ctx.font = '600 15px sans-serif';
    ctx.fillText(subText, 128, 276);

    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = aniso;
    this.textures.push(tex);

    return this.trackMat(
      new THREE.MeshStandardMaterial({
        map: tex,
        emissive: new THREE.Color(0xffdfa8),
        emissiveMap: tex,
        emissiveIntensity: 0.28,
        roughness: 0.5,
      })
    );
  }

  private buildVinylCafeInterior(
    wm: WorldMaterialLibrary,
    aniso: number
  ): InteriorDefinition {
    const cx = 0;
    const cz = -330;
    const room = new THREE.Group();
    room.position.set(cx, 0, cz);
    const obstacles: ObstacleBox2D[] = [];

    const addObs = (lx: number, lz: number, w: number, d: number) => {
      obstacles.push({
        minX: cx + lx - w * 0.5,
        maxX: cx + lx + w * 0.5,
        minZ: cz + lz - d * 0.5,
        maxZ: cz + lz + d * 0.5,
        tag: 'prop',
      });
    };

    // Dark surround plinth so cutaway floats cleanly like a handcrafted isometric diorama
    const backdrop = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(90, 0.2, 90)),
      this.trackMat(
        new THREE.MeshStandardMaterial({ color: 0x171412, roughness: 0.98 })
      )
    );
    backdrop.position.y = -0.25;
    room.add(backdrop);

    // Warm timber herringbone cafe floor (16m × 12.5m)
    const floor = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(16.4, 0.3, 12.8)),
      wm.herringboneBrick
    );
    floor.position.y = -0.14;
    floor.receiveShadow = true;
    room.add(floor);

    // Cutaway North & West brick-and-timber walls (leaving South & East open to isometric camera!)
    const backWall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(16.4, 4.6, 0.45)),
      wm.brickRed
    );
    backWall.position.set(0, 2.3, -6.2);
    backWall.castShadow = true;
    backWall.receiveShadow = true;
    room.add(backWall);

    const sideWall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.45, 4.6, 12.8)),
      wm.stuccoSage
    );
    sideWall.position.set(-8.0, 2.3, 0);
    sideWall.castShadow = true;
    sideWall.receiveShadow = true;
    room.add(sideWall);

    // 1. Wall-to-wall Vinyl Record Shelves along Back Wall (-5.6 .. +1.2)
    for (let sx = -5.8; sx <= 0.6; sx += 2.1) {
      const shelf = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.92, 2.85, 0.62)),
        wm.darkTimber
      );
      shelf.position.set(sx, 1.42, -5.62);
      shelf.castShadow = true;
      room.add(shelf);

      // Colourful rows of vinyl record sleeves inside cubbies
      const sleeveColors = [0xd97a96, 0xe8b264, 0x5c9c92, 0xc75d4c, 0xf2e4ce];
      for (let row = 0; row < 3; row++) {
        for (let k = 0; k < 5; k++) {
          const sleeve = new THREE.Mesh(
            this.trackGeo(new THREE.BoxGeometry(0.28, 0.62, 0.48)),
            this.trackMat(
              new THREE.MeshStandardMaterial({
                color: sleeveColors[(row * 5 + k) % sleeveColors.length],
                roughness: 0.6,
              })
            )
          );
          sleeve.position.set(sx - 0.64 + k * 0.32, 0.58 + row * 0.84, -5.56);
          room.add(sleeve);
        }
      }
    }
    addObs(-2.6, -5.5, 8.6, 1.1);

    // 2. Hero Listening Booth & Spinning Vinyl Turntable Console (Back-Right X = 4.5, Z = -4.8)
    const boothConsole = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(3.2, 1.02, 1.15)),
      wm.warmTimber
    );
    boothConsole.position.set(4.5, 0.51, -4.85);
    boothConsole.castShadow = true;
    room.add(boothConsole);
    addObs(4.5, -4.85, 3.3, 1.25);

    const turntableBase = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.95, 0.12, 0.78)),
      wm.charcoalIron
    );
    turntableBase.position.set(4.5, 1.08, -4.8);
    room.add(turntableBase);

    this.vinylPlatterMesh = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.32, 0.32, 0.04, 20)),
      this.trackMat(
        new THREE.MeshStandardMaterial({
          color: 0x18161a,
          roughness: 0.25,
          metalness: 0.4,
        })
      )
    );
    this.vinylPlatterMesh.position.set(4.42, 1.16, -4.8);
    const labelCenter = new THREE.Mesh(
      this.trackGeo(new THREE.CylinderGeometry(0.11, 0.11, 0.05, 14)),
      wm.neonCoral
    );
    this.vinylPlatterMesh.add(labelCenter);
    room.add(this.vinylPlatterMesh);

    // Tribute Wall Posters above the Turntable (Mariah the Scientist & Ariana Grande nods!)
    const posterMariah = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(1.35, 1.7)),
      this.makePosterMat('MARIAH VIBES', 'VELVET R&B · LP', '#3b1c2a', '#e69aa8', aniso)
    );
    posterMariah.position.set(3.55, 2.75, -5.92);
    room.add(posterMariah);

    const posterAriana = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(1.35, 1.7)),
      this.makePosterMat('SWEETENER SKIES', 'ARIANA POP · LP', '#4a2a3e', '#f5c2d1', aniso)
    );
    posterAriana.position.set(5.35, 2.75, -5.92);
    room.add(posterAriana);

    // 3. Espresso Counter along West Wall (X = -5.9, Z = -1.2)
    const counter = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.4, 1.08, 4.8)),
      wm.warmTimber
    );
    counter.position.set(-5.9, 0.54, -1.2);
    counter.castShadow = true;
    room.add(counter);
    addObs(-5.9, -1.2, 1.5, 4.9);

    const espressoMachine = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.68, 0.56, 0.92)),
      wm.brassGold
    );
    espressoMachine.position.set(-5.9, 1.36, -1.8);
    espressoMachine.castShadow = true;
    room.add(espressoMachine);

    // 4. Intimate Cafe Bistro Tables & Chairs
    for (const [tx, tz] of [
      [-1.8, -0.8],
      [2.2, 0.2],
    ] as const) {
      const top = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.68, 0.68, 0.07, 16)),
        wm.heritageTrimCream
      );
      top.position.set(tx, 0.78, tz);
      top.castShadow = true;
      room.add(top);

      const leg = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.08, 0.24, 0.76, 8)),
        wm.charcoalIron
      );
      leg.position.set(tx, 0.38, tz);
      room.add(leg);

      const lamp = new THREE.Mesh(
        this.trackGeo(new THREE.ConeGeometry(0.16, 0.22, 10)),
        wm.lampGlowWarm
      );
      lamp.position.set(tx, 0.94, tz);
      room.add(lamp);

      for (const cxOff of [-0.88, 0.88]) {
        const seat = new THREE.Mesh(
          this.trackGeo(new THREE.BoxGeometry(0.46, 0.46, 0.46)),
          wm.darkTimber
        );
        seat.position.set(tx + cxOff, 0.23, tz);
        seat.castShadow = true;
        room.add(seat);
      }
      addObs(tx, tz, 1.9, 1.35);
    }

    // 5. Lush Potted Plants & Warm Welcome Mat at South Doorway (X = 0, Z = 5.1)
    for (const [px, pz] of [
      [-7.1, 4.8],
      [6.9, -5.1],
      [6.9, 4.6],
    ] as const) {
      const pot = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.38, 0.28, 0.56, 10)),
        wm.stuccoTerracotta
      );
      pot.position.set(px, 0.28, pz);
      room.add(pot);

      const leaves = new THREE.Mesh(
        this.trackGeo(new THREE.DodecahedronGeometry(0.62, 1)),
        wm.awningStripedGreen
      );
      leaves.position.set(px, 0.95, pz);
      leaves.castShadow = true;
      room.add(leaves);
      addObs(px, pz, 0.9, 0.9);
    }

    const doorMat = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.4, 0.04, 1.2)),
      wm.awningBurgundy
    );
    doorMat.position.set(0, 0.03, 5.2);
    room.add(doorMat);

    this.group.add(room);

    return {
      id: 'vinyl-cafe',
      center: new THREE.Vector3(cx, 0, cz),
      spawnAdi: [cx + 0.0, 0, cz + 3.8],
      spawnDamini: [cx - 1.5, 0, cz + 3.9],
      spawnSunny: [cx + 1.5, 0, cz + 4.1],
      exitExteriorPos: [95.2, 0, -20.5],
      bounds: {
        minX: cx - 7.3,
        maxX: cx + 7.4,
        minZ: cz - 5.4,
        maxZ: cz + 5.7,
      },
      obstacles,
      interactables: [
        {
          id: 'cafe-turntable',
          label: 'Spin Vinyl Record',
          subtitle: 'Mariah the Scientist & Ariana Grande Tributes',
          actionType: 'turntable',
          position: new THREE.Vector3(cx + 4.5, 1.3, cz - 3.6),
          radius: 2.8,
        },
        {
          id: 'cafe-exit',
          label: 'Step Back onto Arcade Alley',
          subtitle: 'Return to Melbourne CBD',
          actionType: 'exit-interior',
          position: new THREE.Vector3(cx + 0, 1.0, cz + 5.2),
          radius: 2.3,
        },
      ],
    };
  }

  private buildArcadeInterior(
    wm: WorldMaterialLibrary,
    aniso: number
  ): InteriorDefinition {
    const cx = 90;
    const cz = -330;
    const room = new THREE.Group();
    room.position.set(cx, 0, cz);
    const obstacles: ObstacleBox2D[] = [];

    const addObs = (lx: number, lz: number, w: number, d: number) => {
      obstacles.push({
        minX: cx + lx - w * 0.5,
        maxX: cx + lx + w * 0.5,
        minZ: cz + lz - d * 0.5,
        maxZ: cz + lz + d * 0.5,
        tag: 'prop',
      });
    };

    const backdrop = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(90, 0.2, 90)),
      this.trackMat(
        new THREE.MeshStandardMaterial({ color: 0x141318, roughness: 0.98 })
      )
    );
    backdrop.position.y = -0.25;
    room.add(backdrop);

    // Retro dark slate-indigo floor + warm timber border (18m × 13.5m)
    const floor = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(18.2, 0.3, 13.6)),
      this.trackMat(
        new THREE.MeshStandardMaterial({ color: 0x262338, roughness: 0.84 })
      )
    );
    floor.position.y = -0.14;
    floor.receiveShadow = true;
    room.add(floor);

    const backWall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(18.2, 4.8, 0.45)),
      wm.brickBrown
    );
    backWall.position.set(0, 2.4, -6.6);
    backWall.castShadow = true;
    room.add(backWall);

    const sideWall = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(0.45, 4.8, 13.6)),
      wm.brickBrown
    );
    sideWall.position.set(-8.9, 2.4, 0);
    sideWall.castShadow = true;
    room.add(sideWall);

    // Glowing Neon Marquee Sign on Back Wall
    const neonBanner = new THREE.Mesh(
      this.trackGeo(new THREE.PlaneGeometry(5.6, 1.35)),
      this.makePosterMat(
        'STARLIGHT ARCADE',
        'WIN PRIZES TOGETHER',
        '#1f1830',
        '#ff9e7d',
        aniso
      )
    );
    neonBanner.position.set(0, 3.45, -6.32);
    room.add(neonBanner);

    // Helper to build multi-part 3D retro arcade cabinets
    const buildCabinet = (
      lx: number,
      lz: number,
      bodyColor: number,
      screenMat: THREE.Material
    ) => {
      const cab = new THREE.Group();
      cab.position.set(lx, 0, lz);

      const base = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.55, 2.35, 1.25)),
        this.trackMat(
          new THREE.MeshStandardMaterial({ color: bodyColor, roughness: 0.45 })
        )
      );
      base.position.y = 1.18;
      base.castShadow = true;
      cab.add(base);

      const marquee = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.58, 0.38, 1.32)),
        wm.neonAmber
      );
      marquee.position.set(0, 2.48, 0.04);
      cab.add(marquee);

      const screen = new THREE.Mesh(
        this.trackGeo(new THREE.PlaneGeometry(1.22, 0.92)),
        screenMat
      );
      screen.position.set(0, 1.62, 0.64);
      screen.rotation.x = -0.14;
      cab.add(screen);

      const deck = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.52, 0.18, 0.55)),
        wm.charcoalIron
      );
      deck.position.set(0, 1.02, 0.58);
      cab.add(deck);

      room.add(cab);
      addObs(lx, lz, 1.75, 1.45);
    };

    // Cabinet A: Memory Match (-4.4, -4.6)
    buildCabinet(-4.4, -4.6, 0x2b6e68, wm.neonTeal);

    // Cabinet B: Damini's Cricket Challenge (0.0, -4.6)
    buildCabinet(0.0, -4.6, 0x2d5e3e, wm.neonAmber);

    // Cabinet C: Glass Starlight Claw Machine (4.4, -4.6)
    {
      const claw = new THREE.Group();
      claw.position.set(4.4, 0, -4.6);

      const lower = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.85, 1.05, 1.5)),
        wm.stuccoTerracotta
      );
      lower.position.y = 0.52;
      lower.castShadow = true;
      claw.add(lower);

      const glassBox = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.78, 1.45, 1.42)),
        wm.architecturalGlass
      );
      glassBox.position.y = 1.76;
      claw.add(glassBox);

      const cap = new THREE.Mesh(
        this.trackGeo(new THREE.BoxGeometry(1.9, 0.34, 1.55)),
        wm.neonCoral
      );
      cap.position.y = 2.65;
      claw.add(cap);

      // Cute plush capsules inside glass case
      const plushCols = [0xf5c26b, 0xeb849b, 0x7cd4c2, 0xf2e4c9];
      for (let i = 0; i < 6; i++) {
        const plush = new THREE.Mesh(
          this.trackGeo(new THREE.SphereGeometry(0.18, 10, 8)),
          this.trackMat(
            new THREE.MeshStandardMaterial({
              color: plushCols[i % plushCols.length],
              roughness: 0.7,
            })
          )
        );
        plush.position.set(-0.5 + (i % 3) * 0.5, 1.18, -0.25 + Math.floor(i / 3) * 0.45);
        claw.add(plush);
      }

      // Animated crane gantry claw
      this.clawHeadGroup = new THREE.Group();
      this.clawHeadGroup.position.set(0, 2.25, 0);
      const cable = new THREE.Mesh(
        this.trackGeo(new THREE.CylinderGeometry(0.02, 0.02, 0.45, 6)),
        wm.brassGold
      );
      cable.position.y = -0.2;
      this.clawHeadGroup.add(cable);
      claw.add(this.clawHeadGroup);

      room.add(claw);
      addObs(4.4, -4.6, 2.0, 1.65);
    }

    // Prize Counter along West Wall (-6.9, -0.4)
    const prizeCounter = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(1.5, 1.05, 5.2)),
      wm.warmTimber
    );
    prizeCounter.position.set(-6.9, 0.52, -0.4);
    prizeCounter.castShadow = true;
    room.add(prizeCounter);
    addObs(-6.9, -0.4, 1.65, 5.35);

    const doorMat = new THREE.Mesh(
      this.trackGeo(new THREE.BoxGeometry(2.6, 0.04, 1.25)),
      wm.awningStripedGreen
    );
    doorMat.position.set(0, 0.03, 5.6);
    room.add(doorMat);

    this.group.add(room);

    return {
      id: 'arcade',
      center: new THREE.Vector3(cx, 0, cz),
      spawnAdi: [cx + 0.0, 0, cz + 4.0],
      spawnDamini: [cx - 1.6, 0, cz + 4.1],
      spawnSunny: [cx + 1.6, 0, cz + 4.3],
      exitExteriorPos: [89.0, 0, -16.5],
      bounds: {
        minX: cx - 8.1,
        maxX: cx + 8.2,
        minZ: cz - 5.7,
        maxZ: cz + 6.1,
      },
      obstacles,
      interactables: [
        {
          id: 'cab-tetris',
          label: 'Play Starlight Tetris',
          subtitle: 'Retro 8-Bit Brick Puzzle',
          actionType: 'minigame-tetris',
          position: new THREE.Vector3(cx - 3.0, 1.4, cz - 3.3),
          radius: 2.6,
        },
        {
          id: 'cab-cricket',
          label: 'Play Cricket Challenge',
          subtitle: 'Minigame · Inspired by Damini’s Batting',
          actionType: 'minigame-cricket',
          position: new THREE.Vector3(cx + 3.0, 1.4, cz - 3.3),
          radius: 2.6,
        },
        {
          id: 'arcade-exit',
          label: 'Step Back onto Arcade Alley',
          subtitle: 'Return to Melbourne CBD',
          actionType: 'exit-interior',
          position: new THREE.Vector3(cx + 0.0, 1.0, cz + 5.6),
          radius: 2.4,
        },
      ],
    };
  }

  public update(elapsed: number): void {
    if (this.vinylPlatterMesh) {
      this.vinylPlatterMesh.rotation.y = elapsed * 1.9;
    }
    if (this.clawHeadGroup) {
      this.clawHeadGroup.position.x = Math.sin(elapsed * 1.2) * 0.45;
    }
  }

  public projectPrompts(
    activeId: ActiveInteriorId,
    adiPos: THREE.Vector3,
    camera: THREE.Camera,
    viewportW: number,
    viewportH: number
  ): InteriorInteractablePrompt[] {
    if (!activeId) return [];
    const def = this.interiors[activeId];
    return def.interactables.map((item) => {
      _projVec.copy(item.position);
      _projVec.project(camera);
      const sx = (_projVec.x * 0.5 + 0.5) * viewportW;
      const sy = (-_projVec.y * 0.5 + 0.5) * viewportH;
      const dist = Math.hypot(adiPos.x - item.position.x, adiPos.z - item.position.z);
      return {
        id: item.id,
        label: item.label,
        subtitle: item.subtitle,
        actionType: item.actionType,
        x: sx,
        y: sy,
        visible: _projVec.z >= -1 && _projVec.z <= 1,
        inRange: dist <= item.radius,
      };
    });
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
