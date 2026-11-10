import {
  Camera,
  Check,
  ChevronRight,
  Download,
  Film,
  Heart,
  Image as ImageIcon,
  Layers,
  RefreshCw,
  Sparkles,
  Upload,
  Volume2,
  X,
} from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { PhotoStorage } from '../../game/PhotoStorage';
import {
  PhotoBoothFrameStyle,
  PhotoBoothTone,
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
  { type: 'date', label: 'Date Stamp', display: 'MELB · ' + new Date().toLocaleDateString('en-AU', { month: 'short', year: 'numeric' }) },
];

export function LivePhotoBoothModal({
  locationId = 'arcade-photobooth',
  locationName = 'Vintage B&W Photo Booth · Arcade Alley',
  defaultPortraitUrl,
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

  // Photo mode & options
  const [mode, setMode] = useState<'strip' | 'single'>('strip');
  const [tone, setTone] = useState<PhotoBoothTone>('classic-bw');
  const [frameStyle, setFrameStyle] = useState<PhotoBoothFrameStyle>('bw-strip');
  const [caption, setCaption] = useState('Arcade Alley Memories');

  // Shooting workflow
  const [countdown, setCountdown] = useState<number | null>(null);
  const [flashActive, setFlashActive] = useState(false);
  const [capturedFrames, setCapturedFrames] = useState<string[]>([]);
  const [activeShotIndex, setActiveShotIndex] = useState<number>(0);
  const [composedDataUrl, setComposedDataUrl] = useState<string | null>(null);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Sticker overlays
  const [stickers, setStickers] = useState<PhotoSticker[]>([
    {
      id: 'default-stamp',
      type: 'date',
      label: 'MELB · 2026',
      xPercent: 50,
      yPercent: 95,
    },
  ]);

  // Audio flash sound effect
  const playShutterSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(800, ctx.currentTime);
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
        await videoRef.current.play();
      }
      setCameraActive(true);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setCameraError(
        msg.includes('Permission')
          ? 'Camera access was declined. You can enable permissions in browser settings or upload a selfie below.'
          : 'Could not access camera. You can still create photos using the upload option!'
      );
      setCameraActive(false);
    } finally {
      setIsInitializing(false);
    }
  }, []);

  // Stop camera stream cleanly
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
    // Attempt camera connection on mount
    startCamera();
    return () => {
      stopCamera();
    };
  }, [startCamera, stopCamera]);

  // Capture single frame from video or fallback image
  const captureRawFrame = useCallback((): string => {
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    const width = 640;
    const height = 480;
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext('2d')!;

    if (cameraActive && video && video.videoWidth > 0) {
      // Mirror horizontally for natural selfie view
      ctx.translate(width, 0);
      ctx.scale(-1, 1);
      ctx.drawImage(video, 0, 0, width, height);
    } else {
      // Fallback: draw stylish placeholder if camera isn't active
      ctx.fillStyle = '#221a18';
      ctx.fillRect(0, 0, width, height);
      ctx.fillStyle = '#e8d5be';
      ctx.font = '600 24px Georgia, serif';
      ctx.textAlign = 'center';
      ctx.fillText('Adi & Damini', width / 2, height / 2 - 20);
      ctx.font = '16px sans-serif';
      ctx.fillStyle = '#f0a886';
      ctx.fillText('Melbourne Dreamland Keepsake', width / 2, height / 2 + 16);
    }

    return canvas.toDataURL('image/jpeg', 0.92);
  }, [cameraActive]);

  // Apply B&W and analog tone transforms to an ImageData context
  const applyToneFilter = useCallback(
    (ctx: CanvasRenderingContext2D, width: number, height: number, selectedTone: PhotoBoothTone) => {
      if (selectedTone === 'natural') return;

      const imgData = ctx.getImageData(0, 0, width, height);
      const data = imgData.data;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Standard luminance
        let gray = 0.299 * r + 0.587 * g + 0.114 * b;

        if (selectedTone === 'classic-bw') {
          // Classic analog film curve: mild S-curve contrast + gentle film grain
          const normalized = gray / 255;
          const contrasted = (Math.sin((normalized - 0.5) * Math.PI) + 1) / 2;
          const noise = (Math.random() - 0.5) * 12;
          const finalVal = Math.max(0, Math.min(255, contrasted * 255 + noise));
          data[i] = finalVal;
          data[i + 1] = finalVal;
          data[i + 2] = finalVal;
        } else if (selectedTone === 'noir-contrast') {
          // High contrast Noir (deep shadows, punchy silver whites)
          let c = (gray - 128) * 1.6 + 128;
          c = Math.max(0, Math.min(255, c));
          data[i] = c;
          data[i + 1] = c;
          data[i + 2] = c;
        } else if (selectedTone === 'warm-silver') {
          // Warm silver / sepia tone
          data[i] = Math.min(255, gray * 1.08 + 14);
          data[i + 1] = Math.min(255, gray * 0.98 + 6);
          data[i + 2] = Math.min(255, gray * 0.85);
        } else if (selectedTone === 'soft-grain') {
          // Soft vintage matte with visible analog grain
          const noise = (Math.random() - 0.5) * 22;
          const soft = gray * 0.88 + 24 + noise;
          const val = Math.max(0, Math.min(255, soft));
          data[i] = val;
          data[i + 1] = val;
          data[i + 2] = val;
        }
      }

      ctx.putImageData(imgData, 0, 0);
    },
    []
  );

  // Trigger countdown shoot workflow
  const triggerShutter = useCallback(() => {
    if (countdown !== null) return;
    const targetCount = mode === 'strip' ? 4 : 1;
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
          // Snap!
          setFlashActive(true);
          playShutterSound();
          setTimeout(() => setFlashActive(false), 200);

          const frame = captureRawFrame();
          setCapturedFrames((prev) => {
            const next = [...prev, frame];
            return next;
          });

          currentShot += 1;
          if (currentShot < targetCount) {
            setTimeout(runOneShot, 1200);
          }
        }
      }, 1000);
    };

    runOneShot();
  }, [countdown, mode, captureRawFrame, playShutterSound]);

  // Compose finished photostrip or card onto high-res canvas
  const composeOutputCanvas = useCallback(async () => {
    if (capturedFrames.length === 0) return;

    // Load all frames as HTMLImageElements
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

    if (mode === 'strip') {
      // Classic 4-Frame Vertical Photo Booth Strip (width 480, height 1600)
      const stripWidth = 480;
      const margin = 28;
      const photoWidth = stripWidth - margin * 2;
      const photoHeight = Math.round((photoWidth * 3) / 4);
      const bottomFooterHeight = 160;
      const gap = 20;

      const totalHeight =
        margin +
        loadedImages.length * photoHeight +
        (loadedImages.length - 1) * gap +
        bottomFooterHeight;

      canvas.width = stripWidth;
      canvas.height = totalHeight;
      const ctx = canvas.getContext('2d')!;

      // Background card
      if (frameStyle === 'romantic-pink') {
        ctx.fillStyle = '#fceee9';
      } else if (frameStyle === 'arcade-retro') {
        ctx.fillStyle = '#1c1822';
      } else {
        // Classic warm cream photobooth cardstock
        ctx.fillStyle = '#fbf7ee';
      }
      ctx.fillRect(0, 0, stripWidth, totalHeight);

      // Delicate inner border line
      ctx.strokeStyle = frameStyle === 'arcade-retro' ? '#e28ca0' : '#e6d8c3';
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 10, stripWidth - 20, totalHeight - 20);

      // Draw each photo frame
      let currentY = margin;
      for (let i = 0; i < loadedImages.length; i++) {
        const img = loadedImages[i];

        // Draw photo onto temp canvas for filter application
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = photoWidth;
        tempCanvas.height = photoHeight;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(img, 0, 0, photoWidth, photoHeight);
        applyToneFilter(tempCtx, photoWidth, photoHeight, tone);

        // Draw onto strip
        ctx.drawImage(tempCanvas, margin, currentY);

        // Frame border
        ctx.strokeStyle = frameStyle === 'arcade-retro' ? '#f5cf76' : '#dfd2bd';
        ctx.lineWidth = 2;
        ctx.strokeRect(margin, currentY, photoWidth, photoHeight);

        currentY += photoHeight + gap;
      }

      // Strip Footer Branding
      ctx.textAlign = 'center';
      ctx.fillStyle = frameStyle === 'arcade-retro' ? '#ffffff' : '#2d221e';
      ctx.font = '700 22px Georgia, serif';
      ctx.fillText(caption.trim() || 'Melbourne Dreamland', stripWidth / 2, currentY + 45);

      ctx.fillStyle = frameStyle === 'arcade-retro' ? '#f0a886' : '#8a7868';
      ctx.font = '600 13px sans-serif';
      ctx.fillText(
        'ARCADE ALLEY · ' +
          new Date().toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          }).toUpperCase(),
        stripWidth / 2,
        currentY + 74
      );

      ctx.font = '12px monospace';
      ctx.fillStyle = frameStyle === 'arcade-retro' ? '#c7a7e8' : '#a89887';
      ctx.fillText('ADI & DAMINI · FOREVER', stripWidth / 2, currentY + 102);

      // Draw Stickers
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
      // Single Polaroid / Postcard Card (width 600, height 740)
      const cardWidth = 600;
      const cardHeight = 740;
      const margin = 32;
      const photoWidth = cardWidth - margin * 2;
      const photoHeight = 440;

      canvas.width = cardWidth;
      canvas.height = cardHeight;
      const ctx = canvas.getContext('2d')!;

      ctx.fillStyle = frameStyle === 'romantic-pink' ? '#fdeee8' : '#faf5eb';
      ctx.fillRect(0, 0, cardWidth, cardHeight);

      // Frame border
      ctx.strokeStyle = '#e6dcce';
      ctx.lineWidth = 2;
      ctx.strokeRect(12, 12, cardWidth - 24, cardHeight - 24);

      if (loadedImages[0]) {
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = photoWidth;
        tempCanvas.height = photoHeight;
        const tempCtx = tempCanvas.getContext('2d')!;
        tempCtx.drawImage(loadedImages[0], 0, 0, photoWidth, photoHeight);
        applyToneFilter(tempCtx, photoWidth, photoHeight, tone);

        ctx.drawImage(tempCanvas, margin, margin);
        ctx.strokeStyle = '#d5c7b3';
        ctx.strokeRect(margin, margin, photoWidth, photoHeight);
      }

      // Handwriting-style caption area
      ctx.textAlign = 'center';
      ctx.fillStyle = '#2b211d';
      ctx.font = '700 24px Georgia, serif';
      ctx.fillText(caption.trim() || 'Our Melbourne Keepsake', cardWidth / 2, 535);

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
      ctx.fillText('Adi & Damini · Melbourne Dreamland', cardWidth / 2, 610);

      // Stickers
      for (const st of stickers) {
        ctx.save();
        const sx = (st.xPercent / 100) * cardWidth;
        const sy = (st.yPercent / 100) * cardHeight;
        ctx.font = '32px sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(st.label, sx, sy);
        ctx.restore();
      }

      setComposedDataUrl(canvas.toDataURL('image/png'));
    }
  }, [capturedFrames, mode, frameStyle, tone, caption, stickers, applyToneFilter]);

  // When captured frames change, trigger composition
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
      tone,
      new Date().toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
    );
    setSavedSuccess(true);
    if (onSaveKeepsake) {
      onSaveKeepsake(entry);
    }
  };

  // Download composed image
  const handleDownload = () => {
    if (!composedDataUrl) return;
    const link = document.createElement('a');
    link.download = `melbourne-photobooth-${Date.now()}.png`;
    link.href = composedDataUrl;
    link.click();
  };

  // File upload fallback
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const src = event.target?.result as string;
      if (src) {
        if (mode === 'strip') {
          setCapturedFrames([src, src, src, src]);
        } else {
          setCapturedFrames([src]);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  // Add sticker
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
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-5"
    >
      <div className="relative flex max-h-[94vh] w-full max-w-5xl flex-col overflow-hidden rounded-3xl border border-[#e8d5be]/30 bg-[#1e1715] text-[#fbf3e6] shadow-2xl">
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
                Vintage B&W Photo Booth
              </h2>
              <p className="text-xs text-[#cbbba7]">{locationName}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-[#e8d5be]/20 bg-[#2a221f] p-2 text-[#d6c5b3] transition-colors hover:bg-[#382d29] hover:text-[#fff5e6] cursor-pointer"
              title="Close Photo Booth"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Content Body: Split layout */}
        <div className="grid min-h-0 flex-1 grid-cols-1 overflow-y-auto lg:grid-cols-12">
          {/* Left Column: Live Camera & Shooting Area (7 cols) */}
          <div className="flex flex-col border-b border-[#e8d5be]/15 p-5 lg:col-span-7 lg:border-b-0 lg:border-r">
            {/* Camera Viewfinder */}
            <div className="relative aspect-[4/3] w-full overflow-hidden rounded-2xl border-2 border-[#59222c] bg-[#120f0e] shadow-inner">
              {/* Hidden Canvas for Compositing */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Real Video Stream (Mirrored for selfie preview) */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`h-full w-full object-cover transition-all duration-300 [transform:scaleX(-1)] ${
                  tone === 'classic-bw'
                    ? 'grayscale contrast-125'
                    : tone === 'noir-contrast'
                      ? 'grayscale contrast-150 brightness-95'
                      : tone === 'warm-silver'
                        ? 'sepia contrast-110 brightness-105'
                        : tone === 'soft-grain'
                          ? 'grayscale brightness-110 contrast-90'
                          : ''
                } ${cameraActive ? 'opacity-100' : 'opacity-0'}`}
              />

              {/* Flash animation */}
              {flashActive && (
                <div className="absolute inset-0 z-30 bg-white transition-opacity duration-150" />
              )}

              {/* Countdown overlay */}
              {countdown !== null && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/40">
                  <span className="font-['Fraunces'] text-8xl font-black text-[#fff6ea] drop-shadow-lg animate-ping">
                    {countdown}
                  </span>
                  {mode === 'strip' && (
                    <span className="mt-2 rounded-full bg-[#59222c]/90 px-4 py-1 text-sm font-semibold text-[#f5caa0]">
                      Shot {activeShotIndex + 1} of 4
                    </span>
                  )}
                </div>
              )}

              {/* Camera Fallback / Error view */}
              {!cameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#2a221f] text-[#f2be82]">
                    <Camera className="h-7 w-7" />
                  </div>
                  <h3 className="text-base font-semibold text-[#fbf2e3]">
                    {isInitializing ? 'Connecting to Camera…' : 'Live Camera Paused'}
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-[#cbbba7]">
                    {cameraError ||
                      'Take a live vintage selfie using your webcam, or upload an image file from your device below.'}
                  </p>

                  <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex items-center gap-1.5 rounded-xl bg-[#e69a7b] px-3.5 py-2 text-xs font-semibold text-[#1f1613] transition-colors hover:bg-[#f0ac8e] cursor-pointer"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                      <span>Retry Camera</span>
                    </button>

                    <label className="flex items-center gap-1.5 rounded-xl border border-[#e8d5be]/25 bg-[#2a221f] px-3.5 py-2 text-xs font-medium text-[#f3e7d6] hover:bg-[#382d29] cursor-pointer">
                      <Upload className="h-3.5 w-3.5 text-[#f2be72]" />
                      <span>Upload Selfie</span>
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

              {/* Viewfinder Decorative Framing Overlay */}
              <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-3 text-[10px] font-mono uppercase tracking-wider text-[#e8d5be]/50">
                <div className="flex justify-between">
                  <span>MELB · 35MM ANALOG</span>
                  <span>{mode === 'strip' ? '4-SHOT STRIP' : 'SINGLE POLAROID'}</span>
                </div>
                <div className="flex justify-between">
                  <span>ISO 400 · MONO</span>
                  <span>{tone.toUpperCase()}</span>
                </div>
              </div>
            </div>

            {/* Mode & Shutter Control Bar */}
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
              {/* Mode Switcher */}
              <div className="flex items-center rounded-xl bg-[#14100e] p-1 border border-[#e8d5be]/15">
                <button
                  type="button"
                  onClick={() => {
                    setMode('strip');
                    setFrameStyle('bw-strip');
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    mode === 'strip'
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
                    setMode('single');
                    setFrameStyle('polaroid');
                  }}
                  className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors cursor-pointer ${
                    mode === 'single'
                      ? 'bg-[#59222c] text-[#fbf2e3]'
                      : 'text-[#baa897] hover:text-[#fff5e6]'
                  }`}
                >
                  <ImageIcon className="h-3.5 w-3.5" />
                  <span>Single Shot</span>
                </button>
              </div>

              {/* Shutter Button */}
              <button
                type="button"
                onClick={triggerShutter}
                disabled={countdown !== null}
                className="flex items-center gap-2 rounded-2xl bg-[#e69a7b] px-6 py-2.5 font-semibold text-[#1c1412] shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 cursor-pointer"
              >
                <Camera className="h-4 w-4" />
                <span>
                  {countdown !== null
                    ? `Shooting (${countdown}s)…`
                    : mode === 'strip'
                      ? 'Take 4-Shot Strip'
                      : 'Snap Photo'}
                </span>
              </button>
            </div>

            {/* Tone Filters */}
            <div className="mt-4">
              <label className="text-xs font-semibold text-[#baa897]">
                Analog B&W Film Tone
              </label>
              <div className="mt-1.5 grid grid-cols-3 gap-1.5 sm:grid-cols-5">
                {(
                  [
                    ['classic-bw', 'Classic B&W'],
                    ['noir-contrast', 'High Noir'],
                    ['warm-silver', 'Warm Silver'],
                    ['soft-grain', 'Soft Grain'],
                    ['natural', 'Natural'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setTone(id)}
                    className={`rounded-xl border px-2.5 py-1.5 text-center text-xs font-medium transition-colors cursor-pointer ${
                      tone === id
                        ? 'border-[#f2c6a0] bg-[#3a272b] text-[#fff6ea]'
                        : 'border-[#e8d5be]/15 bg-[#181311] text-[#baa897] hover:bg-[#251d1a]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Frame Styles */}
            <div className="mt-3">
              <label className="text-xs font-semibold text-[#baa897]">
                Keepsake Frame Style
              </label>
              <div className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                {(
                  [
                    ['bw-strip', 'Classic Strip'],
                    ['polaroid', 'Cream Polaroid'],
                    ['postcard', 'Melbourne Postcard'],
                    ['romantic-pink', 'Romantic Blush'],
                    ['arcade-retro', 'Arcade Neon'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setFrameStyle(id)}
                    className={`rounded-xl border px-2.5 py-1.5 text-left text-xs font-medium transition-colors cursor-pointer ${
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

            {/* Caption & Stickers Picker */}
            <div className="mt-4 flex flex-col gap-2">
              <label className="text-xs font-semibold text-[#baa897]">
                Keepsake Note & Stickers
              </label>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a sweet caption for this memory…"
                className="w-full rounded-xl border border-[#e8d5be]/20 bg-[#161210] px-3.5 py-2 text-xs text-[#fbf3e6] outline-none focus:border-[#f2c6a0]"
              />

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
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

          {/* Right Column: Print Preview & Keepsake Card (5 cols) */}
          <div className="flex flex-col items-center justify-between bg-[#14100e] p-5 lg:col-span-5">
            <div className="w-full text-center">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#baa897]">
                Keepsake Print Preview
              </span>
            </div>

            {/* Preview Card Display */}
            <div className="my-auto flex w-full max-w-[280px] flex-col items-center justify-center py-4">
              {composedDataUrl ? (
                <div className="overflow-hidden rounded-xl shadow-2xl border border-[#e8d5be]/30 transition-transform duration-200 hover:scale-[1.02]">
                  <img
                    src={composedDataUrl}
                    alt="Melbourne Photo Booth Strip"
                    className="max-h-[55vh] w-auto object-contain"
                  />
                </div>
              ) : (
                <div className="flex h-72 w-52 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e8d5be]/20 bg-[#1c1614] p-4 text-center">
                  <Camera className="h-8 w-8 text-[#8c7a6d] mb-2" />
                  <p className="text-xs font-medium text-[#baa897]">
                    No photo taken yet
                  </p>
                  <p className="mt-1 text-[11px] text-[#786a5e]">
                    Click &ldquo;Take 4-Shot Strip&rdquo; to start the arcade countdown
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons: Save & Download */}
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
