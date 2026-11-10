import {
  Compass,
  Footprints,
  Heart,
  MapPin,
  Sparkles,
  TrainFront,
  X,
} from 'lucide-react';
import { POINTS_OF_INTEREST } from '../../game/config/locationsConfig';
import { GameSaveData, PointOfInterest } from '../../game/types';
import { DistrictId } from '../../world/types';

interface WorldMapModalProps {
  activeDistrict: DistrictId;
  saveData: GameSaveData;
  onFastTravel: (poi: PointOfInterest) => void;
  onSelectDistrictView: (districtId: DistrictId) => void;
  onClose: () => void;
}

const DISTRICT_INFO: Record<
  Exclude<DistrictId, 'overview'>,
  {
    name: string;
    subtitle: string;
    description: string;
    color: string;
    badge: string;
  }
> = {
  parkville: {
    name: 'Parkville',
    subtitle: 'Campus Terraces & International House',
    description: 'Leafy plane trees and courtyard avenues where Adi and Damini first met.',
    color: '#7eb38f',
    badge: 'Chapter 1',
  },
  cbd: {
    name: 'Melbourne CBD',
    subtitle: 'Laneways, Gnocchi & Spice',
    description: 'Bustling laneways home to 11 Inch Pizza, Bibi Ji, and the historic Flinders Quarter.',
    color: '#e69a7b',
    badge: 'Chapters 2 & 3',
  },
  arcade: {
    name: 'Arcade Alley',
    subtitle: 'Starlight Arcade, Vinyl & Photo Booth',
    description: 'Vibrant neon haven with arcade minigames, vinyl cafe, and vintage B&W photo booth.',
    color: '#e28ca0',
    badge: 'Entertainment Quarter',
  },
  southbank: {
    name: 'Southbank & Yarra River',
    subtitle: 'Riverfront Promenade & Twilight Overlook',
    description: 'Reflective waters, Princes Bridge, and the ultimate romantic viewpoint across the skyline.',
    color: '#7ba9d4',
    badge: 'Finale Overlook',
  },
  botanic: {
    name: 'Royal Botanic Gardens',
    subtitle: 'Picnic Lawns & Lakeside Walk',
    description: 'Rolling heritage greenery and quiet pavilions where Adi’s birthday was celebrated.',
    color: '#98c287',
    badge: 'Chapter 4',
  },
};

export function WorldMapModal({
  activeDistrict,
  saveData,
  onFastTravel,
  onSelectDistrictView,
  onClose,
}: WorldMapModalProps) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="map-modal-title"
      className="pointer-events-auto fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-3 backdrop-blur-sm sm:p-6"
    >
      <div className="relative flex max-h-[92vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl border border-[#e8d5be]/30 bg-[#1e1715] text-[#fbf3e6] shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e8d5be]/15 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#2a221f] text-[#f5caa0] border border-[#f5caa0]/40">
              <Compass className="h-5 w-5" />
            </div>
            <div>
              <h2
                id="map-modal-title"
                className="font-['Fraunces'] text-xl font-bold tracking-tight text-[#fbf2e3]"
              >
                Melbourne Dreamland Map
              </h2>
              <p className="text-xs text-[#cbbba7]">
                Select any landmark or district to fast-travel together
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e8d5be]/20 bg-[#2a221f] p-2 text-[#d6c5b3] transition-colors hover:bg-[#382d29] hover:text-[#fff5e6] cursor-pointer"
            title="Close Map (Esc)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content: District Cards & Landmark Fast Travel List */}
        <div className="min-h-0 flex-1 overflow-y-auto p-6">
          {/* District Selector Tabs */}
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {(Object.entries(DISTRICT_INFO) as [Exclude<DistrictId, 'overview'>, typeof DISTRICT_INFO['parkville']][]).map(
              ([id, info]) => {
                const isActive = activeDistrict === id;
                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => onSelectDistrictView(id)}
                    className={`flex flex-col rounded-2xl border p-3.5 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#f2c6a0] bg-[#2e231f] shadow-md scale-[1.02]'
                        : 'border-[#e8d5be]/15 bg-[#171311] hover:bg-[#231b18]'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span
                        className="h-2.5 w-2.5 rounded-full"
                        style={{ backgroundColor: info.color }}
                      />
                      <span className="text-[10px] font-mono text-[#a89785]">
                        {info.badge}
                      </span>
                    </div>
                    <div className="mt-2 font-['Fraunces'] text-sm font-semibold text-[#fbf2e3]">
                      {info.name}
                    </div>
                    <div className="mt-0.5 line-clamp-1 text-[11px] text-[#baa897]">
                      {info.subtitle}
                    </div>
                  </button>
                );
              }
            )}
          </div>

          {/* Points of Interest in Melbourne */}
          <div className="mt-6">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-[#baa897]">
              Points of Interest & Romantic Landmarks
            </h3>
            <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
              {POINTS_OF_INTEREST.map((poi) => {
                const isCompleted = saveData.completedMemoryIds.includes(poi.id);
                return (
                  <div
                    key={poi.id}
                    className="flex items-center justify-between gap-3 rounded-2xl border border-[#e8d5be]/15 bg-[#161210] p-3.5 transition-colors hover:border-[#e8d5be]/30"
                  >
                    <div className="flex items-start gap-3 min-w-0">
                      <div className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-[#251d1a] border border-[#e8d5be]/15">
                        {poi.category === 'tram-stop' ? (
                          <TrainFront className="h-4 w-4 text-[#7bd4a0]" />
                        ) : poi.category === 'arcade' || poi.category === 'vinyl-cafe' ? (
                          <Sparkles className="h-4 w-4 text-[#f2be72]" />
                        ) : poi.category === 'photo-booth' ? (
                          <MapPin className="h-4 w-4 text-[#e28ca0]" />
                        ) : (
                          <Heart
                            className={`h-4 w-4 ${
                              isCompleted
                                ? 'fill-[#eb94a4] text-[#eb94a4]'
                                : 'text-[#f2be82]'
                            }`}
                          />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-['Fraunces'] text-sm font-semibold text-[#fbf2e3] truncate">
                            {poi.title}
                          </span>
                          {poi.id === 'yarra-overlook' ? (
                            <span className="rounded-full bg-[#592231] px-2 py-0.5 text-[10px] font-bold text-[#fce6ed] border border-[#f0c2cd]/40">
                              {isCompleted ? 'She Said Yes! 💕' : 'Ask Her Out 💕'}
                            </span>
                          ) : isCompleted ? (
                            <span className="rounded-full bg-[#3d4d3a] px-2 py-0.5 text-[10px] font-medium text-[#a3e0a8]">
                              Visited
                            </span>
                          ) : null}
                        </div>
                        <div className="text-[11px] text-[#b8a795] truncate">
                          {poi.id === 'yarra-overlook'
                            ? 'Where Adi asks Damini out under the Melbourne skyline!'
                            : poi.subtitle}
                        </div>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onFastTravel(poi)}
                      className="flex shrink-0 items-center gap-1.5 rounded-xl bg-[#e69a7b] px-3 py-1.5 text-xs font-semibold text-[#1e1512] transition-colors hover:bg-[#f0ac8e] cursor-pointer"
                    >
                      <Footprints className="h-3.5 w-3.5" />
                      <span>Travel</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
