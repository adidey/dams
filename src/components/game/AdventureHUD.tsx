import {
  BookHeart,
  Camera,
  ChevronLeft,
  ChevronRight,
  Compass,
  Disc3,
  Heart,
  HelpCircle,
  LogOut,
  Map as MapIcon,
  MapPin,
  RotateCcw,
  RotateCw,
  SlidersHorizontal,
  Sparkles,
  TrainFront,
  Volume2,
  VolumeX,
  X,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { useEffect, useState } from 'react';
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
  onTriggerInteract: () => void;
  onInteractInteriorAction: (
    actionType: InteriorInteractablePrompt['actionType']
  ) => void;
  onPetSunny: () => void;
  onOpenJournal: (initialTab: 'chapters' | 'keepsakes') => void;
  onOpenPhotoBooth: () => void;
  onOpenAskHerOut: () => void;
  onOpenMap: () => void;
  onOpenPause: () => void;
  onToggleMute: () => void;
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
  onTriggerInteract,
  onInteractInteriorAction,
  onPetSunny,
  onOpenJournal,
  onOpenPhotoBooth,
  onOpenAskHerOut,
  onOpenMap,
  onOpenPause,
  onToggleMute,
  onFocusCharacter,
  onSelectDistrict,
  onChangeLighting,
  onZoomStep,
  onRotateStep,
  onExitInterior,
}: AdventureHUDProps) {
  // Collapsible Objectives Drawer
  const [objectivesOpen, setObjectivesOpen] = useState(false);
  // Help Modal / Popover
  const [showHelp, setShowHelp] = useState(false);

  const completedCoreCount = CORE_MEMORY_IDS.filter((id) =>
    saveData.completedMemoryIds.includes(id)
  ).length;
  const allCoreDone = completedCoreCount >= CORE_MEMORY_IDS.length;
  const finalDone = saveData.completedMemoryIds.includes('yarra-overlook');

  // Determine current chapter & next recommendation
  let currentChapterNumber = 1;
  let currentChapterTitle = 'International House';
  let nextSuggestedDestination = 'International House (Parkville)';

  for (const poi of POINTS_OF_INTEREST) {
    if (poi.category === 'memory' && !saveData.completedMemoryIds.includes(poi.id)) {
      currentChapterNumber = poi.chapterNumber || 1;
      currentChapterTitle = poi.title;
      nextSuggestedDestination = `${poi.title} (${DISTRICT_TITLES[poi.district].split('·')[0].trim()})`;
      break;
    }
  }

  if (allCoreDone && !finalDone) {
    currentChapterNumber = 6;
    currentChapterTitle = 'Twilight Overlook';
    nextSuggestedDestination = 'Yarra River Twilight Overlook (Southbank)';
  } else if (finalDone) {
    currentChapterNumber = 6;
    currentChapterTitle = 'Our Melbourne Dreamland';
    nextSuggestedDestination = 'Free exploration with Damini & Sunny';
  }

  const interiorTitle =
    game?.activeInterior === 'vinyl-cafe'
      ? 'Inside Wax & Groove Vinyl Cafe'
      : game?.activeInterior === 'arcade'
        ? 'Inside Starlight Coin-Op Arcade'
        : DISTRICT_TITLES[activeDistrict];

  // Hotkey listener for C (Camera/Photobooth), O (Objectives), ? (Help)
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
      } else if (k === 'p' && !anyModalOpen) {
        e.preventDefault();
        onOpenAskHerOut();
      } else if (k === 'o' && !anyModalOpen) {
        e.preventDefault();
        setObjectivesOpen((prev) => !prev);
      } else if (k === '?' && !anyModalOpen) {
        e.preventDefault();
        setShowHelp((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [anyModalOpen, onOpenPhotoBooth]);

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

          {/* Pet Sunny prompt */}
          {game.nearbySunnyPrompt?.visible && (
            <button
              type="button"
              onClick={onPetSunny}
              style={{
                transform: `translate3d(${Math.round(game.nearbySunnyPrompt.x)}px, ${Math.round(game.nearbySunnyPrompt.y)}px, 0) translate(-50%, -100%)`,
              }}
              className="pointer-events-auto absolute left-0 top-0 flex items-center gap-2 rounded-xl border border-[#f5d07a]/70 bg-[#221b16]/95 px-3 py-1.5 text-xs font-semibold text-[#fff4de] shadow-lg transition-transform duration-150 hover:scale-105 cursor-pointer whitespace-nowrap"
            >
              <span className="inline-flex h-5 w-5 items-center justify-center rounded bg-[#eab85c] font-mono text-[11px] font-bold text-[#1f1812]">
                E
              </span>
              <span>Pet Sunny</span>
            </button>
          )}
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
            {/* Interactive "Ask Her Out" Romance Pill */}
            <button
              type="button"
              onClick={onOpenAskHerOut}
              className="flex items-center gap-1 rounded-full bg-[#592231]/85 hover:bg-[#782b3f] px-2 py-0.5 text-[11px] font-semibold text-[#fce6ec] border border-[#f0c2cd]/40 shadow-sm cursor-pointer transition-all hover:scale-105 active:scale-95"
              title="The Big Question · Ask Damini Out (P)"
            >
              <Heart className="h-3 w-3 fill-[#e28ca0] text-[#e28ca0] animate-pulse" />
              <span>{finalDone ? 'She Said Yes! 💕' : 'Ask Her Out 💕'}</span>
            </button>
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
          3. RIGHT-SIDE: OBJECTIVES PANEL (Collapsible)
         ===================================================================== */}
      <aside className="pointer-events-auto absolute right-4 top-4 flex flex-col items-end">
        {/* Toggle Icon */}
        <button
          type="button"
          onClick={() => setObjectivesOpen((prev) => !prev)}
          className="flex items-center gap-1.5 rounded-2xl border border-[#ebd7bf]/20 bg-[#1e1715]/92 px-3 py-2 text-xs font-semibold text-[#f7efe2] shadow-xl hover:bg-[#281f1b] transition-colors cursor-pointer"
          title="Toggle Objectives Panel (O)"
        >
          <Compass className="h-4 w-4 text-[#f2be82]" />
          <span className="hidden sm:inline">Objectives</span>
          {objectivesOpen ? (
            <ChevronRight className="h-3.5 w-3.5 text-[#baa897]" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5 text-[#baa897]" />
          )}
        </button>

        {/* Expanded Objectives Drawer */}
        {objectivesOpen && (
          <div className="mt-2 w-72 rounded-3xl border border-[#ebd7bf]/20 bg-[#1e1715]/95 p-4 text-[#f7efe2] shadow-2xl backdrop-blur-xs">
            {/* Current Objective */}
            <div className="border-b border-[#ebd7bf]/15 pb-3">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#baa897]">
                Current Objective
              </span>
              <p className="mt-1 text-xs font-semibold leading-relaxed text-[#fbf2e3]">
                {finalDone
                  ? 'She Said Yes! 💕 All Chapters Revisited · Forever Our Melbourne'
                  : allCoreDone
                    ? 'Final Overlook Unlocked · Meet at Yarra River Twilight Overlook'
                    : `Explore Melbourne together · Chapter ${currentChapterNumber}: ${currentChapterTitle}`}
              </p>

              {/* Romantic Climax Callout Card */}
              <div className="mt-2.5 rounded-2xl border border-[#f0c2cd]/35 bg-[#331b25] p-2.5 text-center">
                <div className="flex items-center justify-center gap-1 text-[11px] font-bold text-[#fce6ed]">
                  <Heart className="h-3 w-3 fill-[#e28ca0] text-[#e28ca0]" />
                  <span>The Big Question 💕</span>
                </div>
                <p className="mt-0.5 text-[10px] text-[#dfb8c4] leading-snug">
                  {finalDone
                    ? 'Damini said YES! Forever your partner in Melbourne.'
                    : 'Yarra River Twilight Overlook · Ask Damini to be your girlfriend!'}
                </p>
                <button
                  type="button"
                  onClick={onOpenAskHerOut}
                  className="mt-2 w-full rounded-xl bg-gradient-to-r from-[#e6738c] to-[#d95973] py-1.5 text-xs font-bold text-white shadow hover:scale-[1.02] active:scale-98 transition-transform cursor-pointer"
                >
                  {finalDone ? 'Relive The Proposal 💕' : 'Ask Damini Out Now 💕'}
                </button>
              </div>
            </div>

            {/* Suggested Next Destination */}
            <div className="border-b border-[#ebd7bf]/15 py-2.5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-[#baa897]">
                Next Destination
              </span>
              <div className="mt-1 flex items-center gap-1.5 text-xs font-medium text-[#f5caa0]">
                <MapPin className="h-3.5 w-3.5 shrink-0 text-[#e69a7b]" />
                <span className="truncate">{nextSuggestedDestination}</span>
              </div>
            </div>

            {/* Core Memories Checklist */}
            <div className="pt-2.5">
              <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-wider text-[#baa897]">
                <span>Memories Collected</span>
                <span className="text-[#f5caa0]">{completedCoreCount} / 5</span>
              </div>

              <div className="mt-2 flex flex-col gap-1.5">
                {POINTS_OF_INTEREST.filter((p) => p.category === 'memory').map((p) => {
                  const done = saveData.completedMemoryIds.includes(p.id);
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between text-xs"
                    >
                      <span
                        className={
                          done ? 'text-[#a89887] line-through' : 'text-[#fbf3e6]'
                        }
                      >
                        {p.title}
                      </span>
                      {done ? (
                        <span className="rounded-full bg-[#41533e] px-1.5 py-0.2 text-[9px] font-semibold text-[#a3e0a8]">
                          Done
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#f2be82]">Open</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </aside>

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
              title="Vintage B&W Photo Booth (C)"
            >
              <Camera className="h-3.5 w-3.5 text-[#e28ca0]" />
              <span className="hidden sm:inline">Photo Booth</span>
              <span className="sm:hidden">Booth</span>
            </button>

            {/* Ask Her Out Romantic Climax (P) */}
            <button
              type="button"
              onClick={onOpenAskHerOut}
              className="flex items-center gap-1.5 rounded-xl border border-[#f0c2cd]/50 bg-gradient-to-r from-[#592231] to-[#752a3d] px-3.5 py-2 text-xs font-bold text-[#fff3f6] shadow-md hover:scale-105 active:scale-95 transition-transform cursor-pointer whitespace-nowrap"
              title="Ask Damini Out Under Melbourne Twilight (P)"
            >
              <Heart className="h-3.5 w-3.5 fill-[#f2a5b6] text-[#f2a5b6] animate-pulse" />
              <span>{finalDone ? 'She Said Yes! 💕' : 'Ask Her Out 💕'}</span>
            </button>

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

            {/* Divider */}
            <div className="h-6 w-px bg-[#ebd7bf]/15" />

            {/* Camera Zoom / Rotate Mini controls */}
            <div className="hidden md:flex items-center gap-0.5">
              <button
                type="button"
                onClick={() => onRotateStep(-1)}
                title="Rotate -45° ([)"
                className="rounded-lg p-1.5 text-[#cbbba7] hover:bg-[#2c241f] hover:text-[#fff5e6] cursor-pointer"
              >
                <RotateCcw className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onZoomStep(1.18)}
                title="Zoom in (+)"
                className="rounded-lg p-1.5 text-[#cbbba7] hover:bg-[#2c241f] hover:text-[#fff5e6] cursor-pointer"
              >
                <ZoomIn className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onZoomStep(0.84)}
                title="Zoom out (-)"
                className="rounded-lg p-1.5 text-[#cbbba7] hover:bg-[#2c241f] hover:text-[#fff5e6] cursor-pointer"
              >
                <ZoomOut className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onRotateStep(1)}
                title="Rotate +45° (])"
                className="rounded-lg p-1.5 text-[#cbbba7] hover:bg-[#2c241f] hover:text-[#fff5e6] cursor-pointer"
              >
                <RotateCw className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Lighting / Mood */}
            <button
              type="button"
              onClick={() => {
                const order: LightingPreset[] = [
                  'golden-hour',
                  'sunny-afternoon',
                  'laneway-dusk',
                ];
                const next =
                  order[(order.indexOf(lightingPreset) + 1) % order.length];
                onChangeLighting(next);
              }}
              title="Cycle Sky Mood"
              className="rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] px-2.5 py-2 text-xs font-medium text-[#dfd0be] hover:bg-[#382b26] cursor-pointer whitespace-nowrap"
            >
              {lightingPreset === 'golden-hour'
                ? 'Golden Hour'
                : lightingPreset === 'sunny-afternoon'
                  ? 'Sunny Day'
                  : 'Laneway Dusk'}
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

            {/* Controls Help (?) */}
            <button
              type="button"
              onClick={() => setShowHelp((prev) => !prev)}
              title="Keyboard Shortcuts (?)"
              className="rounded-xl border border-[#ebd7bf]/15 bg-[#29201c] p-2 text-xs font-medium text-[#cbbba7] hover:bg-[#382b26] hover:text-[#fff5e6] cursor-pointer"
            >
              <HelpCircle className="h-3.5 w-3.5" />
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

      {/* =====================================================================
          6. SHORTCUTS & HELP POPOVER (Collapsible, non-permanent)
         ===================================================================== */}
      {showHelp && (
        <div className="pointer-events-auto fixed bottom-20 left-1/2 -translate-x-1/2 w-80 rounded-2xl border border-[#ebd7bf]/25 bg-[#1e1715]/95 p-4 text-[#f7efe2] shadow-2xl backdrop-blur-xs">
          <div className="flex items-center justify-between border-b border-[#ebd7bf]/15 pb-2">
            <span className="font-['Fraunces'] text-xs font-bold text-[#fbf2e3]">
              Explorer Controls
            </span>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="text-[#baa897] hover:text-[#fff5e6]"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="mt-2.5 grid grid-cols-2 gap-y-1.5 gap-x-2 text-[11px] text-[#baa897]">
            <div><span className="font-mono text-[#f5caa0]">WASD / Arrows</span>: Walk</div>
            <div><span className="font-mono text-[#f5caa0]">E</span>: Interact</div>
            <div><span className="font-mono text-[#f5caa0]">J</span>: Journal</div>
            <div><span className="font-mono text-[#f5caa0]">I</span>: Keepsakes</div>
            <div><span className="font-mono text-[#f5caa0]">C</span>: Photo Booth</div>
            <div><span className="font-mono text-[#f5caa0]">O</span>: Objectives</div>
            <div><span className="font-mono text-[#f5caa0]">M</span>: Music Toggle</div>
            <div><span className="font-mono text-[#f5caa0]">Esc</span>: Pause Menu</div>
          </div>
        </div>
      )}
    </div>
  );
}
