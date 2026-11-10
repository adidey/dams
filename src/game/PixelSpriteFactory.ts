import * as THREE from 'three';
import { CHARACTERS_CONFIG } from './config/charactersConfig';

export interface SpriteSheetBundle {
  texture: THREE.Texture;
  frameCount: number;
  portraitDataUrls: {
    warm: string;
    playful: string;
    happy: string;
  };
}

/**
 * Generates crisp NearestFilter 2D pixel-art sprite sheets (8 frames × 32×32 px each)
 * and 64×64 dialogue/HUD portraits for Adi, Damini, and Sunny the Golden Retriever.
 *
 * Frame layout (horizontal strip of 8 frames, each 32×32):
 * - 0, 1: Idle breathing / gentle tail wag
 * - 2, 3, 4, 5: 4-frame walking / trotting cycle
 * - 6: Sit / secondary pose
 * - 7: Interact / petted / joyful heart pose
 */
export class PixelSpriteFactory {
  private textures: THREE.Texture[] = [];

  public createAdiBundle(): SpriteSheetBundle {
    const frameW = 32;
    const frameH = 32;
    const frames = 8;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let f = 0; f < frames; f++) {
      this.drawAdiFrame(ctx, f * frameW, 0, f);
    }

    const texture = this.makePixelTexture(
      canvas,
      CHARACTERS_CONFIG.adi.customSpriteSheetUrl
    );

