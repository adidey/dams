import React, { useEffect, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Compass,
  MapPin,
  Minus,
  Plus,
  RotateCcw,
  Sun,
  TrainFront,
} from 'lucide-react';
import { DISTRICT_PRESETS } from '../world/DistrictManager';
import {
  DistrictId,
  LightingPreset,
  ProjectedMarker,
  TramStatusSnapshot,
} from '../world/types';

interface EnvironmentHUDProps {
  activeDistrict: DistrictId;
  targetX: number;
  targetZ: number;
  zoom: number;
  markers: ProjectedMarker[];
  trams: TramStatusSnapshot[];
  followingTramId: string | null;
  showMarkers: boolean;
  lightingPreset: LightingPreset;
  onSelectDistrict: (id: DistrictId) => void;
  onFocusMarker: (pos: [number, number, number], zoom?: number) => void;
  onToggleMarkers: () => void;
  onChangeLighting: (preset: LightingPreset) => void;
  onToggleFollowTram: (tramId: string) => void;
  onResetCamera: () => void;
  onZoomStep: (factor: number) => void;
  onRotateStep: (dir: -1 | 1) => void;
}

const LIGHTING_OPTIONS: Array<{ id: LightingPreset; label: string }> = [
  { id: 'golden-hour', label: 'Golden Hour' },
  { id: 'sunny-afternoon', label: 'Afternoon' },
  { id: 'laneway-dusk', label: 'Laneway Dusk' },
];

