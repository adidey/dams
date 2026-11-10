import { Disc3, Music2, Sparkles, Volume2, VolumeX, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import {
  COLLECTIBLES_CONFIG,
  VINYL_RECORDS_CONFIG,
} from '../../game/config/collectiblesConfig';
import { GameSaveData, VinylRecordTrack } from '../../game/types';

interface VinylTurntableModalProps {
  saveData: GameSaveData;
  daminiPortrait?: string;
  onSelectRecord: (record: VinylRecordTrack) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

export function VinylTurntableModal({
  saveData,
  daminiPortrait,
  onSelectRecord,
  onToggleMute,
  onClose,
}: VinylTurntableModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const activeTrack =
    VINYL_RECORDS_CONFIG.find((r) => r.moodId === saveData.activeVinylMood) ??
    VINYL_RECORDS_CONFIG[0];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/72 p-4 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#ebd4c0]/25 bg-[#211917] p-6 md:p-7 text-[#fbf2e6] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ebd4c0]/15 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#38272c] text-[#f0a5b8]">
              <Disc3 className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-[#d6b8a8]">
                Wax &amp; Groove Vinyl Cafe · Listening Booth
              </div>
              <h2 className="font-['Fraunces'] text-2xl font-semibold text-[#fff6ea]">
                Crate Digging with Damini
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
                  <span>Unmute Turntable</span>
                </>
              ) : (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-[#98deb3]" />
                  <span>Playing</span>
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

        {/* Spinning Turntable + Damini's Personal Commentary */}
        <div className="mt-5 grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
          <div className="flex flex-col items-center justify-center rounded-2xl border border-[#ebd4c0]/15 bg-[#181210] p-5 md:col-span-5">
            <div className="relative flex h-44 w-44 items-center justify-center rounded-full border-4 border-[#362a26] bg-[#120f10] shadow-inner">
              <motion.div
                animate={{ rotate: saveData.musicMuted ? 0 : 360 }}
                transition={{
                  repeat: Infinity,
                  duration: 6,
                  ease: 'linear',
                }}
                className="flex h-38 w-38 items-center justify-center rounded-full border border-white/10 bg-[#1c1719]"
              >
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-full text-[10px] font-bold text-[#1e1516]"
                  style={{ backgroundColor: activeTrack.vinylAccent }}
                >
                  LP
                </div>
              </motion.div>
            </div>

            <div className="mt-3 text-center">
              <div className="text-xs font-semibold text-[#fff5e8]">
                {activeTrack.title}
              </div>
              <div className="mt-0.5 text-[11px] text-[#e69fb2]">
                {activeTrack.artistTribute}
              </div>
            </div>
          </div>

          {/* Crate Selection */}
          <div className="flex flex-col gap-2.5 md:col-span-7">
            {VINYL_RECORDS_CONFIG.map((rec) => {
              const selected = rec.id === activeTrack.id;
              const reward = COLLECTIBLES_CONFIG.find(
                (c) => c.id === rec.rewardCollectibleId
              );
              return (
                <button
                  key={rec.id}
                  type="button"
                  onClick={() => onSelectRecord(rec)}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-3.5 text-left transition-colors cursor-pointer ${
                    selected
                      ? 'border-[#f0a5b8]/65 bg-[#332329]'
                      : 'border-[#ebd4c0]/15 bg-[#29201e] hover:border-[#ebd4c0]/35 hover:bg-[#322724]'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl shadow-sm"
                      style={{ backgroundColor: rec.sleeveColor }}
                    >
                      <Music2
                        className="h-5 w-5"
                        style={{ color: rec.vinylAccent }}
                      />
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#fff5e8]">
                        {rec.title}
                      </div>
                      <div className="truncate text-[11px] text-[#e8a4b6]">
                        {rec.artistTribute}
                      </div>
                      <div className="truncate text-[11px] text-[#bba799]">
                        {rec.sleeveSubtitle}
                      </div>
                    </div>
                  </div>

                  {reward && (
                    <Sparkles
                      className={`h-4 w-4 shrink-0 ${
                        saveData.collectedItemIds.includes(reward.id)
                          ? 'text-[#f2c46d]'
                          : 'text-[#7d6c63]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Damini's Reaction Note */}
        <div className="mt-5 flex items-center gap-3.5 rounded-2xl border border-[#ebd4c0]/15 bg-[#2b2022] p-4">
          {daminiPortrait && (
            <img
              src={daminiPortrait}
              alt="Damini"
              className="h-12 w-12 shrink-0 rounded-xl border border-[#f0a5b8]/35 object-cover [image-rendering:pixelated]"
            />
          )}
          <div>
            <div className="text-xs font-semibold text-[#f0a5b8]">Damini</div>
            <p className="mt-0.5 text-xs leading-relaxed text-[#f7ebe0]">
              {activeTrack.noteFromDamini}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
