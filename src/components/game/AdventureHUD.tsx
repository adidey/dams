import {
  BookHeart,
  Camera,
  Disc3,
  Heart,
  ListMusic,
  LogOut,
  Map as MapIcon,
  Moon,
  Music,
  Pause,
  Play,
  Shuffle,
  SkipBack,
  SkipForward,
  SlidersHorizontal,
  Sparkles,
  Sun,
  TrainFront,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  MELBOURNE_PLAYLIST,
  TrackStatusInfo,
} from '../../game/AudioManager';
import { CORE_MEMORY_IDS, POINTS_OF_INTEREST } from '../../game/config/locationsConfig';
import {
  GameSaveData,
  GameTelemetry,
  InteriorInteractablePrompt,
} from '../../game/types';
import { DistrictId, LightingPreset } from '../../world/types';

interface AdventureHUDProps {
  activeDistrict: DistrictId;
  lightingPreset: LightingPreset;
  game: GameTelemetry | null;
  saveData: GameSaveData;
  portraits: {
    adi: string;
    damini: string;
    sunny: string;
  } | null;
  anyModalOpen: boolean;
  trackStatus: TrackStatusInfo | null;
  onTriggerInteract: () => void;
  onInteractInteriorAction: (
    actionType: InteriorInteractablePrompt['actionType']
  ) => void;
  onOpenJournal: (initialTab: 'chapters' | 'keepsakes') => void;
  onOpenPhotoBooth: () => void;
  onOpenMap: () => void;
  onOpenPause: () => void;
  onToggleMute: () => void;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onToggleShuffle: () => void;
  onSelectTrack: (index: number) => void;
  onFocusCharacter: () => void;
  onSelectDistrict: (id: DistrictId) => void;
  onChangeLighting: (preset: LightingPreset) => void;
  onZoomStep: (factor: number) => void;
  onRotateStep: (dir: -1 | 1) => void;
  onExitInterior: () => void;
}

const DISTRICT_TITLES: Record<DistrictId, string> = {
  overview: 'Greater Melbourne',
  parkville: 'Parkville · Campus & Terraces',
  cbd: 'Melbourne CBD · Laneways & Dining',
  southbank: 'Southbank & Yarra River',
  botanic: 'Royal Botanic Gardens',
  arcade: 'Arcade Alley · Entertainment',
};