export const EnvironmentHUD: React.FC<EnvironmentHUDProps> = ({
  activeDistrict,
  targetX,
  targetZ,
  zoom,
  markers,
  trams,
  followingTramId,
  showMarkers,
  lightingPreset,
  onSelectDistrict,
  onFocusMarker,
  onToggleMarkers,
  onChangeLighting,
  onToggleFollowTram,
  onResetCamera,
  onZoomStep,
  onRotateStep,
}) => {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;
      if (e.key.toLowerCase() === 'h') {
        setCollapsed((prev) => !prev);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const currentPresetInfo =
    DISTRICT_PRESETS.find((d) => d.id === activeDistrict) ?? DISTRICT_PRESETS[1];

  return (
    <div className="pointer-events-none fixed inset-0 z-10 overflow-hidden">
      {/* Projected 3D Landmark, Laneway & Tram Stop Debug Pins */}
      {showMarkers &&
        markers.map((mk) => {
          if (!mk.visible) return null;
          const isTram = mk.category === 'tram-stop';
          const isLane = mk.category === 'laneway';
          return (
            <button
              key={mk.id}
              type="button"
              onClick={() => onFocusMarker(mk.worldPosition, mk.zoom)}
              style={{
                transform: `translate3d(${mk.x.toFixed(1)}px, ${mk.y.toFixed(1)}px, 0) translate(-50%, -100%)`,
              }}
              className="pointer-events-auto absolute top-0 left-0 group flex flex-col items-center transition-opacity duration-150 hover:z-20 focus:outline-none"
            >
              <span
                className={`flex items-center gap-1.5 rounded-md border px-2 py-1 text-[11px] font-medium whitespace-nowrap shadow-sm transition-colors ${
                  isTram
                    ? 'bg-[#1c3829] border-[#3d6e52] text-[#f2e8d5] group-hover:bg-[#244835]'
                    : isLane
                      ? 'bg-[#36241d] border-[#784d3b] text-[#f7e8d4] group-hover:bg-[#472f26]'
                      : 'bg-[#201d1a] border-[#4a433b] text-[#f5efe6] group-hover:bg-[#2c2824]'
                }`}
              >
                {isTram ? (
                  <TrainFront className="w-3 h-3 text-[#d9a752] shrink-0" />
                ) : (
                  <MapPin className="w-3 h-3 text-[#d47b59] shrink-0" />
                )}
                <span>{mk.label}</span>
              </span>
              <span className="h-2 w-[1.5px] bg-[#dfd3c0]/70" />
            </button>
          );
        })}

      {/* Minimal Top-Left Spec & Current District Header (Zero Pills, Zero Pulsing Dots) */}
      <header className="pointer-events-auto absolute top-4 left-5 max-w-md rounded-lg border border-[#3a342e] bg-[#1b1815]/95 px-4 py-3 shadow-md">
        <div className="flex items-baseline justify-between gap-4">
          <h1 className="font-display text-lg font-semibold tracking-tight text-[#f7efe2] whitespace-nowrap">
            Melbourne Dreamland
          </h1>
          <span className="font-mono-tabular text-[11px] text-[#b8ab99] whitespace-nowrap">
            {targetX.toFixed(0)}m, {targetZ.toFixed(0)}m · {zoom.toFixed(2)}x
          </span>
        </div>
        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#cfc3b2]">
          <span className="font-medium text-[#eab875] whitespace-nowrap shrink-0">
            {currentPresetInfo.name}
          </span>
          <span aria-hidden="true" className="shrink-0">·</span>
          <span className="truncate">{currentPresetInfo.subtitle}</span>
        </div>
      </header>

      {/* Unified Collapsible Bottom Control Dock (100% Unobstructed Central Viewport) */}
      <div
        style={{
          transform: collapsed
            ? 'translate3d(-50%, calc(100% - 34px), 0)'
            : 'translate3d(-50%, 0, 0)',
        }}
        className="pointer-events-auto fixed bottom-4 left-1/2 flex w-[min(980px,95vw)] flex-col items-center transition-transform duration-200 ease-out"
      >
        {/* Collapse / Zen Mode Tab */}
        <button
          type="button"
          onClick={() => setCollapsed((c) => !c)}
          className="flex items-center gap-1.5 rounded-t-lg border border-b-0 border-[#3a342e] bg-[#1b1815] px-3.5 py-1.5 text-xs font-medium text-[#d8ccb9] hover:text-[#ffffff] transition-colors whitespace-nowrap"
        >
          {collapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" />
              <span>Show World Controls (H)</span>
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" />
              <span>Hide Controls (H)</span>
            </>
          )}
        </button>

        {/* Main Dock Panel */}
        <div className="w-full rounded-xl border border-[#3a342e] bg-[#1b1815] px-4 py-3 shadow-xl">
          {/* Row 1: District Navigation Bar */}
          <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#2e2924]">
            <div className="flex flex-wrap items-center gap-1 bg-[#141210] p-1 rounded-lg">
              {DISTRICT_PRESETS.map((d) => {
                const active = activeDistrict === d.id;
                return (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => onSelectDistrict(d.id)}
                    className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-[#c96e4b] text-[#fffaf2] shadow-sm'
                        : 'text-[#c9bda9] hover:text-[#f7efe2] hover:bg-[#25211d]'
                    }`}
                  >
                    {d.name}
                  </button>
                );
              })}
            </div>

            {/* Camera Quick Tools */}
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => onRotateStep(-1)}
                title="Rotate camera -45° (Q)"
                className="px-2.5 py-1.5 text-xs font-medium rounded-md bg-[#26221e] text-[#dfd4c3] hover:bg-[#332e28] transition-colors whitespace-nowrap shrink-0"
              >
                <Compass className="w-3.5 h-3.5 inline mr-1" />
                Q / E
              </button>
              <button
                type="button"
                onClick={() => onZoomStep(0.8)}
                title="Zoom Out"
                className="p-1.5 rounded-md bg-[#26221e] text-[#dfd4c3] hover:bg-[#332e28] transition-colors"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onZoomStep(1.25)}
                title="Zoom In"
                className="p-1.5 rounded-md bg-[#26221e] text-[#dfd4c3] hover:bg-[#332e28] transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onResetCamera}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md bg-[#26221e] text-[#f2e8d8] hover:bg-[#332e28] transition-colors whitespace-nowrap shrink-0"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset View</span>
              </button>
            </div>
          </div>

          {/* Row 2: Atmosphere Presets · Live Tram Fleet Ride-Along · Debug Markers · Controls Hint */}
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Lighting Presets */}
            <div className="flex items-center gap-1.5">
              <Sun className="w-3.5 h-3.5 text-[#eab875] shrink-0" />
              <div className="flex items-center gap-1 bg-[#141210] p-0.5 rounded-lg">
                {LIGHTING_OPTIONS.map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => onChangeLighting(opt.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 ${
                      lightingPreset === opt.id
                        ? 'bg-[#332c25] text-[#f7efe2]'
                        : 'text-[#a89c8a] hover:text-[#e6dac8]'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Functional Melbourne Trams Selector */}
            <div className="flex items-center gap-1.5">
              <TrainFront className="w-3.5 h-3.5 text-[#68b588] shrink-0" />
              <span className="text-[#a89c8a] whitespace-nowrap">Trams:</span>
              {trams.map((t) => {
                const isFollowing = followingTramId === t.id;
                return (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => onToggleFollowTram(t.id)}
                    className={`px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                      isFollowing
                        ? 'bg-[#215738] border-[#4b966b] text-[#fff8eb]'
                        : 'bg-[#221f1b] border-[#36302a] text-[#d5c8b4] hover:bg-[#2c2823]'
                    }`}
                  >
                    #{t.routeCode}{' '}
                    {t.state === 'boarding' ? '· Boarding' : ''}
                  </button>
                );
              })}
            </div>

            {/* Landmark & Stop Debug Markers Toggle + Navigation Guide */}
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onToggleMarkers}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-md border transition-colors whitespace-nowrap shrink-0 ${
                  showMarkers
                    ? 'bg-[#2e2721] border-[#6b5847] text-[#f5ead8]'
                    : 'bg-[#1f1c19] border-[#332e28] text-[#9e9282]'
                }`}
              >
                <MapPin className="w-3.5 h-3.5" />
                <span>Markers: {showMarkers ? 'On' : 'Off'}</span>
              </button>

              <span className="hidden lg:inline text-[11px] text-[#9c9080] whitespace-nowrap">
                WASD / Drag to Pan · Scroll to Zoom · Q/E Rotate
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
