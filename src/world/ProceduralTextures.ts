import * as THREE from 'three';

/**
 * Handcrafted procedural HTML5 2D Canvas textures & relief normal maps for Melbourne Dreamland.
 * Zero external assets / 404s. Designed with painterly warmth, tactile mortar/cobble relief,
 * authentic Melbourne signage, wrought-iron filigree lacework, and crisp window displays.
 */
export class ProceduralTextureLibrary {
  private textures: THREE.Texture[] = [];
  private maxAnisotropy: number;

  // Albedo / Color Maps
  public brickRed!: THREE.CanvasTexture;
  public brickOchre!: THREE.CanvasTexture;
  public brickBrown!: THREE.CanvasTexture;
  public brickCreamPainted!: THREE.CanvasTexture;
  public sandstone!: THREE.CanvasTexture;
  public bluestoneCobble!: THREE.CanvasTexture;
  public footpathConcrete!: THREE.CanvasTexture;
  public herringboneBrick!: THREE.CanvasTexture;
  public asphalt!: THREE.CanvasTexture;
  public gardenGravel!: THREE.CanvasTexture;
  public grassPainterly!: THREE.CanvasTexture;
  public grassBotanicLush!: THREE.CanvasTexture;
  public heritageRoofSlate!: THREE.CanvasTexture;
  public terracottaTile!: THREE.CanvasTexture;
  public corrugatedIron!: THREE.CanvasTexture;
  public timberDeck!: THREE.CanvasTexture;

  // Windows, Lacework, Signage & Murals
  public windowWarmLit!: THREE.CanvasTexture;
  public windowAmberCurtain!: THREE.CanvasTexture;
  public windowDaylight!: THREE.CanvasTexture;
  public muralLanewayA!: THREE.CanvasTexture;
  public muralLanewayB!: THREE.CanvasTexture;
  public muralLanewayC!: THREE.CanvasTexture;
  public muralArcade!: THREE.CanvasTexture;
  public vinylShopWindow!: THREE.CanvasTexture;
  public arcadeCabinetWindow!: THREE.CanvasTexture;
  public cafeWindowDisplay!: THREE.CanvasTexture;
  public bookshopWindowDisplay!: THREE.CanvasTexture;
  public filigreeLaceAlpha!: THREE.CanvasTexture;
  public shopSignEspresso!: THREE.CanvasTexture;
  public shopSignBookshop!: THREE.CanvasTexture;
  public shopSignBakery!: THREE.CanvasTexture;
  public shopSignRecords!: THREE.CanvasTexture;
  public shopSignBistro!: THREE.CanvasTexture;
  public tramSign96!: THREE.CanvasTexture;
  public tramSign1!: THREE.CanvasTexture;
  public tramSign35!: THREE.CanvasTexture;

  // Data / Relief Normal Maps & Contact Grounding
  public brickNormal!: THREE.CanvasTexture;
  public bluestoneNormal!: THREE.CanvasTexture;
  public sandstoneNormal!: THREE.CanvasTexture;
  public waterNormal!: THREE.CanvasTexture;
  public radialShadow!: THREE.CanvasTexture;
  public softBoxShadow!: THREE.CanvasTexture;

  constructor(renderer: THREE.WebGLRenderer) {
    this.maxAnisotropy = Math.min(renderer.capabilities.getMaxAnisotropy(), 8);
    this.initAll();
  }

