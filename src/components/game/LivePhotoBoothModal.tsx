import {
  Camera,
  Check,
  Download,
  Film,
  Heart,
  Image as ImageIcon,
  Palette,
  RefreshCw,
  Sparkles,
  Upload,
  UserCheck,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PhotoStorage } from '../../game/PhotoStorage';
import {
  PhotoBoothFrameStyle,
  PhotoSticker,
  StoredUploadedPhoto,
} from '../../game/types';

interface LivePhotoBoothModalProps {
  locationId?: string;
  locationName?: string;
  defaultPortraitUrl?: string;
  onSaveKeepsake?: (photo: StoredUploadedPhoto) => void;
  onClose: () => void;
}

const AVAILABLE_STICKERS: Array<{
  type: PhotoSticker['type'];
  label: string;
  display: string;
}> = [
  { type: 'heart', label: 'Heart', display: '❤️' },
  { type: 'star', label: 'Sparkles', display: '✨' },
  { type: 'tram', label: 'Tram', display: '🚋' },
  { type: 'paw', label: 'Sunny Paw', display: '🐾' },
  { type: 'adams', label: 'Adi + Dams', display: 'Adi & Dams 💕' },
  { type: 'dreamland', label: 'Melbourne Dreamland', display: 'Melbourne Dreamland' },
  {
    type: 'date',
    label: 'Date Stamp',
    display:
      'MELB · ' +
      new Date().toLocaleDateString('en-AU', {
        month: 'short',
        year: 'numeric',
      }),
  },
];

