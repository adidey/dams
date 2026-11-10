import {
  Camera,
  Check,
  Heart,
  PartyPopper,
  Sparkles,
  Volume2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useState } from 'react';
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

export function AskHerOutModal({
  saveData,
  portraits,
  onSuccess,
  onOpenPhotoBooth,
  onClose,
}: AskHerOutModalProps) {
  const [step, setStep] = useState<'question' | 'accepted'>('question');
  const [chosenAnswer, setChosenAnswer] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [savedKeepsake, setSavedKeepsake] = useState(false);

  // Play gentle celebratory chime
  const playChime = () => {
    try {
      const ctx = new (window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext)();
      const notes = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.12);
        gain.gain.setValueAtTime(0.2, ctx.currentTime + idx * 0.12);
        gain.gain.exponentialRampToValueAtTime(
          0.001,
          ctx.currentTime + idx * 0.12 + 0.6
        );
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.12);
        osc.stop(ctx.currentTime + idx * 0.12 + 0.65);
      });
    } catch {
      // AudioContext unavailable
    }
  };

  const handleSayYes = async (answerText: string) => {
    setChosenAnswer(answerText);
    setStep('accepted');
    playChime();

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

    // Auto-generate a beautiful commemorative Polaroid for the Keepsake Gallery
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

        // Shimmer gradient
        const grad = ctx.createLinearGradient(36, 36, 36, 476);
        grad.addColorStop(0, '#36242c');
        grad.addColorStop(1, '#1b1416');
        ctx.fillStyle = grad;
        ctx.fillRect(36, 36, 528, 440);

        // Title on photo
        ctx.textAlign = 'center';
        ctx.fillStyle = '#fce6ec';
        ctx.font = '700 32px Georgia, serif';
        ctx.fillText('The Night She Said Yes 💕', 300, 210);

        ctx.font = '500 18px sans-serif';
        ctx.fillStyle = '#e8b8c8';
        ctx.fillText('Yarra River Twilight Overlook · Melbourne', 300, 255);

        ctx.font = '28px sans-serif';
        ctx.fillText('✨ 💍 🥂 🐾 ✨', 300, 310);

        // Handwritten note area
        ctx.fillStyle = '#2e201b';
        ctx.font = '700 24px Georgia, serif';
        ctx.fillText('“Will you go out with me?” — “YES!”', 300, 545);

        ctx.font = '500 15px sans-serif';
        ctx.fillStyle = '#8f6856';
        ctx.fillText(
          new Date().toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          }) + ' · Adi & Damini Official Beginning',
          300,
          585
        );

        ctx.font = 'italic 14px Georgia, serif';
        ctx.fillStyle = '#a84c66';
        ctx.fillText('“Forever our little Melbourne Dreamland.”', 300, 625);

        const dataUrl = canvas.toDataURL('image/png');
        const photoEntry = await PhotoStorage.addCapturedPhoto(
          'yarra-overlook',
          dataUrl,
          'The Night She Said Yes 💕',
          'romantic-pink',
          'warm-silver',
          new Date().toLocaleDateString('en-AU', {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
          })
        );
        setSavedKeepsake(true);
        onSuccess(updatedSave, photoEntry);
        return;
      }
    } catch {
      // Fallback
    }

    onSuccess(updatedSave);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ask-her-out-title"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-3 sm:p-5 backdrop-blur-sm"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="relative flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl border-2 border-[#f0c2cd] bg-[#1e1518] text-[#fbf3e6] shadow-[0_0_60px_rgba(230,120,150,0.25)]"
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 z-20 rounded-xl bg-black/40 p-2 text-[#d6c5b3] transition-colors hover:bg-black/70 hover:text-white cursor-pointer"
          title="Close (Esc)"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Top Romantic Melbourne Twilight Header */}
        <div className="relative border-b border-[#f0c2cd]/20 bg-gradient-to-b from-[#3a1b26] to-[#1e1518] px-6 py-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#592231] text-[#f5caa0] shadow-md border border-[#f5caa0]/30 mb-2.5">
            <Heart className="h-6 w-6 fill-[#e28ca0] text-[#e28ca0] animate-pulse" />
          </div>

          <span className="font-mono text-xs uppercase tracking-widest text-[#f5caa0]">
            Southbank Promenade · Twilight Overlook
          </span>
          <h2
            id="ask-her-out-title"
            className="mt-1 font-['Fraunces'] text-2xl sm:text-3xl font-bold tracking-tight text-[#fbf2e3]"
          >
            {step === 'question'
              ? 'The Moment Under the Melbourne Skyline'
              : 'She Said Yes! 💕'}
          </h2>
        </div>

        {/* Character Stage: Adi & Damini together with Sunny */}
        <div className="flex items-center justify-center gap-4 bg-[#160f13] py-5 px-6 border-b border-[#f0c2cd]/15">
          {portraits && (
            <div className="flex items-end gap-3">
              <div className="text-center">
                <img
                  src={portraits.adi}
                  alt="Adi"
                  className="h-20 w-20 rounded-2xl border-2 border-[#e8d4bc]/40 bg-[#2d1e24] object-cover shadow-lg [image-rendering:pixelated]"
                />
                <span className="mt-1 block text-xs font-semibold text-[#f5caa0]">
                  Adi
                </span>
              </div>

              <div className="pb-3 text-[#e28ca0]">
                <Heart className="h-6 w-6 fill-[#e28ca0] animate-bounce" />
              </div>

              <div className="text-center">
                <img
                  src={portraits.damini}
                  alt="Damini"
                  className="h-20 w-20 rounded-2xl border-2 border-[#eb9fb0]/50 bg-[#2d1e24] object-cover shadow-lg [image-rendering:pixelated]"
                />
                <span className="mt-1 block text-xs font-semibold text-[#f5caa0]">
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
        <div className="min-h-0 flex-1 overflow-y-auto p-6 text-center">
          {step === 'question' ? (
            <div className="space-y-4">
              <div className="mx-auto max-w-lg rounded-2xl border border-[#e8d5be]/20 bg-[#26191f] p-4 text-left shadow-inner">
                <p className="text-xs font-semibold text-[#f5caa0] mb-1 font-mono uppercase tracking-wider">
                  Adi speaks from the heart:
                </p>
                <p className="font-['Fraunces'] text-base italic leading-relaxed text-[#fbf3e6]">
                  &ldquo;Damini, from our very first days at International House in Parkville,
                  to sharing gnocchi at 11 Inch Pizza, laughing through dinner at Bibi Ji,
                  birthday walks in the Botanic Gardens, and every quiet late-night tram ride…
                </p>
                <p className="mt-3 font-['Fraunces'] text-base italic leading-relaxed text-[#fbf3e6]">
                  Every memory in this city is only special because you were by my side.
                  I didn’t just bring you here to look back on old chapters. I brought you here
                  because I want to write all our future chapters together.&rdquo;
                </p>
              </div>

              {/* The Big Question */}
              <div className="py-2">
                <p className="font-['Fraunces'] text-2xl sm:text-3xl font-extrabold text-[#fce8ef] drop-shadow-md">
                  &ldquo;Damini, will you go out with me?&rdquo;
                </p>
                <p className="mt-1 text-xs text-[#d6b0ba]">
                  Under Princes Bridge and the twilight reflections of the Yarra
                </p>
              </div>

              {/* Choices */}
              <div className="mx-auto flex max-w-md flex-col gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => handleSayYes('Yes! A million times yes! 💕')}
                  className="flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#e6738c] to-[#d95973] px-6 py-3.5 text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.03] active:scale-95 cursor-pointer"
                >
                  <Heart className="h-4 w-4 fill-white" />
                  <span>Yes! A million times yes! 💕</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    handleSayYes('Obviously yes, what took you so long? 🥰')
                  }
                  className="flex items-center justify-center gap-2 rounded-2xl border border-[#f0c2cd]/40 bg-[#341b25] px-6 py-3 text-xs font-semibold text-[#fce6ed] transition-colors hover:bg-[#482433] cursor-pointer"
                >
                  <Sparkles className="h-4 w-4 text-[#f5caa0]" />
                  <span>Obviously yes, what took you so long? 🥰</span>
                </button>
              </div>
            </div>
          ) : (
            /* Accepted State */
            <div className="space-y-4">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#592231] text-[#f5caa0] shadow-xl">
                <PartyPopper className="h-8 w-8 text-[#f5caa0]" />
              </div>

              <div className="space-y-1">
                <h3 className="font-['Fraunces'] text-2xl font-bold text-[#fce8ef]">
                  It’s Official: Adi &amp; Damini 💕
                </h3>
                <p className="text-xs text-[#baa897]">
                  {chosenAnswer}
                </p>
              </div>

              <div className="mx-auto max-w-lg rounded-2xl border border-[#e8d5be]/20 bg-[#26191f] p-4 text-left shadow-inner">
                <p className="text-xs font-semibold text-[#f5caa0] mb-1 font-mono uppercase tracking-wider">
                  Damini with a radiant smile:
                </p>
                <p className="font-['Fraunces'] text-base italic leading-relaxed text-[#fbf3e6]">
                  &ldquo;I’ve been waiting for you to ask tonight, Adi. Yes, a thousand times yes!
                  There’s no one else in Melbourne — or anywhere in the world — I’d rather
                  share gnocchi with, listen to records with, and build a life with.&rdquo;
                </p>
                <p className="mt-2 text-xs font-medium text-[#baa897]">
                  Sunny barks happily and does a joyful spin! 🐾
                </p>
              </div>

              {/* Reward Unlocked Notice */}
              <div className="mx-auto flex max-w-md items-center justify-between rounded-xl border border-[#f5caa0]/30 bg-[#2a1b18] p-3 text-left">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#592231] text-[#f5caa0]">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#fbf2e3]">
                      Keepsake Unlocked: The Golden Melbourne Promise
                    </div>
                    <div className="text-[11px] text-[#d6b0ba]">
                      Added to Memory Journal &amp; Photo Keepsake Shelf
                    </div>
                  </div>
                </div>
                <Check className="h-4 w-4 text-[#8ed4a8]" />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPhotoBooth();
                  }}
                  className="flex items-center gap-1.5 rounded-xl bg-[#592231] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#6e2c3e] cursor-pointer"
                >
                  <Camera className="h-4 w-4 text-[#f5caa0]" />
                  <span>Snap Victory Photo Strip</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="rounded-xl border border-[#e8d5be]/25 bg-[#25181e] px-4 py-2.5 text-xs font-semibold text-[#fce8ef] hover:bg-[#38232b] cursor-pointer"
                >
                  Continue Exploring Together
                </button>
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