  private registerColorTex(
    canvas: HTMLCanvasElement,
    repeatX = 1,
    repeatY = 1,
    pixelCrisp = false
  ): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    if (pixelCrisp) {
      tex.magFilter = THREE.NearestFilter;
      tex.minFilter = THREE.LinearMipmapLinearFilter;
    } else {
      tex.anisotropy = this.maxAnisotropy;
    }
    tex.needsUpdate = true;
    this.textures.push(tex);
    return tex;
  }

  private registerDataTex(
    canvas: HTMLCanvasElement,
    repeatX = 1,
    repeatY = 1
  ): THREE.CanvasTexture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.NoColorSpace;
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(repeatX, repeatY);
    tex.anisotropy = this.maxAnisotropy;
    tex.needsUpdate = true;
    this.textures.push(tex);
    return tex;
  }

  private seededRandom(seed: number): () => number {
    let s = seed % 2147483647;
    if (s <= 0) s += 2147483646;
    return () => {
      s = (s * 16807) % 2147483647;
      return (s - 1) / 2147483646;
    };
  }

  /**
   * Converts a grayscale height canvas into a tangent-space normal map.
   */
  private heightCanvasToNormal(
    heightCanvas: HTMLCanvasElement,
    strength: number,
    repeatX: number,
    repeatY: number
  ): THREE.CanvasTexture {
    const w = heightCanvas.width;
    const h = heightCanvas.height;
    const srcCtx = heightCanvas.getContext('2d')!;
    const src = srcCtx.getImageData(0, 0, w, h).data;

    const outCanvas = document.createElement('canvas');
    outCanvas.width = w;
    outCanvas.height = h;
    const outCtx = outCanvas.getContext('2d')!;
    const outImg = outCtx.createImageData(w, h);
    const dst = outImg.data;

    const sample = (x: number, y: number): number => {
      const wx = ((x % w) + w) % w;
      const wy = ((y % h) + h) % h;
      return src[(wy * w + wx) * 4] / 255;
    };

    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const l = sample(x - 1, y);
        const r = sample(x + 1, y);
        const u = sample(x, y - 1);
        const d = sample(x, y + 1);
        const dx = (l - r) * strength;
        const dy = (u - d) * strength;
        const dz = 1.0;
        const invLen = 1 / Math.hypot(dx, dy, dz);
        const idx = (y * w + x) * 4;
        dst[idx] = Math.floor((dx * invLen * 0.5 + 0.5) * 255);
        dst[idx + 1] = Math.floor((dy * invLen * 0.5 + 0.5) * 255);
        dst[idx + 2] = Math.floor((dz * invLen * 0.5 + 0.5) * 255);
        dst[idx + 3] = 255;
      }
    }

    outCtx.putImageData(outImg, 0, 0);
    return this.registerDataTex(outCanvas, repeatX, repeatY);
  }

  private createBrickTexture(
    basePalette: string[],
    mortarColor: string,
    seed: number
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(seed);

    ctx.fillStyle = mortarColor;
    ctx.fillRect(0, 0, 256, 256);

    const rows = 16;
    const cols = 8;
    const brickH = 256 / rows;
    const brickW = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : brickW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const x = c * brickW + offset;
        const y = r * brickH;
        const color = basePalette[Math.floor(rand() * basePalette.length)];
        ctx.fillStyle = color;
        ctx.fillRect(x + 1.5, y + 1.5, brickW - 3, brickH - 3);

        // Warm top-edge highlight + subtle bottom shadow per brick
        ctx.fillStyle = 'rgba(255, 242, 222, 0.12)';
        ctx.fillRect(x + 1.5, y + 1.5, brickW - 3, 2);
        ctx.fillStyle = 'rgba(28, 16, 12, 0.14)';
        ctx.fillRect(x + 1.5, y + brickH - 3.5, brickW - 3, 2);

        // Kiln fleck / handmade brick patina
        if (rand() > 0.55) {
          ctx.fillStyle =
            rand() > 0.45 ? 'rgba(35, 20, 15, 0.14)' : 'rgba(240, 215, 185, 0.09)';
          ctx.fillRect(x + 3 + rand() * 14, y + 3, 7 + rand() * 6, brickH - 6);
        }
      }
    }

    return this.registerColorTex(canvas, 2, 2);
  }

  private createBrickNormalMap(): THREE.CanvasTexture {
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 256;
    hCanvas.height = 256;
    const ctx = hCanvas.getContext('2d')!;
    const rand = this.seededRandom(901);

    ctx.fillStyle = '#484848';
    ctx.fillRect(0, 0, 256, 256);

    const rows = 16;
    const cols = 8;
    const brickH = 256 / rows;
    const brickW = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const offset = r % 2 === 0 ? 0 : brickW * 0.5;
      for (let c = -1; c <= cols; c++) {
        const v = 195 + Math.floor(rand() * 45);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(c * brickW + offset + 2, r * brickH + 2, brickW - 4, brickH - 4);
      }
    }
    return this.heightCanvasToNormal(hCanvas, 2.1, 2, 2);
  }

  private createSandstoneTexture(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(402);

    ctx.fillStyle = '#c8ab83';
    ctx.fillRect(0, 0, 256, 256);

    const shades = ['#d8be98', '#cfb38c', '#c3a47b', '#dfcaaa', '#ba9b72'];
    const rows = 8;
    const cols = 4;
    const h = 256 / rows;
    const w = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const off = r % 2 === 0 ? 0 : w * 0.5;
      for (let c = -1; c <= cols; c++) {
        const bx = c * w + off;
        const by = r * h;
        ctx.fillStyle = shades[Math.floor(rand() * shades.length)];
        ctx.fillRect(bx + 1.5, by + 1.5, w - 3, h - 3);
        ctx.fillStyle = 'rgba(255, 248, 232, 0.14)';
        ctx.fillRect(bx + 2, by + 2, w - 4, 2);
        ctx.strokeStyle = 'rgba(85, 62, 40, 0.25)';
        ctx.lineWidth = 1.2;
        ctx.strokeRect(bx + 1.5, by + 1.5, w - 3, h - 3);
      }
    }
    return this.registerColorTex(canvas, 2, 2);
  }

  private createSandstoneNormalMap(): THREE.CanvasTexture {
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 256;
    hCanvas.height = 256;
    const ctx = hCanvas.getContext('2d')!;
    const rand = this.seededRandom(409);

    ctx.fillStyle = '#606060';
    ctx.fillRect(0, 0, 256, 256);

    const rows = 8;
    const cols = 4;
    const h = 256 / rows;
    const w = 256 / cols;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 === 0 ? 0 : w * 0.5;
      for (let c = -1; c <= cols; c++) {
        const v = 205 + Math.floor(rand() * 35);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.fillRect(c * w + off + 2, r * h + 2, w - 4, h - 4);
      }
    }
    return this.heightCanvasToNormal(hCanvas, 1.8, 2, 2);
  }

  private createBluestoneCobble(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(881);

    ctx.fillStyle = '#25282e';
    ctx.fillRect(0, 0, 256, 256);

    const shades = ['#3c424c', '#484f5b', '#343840', '#505763', '#3b4049', '#434850'];
    const rows = 14;
    const cols = 10;
    const h = 256 / rows;
    const w = 256 / cols;

    for (let r = 0; r < rows; r++) {
      const off = r % 2 === 0 ? 0 : w * 0.5;
      for (let c = -1; c <= cols; c++) {
        const jx = (rand() - 0.5) * 2;
        ctx.fillStyle = shades[Math.floor(rand() * shades.length)];
        ctx.beginPath();
        ctx.roundRect(c * w + off + 1.5 + jx, r * h + 1.5, w - 3, h - 3, 3);
        ctx.fill();

        ctx.fillStyle = 'rgba(220, 230, 245, 0.1)';
        ctx.fillRect(c * w + off + 3 + jx, r * h + 2.5, w - 6, 2);
      }
    }
    return this.registerColorTex(canvas, 3, 8);
  }

  private createBluestoneNormalMap(): THREE.CanvasTexture {
    const hCanvas = document.createElement('canvas');
    hCanvas.width = 256;
    hCanvas.height = 256;
    const ctx = hCanvas.getContext('2d')!;
    const rand = this.seededRandom(887);

    ctx.fillStyle = '#383838';
    ctx.fillRect(0, 0, 256, 256);

    const rows = 14;
    const cols = 10;
    const h = 256 / rows;
    const w = 256 / cols;
    for (let r = 0; r < rows; r++) {
      const off = r % 2 === 0 ? 0 : w * 0.5;
      for (let c = -1; c <= cols; c++) {
        const v = 195 + Math.floor(rand() * 48);
        ctx.fillStyle = `rgb(${v},${v},${v})`;
        ctx.beginPath();
        ctx.roundRect(c * w + off + 2, r * h + 2, w - 4, h - 4, 3);
        ctx.fill();
      }
    }
    return this.heightCanvasToNormal(hCanvas, 2.4, 3, 8);
  }

  private createFootpathConcrete(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(519);

    ctx.fillStyle = '#bab0a0';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle per-flagstone tone variation
    const slabShades = ['#bfb5a5', '#b5ab9b', '#c2b8a8', '#b1a798'];
    for (let r = 0; r < 4; r++) {
      for (let c = 0; c < 4; c++) {
        ctx.fillStyle = slabShades[(r * 3 + c) % slabShades.length];
        ctx.fillRect(c * 64 + 1, r * 64 + 1, 62, 62);
      }
    }

    // Warm aggregate speckle
    for (let i = 0; i < 1100; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      ctx.fillStyle =
        rand() > 0.5 ? 'rgba(255,248,238,0.14)' : 'rgba(68,60,52,0.11)';
      ctx.fillRect(x, y, 2, 2);
    }

    // Crisp bluestone-tinted paving slab joints
    ctx.strokeStyle = 'rgba(65, 60, 54, 0.34)';
    ctx.lineWidth = 2;
    for (let i = 0; i < 4; i++) {
      const p = i * 64;
      ctx.beginPath();
      ctx.moveTo(p, 0);
      ctx.lineTo(p, 256);
      ctx.moveTo(0, p);
      ctx.lineTo(256, p);
      ctx.stroke();
    }
    return this.registerColorTex(canvas, 2, 2);
  }

  private createHerringboneBrick(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(312);

    ctx.fillStyle = '#694134';
    ctx.fillRect(0, 0, 256, 256);

    const colors = ['#9e5943', '#8e4d3a', '#ae674e', '#7e4434', '#a55f47', '#b67156'];
    const step = 16;
    for (let y = 0; y < 256; y += step) {
      for (let x = 0; x < 256; x += step) {
        ctx.fillStyle = colors[Math.floor(rand() * colors.length)];
        if (((x + y) / step) % 2 === 0) {
          ctx.fillRect(x + 1, y + 1, step * 2 - 2, step - 2);
        } else {
          ctx.fillRect(x + 1, y + 1, step - 2, step * 2 - 2);
        }
      }
    }
    return this.registerColorTex(canvas, 4, 4);
  }

  private createAsphalt(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(999);

    ctx.fillStyle = '#383a3f';
    ctx.fillRect(0, 0, 256, 256);

    // Subtle wheel-track wear & warm aggregate speckle
    ctx.fillStyle = 'rgba(44, 46, 52, 0.35)';
    ctx.fillRect(42, 0, 48, 256);
    ctx.fillRect(166, 0, 48, 256);

    for (let i = 0; i < 2000; i++) {
      const x = rand() * 256;
      const y = rand() * 256;
      const v = 48 + Math.floor(rand() * 32);
      ctx.fillStyle = `rgb(${v + 3}, ${v + 2}, ${v + 5})`;
      ctx.fillRect(x, y, 2, 2);
    }
    return this.registerColorTex(canvas, 4, 4);
  }

  private createGardenGravel(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(774);

    ctx.fillStyle = '#cca97e';
    ctx.fillRect(0, 0, 256, 256);

    const pebbles = ['#e2c79d', '#bc9b70', '#d6b88d', '#b08e64', '#ead2ab'];
    for (let i = 0; i < 1600; i++) {
      ctx.fillStyle = pebbles[Math.floor(rand() * pebbles.length)];
      ctx.fillRect(rand() * 256, rand() * 256, 2.8, 2.8);
    }
    return this.registerColorTex(canvas, 3, 3);
  }

  private createPainterlyGrass(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(1204);

    ctx.fillStyle = '#5e7e46';
    ctx.fillRect(0, 0, 512, 512);

    const tones = ['#688a4d', '#54733e', '#739454', '#638449', '#7d9b59'];
    for (let i = 0; i < 460; i++) {
      ctx.fillStyle = tones[Math.floor(rand() * tones.length)];
      ctx.beginPath();
      ctx.ellipse(
        rand() * 512,
        rand() * 512,
        12 + rand() * 28,
        8 + rand() * 18,
        rand() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    for (let i = 0; i < 1400; i++) {
      const x = rand() * 512;
      const y = rand() * 512;
      ctx.fillStyle =
        rand() > 0.4 ? 'rgba(148, 182, 94, 0.28)' : 'rgba(52, 80, 36, 0.22)';
      ctx.fillRect(x, y, 2, 5);
    }
    return this.registerColorTex(canvas, 8, 8);
  }

  private createBotanicLushGrass(): THREE.CanvasTexture {
    // Richer, dewy emerald-and-clover painterly lawn specifically for Royal Botanic Gardens lawns!
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(2408);

    ctx.fillStyle = '#4c7640';
    ctx.fillRect(0, 0, 512, 512);

    const lushTones = ['#588649', '#436b38', '#669452', '#527d44', '#729e58'];
    for (let i = 0; i < 520; i++) {
      ctx.fillStyle = lushTones[Math.floor(rand() * lushTones.length)];
      ctx.beginPath();
      ctx.ellipse(
        rand() * 512,
        rand() * 512,
        14 + rand() * 32,
        10 + rand() * 22,
        rand() * Math.PI,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }

    // Delicate white clover & buttercup micro-flecks on Botanic lawns
    for (let i = 0; i < 240; i++) {
      ctx.fillStyle =
        rand() > 0.35 ? 'rgba(246, 244, 228, 0.42)' : 'rgba(242, 202, 92, 0.38)';
      ctx.fillRect(rand() * 512, rand() * 512, 2.5, 2.5);
    }

    return this.registerColorTex(canvas, 6, 6);
  }

  private createRoofSlate(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(330);
    ctx.fillStyle = '#333942';
    ctx.fillRect(0, 0, 128, 128);
    const shades = ['#3e4652', '#363d48', '#464f5c', '#3b434e'];
    for (let r = 0; r < 10; r++) {
      const off = (r % 2) * 8;
      for (let c = -1; c <= 8; c++) {
        ctx.fillStyle = shades[Math.floor(rand() * shades.length)];
        ctx.fillRect(c * 16 + off + 1, r * 12.8 + 1, 14, 11);
      }
    }
    return this.registerColorTex(canvas, 3, 3);
  }

  private createTerracottaTile(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(415);
    ctx.fillStyle = '#7d3a28';
    ctx.fillRect(0, 0, 128, 128);
    const tiles = ['#b5583d', '#a64d34', '#c26447', '#99452e'];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 12; c++) {
        ctx.fillStyle = tiles[Math.floor(rand() * tiles.length)];
        ctx.fillRect(c * 10.6 + 1, r * 16 + 1, 8.6, 14);
        ctx.fillStyle = 'rgba(255,225,195,0.16)';
        ctx.fillRect(c * 10.6 + 2, r * 16 + 1, 3, 14);
      }
    }
    return this.registerColorTex(canvas, 3, 3);
  }

  private createCorrugatedIron(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    for (let x = 0; x < 128; x += 8) {
      ctx.fillStyle = x % 16 === 0 ? '#7e848a' : '#63696f';
      ctx.fillRect(x, 0, 4, 128);
      ctx.fillStyle = '#979da3';
      ctx.fillRect(x + 4, 0, 4, 128);
    }
    return this.registerColorTex(canvas, 4, 2);
  }

  private createTimberDeck(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const rand = this.seededRandom(614);
    const planks = ['#8b5e3c', '#986946', '#7d5334', '#a1714c', '#845838'];
    for (let r = 0; r < 16; r++) {
      ctx.fillStyle = planks[Math.floor(rand() * planks.length)];
      ctx.fillRect(0, r * 16, 256, 14.5);
      ctx.fillStyle = 'rgba(255, 232, 200, 0.08)';
      ctx.fillRect(0, r * 16 + 1, 256, 2);
      ctx.fillStyle = '#472d1b';
      ctx.fillRect(0, r * 16 + 14.5, 256, 1.5);
    }
    return this.registerColorTex(canvas, 3, 3);
  }

  private createFiligreeLaceAlpha(): THREE.CanvasTexture {
    // Classic Melbourne Victorian cast-iron verandah & balcony lacework alpha cutout pattern!
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, 128, 64);

    ctx.fillStyle = '#ffffff';
    ctx.strokeStyle = '#ffffff';
    // Top & bottom rail bars
    ctx.fillRect(0, 0, 128, 7);
    ctx.fillRect(0, 57, 128, 7);

    // Repeating Victorian foliate scrollwork & vertical spindles
    for (let x = 8; x < 128; x += 16) {
      ctx.fillRect(x - 1.5, 6, 3, 52);
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(x + 8, 22, 6, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(x + 8, 42, 6, 0, Math.PI * 2);
      ctx.stroke();
    }
    return this.registerDataTex(canvas, 3, 1);
  }

  private createWindowTexture(variant: 'warm' | 'curtain' | 'daylight'): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 160;
    const ctx = canvas.getContext('2d')!;

    if (variant === 'warm') {
      const grad = ctx.createLinearGradient(0, 0, 0, 160);
      grad.addColorStop(0, '#ffdc92');
      grad.addColorStop(0.55, '#f5b150');
      grad.addColorStop(1, '#c47230');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 160);

      // Bookshelves, warm pendant lamp & indoor plant silhouette
      ctx.fillStyle = 'rgba(84, 42, 20, 0.42)';
      ctx.fillRect(12, 92, 36, 64);
      ctx.fillRect(80, 84, 34, 72);
      ctx.fillStyle = '#fff5d6';
      ctx.beginPath();
      ctx.arc(64, 42, 12, 0, Math.PI * 2);
      ctx.fill();
    } else if (variant === 'curtain') {
      const grad = ctx.createLinearGradient(0, 0, 0, 160);
      grad.addColorStop(0, '#f0a856');
      grad.addColorStop(1, '#9e5328');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 160);

      // Half-drawn Venetian blind / linen curtain slats
      ctx.fillStyle = 'rgba(54, 32, 22, 0.46)';
      for (let y = 8; y < 74; y += 9) {
        ctx.fillRect(6, y, 116, 5);
      }
      // Draped side curtains
      ctx.fillStyle = 'rgba(72, 38, 26, 0.5)';
      ctx.fillRect(6, 6, 22, 148);
      ctx.fillRect(100, 6, 22, 148);
    } else {
      const grad = ctx.createLinearGradient(0, 0, 128, 160);
      grad.addColorStop(0, '#5d7c90');
      grad.addColorStop(0.48, '#82a2b5');
      grad.addColorStop(1, '#3b4e5c');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, 128, 160);
      // Warm sky reflection slash
      ctx.fillStyle = 'rgba(255, 232, 198, 0.28)';
      ctx.beginPath();
      ctx.moveTo(0, 124);
      ctx.lineTo(108, 0);
      ctx.lineTo(128, 0);
      ctx.lineTo(28, 160);
      ctx.closePath();
      ctx.fill();
    }

    // Double-hung sash window frame & glazing bars
    ctx.strokeStyle = '#2d241f';
    ctx.lineWidth = 7;
    ctx.strokeRect(3.5, 3.5, 121, 153);
    ctx.strokeStyle = '#e8dcc6';
    ctx.lineWidth = 3;
    ctx.strokeRect(9, 9, 110, 142);
    ctx.beginPath();
    ctx.moveTo(9, 78);
    ctx.lineTo(119, 78);
    ctx.moveTo(64, 9);
    ctx.lineTo(64, 78);
    ctx.stroke();

    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createShopSignTexture(
    bgHex: string,
    borderHex: string,
    title: string,
    sub: string,
    textHex = '#f8efe0'
  ): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = bgHex;
    ctx.fillRect(0, 0, 256, 64);

    ctx.strokeStyle = borderHex;
    ctx.lineWidth = 4;
    ctx.strokeRect(4, 4, 248, 56);

    ctx.fillStyle = textHex;
    ctx.textAlign = 'center';
    ctx.font = 'bold 21px Georgia, serif';
    ctx.fillText(title, 128, 31);

    ctx.fillStyle = borderHex;
    ctx.font = '600 11px sans-serif';
    ctx.fillText(sub, 128, 49);

    return this.registerColorTex(canvas, 1, 1);
  }

  private createLanewayMuralA(): THREE.CanvasTexture {
    // Hosier Lane style warm botanical + cockatoo + geometric mural on brick
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#7e3e31';
    ctx.fillRect(0, 0, 256, 128);

    ctx.fillStyle = '#2d5c63';
    ctx.beginPath();
    ctx.arc(70, 74, 52, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#e69d45';
    ctx.beginPath();
    ctx.arc(155, 58, 46, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#d65a47';
    ctx.fillRect(175, 30, 62, 76);

    // Stylised sulphur-crested cockatoo & native banksia leaves
    ctx.fillStyle = '#f8f2e4';
    ctx.beginPath();
    ctx.ellipse(95, 68, 26, 18, -0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f5c542';
    ctx.beginPath();
    ctx.moveTo(108, 52);
    ctx.lineTo(128, 30);
    ctx.lineTo(118, 56);
    ctx.fill();

    ctx.strokeStyle = '#f4ead5';
    ctx.lineWidth = 4;
    ctx.strokeRect(18, 18, 220, 92);

    ctx.fillStyle = '#3f7a52';
    for (let i = 0; i < 6; i++) {
      ctx.beginPath();
      ctx.ellipse(36 + i * 36, 102, 12, 6, 0.4, 0, Math.PI * 2);
      ctx.fill();
    }

    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createLanewayMuralB(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#2b333c';
    ctx.fillRect(0, 0, 256, 128);

    const blocks = [
      { x: 12, y: 14, w: 72, h: 100, c: '#c9563c' },
      { x: 90, y: 20, w: 80, h: 90, c: '#e8b454' },
      { x: 176, y: 12, w: 68, h: 102, c: '#487f68' },
    ];
    blocks.forEach((b) => {
      ctx.fillStyle = b.c;
      ctx.fillRect(b.x, b.y, b.w, b.h);
    });

    ctx.fillStyle = '#f7efe0';
    ctx.beginPath();
    ctx.arc(48, 54, 22, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#215738';
    ctx.fillRect(104, 42, 52, 52);
    ctx.fillStyle = '#f5d98e';
    ctx.fillRect(112, 50, 15, 16);
    ctx.fillRect(133, 50, 15, 16);

    ctx.fillStyle = '#f48c64';
    ctx.beginPath();
    ctx.arc(210, 62, 24, 0, Math.PI * 2);
    ctx.fill();

    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createLanewayMuralC(): THREE.CanvasTexture {
    // Union / Meyers Place paste-up posters, vintage gig bills & bold botanical stencil mural
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#5e4338';
    ctx.fillRect(0, 0, 256, 128);

    const posters = [
      { x: 16, y: 20, w: 46, h: 66, c: '#f2e3c6', h2: '#d1523e' },
      { x: 70, y: 28, w: 44, h: 62, c: '#e8b954', h2: '#253842' },
      { x: 124, y: 16, w: 54, h: 74, c: '#457d6c', h2: '#f7efe2' },
      { x: 188, y: 24, w: 50, h: 68, c: '#d96c4e', h2: '#231f20' },
    ];
    for (const p of posters) {
      ctx.fillStyle = p.c;
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = p.h2;
      ctx.fillRect(p.x + 5, p.y + 6, p.w - 10, 18);
      ctx.beginPath();
      ctx.arc(p.x + p.w * 0.5, p.y + p.h * 0.65, 11, 0, Math.PI * 2);
      ctx.fill();
    }

    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createArcadeMural(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1e1b29';
    ctx.fillRect(0, 0, 256, 128);

    const stars = [
      [24, 24],
      [62, 18],
      [114, 30],
      [168, 22],
      [220, 28],
      [44, 88],
      [198, 92],
    ];
    ctx.fillStyle = '#ffd166';
    stars.forEach(([sx, sy]) => {
      ctx.fillRect(sx - 4, sy - 1, 9, 3);
      ctx.fillRect(sx - 1, sy - 4, 3, 9);
    });

    ctx.fillStyle = '#ef6f53';
    ctx.fillRect(78, 38, 100, 60);
    ctx.fillStyle = '#fdf0d5';
    ctx.fillRect(88, 46, 80, 28);
    ctx.fillStyle = '#264653';
    ctx.beginPath();
    ctx.arc(108, 60, 8, 0, Math.PI * 2);
    ctx.arc(148, 60, 8, 0, Math.PI * 2);
    ctx.fill();

    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createVinylShopWindow(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#382218';
    ctx.fillRect(0, 0, 128, 128);
    ctx.fillStyle = '#ffcf7d';
    ctx.fillRect(6, 6, 116, 116);

    const sleeves = ['#d1495b', '#2b5876', '#edae49', '#3d7a5a', '#6d4c7d', '#d96b43'];
    for (let r = 0; r < 2; r++) {
      for (let c = 0; c < 3; c++) {
        ctx.fillStyle = sleeves[(r * 3 + c) % sleeves.length];
        ctx.fillRect(14 + c * 34, 52 + r * 34, 28, 28);
        ctx.fillStyle = '#1c1917';
        ctx.beginPath();
        ctx.arc(28 + c * 34, 66 + r * 34, 8, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#191716';
      ctx.beginPath();
      ctx.arc(28 + i * 36, 26, 13, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e76f51';
      ctx.beginPath();
      ctx.arc(28 + i * 36, 26, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createArcadeWindow(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#1a1626';
    ctx.fillRect(0, 0, 128, 128);

    const cabColors = ['#e76f51', '#2a9d8f', '#f4a261'];
    for (let i = 0; i < 3; i++) {
      const x = 12 + i * 36;
      ctx.fillStyle = cabColors[i];
      ctx.fillRect(x, 34, 28, 86);
      ctx.fillStyle = '#7bf1a8';
      ctx.fillRect(x + 4, 46, 20, 22);
      ctx.fillStyle = '#ffd166';
      ctx.fillRect(x + 3, 36, 22, 6);
    }

    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createCafeWindow(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    const grad = ctx.createLinearGradient(0, 0, 0, 128);
    grad.addColorStop(0, '#ffe4ad');
    grad.addColorStop(1, '#e69844');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 128, 128);

    // Timber counter + La Marzocco espresso machine + pastry dome
    ctx.fillStyle = '#542f1c';
    ctx.fillRect(8, 82, 112, 40);
    ctx.fillStyle = '#c4c8cc';
    ctx.fillRect(22, 58, 36, 24);
    ctx.fillStyle = '#f5dec0';
    ctx.beginPath();
    ctx.arc(88, 74, 14, Math.PI, 0);
    ctx.fill();

    for (let i = 0; i < 3; i++) {
      ctx.fillStyle = '#fff9e4';
      ctx.beginPath();
      ctx.arc(28 + i * 36, 26, 8, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.strokeStyle = '#332218';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 122, 122);
    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createBookshopWindow(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;

    ctx.fillStyle = '#f5cf86';
    ctx.fillRect(0, 0, 128, 128);

    // Tiered Melbourne indie bookshop display shelves & colourful book spines
    const spines = ['#b5483a', '#355c6e', '#587850', '#d48d3b', '#6d4966', '#cc5f43'];
    for (let shelf = 0; shelf < 3; shelf++) {
      const sy = 38 + shelf * 30;
      ctx.fillStyle = '#4f311f';
      ctx.fillRect(10, sy + 20, 108, 5);
      for (let b = 0; b < 8; b++) {
        ctx.fillStyle = spines[(shelf * 3 + b) % spines.length];
        ctx.fillRect(14 + b * 12.5, sy, 10, 20);
      }
    }
    ctx.strokeStyle = '#2d241e';
    ctx.lineWidth = 6;
    ctx.strokeRect(3, 3, 122, 122);
    return this.registerColorTex(canvas, 1, 1, true);
  }

  private createTramSignTexture(route: string, dest: string): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#181715';
    ctx.fillRect(0, 0, 256, 64);

    ctx.fillStyle = '#f5b841';
    ctx.fillRect(8, 8, 58, 48);
    ctx.fillStyle = '#181715';
    ctx.font = 'bold 30px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(route, 37, 43);

    ctx.fillStyle = '#ffdf9a';
    ctx.font = 'bold 20px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(dest, 78, 40);

    return this.registerColorTex(canvas, 1, 1);
  }

  private createRadialShadow(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d')!;
    const grad = ctx.createRadialGradient(32, 32, 4, 32, 32, 30);
    grad.addColorStop(0, 'rgba(18, 14, 10, 0.50)');
    grad.addColorStop(0.65, 'rgba(18, 14, 10, 0.20)');
    grad.addColorStop(1, 'rgba(18, 14, 10, 0.0)');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 64, 64);
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    this.textures.push(tex);
    return tex;
  }

  private createSoftBoxShadow(): THREE.CanvasTexture {
    // Soft rectangular ambient-occlusion contact skirt for building footprints!
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 128;
    const ctx = canvas.getContext('2d')!;
    ctx.clearRect(0, 0, 128, 128);
    for (let i = 0; i < 18; i++) {
      const inset = i * 2.2;
      ctx.fillStyle = 'rgba(20, 15, 12, 0.042)';
      ctx.beginPath();
      ctx.roundRect(inset, inset, 128 - inset * 2, 128 - inset * 2, 16);
      ctx.fill();
    }
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.needsUpdate = true;
    this.textures.push(tex);
    return tex;
  }

  private createWaterNormal(): THREE.CanvasTexture {
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d')!;
    const img = ctx.createImageData(256, 256);
    for (let y = 0; y < 256; y++) {
      for (let x = 0; x < 256; x++) {
        const u = (x / 256) * Math.PI * 2;
        const v = (y / 256) * Math.PI * 2;
        const nx =
          Math.sin(u * 2 + v * 1) * 0.28 +
          Math.cos(u * 3 - v * 4 + 1.3) * 0.22 +
          Math.sin(u * 5 + v * 3 + 2.4) * 0.14;
        const ny =
          Math.cos(v * 2 - u * 1 + 0.7) * 0.28 +
          Math.sin(v * 5 + u * 2 + 1.9) * 0.22 +
          Math.cos(v * 3 - u * 6) * 0.14;
        const idx = (y * 256 + x) * 4;
        img.data[idx] = Math.floor((nx * 0.5 + 0.5) * 255);
        img.data[idx + 1] = Math.floor((ny * 0.5 + 0.5) * 255);
        img.data[idx + 2] = 244;
        img.data[idx + 3] = 255;
      }
    }
    ctx.putImageData(img, 0, 0);
    return this.registerDataTex(canvas, 6, 2.5);
  }

  private initAll(): void {
    this.brickRed = this.createBrickTexture(
      ['#9e4838', '#8e3e2f', '#ae5443', '#964435', '#7d3528'],
      '#cbbba6',
      101
    );
    this.brickOchre = this.createBrickTexture(
      ['#c9935b', '#be8750', '#d49f67', '#b57e48', '#cfa06e'],
      '#dfd2be',
      202
    );
    this.brickBrown = this.createBrickTexture(
      ['#6e4d3f', '#624336', '#7b5848', '#593c30', '#735143'],
      '#bfb09c',
      303
    );
    this.brickCreamPainted = this.createBrickTexture(
      ['#e5d6be', '#dccbb2', '#ebdec8', '#d5c4aa'],
      '#c2b29b',
      404
    );

    this.sandstone = this.createSandstoneTexture();
    this.bluestoneCobble = this.createBluestoneCobble();
    this.footpathConcrete = this.createFootpathConcrete();
    this.herringboneBrick = this.createHerringboneBrick();
    this.asphalt = this.createAsphalt();
    this.gardenGravel = this.createGardenGravel();
    this.grassPainterly = this.createPainterlyGrass();
    this.grassBotanicLush = this.createBotanicLushGrass();
    this.heritageRoofSlate = this.createRoofSlate();
    this.terracottaTile = this.createTerracottaTile();
    this.corrugatedIron = this.createCorrugatedIron();
    this.timberDeck = this.createTimberDeck();

    this.filigreeLaceAlpha = this.createFiligreeLaceAlpha();
    this.windowWarmLit = this.createWindowTexture('warm');
    this.windowAmberCurtain = this.createWindowTexture('curtain');
    this.windowDaylight = this.createWindowTexture('daylight');

    this.muralLanewayA = this.createLanewayMuralA();
    this.muralLanewayB = this.createLanewayMuralB();
    this.muralLanewayC = this.createLanewayMuralC();
    this.muralArcade = this.createArcadeMural();

    this.vinylShopWindow = this.createVinylShopWindow();
    this.arcadeCabinetWindow = this.createArcadeWindow();
    this.cafeWindowDisplay = this.createCafeWindow();
    this.bookshopWindowDisplay = this.createBookshopWindow();

    this.shopSignEspresso = this.createShopSignTexture(
      '#233d30',
      '#e3b363',
      'LANEWAY ESPRESSO',
      'ROASTERS · FLAT WHITE'
    );
    this.shopSignBookshop = this.createShopSignTexture(
      '#2e2522',
      '#d99b52',
      'HILL OF CONTENT',
      'BOOKS · PRINTS · FOLIOS'
    );
    this.shopSignBakery = this.createShopSignTexture(
      '#6b3226',
      '#f2d59b',
      'FLINDERS BAKEHOUSE',
      'SOURDOUGH · PASTRIES'
    );
    this.shopSignRecords = this.createShopSignTexture(
      '#1e242b',
      '#ef6f53',
      'WAX & GROOVE',
      'RARE VINYL · HI-FI'
    );
    this.shopSignBistro = this.createShopSignTexture(
      '#3b1f1e',
      '#f4b860',
      'MIDNIGHT IZAKAYA',
      'RAMEN · JAZZ · LANTERNS'
    );

    this.tramSign96 = this.createTramSignTexture('96', 'ST KILDA BEACH');
    this.tramSign1 = this.createTramSignTexture('1', 'MELBOURNE UNI');
    this.tramSign35 = this.createTramSignTexture('35', 'CITY CIRCLE');

    this.brickNormal = this.createBrickNormalMap();
    this.bluestoneNormal = this.createBluestoneNormalMap();
    this.sandstoneNormal = this.createSandstoneNormalMap();
    this.waterNormal = this.createWaterNormal();
    this.radialShadow = this.createRadialShadow();
    this.softBoxShadow = this.createSoftBoxShadow();
  }

  public dispose(): void {
    for (const t of this.textures) {
      t.dispose();
    }
    this.textures = [];
  }
}
