import {
  Camera,
  Check,
  Download,
  Heart,
  Music,
  PartyPopper,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { ONLINE_AUDIO_TRACKS } from '../../game/AudioManager';
import { PhotoStorage } from '../../game/PhotoStorage';
import { GameSaveData, StoredUploadedPhoto } from '../../game/types';

interface AskHerOutModalProps {
  saveData: GameSaveData;
  portraits: {
    adi: string;
    damini: string;
    sunny: string;
  } | null;
  onSuccess: (updatedSave: GameSaveData, savedPhoto?: StoredUploadedPhoto) => void;
  onOpenPhotoBooth: () => void;
  onClose: () => void;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
  color: string;
  rotation: number;
  vRot: number;
  shape: 'rect' | 'circle' | 'heart' | 'star';
  alpha: number;
}

export function AskHerOutModal({
  saveData,
  portraits,
  onSuccess,
  onOpenPhotoBooth,
  onClose,
}: AskHerOutModalProps) {
  const [step, setStep] = useState<'question' | 'accepted'>('question');
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [savedPhotoEntry, setSavedPhotoEntry] =
    useState<StoredUploadedPhoto | null>(null);
  const [celebrationMusic, setCelebrationMusic] = useState<
    'mariah' | 'ariana'
  >('mariah');

  // Background Celebration Audio
  const celebrationAudioRef = useRef<HTMLAudioElement | null>(null);
  const confettiCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Play romantic celebration audio from Mariah the Scientist or Ariana Grande
  const playCelebrationAudio = useCallback((trackKey: 'mariah' | 'ariana') => {
    try {
      if (!celebrationAudioRef.current) {
        celebrationAudioRef.current = new Audio();
        celebrationAudioRef.current.crossOrigin = 'anonymous';
      }
      const moodKey =
        trackKey === 'mariah' ? 'velvet-scientist' : 'daydream-grande';
      const track = ONLINE_AUDIO_TRACKS[moodKey];
      if (track) {
        celebrationAudioRef.current.src = track.url;
        celebrationAudioRef.current.loop = true;
        celebrationAudioRef.current.volume = 0.8;
        celebrationAudioRef.current.play().catch(() => {});
      }
    } catch {
      // Audio stream fallback
    }
  }, []);

  // Stop celebration audio on unmount or close
  useEffect(() => {
    return () => {
      if (celebrationAudioRef.current) {
        celebrationAudioRef.current.pause();
        celebrationAudioRef.current.src = '';
      }
      if (animFrameRef.current) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, []);

  // Confetti Particle Physics Simulation
  const startConfettiAnimation = useCallback(() => {
    const canvas = confettiCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = canvas.parentElement?.clientWidth || 700;
    canvas.height = canvas.parentElement?.clientHeight || 650;

    const colors = [
      '#f2728c',
      '#f5ca7a',
      '#e28ca0',
      '#8ed4a8',
      '#7ba9d4',
      '#ffffff',
      '#f9b8c8',
    ];
    const particles: Particle[] = [];

    // Spawn 140 celebratory particles
    for (let i = 0; i < 140; i++) {
      particles.push({
        x: canvas.width / 2 + (Math.random() - 0.5) * 80,
        y: canvas.height / 2 + (Math.random() - 0.5) * 80,
        vx: (Math.random() - 0.5) * 16,
        vy: -Math.random() * 12 - 4,
        size: 6 + Math.random() * 8,
        color: colors[Math.floor(Math.random() * colors.length)],
        rotation: Math.random() * Math.PI * 2,
        vRot: (Math.random() - 0.5) * 0.2,
        shape:
          Math.random() > 0.6
            ? 'heart'
            : Math.random() > 0.3
              ? 'star'
              : 'rect',
        alpha: 1,
      });
    }

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.28; // gravity
        p.vx *= 0.985; // drag
        p.rotation += p.vRot;

        // If particle drops off bottom, gently respawn from top
        if (p.y > canvas.height + 20) {
          p.y = -10;
          p.x = Math.random() * canvas.width;
          p.vy = 2 + Math.random() * 3;
        }

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation);
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;

        if (p.shape === 'heart') {
          ctx.font = `${p.size * 1.5}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('❤️', 0, 0);
        } else if (p.shape === 'star') {
          ctx.font = `${p.size * 1.5}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('✨', 0, 0);
        } else {
          ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size * 0.6);
        }
        ctx.restore();
      }

      animFrameRef.current = requestAnimationFrame(render);
    };

    render();
  }, []);

  // Chime sound
  const playChime = () => {
    try {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99, 1046.5, 1318.5]; // C5, E5, G5, C6, E6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
        gain.gain.setValueAtTime(0.25, ctx.currentTime + idx * 0.1);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.1 + 0.8
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.1);
        osc.stop(ctx.currentTime + idx * 0.1 + 0.85);
      });
    } catch {
      // AudioContext unavailable
    }
  };

  const handleSayYes = async (answerText: string) => {
    setChosenAnswer(answerText);
    setStep('accepted');
    playChime();
    playCelebrationAudio(celebrationMusic);

    // Start celebratory confetti
    setTimeout(() => {
      startConfettiAnimation();
    }, 100);

    // Mark 'yarra-overlook' and 'keepsake-ask-her-out-promise' as completed
    const updatedMemories = Array.from(
      new Set([...saveData.completedMemoryIds, 'yarra-overlook'])
    );
    const updatedItems = Array.from(
      new Set([
        ...saveData.collectedItemIds,
        'keepsake-yarra-lantern',
        'keepsake-ask-her-out-promise',
      ])
    );
    const updatedSave: GameSaveData = {
      ...saveData,
      completedMemoryIds: updatedMemories,
      collectedItemIds: updatedItems,
      lastSavedAt: Date.now(),
    };

    // Auto-generate high-res celebratory Polaroid keepsake
    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 740;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        // Cream cardstock
        ctx.fillStyle = '#fdf8f0';
        ctx.fillRect(0, 0, 600, 740);

        // Border
        ctx.strokeStyle = '#e8d7c4';
        ctx.lineWidth = 3;
        ctx.strokeRect(16, 16, 568, 708);

        // Photo area
        ctx.fillStyle = '#221918';
        ctx.fillRect(36, 36, 528, 440);

        const grad = ctx.createLinearGradient(36, 36, 36, 476);
        grad.addColorStop(0, '#421d28');
        grad.addColorStop(1, '#1b1216');
        ctx.fillStyle = grad;
        ctx.fillRect(36, 36, 528, 440);

        // Title on photo
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fce6ec';
        ctx.font = '700 34px Georgia, serif';
        ctx.fillText('SHE SAID YES! 💕', 300, 195);

        ctx.font = '500 19px sans-serif';
        ctx.fillStyle = '#f5b0c2';
        ctx.fillText('Yarra River Twilight Overlook · Melbourne', 300, 245);

        ctx.font = '30px sans-serif';
        ctx.fillText('✨ 💍 🥂 🐾 ✨', 300, 305);

        ctx.font = '600 16px monospace';
        ctx.fillStyle = '#f5caa0';
        ctx.fillText('ADI & DAMINI · OFFICIAL BEGINNING', 300, 365);

        // Handwritten note area
        ctx.fillStyle = '#2e201b';
        ctx.font = '700 24px Georgia, serif';
        ctx.fillText('“Will you go out with me?” — “YES!”', 300, 540);

        ctx.font = '500 15px sans-serif';
        ctx.fillStyle = '#8f6856';
        ctx.fillText(
          new Date().toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }) + ' · Under the Melbourne Sky',
          300,
          580
        );

        ctx.font = 'italic 15px Georgia, serif';
        ctx.fillStyle = '#a84c66';
        ctx.fillText('“Forever our little Melbourne Dreamland.”', 300, 625);

        const dataUrl = canvas.toDataURL('image/png');
        const photoEntry = await PhotoStorage.addCapturedPhoto(
          'yarra-overlook',
          dataUrl,
          'She Said Yes! 💕',
          'romantic-pink',
          'classic-bw',
          new Date().toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        );
        setSavedPhotoEntry(photoEntry);
        onSuccess(updatedSave, photoEntry);
        return;
      }
    } catch {
      // Fallback
    }

    onSuccess(updatedSave);
  };

  const handleSwitchMusic = (key: 'mariah' | 'ariana') => {
    setCelebrationMusic(key);
    playCelebrationAudio(key);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-her-out-title"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 sm:p-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-h-[95vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-[#f0c2cd] bg-[#1a1215] text-[#fbf3e6] shadow-[0_0_80px_rgba(230,120,150,0.35)]"
      >
        {/* Full-screen Confetti Canvas Overlay */}
        <canvas
          ref={confettiCanvasRef}
          className="pointer-events-none absolute inset-0 z-20 h-full w-full"
        />

        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-30 rounded-xl bg-black/50 p-2 text-[#d6c5b3] transition-colors hover:bg-black/80 hover:text-white cursor-pointer"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Header */}
        <div className="relative border-b border-[#f0c2cd]/20 bg-gradient-to-b from-[#401c27] via-[#2d161e] to-[#1a1215] px-6 py-5 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#612433] text-[#f5caa0] shadow-lg border border-[#f5caa0]/40 mb-2">
            {step === 'question' ? (
              <Heart className="h-7 w-7 fill-[#e28ca0] text-[#e28ca0] animate-pulse" />
            ) : (
              <PartyPopper className="h-7 w-7 text-[#f5caa0] animate-bounce" />
            )}
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-[#f5caa0]">
            Southbank Promenade · Twilight Overlook
          </span>
          <h2
            id="ask-her-out-title"
            className="mt-1 font-['Fraunces'] text-2xl sm:text-3xl font-extrabold tracking-tight text-[#fbf2e3]"
          >
            {step === 'question'
              ? 'The Big Question Under Melbourne Lights'
              : 'SHE SAID YES! 💕 ADI & DAMINI ARE OFFICIAL!'}
          </h2>
        </div>

        {/* Character Stage: Adi & Damini together with Sunny */}
        <div className="flex items-center justify-center gap-4 bg-[#140e11] py-4 px-6 border-b border-[#f0c2cd]/15">
          {portraits && (
            <div className="flex items-end gap-3">
              <div className="text-center">
                <img
                  src={portraits.adi}
                  alt="Adi"
                  className="h-20 w-20 rounded-2xl border-2 border-[#e8d4bc]/40 bg-[#2d1e24] object-cover shadow-lg [image-rendering:pixelated]"
                />
                <span className="mt-1 block text-xs font-bold text-[#f5caa0]">
                  Adi
                </span>
              </div>

              <div className="pb-3 text-[#e28ca0]">
                <Heart className="h-7 w-7 fill-[#e28ca0] animate-ping" />
              </div>

              <div className="text-center">
                <img
                  src={portraits.damini}
                  alt="Damini"
                  className="h-20 w-20 rounded-2xl border-2 border-[#eb9fb0]/50 bg-[#2d1e24] object-cover shadow-lg [image-rendering:pixelated]"
                />
                <span className="mt-1 block text-xs font-bold text-[#f5caa0]">
                  Damini
                </span>
              </div>

              <div className="text-center pl-2">
                <img
                  src={portraits.sunny}
                  alt="Sunny"
                  className="h-14 w-14 rounded-xl border border-[#f5d07a]/40 bg-[#2d1e24] object-cover shadow-md [image-rendering:pixelated]"
                />
                <span className="mt-0.5 block text-[11px] text-[#baa897]">
                  Sunny 🐾
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="relative z-10 min-h-0 flex-1 overflow-y-auto p-6 text-center">
          {step === 'question' ? (
            <div className="space-y-4">
              <div className="mx-auto max-w-lg rounded-2xl border border-[#e8d5be]/20 bg-[#24171d] p-4 text-left shadow-inner">
                <p className="text-xs font-semibold text-[#f5caa0] mb-1 font-mono uppercase tracking-wider">
                  Adi speaks from the heart:
                </p>
                <p className="font-['Fraunces'] text-base italic leading-relaxed text-[#fbf3e6]">
                  &ldquo;Damini, from our very first morning at International
                  House in Parkville, to sharing gnocchi at 11 Inch Pizza, laughing
                  through dinner at Bibi Ji, our birthday walks in the Botanic
                  Gardens, and every quiet late-night tram ride…
                </p>
                <p className="mt-3 font-['Fraunces'] text-base italic leading-relaxed text-[#fbf3e6]">
                  Every memory in this city is only special because you were by
                  my side. I brought you here because there’s something I want to
                  ask you for our future together.&rdquo;
                </p>
              </div>

              {/* The Question */}
              <div className="py-2">
                <p className="font-['Fraunces'] text-2xl sm:text-3xl font-extrabold text-[#fce8ef] drop-shadow-md">
                  &ldquo;Damini, will you go out with me?&rdquo;
                </p>
                <p className="mt-1 text-xs text-[#d6b0ba]">
                  Under Princes Bridge and the glowing twilight of the Yarra River
                </p>
              </div>

              {/* Choices */}
              <div className="mx-auto flex max-w-md flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleSayYes('Yes! A million times yes! 💕')}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e6738c] to-[#d95973] px-6 py-4 text-sm font-extrabold text-white shadow-xl transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  <span>Yes! A million times yes! 💕</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSayYes('Obviously yes, what took you so long? 🥰')
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#f0c2cd]/50 bg-[#341b25] px-6 py-3.5 text-xs font-bold text-[#fce6ed] transition-colors hover:bg-[#482433] cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[#f5caa0]" />
                  <span>Obviously yes, what took you so long? 🥰</span>
                </button>
              </div>
            </div>
          ) : (
            /* =================================================================
               GRAND CELEBRATION STATE
               ================================================================= */
            <div className="space-y-4">
              <div className="rounded-2xl border border-[#f0c2cd]/40 bg-gradient-to-b from-[#3a1a25] to-[#25141b] p-4 text-center shadow-2xl">
                <span className="text-xs font-mono uppercase tracking-widest text-[#f5caa0]">
                  Official Melbourne Dreamland Romance
                </span>
                <h3 className="mt-1 font-['Fraunces'] text-3xl font-extrabold text-[#fff0f4]">
                  IT’S OFFICIAL! 💕
                </h3>
                <p className="text-xs text-[#fce4ec] font-medium mt-1">
                  &ldquo;{chosenAnswer}&rdquo;
                </p>
              </div>

              {/* Damini & Sunny Reactions */}
              <div className="mx-auto max-w-lg rounded-2xl border border-[#e8d5be]/20 bg-[#24171d] p-4 text-left shadow-inner">
                <p className="text-xs font-semibold text-[#f5caa0] mb-1 font-mono uppercase tracking-wider">
                  Damini with a joyful tear and beaming smile:
                </p>
                <p className="font-['Fraunces'] text-base italic leading-relaxed text-[#fbf3e6]">
                  &ldquo;I’ve been waiting for you to ask tonight, Adi! Yes, a
                  thousand times yes! There’s no one else in Melbourne — or
                  anywhere in the world — I’d rather explore with, laugh with, and
                  build our future with.&rdquo;
                </p>

                <div className="mt-3 flex items-center gap-2 rounded-xl bg-[#341c27] p-2 text-xs text-[#fce8ef]">
                  <span className="text-base">🐾</span>
                  <span className="font-semibold text-[#f5caa0]">
                    Sunny barks joyfully and does a happy 360° spin! &ldquo;Woof!
                    Sunny totally approves! Best couple ever!&rdquo;
                  </span>
                </div>
              </div>

              {/* CELEBRATION MUSIC SELECTOR */}
              <div className="mx-auto max-w-lg rounded-2xl border border-[#e8d5be]/20 bg-[#1e1318] p-3 text-left">
                <div className="flex items-center justify-between text-xs font-bold text-[#fce8ef] mb-2">
                  <div className="flex items-center gap-1.5">
                    <Music className="h-4 w-4 text-[#f5caa0]" />
                    <span>Celebration Soundtrack (Online Audio):</span>
                  </div>
                  <span className="text-[10px] text-[#8ed4a8] font-mono">
                    ● Streaming Now
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => handleSwitchMusic('mariah')}
                    className={`rounded-xl border p-2 text-left text-xs transition-colors cursor-pointer ${
                      celebrationMusic === 'mariah'
                        ? 'border-[#f2c6a0] bg-[#421d2a] text-[#fff6ea]'
                        : 'border-[#e8d5be]/15 bg-[#25171e] text-[#baa897] hover:bg-[#321e28]'
                    }`}
                  >
                    <div className="font-semibold text-[#f5caa0]">
                      Mariah the Scientist
                    </div>
                    <div className="text-[10px] truncate text-[#cbbba7]">
                      Always N Forever (Audio Stream)
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleSwitchMusic('ariana')}
                    className={`rounded-xl border p-2 text-left text-xs transition-colors cursor-pointer ${
                      celebrationMusic === 'ariana'
                        ? 'border-[#f2c6a0] bg-[#421d2a] text-[#fff6ea]'
                        : 'border-[#e8d5be]/15 bg-[#25171e] text-[#baa897] hover:bg-[#321e28]'
                    }`}
                  >
                    <div className="font-semibold text-[#f5caa0]">
                      Ariana Grande
                    </div>
                    <div className="text-[10px] truncate text-[#cbbba7]">
                      Sweetener R&amp;B Mashup (Stream)
                    </div>
                  </button>
                </div>
              </div>

              {/* Commemorative Keepsake Certificate */}
              <div className="mx-auto flex max-w-lg items-center justify-between rounded-xl border border-[#f5caa0]/35 bg-[#2a1b18] p-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[#592231] text-[#f5caa0]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#fbf2e3]">
                      Keepsake Unlocked: The Golden Melbourne Promise
                    </div>
                    <div className="text-[11px] text-[#d6b0ba]">
                      Commemorative Polaroid saved to your Memory Journal
                    </div>
                  </div>
                </div>
                <Check className="h-5 w-5 text-[#8ed4a8]" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPhotoBooth();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-[#e6738c] to-[#d95973] px-5 py-3 text-xs font-bold text-white shadow-lg hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                >
                  <Camera className="h-4 w-4" />
                  <span>Take Victory Couple Photo Strip</span>
                </button>

                {savedPhotoEntry && (
                  <a
                    href={savedPhotoEntry.dataUrl}
                    download="adi-and-damini-said-yes.png"
                    className="flex items-center gap-1.5 rounded-xl border border-[#f5caa0]/40 bg-[#341d27] px-4 py-3 text-xs font-bold text-[#fce8ef] hover:bg-[#482534] transition-colors cursor-pointer"
                  >
                    <Download className="h-4 w-4 text-[#f5caa0]" />
                    <span>Download Certificate</span>
                  </a>
                )}

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#e8d5be]/25 bg-[#22161b] px-4 py-3 text-xs font-semibold text-[#baa897] hover:bg-[#321e27] hover:text-white cursor-pointer"
                >
                  Explore Melbourne as Partners
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