export function LivePhotoBoothModal({
  locationId = 'arcade-photobooth',
  locationName = 'Vintage Photo Booth · Arcade Alley',
  onSaveKeepsake,
  onClose,
}: LivePhotoBoothModalProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  // Camera permissions & state
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(false);

  // Simplified Rock-Solid Filter Style: 'normal' (color) vs 'bw' (black & white)
  const [colorMode, setColorMode] = useState<'normal' | 'bw'>('bw');
  const [format, setFormat] = useState<'strip' | 'single'>('strip');
  const [frameStyle, setFrameStyle] =
    useState<PhotoBoothFrameStyle>('bw-strip');
  const [caption, setCaption] = useState('Arcade Alley Keepsake');

  // Shooting workflow
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [composedDataUrl, setComposedDataUrl] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Stickers
  const [stickers, setStickers] = useState<PhotoSticker[]>([
    {
      id: 'default-stamp',
      type: 'date',
      label:
        'MELB · ' +
        new Date().toLocaleDateString('en-AU', {
          month: 'short',
          year: 'numeric',
        }),
      xPercent: 50,
      yPercent: 94,
    },
  ]);

  // Play shutter sound effect
  const playShutterSound = useCallback(() => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(820, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(140, ctx.currentTime + 0.12);
      gain.gain.setValueAtTime(0.35, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.12);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.13);
    } catch {
      // AudioContext unavailable
    }
  }, []);

  // Initialize webcam
  const startCamera = useCallback(async () => {
    setIsInitializing(true);
    setCameraError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam not supported in this browser environment');
      }
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: 'user',
          width: { ideal: 1280 },
          height: { ideal: 960 },
        },
        audio: false,
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.playsInline = true;
        videoRef.current.muted = true;
        videoRef.current.onloadedmetadata = () => {
          videoRef.current?.play().catch(() => {});
          setCameraActive(true);
        };
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(
        msg.includes('Permission')
          ? 'Camera permission was paused. You can use our Couple Portrait or upload a selfie below!'
          : 'Camera is currently unavailable in this browser. You can still create photos using the Couple Portrait or file upload!'
      );
      setCameraActive(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Stop camera cleanly
  const stopCamera = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraActive(false);
  }, []);

  useEffect(() => {
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Capture single frame from webcam OR romantic fallback illustration
  const captureFrameSource = useCallback((): string => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (cameraActive && video && video.videoWidth > 0 && !video.paused) {
      // Draw mirrored selfie
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
    } else {
      // Create lovely illustrative scene of Adi & Damini in the Melbourne arcade booth
      const grad = ctx.createLinearGradient(0, 0, width, height);
      grad.addColorStop(0, '#361e27');
      grad.addColorStop(0.5, '#22151b');
      grad.addColorStop(1, '#150d11');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // Warm velvet curtain borders
      ctx.fillStyle = '#6e2434';
      ctx.fillRect(0, 0, 70, height);
      ctx.fillRect(width - 70, 0, 70, height);

      // Gold marquee banner at top
      ctx.fillStyle = '#f5ca7a';
      ctx.font = '700 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('MELBOURNE DREAMLAND', width / 2, 70);

      // Sweet romantic silhouette representation
      ctx.fillStyle = '#fff4ea';
      ctx.font = '700 36px Georgia, serif';
      ctx.fillText('Adi & Damini 💕', width / 2, 220);

      ctx.fillStyle = '#f2a5b6';
      ctx.font = '20px sans-serif';
      ctx.fillText('Arcade Alley Photobooth', width / 2, 265);

      ctx.font = '28px sans-serif';
      ctx.fillText('✨ 📸 🚋 🐾 ✨', width / 2, 320);

      ctx.font = '14px monospace';
      ctx.fillStyle = '#c8b4a2';
      ctx.fillText(
        new Date().toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }),
        width / 2,
        370
      );
    }

    return canvas.toDataURL('image/png');
  }, [cameraActive]);

  // Trigger countdown shoot
  const triggerShutter = useCallback(() => {
    if (countdown !== null) return;
    const targetCount = format === 'strip' ? 4 : 1;
    setCapturedFrames([]);
    setComposedDataUrl(null);
    setSavedSuccess(false);

    let currentShot = 0;

    const runOneShot = () => {
      let count = 3;
      setCountdown(count);
      setActiveShotIndex(currentShot);

      const timer = setInterval(() => {
        count -= 1;
        if (count > 0) {
          setCountdown(count);
        } else {
          clearInterval(timer);
          setCountdown(null);

          // Flash
          setFlashActive(true);
          playShutterSound();
          setTimeout(() => setFlashActive(false), 200);

          const frame = captureFrameSource();
          setCapturedFrames((prev) => [...prev, frame]);

          currentShot += 1;
          if (currentShot < targetCount) {
            setTimeout(runOneShot, 1100);
          }
        }
      }, 1000);
    };

    runOneShot();
  }, [countdown, format, captureFrameSource, playShutterSound]);

  // Instant snap couple portrait without waiting
  const handleSnapInstantCouple = () => {
    const frame = captureFrameSource();
    if (format === 'strip') {
      setCapturedFrames([frame, frame, frame, frame]);
    } else {
      setCapturedFrames([frame]);
    }
  };

  // Compose output strip / polaroid onto canvas
  const composeOutputCanvas = useCallback(async () => {
    if (capturedFrames.length === 0) return;

    const loadedImages: HTMLImageElement[] = await Promise.all(
      capturedFrames.map(
        (src) =>
          new Promise<HTMLImageElement>((resolve, reject) => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = reject;
            img.src = src;
          })
      )
    );

    const canvas = canvasRef.current || document.createElement('canvas');

    if (format === 'strip') {
      // Vertical 4-frame strip (width: 480, height: 1620)
      const stripWidth = 480;
      const margin = 26;
      const photoWidth = stripWidth - margin * 2;
      const photoHeight = Math.round((photoWidth * 3) / 4);
      const gap = 18;
      const footerHeight = 150;

      const totalHeight =
        margin +
        loadedImages.length * photoHeight +
        (loadedImages.length - 1) * gap +
        footerHeight;

      canvas.width = stripWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d')!;

      // Cardstock background
      ctx.fillStyle =
        frameStyle === 'romantic-pink'
          ? '#fdf0ec'
          : frameStyle === 'arcade-retro'
            ? '#1a1420'
            : '#fdfbf6';
      ctx.fillRect(0, 0, stripWidth, totalHeight);

      // Subtle inner border
      ctx.strokeStyle =
        frameStyle === 'arcade-retro' ? '#e28ca0' : '#e5d7c3';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, stripWidth - 20, totalHeight - 20);

      let currentY = margin;
      for (let i = 0; i < loadedImages.length; i++) {
        const img = loadedImages[i];

        // Draw photo with chosen Normal Color vs Black & White filter
        ctx.save();
        if (colorMode === 'bw') {
          ctx.filter = 'grayscale(100%) contrast(125%) brightness(96%)';
        } else {
          ctx.filter = 'none';
        }
        ctx.drawImage(img, margin, currentY, photoWidth, photoHeight);
        ctx.restore();

        // Frame border around each photo
        ctx.strokeStyle =
          frameStyle === 'arcade-retro' ? '#f5ca7a' : '#dcd0bc';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, currentY, photoWidth, photoHeight);

        currentY += photoHeight + gap;
      }

      // Footer branding
      ctx.textAlign = 'center';
      ctx.fillStyle =
        frameStyle === 'arcade-retro' ? '#ffffff' : '#2b1f1a';
      ctx.font = '700 22px Georgia, serif';
      ctx.fillText(
        caption.trim() || 'Melbourne Dreamland',
        stripWidth / 2,
        currentY + 44
      );

      ctx.fillStyle =
        frameStyle === 'arcade-retro' ? '#f0a886' : '#887464';
      ctx.font = '600 13px sans-serif';
      ctx.fillText(
        'ARCADE ALLEY · ' +
          new Date()
            .toLocaleDateString('en-AU', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })
            .toUpperCase(),
        stripWidth / 2,
        currentY + 72
      );

      ctx.font = '12px monospace';
      ctx.fillStyle =
        frameStyle === 'arcade-retro' ? '#c8b4a2' : '#a89887';
      ctx.fillText('ADI & DAMINI · FOREVER 💕', stripWidth / 2, currentY + 98);

      // Render stickers
      for (const st of stickers) {
        ctx.save();
        const sx = (st.xPercent / 100) * stripWidth;
        const sy = (st.yPercent / 100) * totalHeight;
        ctx.font = '28px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.label, sx, sy);
        ctx.restore();
      }

      setComposedDataUrl(canvas.toDataURL('image/png'));
    } else {
      // Single Polaroid card (width: 580, height: 720)
      const cardWidth = 580;
      const cardHeight = 720;
      const margin = 32;
      const photoWidth = cardWidth - margin * 2;
      const photoHeight = 430;

      canvas.width = cardWidth;
      canvas.height = cardHeight;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle =
        frameStyle === 'romantic-pink' ? '#fdf0ec' : '#fdfbf6';
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      ctx.strokeStyle = '#e5d7c3';
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, cardWidth - 24, cardHeight - 24);

      if (loadedImages[0]) {
        ctx.save();
        if (colorMode === 'bw') {
          ctx.filter = 'grayscale(100%) contrast(125%) brightness(96%)';
        } else {
          ctx.filter = 'none';
        }
        ctx.drawImage(loadedImages[0], margin, margin, photoWidth, photoHeight);
        ctx.restore();

        ctx.strokeStyle = '#dcd0bc';
        ctx.strokeRect(margin, margin, photoWidth, photoHeight);
      }

      // Polaroid footer
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2b1f1a';
      ctx.font = '700 24px Georgia, serif';
      ctx.fillText(
        caption.trim() || 'Our Melbourne Keepsake',
        cardWidth / 2,
        535
      );

      ctx.font = '14px sans-serif';
      ctx.fillStyle = '#7a6858';
      ctx.fillText(
        new Date().toLocaleDateString('en-AU', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
        cardWidth / 2,
        575
      );

      ctx.font = '12px sans-serif';
      ctx.fillStyle = '#9c8c7d';
      ctx.fillText('Adi & Damini · Melbourne Dreamland 💕', cardWidth / 2, 610);

      for (const st of stickers) {
        ctx.save();
        const sx = (st.xPercent / 100) * cardWidth;
        const sy = (st.yPercent / 100) * cardHeight;
        ctx.font = '30px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.label, sx, sy);
        ctx.restore();
      }

      setComposedDataUrl(canvas.toDataURL('image/png'));
    }
  }, [capturedFrames, format, frameStyle, colorMode, caption, stickers]);

  // Re-compose whenever frames, format, or colorMode changes
  useEffect(() => {
    if (capturedFrames.length > 0) {
      composeOutputCanvas();
    }
  }, [capturedFrames, composeOutputCanvas]);

  // Save to Keepsakes (IndexedDB)
  const handleSaveToKeepsakes = async () => {
    if (!composedDataUrl) return;
    const entry = await PhotoStorage.addCapturedPhoto(
      locationId,
      composedDataUrl,
      caption || 'Arcade Photo Booth Strip',
      frameStyle,
      colorMode === 'bw' ? 'classic-bw' : 'natural',
      new Date().toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      })
    );
    setSavedSuccess(true);
    if (onSaveKeepsake) {
      onSaveKeepsake(entry);
    }
  };

  // Download image
  const handleDownload = () => {
    if (!composedDataUrl) return;
    const link = document.createElement('a');
    link.download = `melbourne-photobooth-${colorMode}-${Date.now()}.png`;
    link.href = composedDataUrl;
    link.click();
  };

  // File upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        if (format === 'strip') {
          setCapturedFrames([src, src, src, src]);
        } else {
          setCapturedFrames([src]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddSticker = (item: (typeof AVAILABLE_STICKERS)[0]) => {
    setStickers((prev) => [
      ...prev,
      {
        id: `st-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        type: item.type,
        label: item.display,
        xPercent: 20 + Math.random() * 60,
        yPercent: 30 + Math.random() * 40,
      },
    ]);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="photobooth-title"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm"
    >
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#e8d5be]/30 bg-[#1c1514] text-[#fbf3e6] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8d5be]/15 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#59222c] text-[#f5caa0] border border-[#f5caa0]/40">
              <Film className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="photobooth-title"
                className="font-['Fraunces'] text-xl font-bold tracking-tight text-[#fbf2e3]"
              >
                Vintage Melbourne Photo Booth
              </h2>
              <p className="text-xs text-[#cbbba7]">{locationName}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e8d5be]/20 bg-[#2a221f] p-2 text-[#d6c5b3] transition-colors hover:bg-[#382d29] hover:text-[#fff5e6] cursor-pointer"
            title="Close Photo Booth (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content Body: Split Viewfinder & Output */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Left Column: Live Viewfinder & Controls (7 cols) */}
          <div className="flex flex-col border-b border-[#e8d5be]/15 p-5 lg:col-span-7 lg:border-b-0 lg:border-r">
            {/* Viewfinder Window */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-[#59222c] bg-[#120f0e] shadow-inner">
              <canvas ref={canvasRef} className="hidden" />

              {/* Video Element */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover transition-all duration-300 [transform:scaleX(-1)] ${
                  colorMode === 'bw'
                    ? 'grayscale contrast-125 brightness-95'
                    : 'contrast-105'
                } ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Flash animation */}
              {flashActive && (
                <div className="absolute inset-0 z-30 bg-white transition-opacity duration-150" />
              )}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/45">
                  <span className="font-['Fraunces'] text-8xl font-black text-[#fff6ea] drop-shadow-lg animate-ping">
                    {countdown}
                  </span>
                  {format === 'strip' && (
                    <span className="mt-2 rounded-full bg-[#59222c]/90 px-4 py-1 text-sm font-semibold text-[#f5caa0]">
                      Frame {activeShotIndex + 1} of 4
                    </span>
                  )}
                </div>
              )}

              {/* Camera Fallback / In-Booth Couple View */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-gradient-to-b from-[#2d1b22] to-[#160f12]">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#59222c] text-[#f5caa0] border border-[#f5caa0]/30 shadow-lg">
                    <Camera className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-semibold text-[#fbf2e3]">
                    {isInitializing
                      ? 'Starting Camera…'
                      : 'Arcade Couple Photo Booth'}
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-[#cbbba7]">
                    {cameraError ||
                      'Snap a photo with your webcam, create an in-booth couple strip, or upload a photo!'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-1.5 rounded-xl bg-[#e69a7b] px-3.5 py-2 text-xs font-semibold text-[#1f1613] hover:bg-[#f0ac8e] cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Use Webcam</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleSnapInstantCouple}
                      className="flex items-center gap-1.5 rounded-xl bg-[#59222c] px-3.5 py-2 text-xs font-semibold text-white hover:bg-[#722b39] cursor-pointer"
                    >
                      <UserCheck className="h-3.5 w-3.5 text-[#f5caa0]" />
                      <span>Snap Couple Portrait</span>
                    </button>

                    <label className="flex items-center gap-1.5 rounded-xl border border-[#e8d5be]/25 bg-[#2a221f] px-3.5 py-2 text-xs font-medium text-[#f3e7d6] hover:bg-[#382d29] cursor-pointer">
                      <Upload className="h-3.5 w-3.5 text-[#f2be72]" />
                      <span>Upload Photo</span>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                    </label>
                  </div>
                </div>
              )}

              {/* Viewfinder Badges */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 text-[10px] font-mono uppercase tracking-wider text-[#e8d5be]/60">
                <div className="flex justify-between">
                  <span>MELB · 35MM</span>
                  <span>{format === 'strip' ? '4-FRAME STRIP' : 'POLAROID'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ISO 400</span>
                  <span className="font-bold text-[#f5caa0]">
                    {colorMode === 'bw' ? 'BLACK & WHITE' : 'NORMAL (COLOR)'}
                  </span>
                </div>
              </div>
            </div>

            {/* COLOR MODE TOGGLE: Normal vs Black & White */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-[#e8d5be]/20 bg-[#161211] p-3">
              <div className="flex items-center gap-2">
                <Palette className="h-4 w-4 text-[#f5caa0]" />
                <span className="text-xs font-semibold text-[#fbf2e3]">
                  Photo Style:
                </span>
              </div>

              <div className="flex items-center rounded-xl bg-[#261c19] p-1 border border-[#e8d5be]/15">
                <button
                  type="button"
                  onClick={() => setColorMode('normal')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    colorMode === 'normal'
                      ? 'bg-[#e69a7b] text-[#1c1412] shadow-sm'
                      : 'text-[#baa897] hover:text-[#fff5e6]'
                  }`}
                >
                  <span>Normal (Color)</span>
                </button>
                <button
                  type="button"
                  onClick={() => setColorMode('bw')}
                  className={`flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition-all cursor-pointer ${
                    colorMode === 'bw'
                      ? 'bg-[#59222c] text-[#fbf2e3] shadow-sm'
                      : 'text-[#baa897] hover:text-[#fff5e6]'
                  }`}
                >
                  <span>Black &amp; White</span>
                </button>
              </div>
            </div>

            {/* Format & Shutter Buttons */}
            <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
              {/* Format selection */}
              <div className="flex items-center rounded-xl bg-[#14100e] p-1 border border-[#e8d5be]/15">
                <button
                  type="button"
                  onClick={() => {
                    setFormat('strip');
                    setFrameStyle('bw-strip');
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    format === 'strip'
                      ? 'bg-[#59222c] text-[#fbf2e3]'
                      : 'text-[#baa897] hover:text-[#fff5e6]'
                  }`}
                >
                  <Film className="h-3.5 w-3.5" />
                  <span>4-Shot Strip</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setFormat('single');
                    setFrameStyle('polaroid');
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    format === 'single'
                      ? 'bg-[#59222c] text-[#fbf2e3]'
                      : 'text-[#baa897] hover:text-[#fff5e6]'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Polaroid Card</span>
                </button>
              </div>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={triggerShutter}
                disabled={countdown !== null}
                className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-[#e69a7b] to-[#df8361] px-6 py-2.5 font-bold text-[#1c1412] shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                <span>
                  {countdown !== null
                    ? `Shooting (${countdown}s)…`
                    : format === 'strip'
                      ? 'Take 4-Shot Strip'
                      : 'Snap Polaroid'}
                </span>
              </button>
            </div>

            {/* Frame Styles */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-[#baa897]">
                Frame Border Style
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5">
                {(
                  [
                    ['bw-strip', 'Classic Cream'],
                    ['romantic-pink', 'Romantic Blush'],
                    ['arcade-retro', 'Arcade Neon'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFrameStyle(id)}
                    className={`rounded-xl border px-2.5 py-1.5 text-center text-xs font-medium transition-colors cursor-pointer ${
                      frameStyle === id
                        ? 'border-[#f2c6a0] bg-[#3a272b] text-[#fff6ea]'
                        : 'border-[#e8d5be]/15 bg-[#181311] text-[#baa897] hover:bg-[#251d1a]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Note & Stickers */}
            <div className="mt-3 flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#baa897]">
                Keepsake Caption &amp; Stickers
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a sweet caption for this memory…"
                className="w-full rounded-xl border border-[#e8d5be]/20 bg-[#161210] px-3.5 py-2 text-xs text-[#fbf3e6] outline-none focus:border-[#f2c6a0]"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                <span className="text-[11px] text-[#8e7e70]">Add Sticker:</span>
                {AVAILABLE_STICKERS.map((st) => (
                  <button
                    key={st.type}
                    type="button"
                    onClick={() => handleAddSticker(st)}
                    className="flex items-center gap-1 rounded-lg border border-[#e8d5be]/20 bg-[#251d1a] px-2 py-1 text-xs text-[#e8d5be] transition-colors hover:bg-[#382b26] cursor-pointer"
                  >
                    <span>{st.display}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Right Column: Instant Print Preview (5 cols) */}
          <div className="flex flex-col items-center justify-between bg-[#14100e] p-5 lg:col-span-5">
            <div className="w-full text-center">
              <span className="text-xs font-bold uppercase tracking-wider text-[#baa897]">
                Keepsake Print Preview ({colorMode === 'bw' ? 'B&W' : 'Color'})
              </span>
            </div>

            {/* Preview Card */}
            <div className="my-auto flex w-full max-w-[280px] flex-col items-center justify-center py-4">
              {composedDataUrl ? (
                <div className="overflow-hidden rounded-xl shadow-2xl border border-[#e8d5be]/30 transition-transform duration-200 hover:scale-[1.02]">
                  <img
                    src={composedDataUrl}
                    alt="Melbourne Photo Booth Keepsake"
                    className="max-h-[55vh] w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-72 w-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e8d5be]/20 bg-[#1c1614] p-4 text-center">
                  <Camera className="h-8 w-8 text-[#8c7a6d] mb-2" />
                  <p className="text-xs font-medium text-[#baa897]">
                    Ready to take photos
                  </p>
                  <p className="mt-1 text-[11px] text-[#786a5e]">
                    Click &ldquo;Take 4-Shot Strip&rdquo; or &ldquo;Snap Couple
                    Portrait&rdquo;
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="flex w-full flex-col gap-2 pt-2">
              <button
                type="button"
                onClick={handleSaveToKeepsakes}
                disabled={!composedDataUrl}
                className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-semibold transition-all cursor-pointer ${
                  savedSuccess
                    ? 'bg-[#5e966e] text-white'
                    : 'bg-[#59222c] text-[#fbf2e3] hover:bg-[#6e2c38] disabled:opacity-40'
                }`}
              >
                {savedSuccess ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Saved to Keepsakes Shelf!</span>
                  </>
                ) : (
                  <>
                    <Heart className="h-4 w-4 text-[#f5caa0]" />
                    <span>Save to Keepsake Gallery</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleDownload}
                disabled={!composedDataUrl}
                className="flex w-full items-center justify-center gap-1.5 rounded-xl border border-[#e8d5be]/20 bg-[#251d1a] py-2 text-xs font-medium text-[#ebd7bf] transition-colors hover:bg-[#342823] disabled:opacity-40 cursor-pointer"
              >
                <Download className="h-3.5 w-3.5 text-[#f5caa0]" />
                <span>Download Photo (PNG)</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
