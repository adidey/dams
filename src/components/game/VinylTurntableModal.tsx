import {
  Disc3,
  ListMusic,
  Music2,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  Sparkles,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import {
  MELBOURNE_PLAYLIST,
  MusicTrack,
  TrackStatusInfo,
} from '../../game/AudioManager';
import { GameSaveData, VinylRecordTrack } from '../../game/types';

interface VinylTurntableModalProps {
  saveData: GameSaveData;
  daminiPortrait?: string;
  trackStatus: TrackStatusInfo | null;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSelectTrack: (index: number) => void;
  onToggleShuffle: () => void;
  onSelectRecord?: (record: VinylRecordTrack) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

// Artist aesthetic color theming
const ARTIST_SLEEVE_STYLES: Record<
  string,
  { sleeveBg: string; accent: string; note: string }
> = {
  'Mariah the Scientist': {
    sleeveBg: '#441d2f',
    accent: '#f0a5be',
    note: '“Mariah the Scientist is non-negotiable on night drives through Melbourne. Late-night velvet vibes only.”',
  },
  SZA: {
    sleeveBg: '#213328',
    accent: '#8be0b2',
    note: '“SZA puts feelings into words that nothing else can. Listen closely to the lyrics.”',
  },
  'Ariana Grande': {
    sleeveBg: '#482736',
    accent: '#f7c4d5',
    note: '“Sweetener era energy forever. Instant serotonin boost whether we’re walking down Swanston or sitting here.”',
  },
  'Ariana Grande & The Weeknd': {
    sleeveBg: '#361b2b',
    accent: '#eb92b0',
    note: '“A classic duet that never misses. The harmonies are ridiculous.”',
  },
  'Ariana Grande & Zedd': {
    sleeveBg: '#26294d',
    accent: '#8da6ff',
    note: '“Turn this one all the way up! Ready to dance right in the middle of Arcade Alley.”',
  },
  PinkPantheress: {
    sleeveBg: '#42241d',
    accent: '#f5b08c',
    note: '“Y2K garage rhythm and sweet melodies — always puts the biggest smile on my face.”',
  },
  'Flo Milli & Monaleo': {
    sleeveBg: '#3b1828',
    accent: '#ff85b8',
    note: '“Unmatched confidence and flow. Perfect when we need that burst of Melbourne date excitement!”',
  },
};

export function VinylTurntableModal({
  saveData,
  daminiPortrait,
  trackStatus,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSelectTrack,
  onToggleShuffle,
  onToggleMute,
  onClose,
}: VinylTurntableModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === ' ') {
        e.preventDefault();
        onTogglePlay();
      } else if (e.key.toLowerCase() === 'n') {
        e.preventDefault();
        onNextTrack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, onNextTrack, onTogglePlay]);

  const currentTrack: MusicTrack =
    trackStatus?.track || MELBOURNE_PLAYLIST[0];
  const isPlaying = Boolean(trackStatus?.isPlaying && !saveData.musicMuted);

  const artistStyle =
    ARTIST_SLEEVE_STYLES[currentTrack.artist] || {
      sleeveBg: '#342621',
      accent: '#f2be82',
      note: '“Such a perfect soundtrack for exploring Melbourne together.”',
    };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#ebd4c0]/25 bg-[#1f1715] p-5 sm:p-7 text-[#fbf2e6] shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#ebd4c0]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#3d242c] text-[#f2aab8] shadow-inner">
              <Disc3 className="h-6 w-6" />
            </div>
            <div>
              <div className="text-xs text-[#d6b8a8] flex items-center gap-1.5">
                <span>Wax &amp; Groove Vinyl Cafe</span>
                <span>·</span>
                <span className="text-[#f5caa0]">Analog Listening Booth</span>
              </div>
              <h2 className="font-['Fraunces'] text-xl sm:text-2xl font-semibold text-[#fff6ea]">
                Turntable &amp; Record Crates
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onToggleMute}
              className="flex items-center gap-1.5 rounded-xl border border-[#ebd4c0]/20 bg-[#2d2220] px-3 py-1.5 text-xs font-medium text-[#f5e7d6] hover:bg-[#3b2d2a] cursor-pointer whitespace-nowrap"
            >
              {saveData.musicMuted ? (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-[#e08275]" />
                  <span>Unmute</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-[#98deb3]" />
                  <span>Sound On</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl p-2 text-[#bfa999] hover:bg-[#332724] hover:text-white cursor-pointer"
              aria-label="Close turntable"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Main Listening Lounge Layout */}
        <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-12 lg:items-start">
          {/* Left Column: Spinning Turntable Deck & Active Controls */}
          <div className="flex flex-col items-center rounded-3xl border border-[#ebd4c0]/15 bg-[#171210] p-6 lg:col-span-5 shadow-inner">
            {/* Real Turntable Platter */}
            <div className="relative flex h-52 w-52 items-center justify-center rounded-full border-4 border-[#362a26] bg-[#0f0c0d] shadow-2xl">
              {/* Vinyl grooves */}
              <motion.div
                animate={{ rotate: isPlaying ? 360 : 0 }}
                transition={{
                  repeat: Infinity,
                  duration: 4.2,
                  ease: 'linear',
                }}
                className="relative flex h-46 w-46 items-center justify-center rounded-full border-2 border-white/10 bg-[radial-gradient(circle,#1a1417_0%,#0e0b0c_75%,#1c1619_100%)] shadow-lg"
              >
                {/* Vinyl Grooves rings */}
                <div className="absolute inset-4 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-8 rounded-full border border-white/5 pointer-events-none" />
                <div className="absolute inset-12 rounded-full border border-white/5 pointer-events-none" />

                {/* Center Record Label */}
                <div
                  className="relative flex h-16 w-16 items-center justify-center rounded-full text-center p-1.5 shadow-md"
                  style={{ backgroundColor: artistStyle.accent }}
                >
                  <div className="font-['Fraunces'] text-[9px] font-bold text-[#1f1418] leading-tight truncate px-1">
                    {currentTrack.title}
                  </div>
                  {/* Spindle hole */}
                  <div className="absolute h-3 w-3 rounded-full bg-[#0a0809] border border-white/30" />
                </div>
              </motion.div>

              {/* Tonearm overlay */}
              <div
                className={`absolute right-1 top-2 w-14 h-24 origin-top-right transition-transform duration-500 pointer-events-none ${
                  isPlaying ? 'rotate-12' : '-rotate-6'
                }`}
              >
                <div className="h-20 w-1 bg-[#8c7a68] rounded-full mx-auto" />
                <div className="h-4 w-3 bg-[#e6c37a] rounded-sm -mt-1 ml-1" />
              </div>
            </div>

            {/* Currently Playing Track Metadata */}
            <div className="mt-4 text-center w-full">
              <div className="font-['Fraunces'] text-base font-bold text-[#fff7ee] truncate">
                {currentTrack.title}
              </div>
              <div
                className="mt-0.5 text-xs font-medium truncate"
                style={{ color: artistStyle.accent }}
              >
                {currentTrack.artist}
              </div>
            </div>

            {/* Turntable Transport Controls */}
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                type="button"
                onClick={onPrevTrack}
                className="rounded-xl border border-[#ebd4c0]/15 bg-[#251d1a] p-2.5 text-[#d9c8b8] hover:bg-[#352824] hover:text-white transition-colors cursor-pointer"
                title="Previous Track"
              >
                <SkipBack className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onTogglePlay}
                className="flex items-center gap-2 rounded-2xl bg-[#e69a7b] px-5 py-2.5 text-xs font-bold text-[#1f1512] hover:bg-[#f2ab8d] transition-transform active:scale-95 cursor-pointer shadow-lg"
                title="Play / Pause (Space)"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4 fill-current" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 fill-current" />
                    <span>Spin Record</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={onNextTrack}
                className="rounded-xl border border-[#ebd4c0]/15 bg-[#251d1a] p-2.5 text-[#d9c8b8] hover:bg-[#352824] hover:text-white transition-colors cursor-pointer"
                title="Next Track (N)"
              >
                <SkipForward className="h-4 w-4" />
              </button>

              <button
                type="button"
                onClick={onToggleShuffle}
                className={`rounded-xl border p-2.5 transition-colors cursor-pointer ${
                  trackStatus?.isShuffle
                    ? 'border-[#e69a7b] bg-[#3a251e] text-[#f5caa0]'
                    : 'border-[#ebd4c0]/15 bg-[#251d1a] text-[#8c7b6e] hover:bg-[#352824]'
                }`}
                title="Shuffle Mode"
              >
                <Shuffle className="h-4 w-4" />
              </button>
            </div>

            {/* Damini's Note */}
            <div className="mt-5 w-full rounded-2xl border border-[#ebd4c0]/10 bg-[#211a18] p-3 text-left">
              <div className="flex items-center gap-2 text-[11px] font-semibold text-[#f5caa0]">
                {daminiPortrait && (
                  <img
                    src={daminiPortrait}
                    alt="Damini"
                    className="h-5 w-5 rounded-md border border-[#f0a5b8]/30 object-cover [image-rendering:pixelated]"
                  />
                )}
                <span>Damini’s Playlist Note</span>
              </div>
              <p className="mt-1 text-xs italic text-[#dfd0be] leading-relaxed">
                {artistStyle.note}
              </p>
            </div>
          </div>

          {/* Right Column: 12-Track Record Crates */}
          <div className="flex flex-col gap-3 lg:col-span-7">
            <div className="flex items-center justify-between">
              <span className="font-['Fraunces'] text-sm font-semibold text-[#fbf2e6] flex items-center gap-1.5">
                <ListMusic className="h-4 w-4 text-[#e69a7b]" />
                <span>Damini’s Melbourne Record Crate ({MELBOURNE_PLAYLIST.length} Tracks)</span>
              </span>
              <span className="text-[11px] text-[#baa897]">
                Click any vinyl to play
              </span>
            </div>

            {/* Scrollable Crates Grid */}
            <div className="max-h-[380px] overflow-y-auto pr-1 flex flex-col gap-2">
              {MELBOURNE_PLAYLIST.map((track, idx) => {
                const isActive = trackStatus?.index === idx;
                const style =
                  ARTIST_SLEEVE_STYLES[track.artist] || {
                    sleeveBg: '#342621',
                    accent: '#f2be82',
                    note: '',
                  };

                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => onSelectTrack(idx)}
                    className={`flex items-center justify-between gap-3 rounded-2xl border p-3 text-left transition-all duration-150 cursor-pointer ${
                      isActive
                        ? 'border-[#e69a7b] bg-[#342421] shadow-md ring-1 ring-[#e69a7b]/40'
                        : 'border-[#ebd4c0]/12 bg-[#251e1c] hover:border-[#ebd4c0]/30 hover:bg-[#2e2422]'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {/* Stylized Vinyl Sleeve miniature */}
                      <div
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm relative overflow-hidden"
                        style={{ backgroundColor: style.sleeveBg }}
                      >
                        <Music2
                          className="h-5 w-5"
                          style={{ color: style.accent }}
                        />
                        {isActive && (
                          <span className="absolute inset-0 bg-black/20 flex items-center justify-center">
                            <span className="h-2 w-2 rounded-full bg-[#e69a7b] animate-ping" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div
                          className={`text-xs font-semibold truncate ${
                            isActive ? 'text-[#fff7ee]' : 'text-[#ede0ce]'
                          }`}
                        >
                          {track.title}
                        </div>
                        <div className="text-[11px] text-[#bda997] truncate">
                          {track.artist}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {isActive && (
                        <span className="flex items-center gap-1 rounded-full bg-[#e69a7b]/20 px-2.5 py-0.5 text-[10px] font-mono font-bold text-[#f5caa0]">
                          <Sparkles className="h-3 w-3" />
                          <span>Now Spinning</span>
                        </span>
                      )}
                      <span className="text-[10px] font-mono text-[#8a796c]">
                        #{idx + 1}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