export function AdventureHUD({
  activeDistrict,
  lightingPreset,
  game,
  saveData,
  portraits,
  anyModalOpen,
  trackStatus,
  onTriggerInteract,
  onInteractInteriorAction,
  onOpenJournal,
  onOpenPhotoBooth,
  onOpenMap,
  onOpenPause,
  onToggleMute,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onToggleShuffle,
  onSelectTrack,
  onFocusCharacter,
  onSelectDistrict,
  onChangeLighting,
  onZoomStep,
  onRotateStep,
  onExitInterior,
}: AdventureHUDProps) {
  // Playlist dropdown
  const [playlistOpen, setPlaylistOpen] = useState(false);

  const completedCoreCount = CORE_MEMORY_IDS.filter((id) =>
    saveData.completedMemoryIds.includes(id)
  ).length;
  const allCoreDone = completedCoreCount >= CORE_MEMORY_IDS.length;
  const finalDone = saveData.completedMemoryIds.includes('yarra-overlook');

  // Determine current chapter & next recommendation
  let currentChapterNumber = 1;

  for (const poi of POINTS_OF_INTEREST) {
    if (poi.category === 'memory' && !saveData.completedMemoryIds.includes(poi.id)) {
      currentChapterNumber = poi.chapterNumber || 1;
      break;
    }
  }

  if (allCoreDone && !finalDone) {
    currentChapterNumber = 6;
  } else if (finalDone) {
    currentChapterNumber = 6;
  }

  const interiorTitle =
    game?.activeInterior === 'vinyl-cafe'
      ? 'Inside Wax & Groove Vinyl Cafe'
      : game?.activeInterior === 'arcade'
        ? 'Inside Starlight Coin-Op Arcade'
        : DISTRICT_TITLES[activeDistrict];

  // Hotkey listener for C (Camera/Photobooth), N (Next Song)
  // S key is NOT intercepted so WASD walking is completely free!
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'c' && !anyModalOpen) {
        e.preventDefault();
        onOpenPhotoBooth();
      } else if (k === 'n' && !anyModalOpen) {
        e.preventDefault();
        onNextTrack();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyModalOpen, onNextTrack, onOpenPhotoBooth]);

  return (
    <div className="pointer-events-none fixed inset-0 z-10 select-none overflow-hidden">
      {/* =====================================================================
          1. WORLD-PROJECTED INTERACTION PROMPTS & PINS
         ===================================================================== */}
      {!anyModalOpen && game && !game.tramRide && (
        <div className="absolute inset-0 overflow-hidden">
          {!game.activeInterior &&
            game.projectedPOIs.map((poi) => {
              if (!poi.visible) return null;

              if (poi.inRange) {
                return (
                  <button
                    key={poi.id}
                    type="button"
                    onClick={onTriggerInteract}
                    style={{
                      transform: `translate3d(${Math.round(poi.x)}px, ${Math.round(poi.y)}px, 0) translate(-50%, -100%)`,
                    }}
                    className="pointer-events-auto absolute left-0 top-0 flex items-center gap-2.5 rounded-2xl border border-[#f2c6a0]/80 bg-[#1e1715]/95 px-3.5 py-2 text-left text-[#fbf3e6] shadow-2xl transition-transform duration-150 hover:scale-105 cursor-pointer whitespace-nowrap"
                  >
                    <span className="inline-flex h-6 w-6 items-center justify-center rounded-lg bg-[#e69a7b] font-mono text-xs font-bold text-[#1f1714] shadow-sm">
                      E
                    </span>
                    <div>
                      <div className="text-xs font-semibold tracking-tight text-[#fff6ea]">
                        {poi.promptLabel}
                      </div>
                      <div className="text-[11px] text-[#d6c5b3]">
                        {poi.subtitle}
                      </div>
                    </div>
                  </button>
                );
              }

              // Subtle unobtrusive pin marker label when in distance
              return (
                <div
                  key={poi.id}
                  style={{
                    transform: `translate3d(${Math.round(poi.x)}px, ${Math.round(poi.y)}px, 0) translate(-50%, -100%)`,
                  }}
                  className="pointer-events-none absolute left-0 top-0 flex items-center gap-1.5 rounded-lg border border-[#e8d5be]/20 bg-[#1c1614]/85 px-2.5 py-1 text-[11px] font-medium text-[#efe2cf] shadow-sm whitespace-nowrap"
                >
                  {poi.category === 'tram-stop' ? (
                    <TrainFront className="h-3 w-3 text-[#7bd4a0]" />
                  ) : poi.category === 'vinyl-cafe' ? (
                    <Disc3 className="h-3 w-3 text-[#eb9db2]" />
                  ) : poi.category === 'arcade' ? (
                    <Sparkles className="h-3 w-3 text-[#f2be72]" />
                  ) : poi.category === 'photo-booth' ? (
                    <Camera className="h-3 w-3 text-[#e28ca0]" />
                  ) : (
                    <Heart
                      className={`h-3 w-3 ${
                        poi.completed
                          ? 'fill-[#eb94a4] text-[#eb94a4]'
                          : 'text-[#f2be82]'
                      }`}
                    />
                  )}
                  <span>{poi.title}</span>
                </div>
              );
            })}

          {/* Interior 2.5D prompts */}
          {game.activeInterior &&
            game.interiorPrompts.map((p) => {
              if (!p.visible) return null;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() =>
                    p.actionType === 'exit-interior'
                      ? onExitInterior()
                      : onInteractInteriorAction(p.actionType)
                  }
                  style={{
                    transform: `translate3d(${Math.round(p.x)}px, ${Math.round(p.y)}px, 0) translate(-50%, -100%)`,
                  }}
                  className={`pointer-events-auto absolute left-0 top-0 flex items-center gap-2 rounded-xl border px-3 py-1.5 text-left shadow-lg transition-transform duration-150 hover:scale-105 cursor-pointer whitespace-nowrap ${
                    p.inRange
                      ? 'border-[#f2c6a0]/80 bg-[#221a17]/95 text-[#fff6ea]'
                      : 'border-[#e8d5be]/25 bg-[#1b1614]/88 text-[#dfd0bc]'
                  }`}
                >
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded font-mono text-[11px] font-bold ${
                      p.inRange
                        ? 'bg-[#e89973] text-[#1e1613]'
                        : 'bg-[#362c27] text-[#dfd0bc]'
                    }`}
                  >
                    E
                  </span>
                  <div>
                    <div className="text-xs font-semibold">{p.label}</div>
                    {p.inRange && (
                      <div className="text-[10px] text-[#cbb8a4]">
                        {p.subtitle}
                      </div>
                    )}
                  </div>
                </button>
              );
            })}
        </div>
      )}

      {/* =====================================================================
          2. TOP-LEFT: RELATIONSHIP & LOCATION PANEL (Compact Floating Plaque)
         ===================================================================== */}
      <header className="pointer-events-auto absolute left-4 top-4 flex items-center gap-3 rounded-2xl border border-[#ebd7bf]/20 bg-[#1e1715]/92 px-3.5 py-2.5 text-[#f7efe2] shadow-xl backdrop-blur-xs">
        {/* Adi & Damini Portraits + Focus Center Button */}
        {portraits && (
          <button
            type="button"
            onClick={onFocusCharacter}
            title="Focus camera on Adi & Damini"
            className="flex items-center gap-1 rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] p-1 transition-colors hover:border-[#f0be86]/50 cursor-pointer"
          >
            <img
              src={portraits.adi}
              alt="Adi"
              className="h-7 w-7 rounded-lg border border-[#e8d4bc]/25 object-cover [image-rendering:pixelated]"
            />
            <img
              src={portraits.damini}
              alt="Damini"
              className="h-7 w-7 rounded-lg border border-[#eb9fb0]/35 object-cover [image-rendering:pixelated]"
            />
          </button>
        )}

        <div className="flex flex-col min-w-0">
          <div className="flex items-center gap-2">
            <h1 className="font-['Fraunces'] text-sm font-bold tracking-tight text-[#fbf2e3] whitespace-nowrap">
              Melbourne Dreamland
            </h1>
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-[#cbbba7] truncate">
            <span className="font-medium text-[#f2c6a0]">
              Ch. {currentChapterNumber}
            </span>
            <span>·</span>
            <span className="truncate max-w-[140px] sm:max-w-[200px]">
              {interiorTitle}
            </span>
            <span>·</span>
            <span className="font-mono text-[10px] text-[#bfb09e] tabular-nums">
              {completedCoreCount}/5 Memories
            </span>
          </div>
        </div>

        {game?.activeInterior && (
          <button
            type="button"
            onClick={onExitInterior}
            className="flex items-center gap-1 rounded-xl bg-[#d98468] px-2.5 py-1.5 text-xs font-semibold text-[#1d1512] transition-colors hover:bg-[#e6967a] cursor-pointer whitespace-nowrap shrink-0"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Outside</span>
          </button>
        )}
      </header>



      {/* =====================================================================
          4. ACTIVE MELBOURNE TRAM JOURNEY BANNER
         ===================================================================== */}
      {game?.tramRide && (
        <div className="pointer-events-auto absolute left-1/2 top-5 -translate-x-1/2 rounded-2xl border border-[#8ed4a8]/40 bg-[#18261e]/95 px-5 py-3 text-[#f2fbf5] shadow-2xl">
          <div className="flex items-center gap-3 text-xs">
            <TrainFront className="h-4 w-4 text-[#8ed4a8] shrink-0" />
            <div>
              <div className="font-semibold tracking-tight whitespace-nowrap">
                {game.tramRide.routeBadge} ·{' '}
                {game.tramRide.phase === 'approaching'
                  ? 'Tram Arriving at Platform…'
                  : game.tramRide.phase === 'boarding'
                    ? 'Adi, Damini & Sunny Boarding…'
                    : game.tramRide.phase === 'riding'
                      ? `Riding to ${game.tramRide.destinationTitle}`
                      : 'Arriving at Destination Stop…'}
              </div>
              <div className="mt-1.5 h-1.5 w-64 overflow-hidden rounded-full bg-[#2b4235]">
                <div
                  className="h-full bg-[#8ed4a8] transition-transform duration-150 origin-left"
                  style={{
                    transform: `scaleX(${Math.max(0.06, game.tramRide.progress01)})`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* =====================================================================
          5. BOTTOM: COMPACT FLOATING ACTION DOCK
         ===================================================================== */}
      {!anyModalOpen && (
        <div className="pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2">
          <div className="pointer-events-auto flex items-center gap-2 rounded-2xl border border-[#ebd7bf]/20 bg-[#1e1715]/94 p-2 shadow-2xl backdrop-blur-xs">
            {/* Memory Journal */}
            <button
              type="button"
              onClick={() => onOpenJournal('chapters')}
              className="flex items-center gap-1.5 rounded-xl bg-[#e69a7b] px-3.5 py-2 text-xs font-semibold text-[#1f1613] transition-transform hover:scale-105 active:scale-95 cursor-pointer whitespace-nowrap"
              title="Memory Journal (J)"
            >
              <BookHeart className="h-4 w-4" />
              <span>Journal (J)</span>
            </button>

            {/* Keepsakes Shelf */}
            <button
              type="button"
              onClick={() => onOpenJournal('keepsakes')}
              className="flex items-center gap-1.5 rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] px-3 py-2 text-xs font-medium text-[#f3e7d6] hover:bg-[#382b26] transition-colors cursor-pointer whitespace-nowrap"
              title="Keepsakes & Memories (I)"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#f2be72]" />
              <span className="hidden sm:inline">Keepsakes (I)</span>
            </button>

            {/* Vintage Photo Booth (C) */}
            <button
              type="button"
              onClick={onOpenPhotoBooth}
              className="flex items-center gap-1.5 rounded-xl border border-[#e28ca0]/40 bg-[#3d1e27] px-3 py-2 text-xs font-medium text-[#fff2f5] hover:bg-[#522533] transition-colors cursor-pointer whitespace-nowrap"
              title="Vintage Photo Booth (C)"
            >
              <Camera className="h-3.5 w-3.5 text-[#e28ca0]" />
              <span className="hidden sm:inline">Photo Booth</span>
              <span className="sm:hidden">Booth</span>
            </button>

            {/* Melbourne Dreamland MP3 Jukebox */}
            <div className="relative flex items-center gap-1.5 rounded-xl border border-[#ebd7bf]/20 bg-[#29201c] px-2.5 py-1 text-xs text-[#f7efe2]">
              {/* Playlist toggle button with current track info */}
              <button
                type="button"
                onClick={() => setPlaylistOpen((prev) => !prev)}
                className="flex items-center gap-1.5 text-left text-xs font-semibold text-[#f5caa0] hover:text-[#fff6ea] transition-colors cursor-pointer max-w-[130px] sm:max-w-[190px] truncate"
                title="Click to view all 12 songs"
              >
                <Music className="h-3.5 w-3.5 shrink-0 text-[#e69a7b]" />
                <span className="truncate">
                  {trackStatus?.track.title || 'Soundtrack'}
                </span>
              </button>

              {/* Controls: Prev, Play/Pause, Next, Shuffle */}
              <div className="flex items-center gap-0.5 pl-1 border-l border-[#ebd7bf]/15">
                <button
                  type="button"
                  onClick={onPrevTrack}
                  className="rounded-lg p-1 text-[#cbbba7] hover:bg-[#382b26] hover:text-[#fff5e6] cursor-pointer"
                  title="Previous track"
                >
                  <SkipBack className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onTogglePlay}
                  className="rounded-lg bg-[#e69a7b] p-1 text-[#1f1613] hover:bg-[#f0ac8e] transition-transform active:scale-95 cursor-pointer"
                  title={trackStatus?.isPlaying ? 'Pause' : 'Play'}
                >
                  {trackStatus?.isPlaying ? (
                    <Pause className="h-3.5 w-3.5" />
                  ) : (
                    <Play className="h-3.5 w-3.5 fill-current" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={onNextTrack}
                  className="rounded-lg p-1 text-[#cbbba7] hover:bg-[#382b26] hover:text-[#fff5e6] cursor-pointer"
                  title="Next track (N)"
                >
                  <SkipForward className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={onToggleShuffle}
                  className={`rounded-lg p-1 transition-colors cursor-pointer ${
                    trackStatus?.isShuffle
                      ? 'text-[#f5caa0] bg-[#3a2721]'
                      : 'text-[#8c7b6d] hover:bg-[#382b26]'
                  }`}
                  title="Toggle Shuffle"
                >
                  <Shuffle className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Playlist Popup Menu */}
              {playlistOpen && (
                <div className="absolute bottom-full mb-3 left-0 w-72 rounded-2xl border border-[#ebd7bf]/25 bg-[#1e1715]/98 p-3 shadow-2xl backdrop-blur-md z-40">
                  <div className="flex items-center justify-between border-b border-[#ebd7bf]/15 pb-2 mb-2">
                    <span className="font-['Fraunces'] text-xs font-bold text-[#fbf2e3] flex items-center gap-1.5">
                      <ListMusic className="h-3.5 w-3.5 text-[#e69a7b]" />
                      <span>Soundtrack Playlist (12 Tracks)</span>
                    </span>
                    <button
                      type="button"
                      onClick={() => setPlaylistOpen(false)}
                      className="text-[#baa897] hover:text-[#fff5e6] cursor-pointer"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>

                  <div className="max-h-56 overflow-y-auto flex flex-col gap-1 pr-1">
                    {MELBOURNE_PLAYLIST.map((t, idx) => {
                      const active = trackStatus?.index === idx;
                      return (
                        <button
                          key={t.id}
                          type="button"
                          onClick={() => {
                            onSelectTrack(idx);
                            setPlaylistOpen(false);
                          }}
                          className={`flex items-center justify-between rounded-xl px-2.5 py-1.5 text-left text-xs transition-colors cursor-pointer ${
                            active
                              ? 'bg-[#59222c] text-[#fff6ea] font-bold'
                              : 'text-[#dfd0bc] hover:bg-[#2d231f]'
                          }`}
                        >
                          <div className="truncate mr-2">
                            <div className="truncate">{t.title}</div>
                            <div className="text-[10px] text-[#baa897]">{t.artist}</div>
                          </div>
                          {active && (
                            <span className="text-[10px] text-[#f5caa0] font-mono shrink-0">
                              Playing
                            </span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* World Map (M) */}
            <button
              type="button"
              onClick={onOpenMap}
              className="flex items-center gap-1.5 rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] px-3 py-2 text-xs font-medium text-[#f3e7d6] hover:bg-[#382b26] transition-colors cursor-pointer whitespace-nowrap"
              title="World Map & Fast Travel"
            >
              <MapIcon className="h-3.5 w-3.5 text-[#7bd4a0]" />
              <span className="hidden sm:inline">Map</span>
            </button>

            {/* Weather / Lighting Atmosphere Toggle */}
            <button
              type="button"
              onClick={() =>
                onChangeLighting(
                  lightingPreset === 'golden-hour' ? 'laneway-dusk' : 'golden-hour'
                )
              }
              className="flex items-center gap-1.5 rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] px-3 py-2 text-xs font-medium text-[#f3e7d6] hover:bg-[#382b26] transition-colors cursor-pointer whitespace-nowrap"
              title={`Switch lighting to ${
                lightingPreset === 'golden-hour' ? 'Laneway Dusk' : 'Golden Hour'
              }`}
            >
              {lightingPreset === 'golden-hour' ? (
                <>
                  <Sun className="h-3.5 w-3.5 text-[#f59e0b]" />
                  <span className="hidden sm:inline">Golden Hour</span>
                </>
              ) : (
                <>
                  <Moon className="h-3.5 w-3.5 text-[#a78bfa]" />
                  <span className="hidden sm:inline">Laneway Dusk</span>
                </>
              )}
            </button>

            {/* Audio Mute */}
            <button
              type="button"
              onClick={onToggleMute}
              title="Toggle Music (M)"
              className="flex items-center gap-1 rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] p-2 text-xs font-medium text-[#f3e7d6] hover:bg-[#382b26] cursor-pointer"
            >
              {saveData.musicMuted ? (
                <VolumeX className="h-3.5 w-3.5 text-[#d98477]" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-[#9fd4b2]" />
              )}
            </button>

            {/* Pause Settings Menu */}
            <button
              type="button"
              onClick={onOpenPause}
              title="Settings & Save (Esc)"
              className="rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] p-2 text-xs font-medium text-[#f3e7d6] hover:bg-[#382b26] cursor-pointer"
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