    return {
      texture,
      frameCount: frames,
      portraitDataUrls: {
        warm: this.renderPortrait('adi', 'warm'),
        playful: this.renderPortrait('adi', 'playful'),
        happy: this.renderPortrait('adi', 'happy'),
      },
    };
  }

  public createDaminiBundle(): SpriteSheetBundle {
    const frameW = 32;
    const frameH = 32;
    const frames = 8;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let f = 0; f < frames; f++) {
      this.drawDaminiFrame(ctx, f * frameW, 0, f);
    }

    const texture = this.makePixelTexture(
      canvas,
      CHARACTERS_CONFIG.damini.customSpriteSheetUrl
    );

    return {
      texture,
      frameCount: frames,
      portraitDataUrls: {
        warm: this.renderPortrait('damini', 'warm'),
        playful: this.renderPortrait('damini', 'playful'),
        happy: this.renderPortrait('damini', 'happy'),
      },
    };
  }

  public createSunnyBundle(): SpriteSheetBundle {
    const frameW = 32;
    const frameH = 32;
    const frames = 8;
    const canvas = document.createElement('canvas');
    canvas.width = frameW * frames;
    canvas.height = frameH;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    for (let f = 0; f < frames; f++) {
      this.drawSunnyFrame(ctx, f * frameW, 0, f);
    }

    const texture = this.makePixelTexture(
      canvas,
      CHARACTERS_CONFIG.sunny.customSpriteSheetUrl
    );

    return {
      texture,
      frameCount: frames,
      portraitDataUrls: {
        warm: this.renderPortrait('sunny', 'warm'),
        playful: this.renderPortrait('sunny', 'playful'),
        happy: this.renderPortrait('sunny', 'happy'),
      },
    };
  }

  public createHeartEmoteTexture(): THREE.Texture {
    const canvas = document.createElement('canvas');
    canvas.width = 16;
    canvas.height = 16;
    const ctx = canvas.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    const pattern = [
      '................',
      '..####....####..',
      '.######..######.',
      '################',
      '###**###########',
      '###*############',
      '.##############.',
      '..############..',
      '...##########...',
      '....########....',
      '.....######.....',
      '......####......',
      '.......##.......',
      '................',
    ];
    pattern.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const ch = row[x];
        if (ch === '#') {
          ctx.fillStyle = '#eb6b7e';
          ctx.fillRect(x, y + 1, 1, 1);
        } else if (ch === '*') {
          ctx.fillStyle = '#ffdbe2';
          ctx.fillRect(x, y + 1, 1, 1);
        }
      }
    });

    return this.makePixelTexture(canvas);
  }

  private makePixelTexture(
    canvas: HTMLCanvasElement,
    customUrl?: string
  ): THREE.Texture {
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.magFilter = THREE.NearestFilter;
    tex.minFilter = THREE.NearestFilter;
    tex.generateMipmaps = false;
    tex.needsUpdate = true;

    if (customUrl) {
      const loader = new THREE.TextureLoader();
      loader.load(
        customUrl,
        (loaded) => {
          const ctx = canvas.getContext('2d');
          if (ctx && loaded.image) {
            ctx.imageSmoothingEnabled = false;
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(
              loaded.image as CanvasImageSource,
              0,
              0,
              canvas.width,
              canvas.height
            );
            tex.needsUpdate = true;
          }
          loaded.dispose();
        },
        undefined,
        () => {
          // Keep built-in pixel sprite sheet cleanly if custom file is absent
        }
      );
    }

    this.textures.push(tex);
    return tex;
  }

  private px(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    x: number,
    y: number,
    w: number,
    h: number,
    color: string
  ): void {
    ctx.fillStyle = color;
    ctx.fillRect(ox + x, oy + y, w, h);
  }

  /**
   * Draws Adi (32×32 pixel frame, grounded cleanly at y = 31)
   * Recognisable South Asian features: warm brown skin, thick wavy dark-espresso hair,
   * forest-olive Melbourne overshirt over cream tee, dark indigo chinos, crisp white sneakers.
   */
  private drawAdiFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    frame: number
  ): void {
    const isWalk = frame >= 2 && frame <= 5;
    const isInteract = frame >= 6;
    const bob =
      frame === 1
        ? 1
        : frame === 2 || frame === 4
          ? -1
          : isInteract && frame === 7
            ? 1
            : 0;

    const outline = '#231b18';
    const hairDark = '#1c1618';
    const hairHi = '#33292d';
    const skin = '#b97c56';
    const skinShade = '#9c6340';
    const jacket = '#3b5949';
    const jacketShade = '#2b4236';
    const tee = '#f4ead8';
    const pants = '#2a3347';
    const pantsShade = '#1e2536';
    const shoe = '#f0ebe1';
    const shoeSole = '#7d5b44';

    // Legs & sneakers (grounded at y = 31)
    let leftLegY = 24;
    let rightLegY = 24;
    let leftArmSwing = 0;
    let rightArmSwing = 0;

    if (isWalk) {
      if (frame === 2) {
        leftLegY = 23;
        rightLegY = 25;
        leftArmSwing = 1;
        rightArmSwing = -1;
      } else if (frame === 3) {
        leftLegY = 24;
        rightLegY = 24;
      } else if (frame === 4) {
        leftLegY = 25;
        rightLegY = 23;
        leftArmSwing = -1;
        rightArmSwing = 1;
      }
    }

    // Trousers
    this.px(ctx, ox, oy, 11, 22 + bob, 10, 3, outline);
    this.px(ctx, ox, oy, 12, leftLegY + bob, 3, 30 - (leftLegY + bob), pants);
    this.px(ctx, ox, oy, 17, rightLegY + bob, 3, 30 - (rightLegY + bob), pants);
    this.px(ctx, ox, oy, 15, 23 + bob, 2, 3, pantsShade);

    // Sneakers
    this.px(ctx, ox, oy, 11, Math.min(29, leftLegY + 5), 4, 2, shoe);
    this.px(ctx, ox, oy, 11, 31, 4, 1, shoeSole);
    this.px(ctx, ox, oy, 17, Math.min(29, rightLegY + 5), 4, 2, shoe);
    this.px(ctx, ox, oy, 17, 31, 4, 1, shoeSole);

    // Torso: Olive overshirt + cream inner tee + subtle crossbody strap
    const ty = 14 + bob;
    this.px(ctx, ox, oy, 9, ty, 14, 9, outline);
    this.px(ctx, ox, oy, 10, ty + 1, 12, 7, jacket);
    this.px(ctx, ox, oy, 14, ty + 1, 4, 7, tee);
    this.px(ctx, ox, oy, 10, ty + 6, 3, 2, jacketShade);
    this.px(ctx, ox, oy, 19, ty + 6, 3, 2, jacketShade);
    // Warm leather camera/satchel strap detail
    this.px(ctx, ox, oy, 13, ty + 1, 1, 3, '#6e4730');
    this.px(ctx, ox, oy, 14, ty + 4, 2, 2, '#6e4730');

    // Arms & hands
    if (isInteract) {
      // Friendly wave / reaching down to pet Sunny
      this.px(ctx, ox, oy, 8, ty + 1, 2, 5, jacket);
      this.px(ctx, ox, oy, 8, ty + 6, 2, 2, skin);
      this.px(ctx, ox, oy, 22, ty - 2, 2, 5, jacket);
      this.px(ctx, ox, oy, 22, ty - 4, 2, 2, skin);
    } else {
      this.px(ctx, ox, oy, 8, ty + 1 + leftArmSwing, 2, 5, jacket);
      this.px(ctx, ox, oy, 8, ty + 6 + leftArmSwing, 2, 2, skin);
      this.px(ctx, ox, oy, 22, ty + 1 + rightArmSwing, 2, 5, jacket);
      this.px(ctx, ox, oy, 22, ty + 6 + rightArmSwing, 2, 2, skin);
    }

    // Neck & Head
    const hy = 4 + bob;
    this.px(ctx, ox, oy, 14, hy + 9, 4, 2, skinShade);
    this.px(ctx, ox, oy, 10, hy + 1, 12, 9, outline);
    this.px(ctx, ox, oy, 11, hy + 2, 10, 7, skin);
    this.px(ctx, ox, oy, 11, hy + 7, 10, 2, skinShade);
    // Ears
    this.px(ctx, ox, oy, 10, hy + 5, 1, 2, skin);
    this.px(ctx, ox, oy, 21, hy + 5, 1, 2, skin);

    // Thick wavy dark hair silhouette
    this.px(ctx, ox, oy, 9, hy - 1, 14, 4, hairDark);
    this.px(ctx, ox, oy, 10, hy - 2, 11, 2, hairDark);
    this.px(ctx, ox, oy, 12, hy - 2, 5, 1, hairHi);
    this.px(ctx, ox, oy, 9, hy + 2, 2, 3, hairDark);
    this.px(ctx, ox, oy, 21, hy + 2, 2, 3, hairDark);
    // Wavy fringe tuft
    this.px(ctx, ox, oy, 15, hy + 2, 3, 1, hairDark);

    // Expressive eyes, brows & warm smile
    this.px(ctx, ox, oy, 12, hy + 4, 2, 1, hairDark);
    this.px(ctx, ox, oy, 18, hy + 4, 2, 1, hairDark);
    this.px(ctx, ox, oy, 13, hy + 5, 1, 2, '#171214');
    this.px(ctx, ox, oy, 18, hy + 5, 1, 2, '#171214');
    // Smile
    this.px(ctx, ox, oy, 15, hy + 7, 3, 1, isInteract ? '#fff5eb' : '#6e3b2b');
  }

  /**
   * Draws Damini (32×32 pixel frame, slightly shorter silhouette than Adi, grounded at y = 31)
   * Recognisable features: warm golden-brown skin, long layered dark-chestnut/raven hair,
   * gold hoop earrings, dusty-rose berry cardigan over cream top, indigo skirt/trousers, ankle boots.
   */
  private drawDaminiFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    frame: number
  ): void {
    const isWalk = frame >= 2 && frame <= 5;
    const isInteract = frame >= 6;
    const bob =
      frame === 1
        ? 1
        : frame === 2 || frame === 4
          ? -1
          : isInteract && frame === 7
            ? -1
            : 0;

    const outline = '#241a1d';
    const hairDark = '#1b1318';
    const hairRich = '#34222b';
    const skin = '#c2855e';
    const skinShade = '#a66b47';
    const blush = '#df8589';
    const cardigan = '#b85a71';
    const cardiganShade = '#944358';
    const creamTop = '#f8efe2';
    const skirt = '#333d54';
    const boot = '#4a3128';
    const gold = '#f0c45d';

    let leftFootY = 29;
    let rightFootY = 29;
    let armOffset = 0;
    if (isWalk) {
      if (frame === 2) {
        leftFootY = 28;
        rightFootY = 30;
        armOffset = 1;
      } else if (frame === 4) {
        leftFootY = 30;
        rightFootY = 28;
        armOffset = -1;
      }
    }

    // Long hair back layer flowing behind shoulders
    const hy = 5 + bob;
    this.px(ctx, ox, oy, 9, hy + 3, 14, 13, hairDark);

    // Legs & ankle boots (grounded at y = 31)
    this.px(ctx, ox, oy, 12, 26 + bob, 2, 4, skin);
    this.px(ctx, ox, oy, 18, 26 + bob, 2, 4, skin);
    this.px(ctx, ox, oy, 12, leftFootY, 3, 32 - leftFootY, boot);
    this.px(ctx, ox, oy, 17, rightFootY, 3, 32 - rightFootY, boot);

    // Skirt / tailored hem
    this.px(ctx, ox, oy, 10, 22 + bob, 12, 5, outline);
    this.px(ctx, ox, oy, 11, 22 + bob, 10, 4, skirt);

    // Berry-rose knit cardigan + cream blouse
    const ty = 15 + bob;
    this.px(ctx, ox, oy, 10, ty, 12, 8, outline);
    this.px(ctx, ox, oy, 11, ty + 1, 10, 6, cardigan);
    this.px(ctx, ox, oy, 14, ty + 1, 4, 6, creamTop);
    this.px(ctx, ox, oy, 11, ty + 5, 2, 2, cardiganShade);
    this.px(ctx, ox, oy, 19, ty + 5, 2, 2, cardiganShade);

    // Arms
    if (isInteract) {
      // Clasped happy hands / cheerful wave
      this.px(ctx, ox, oy, 9, ty + 1, 2, 4, cardigan);
      this.px(ctx, ox, oy, 21, ty - 1, 2, 4, cardigan);
      this.px(ctx, ox, oy, 21, ty - 2, 2, 2, skin);
    } else {
      this.px(ctx, ox, oy, 9, ty + 1 + armOffset, 2, 5, cardigan);
      this.px(ctx, ox, oy, 9, ty + 6 + armOffset, 2, 1, skin);
      this.px(ctx, ox, oy, 21, ty + 1 - armOffset, 2, 5, cardigan);
      this.px(ctx, ox, oy, 21, ty + 6 - armOffset, 2, 1, skin);
    }

    // Face & hair front framing
    this.px(ctx, ox, oy, 14, hy + 9, 4, 2, skinShade);
    this.px(ctx, ox, oy, 10, hy + 1, 12, 8, outline);
    this.px(ctx, ox, oy, 11, hy + 2, 10, 7, skin);

    // Lush layered dark hair crown & side locks
    this.px(ctx, ox, oy, 9, hy - 1, 14, 4, hairDark);
    this.px(ctx, ox, oy, 11, hy - 2, 10, 2, hairDark);
    this.px(ctx, ox, oy, 12, hy - 1, 4, 1, hairRich);
    this.px(ctx, ox, oy, 9, hy + 2, 2, 9, hairDark);
    this.px(ctx, ox, oy, 21, hy + 2, 2, 9, hairDark);

    // Gold hoop earrings
    this.px(ctx, ox, oy, 10, hy + 6, 1, 2, gold);
    this.px(ctx, ox, oy, 21, hy + 6, 1, 2, gold);

    // Eyes, warm blush & smile
    this.px(ctx, ox, oy, 13, hy + 5, 1, 2, '#171115');
    this.px(ctx, ox, oy, 18, hy + 5, 1, 2, '#171115');
    this.px(ctx, ox, oy, 12, hy + 6, 1, 1, blush);
    this.px(ctx, ox, oy, 19, hy + 6, 1, 1, blush);
    this.px(ctx, ox, oy, 15, hy + 7, 2, 1, isInteract ? '#fff5eb' : '#7a3b42');
  }

  /**
   * Draws Sunny the Golden Retriever (32×32 pixel frame, grounded at y = 31)
   * - 0, 1: Standing idle + tail wag
   * - 2, 3, 4, 5: Happy trotting walk + floppy ears + feathered tail wag
   * - 6: Polite sitting pose
   * - 7: Petted bliss pose + pixel heart!
   */
  private drawSunnyFrame(
    ctx: CanvasRenderingContext2D,
    ox: number,
    oy: number,
    frame: number
  ): void {
    const goldLight = '#f4cb78';
    const goldMid = '#e0a94f';
    const goldDeep = '#bd8231';
    const creamChest = '#fae6b6';
    const nose = '#241c18';
    const collar = '#c94f53';
    const tag = '#ffd966';
    const tongue = '#eb7c8d';

    const tailUp = frame % 2 === 0;
    const isSit = frame === 6 || frame === 7;
    const isPetted = frame === 7;
    const trotBob = frame === 2 || frame === 4 ? -1 : 0;

    if (isSit) {
      // Sitting Golden Retriever facing forward-right
      // Feathered wagging tail
      this.px(ctx, ox, oy, tailUp ? 6 : 5, tailUp ? 22 : 24, 4, 3, goldMid);
      this.px(ctx, ox, oy, tailUp ? 5 : 4, tailUp ? 20 : 23, 3, 2, creamChest);

      // Seated hindquarters & front paws
      this.px(ctx, ox, oy, 9, 21, 10, 9, goldMid);
      this.px(ctx, ox, oy, 9, 26, 5, 5, goldDeep);
      this.px(ctx, ox, oy, 15, 24, 5, 7, goldLight);
      this.px(ctx, ox, oy, 13, 29, 8, 2, creamChest);

      // Fluffy cream chest ruff & collar
      this.px(ctx, ox, oy, 14, 18, 7, 6, creamChest);
      this.px(ctx, ox, oy, 14, 17, 6, 2, collar);
      this.px(ctx, ox, oy, 18, 18, 2, 2, tag);

      // Head
      const headY = isPetted ? 9 : 10;
      this.px(ctx, ox, oy, 13, headY, 9, 7, goldLight);
      this.px(ctx, ox, oy, 20, headY + 3, 4, 4, goldMid);
      this.px(ctx, ox, oy, 23, headY + 3, 2, 2, nose);
      // Floppy golden ear
      this.px(ctx, ox, oy, 12, headY + 1, 3, 5, goldDeep);
      // Eye (happy squint when petted!)
      if (isPetted) {
        this.px(ctx, ox, oy, 18, headY + 3, 2, 1, nose);
        // Cute pixel heart floating above Sunny!
        this.px(ctx, ox, oy, 15, 3, 2, 2, '#eb6b7e');
        this.px(ctx, ox, oy, 18, 3, 2, 2, '#eb6b7e');
        this.px(ctx, ox, oy, 15, 5, 5, 2, '#eb6b7e');
        this.px(ctx, ox, oy, 16, 7, 3, 1, '#eb6b7e');
      } else {
        this.px(ctx, ox, oy, 18, headY + 2, 2, 2, nose);
      }
      this.px(ctx, ox, oy, 21, headY + 6, 2, 2, tongue);
      return;
    }

    // Standing / Trotting Golden Retriever
    const by = 18 + trotBob;

    // Feathered Golden Tail wagging
    if (tailUp) {
      this.px(ctx, ox, oy, 4, by - 2, 5, 3, goldMid);
      this.px(ctx, ox, oy, 3, by - 4, 4, 3, creamChest);
    } else {
      this.px(ctx, ox, oy, 4, by + 1, 5, 3, goldMid);
      this.px(ctx, ox, oy, 3, by + 2, 4, 2, creamChest);
    }

    // Four Trotting Legs (grounded at y = 31)
    const stride = frame === 2 ? 2 : frame === 4 ? -2 : 0;
    this.px(ctx, ox, oy, 9 + (stride > 0 ? 1 : 0), 25, 3, 6, goldDeep);
    this.px(ctx, ox, oy, 12 - (stride > 0 ? 1 : 0), 25, 3, 6, goldLight);
    this.px(ctx, ox, oy, 17 - (stride > 0 ? 1 : 0), 25, 3, 6, goldDeep);
    this.px(ctx, ox, oy, 20 + (stride > 0 ? 1 : 0), 25, 3, 6, goldLight);
    // Paws
    this.px(ctx, ox, oy, 9 + (stride > 0 ? 1 : 0), 30, 3, 1, creamChest);
    this.px(ctx, ox, oy, 20 + (stride > 0 ? 1 : 0), 30, 3, 1, creamChest);

    // Body & fluffy golden belly fringe
    this.px(ctx, ox, oy, 8, by, 15, 7, goldMid);
    this.px(ctx, ox, oy, 9, by, 13, 4, goldLight);
    this.px(ctx, ox, oy, 10, by + 5, 11, 2, creamChest);
    this.px(ctx, ox, oy, 18, by - 1, 6, 6, creamChest);

    // Red collar & golden heart tag
    this.px(ctx, ox, oy, 18, by - 2, 5, 2, collar);
    this.px(ctx, ox, oy, 22, by - 1, 2, 2, tag);

    // Head, snout, floppy ear & smiling pink tongue
    const hy = 11 + trotBob;
    this.px(ctx, ox, oy, 17, hy, 9, 7, goldLight);
    this.px(ctx, ox, oy, 24, hy + 3, 4, 4, goldMid);
    this.px(ctx, ox, oy, 27, hy + 3, 2, 2, nose);
    this.px(ctx, ox, oy, 16, hy + 1 + (frame === 3 ? -1 : 0), 3, 5, goldDeep);
    this.px(ctx, ox, oy, 22, hy + 2, 2, 2, nose);
    this.px(ctx, ox, oy, 25, hy + 6, 2, 2, tongue);
  }

  private renderPortrait(
    who: 'adi' | 'damini' | 'sunny',
    mood: 'warm' | 'playful' | 'happy'
  ): string {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 64;
    const ctx = c.getContext('2d')!;
    ctx.imageSmoothingEnabled = false;

    // Soft warm portrait backing circle
    ctx.fillStyle =
      who === 'adi' ? '#2c3d35' : who === 'damini' ? '#4a2c38' : '#4a3a22';
    ctx.fillRect(0, 0, 64, 64);

    const temp = document.createElement('canvas');
    temp.width = 32;
    temp.height = 32;
    const tctx = temp.getContext('2d')!;
    tctx.imageSmoothingEnabled = false;

    const frameIdx = mood === 'happy' ? 7 : mood === 'playful' ? 2 : 0;
    if (who === 'adi') {
      this.drawAdiFrame(tctx, 0, 0, frameIdx);
      ctx.drawImage(temp, 4, 1, 24, 24, 0, 2, 64, 64);
    } else if (who === 'damini') {
      this.drawDaminiFrame(tctx, 0, 0, frameIdx);
      ctx.drawImage(temp, 4, 2, 24, 24, 0, 2, 64, 64);
    } else {
      this.drawSunnyFrame(tctx, 0, 0, mood === 'happy' ? 7 : 6);
      ctx.drawImage(temp, 4, 6, 24, 24, 0, 2, 64, 64);
    }

    return c.toDataURL();
  }

  public dispose(): void {
    for (const t of this.textures) t.dispose();
    this.textures = [];
  }
}
