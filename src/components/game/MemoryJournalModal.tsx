import {
  BookHeart,
  Camera,
  Check,
  CheckCircle2,
  Compass,
  Download,
  Edit2,
  Heart,
  Image as ImageIcon,
  Lock,
  Sparkles,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect, useMemo, useState } from 'react';
import { COLLECTIBLES_CONFIG } from '../../game/config/collectiblesConfig';
import {
  CORE_MEMORY_IDS,
  POINTS_OF_INTEREST,
} from '../../game/config/locationsConfig';
import { PHOTO_MEMORY_CONFIG } from '../../game/config/photosConfig';
import {
  GameSaveData,
  PointOfInterest,
  StoredUploadedPhoto,
} from '../../game/types';
import { LightingPreset } from '../../world/types';
import { CollectibleIcon } from './CollectibleIcon';

interface MemoryJournalModalProps {
  activeTab: 'chapters' | 'keepsakes' | 'gallery' | 'settings';
  saveData: GameSaveData;
  uploadedPhotos: StoredUploadedPhoto[];
  lightingPreset: LightingPreset;
  onChangeTab: (tab: 'chapters' | 'keepsakes' | 'gallery' | 'settings') => void;
  onRevisitMemory: (poi: PointOfInterest) => void;
  onTravelNearPOI: (poi: PointOfInterest) => void;
  onOpenPhotoBooth: () => void;
  onUpdateCaption?: (photoId: string, caption: string) => Promise<void>;
  onDeletePhoto?: (photoId: string) => Promise<void>;
  onChangeLighting: (preset: LightingPreset) => void;
  onToggleMute: () => void;
  onClose: () => void;
}

export function MemoryJournalModal({
  activeTab,
  saveData,
  uploadedPhotos,
  lightingPreset,
  onChangeTab,
  onRevisitMemory,
  onTravelNearPOI,
  onOpenPhotoBooth,
  onUpdateCaption,
  onDeletePhoto,
  onChangeLighting,
  onToggleMute,
  onClose,
}: MemoryJournalModalProps) {
  const [selectedPhoto, setSelectedPhoto] = useState<StoredUploadedPhoto | null>(null);
  const [editingCaption, setEditingCaption] = useState(false);
  const [captionInput, setCaptionInput] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (selectedPhoto) {
          setSelectedPhoto(null);
        } else {
          onClose();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose, selectedPhoto]);

  const memoryChapters = useMemo(
    () =>
      POINTS_OF_INTEREST.filter(
        (p) => p.category === 'memory' || p.category === 'final-memory'
      ).sort((a, b) => (a.chapterNumber ?? 99) - (b.chapterNumber ?? 99)),
    []
  );

  const completedCoreCount = CORE_MEMORY_IDS.filter((id) =>
    saveData.completedMemoryIds.includes(id)
  ).length;
  const allCoreDone = completedCoreCount >= CORE_MEMORY_IDS.length;

  const handleSaveCaption = async () => {
    if (!selectedPhoto || !onUpdateCaption) return;
    await onUpdateCaption(selectedPhoto.id, captionInput);
    setSelectedPhoto({ ...selectedPhoto, caption: captionInput });
    setEditingCaption(false);
  };

  const handleDeleteCurrent = async (id: string) => {
    if (!onDeletePhoto) return;
    await onDeletePhoto(id);
    setDeleteConfirmId(null);
    if (selectedPhoto?.id === id) {
      setSelectedPhoto(null);
    }
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-3 sm:p-5 pointer-events-auto backdrop-blur-xs">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[92vh] w-full max-w-4xl overflow-y-auto rounded-3xl border border-[#e6cfd2] bg-[#fbf4e8] p-5 sm:p-7 text-[#362722] shadow-2xl"
      >
        {/* Header */}
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-[#e5cfd2] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#a35a6b]">
              <BookHeart className="h-4 w-4" />
              <span>Adi &amp; Damini’s Keepsakes &amp; Scrapbook</span>
              <span aria-hidden="true">·</span>
              <span className="font-mono tabular-nums">
                {completedCoreCount}/{CORE_MEMORY_IDS.length} Core Chapters
              </span>
            </div>
            <h2 className="mt-0.5 font-['Fraunces'] text-2xl md:text-3xl italic font-semibold text-[#2d1f1b]">
              Our Melbourne Memory Journal
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e2cbd0] bg-[#fffaf2] p-2 text-[#6e524a] hover:bg-[#f7e5e8] hover:text-[#2f201c] cursor-pointer"
            aria-label="Close journal"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Filter Navigation Tabs */}
        <div className="mt-4 flex flex-wrap items-center gap-1 rounded-xl bg-[#f0e4d4] p-1">
          {(
            [
              ['chapters', 'Memory Chapters'],
              ['keepsakes', `Keepsakes (${saveData.collectedItemIds.length}/12)`],
              ['gallery', `Photo Booth Gallery (${uploadedPhotos.length})`],
              ['settings', 'World & Controls'],
            ] as const
          ).map(([tabId, label]) => (
            <button
              key={tabId}
              type="button"
              onClick={() => onChangeTab(tabId)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeTab === tabId
                  ? 'bg-[#fffdf9] text-[#2d1f1b] shadow-sm'
                  : 'text-[#785e55] hover:text-[#2d1f1b]'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {/* =================================================================
            TAB 1: MEMORY CHAPTERS
           ================================================================= */}
        {activeTab === 'chapters' && (
          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
            {memoryChapters.map((poi) => {
              const completed = saveData.completedMemoryIds.includes(poi.id);
              const locked = Boolean(poi.requiresAllCoreMemories && !allCoreDone);
              const uploadedThumb = uploadedPhotos.find(
                (p) => p.locationId === poi.id
              )?.dataUrl;
              const configuredThumb = PHOTO_MEMORY_CONFIG[poi.id]?.find((c) =>
                Boolean(c.src)
              )?.src;
              const thumbSrc = uploadedThumb ?? configuredThumb;

              return (
                <div
                  key={poi.id}
                  className={`flex flex-col justify-between rounded-2xl border p-4 transition-colors ${
                    locked
                      ? 'border-[#e4d6c8] bg-[#f4ece0]/80 opacity-80'
                      : completed
                        ? 'border-[#e3b8c2] bg-[#fffaf5]'
                        : 'border-[#e6d7c6] bg-[#fffdf9]'
                  }`}
                >
                  <div>
                    <div className="flex items-center justify-between gap-2 text-xs text-[#8f6d63]">
                      <span>
                        {poi.dateHint ?? `Chapter ${poi.chapterNumber}`}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        {locked ? (
                          <>
                            <Lock className="h-3.5 w-3.5 text-[#9c8478]" />
                            <span>Complete 5 Core Memories</span>
                          </>
                        ) : completed ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5 text-[#5aa878]" />
                            <span className="text-[#458a60]">Remembered</span>
                          </>
                        ) : (
                          <>
                            <Heart className="h-3.5 w-3.5 text-[#d67489]" />
                            <span className="text-[#b3576c]">Unvisited</span>
                          </>
                        )}
                      </span>
                    </div>

                    <h3 className="mt-1 font-['Fraunces'] text-lg font-semibold text-[#2d1f1b]">
                      {poi.title}
                    </h3>
                    <div className="text-xs text-[#9c6b77]">{poi.subtitle}</div>

                    {thumbSrc && (
                      <div className="mt-3 overflow-hidden rounded-xl border border-[#ead6d9] bg-[#f5ede0]">
                        <img
                          src={thumbSrc}
                          alt={poi.title}
                          referrerPolicy="no-referrer"
                          className="h-32 w-full object-cover"
                        />
                      </div>
                    )}

                    <p className="mt-2.5 text-xs leading-relaxed text-[#57413a]">
                      {poi.journalDescription}
                    </p>
                  </div>

                  {!locked && (
                    <div className="mt-4 flex items-center gap-2 pt-2 border-t border-[#efe2d5]">
                      <button
                        type="button"
                        onClick={() => onTravelNearPOI(poi)}
                        className="flex items-center gap-1.5 rounded-xl border border-[#dfd0c1] bg-[#faf2e6] px-3 py-2 text-xs font-medium text-[#4a3630] hover:bg-[#f2e5d4] cursor-pointer whitespace-nowrap"
                      >
                        <Compass className="h-3.5 w-3.5 text-[#b3576c]" />
                        <span>Walk Nearby</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => onRevisitMemory(poi)}
                        className="flex-1 rounded-xl bg-[#d67489] px-3 py-2 text-xs font-semibold text-white hover:bg-[#c46076] cursor-pointer whitespace-nowrap"
                      >
                        {completed ? 'Open Scrapbook Page' : 'Preview Scrapbook'}
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================================
            TAB 2: COLLECTIBLE KEEPSAKES
           ================================================================= */}
        {activeTab === 'keepsakes' && (
          <div className="mt-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 md:grid-cols-3">
            {COLLECTIBLES_CONFIG.map((item) => {
              const unlocked = saveData.collectedItemIds.includes(item.id);
              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-4 ${
                    unlocked
                      ? 'border-[#e5c4cc] bg-[#fffaf5]'
                      : 'border-[#e6d9ca] bg-[#f4ece0]/75 opacity-75'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#291f1c]">
                      {unlocked ? (
                        <CollectibleIcon
                          iconKey={item.iconKey}
                          accentHex={item.accentHex}
                        />
                      ) : (
                        <Sparkles className="h-4 w-4 text-[#7d6860]" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="truncate text-xs font-semibold text-[#2d1f1b]">
                        {unlocked ? item.name : 'Undiscovered Keepsake'}
                      </div>
                      <div className="truncate text-[11px] text-[#a35a6b]">
                        {item.sourceLabel}
                      </div>
                    </div>
                  </div>
                  <p className="mt-2.5 text-xs leading-relaxed text-[#5c453e]">
                    {unlocked
                      ? item.description
                      : `Explore ${item.sourceLabel} to add this keepsake to Adi & Damini’s shelf.`}
                  </p>
                </div>
              );
            })}
          </div>
        )}

        {/* =================================================================
            TAB 3: PHOTO BOOTH & KEEPSAKE GALLERY (NEW!)
           ================================================================= */}
        {activeTab === 'gallery' && (
          <div className="mt-6">
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#ebd7bf]/60 pb-3">
              <div>
                <h3 className="font-['Fraunces'] text-lg font-semibold text-[#2d1f1b]">
                  Photobooth Strips &amp; Saved Moments
                </h3>
                <p className="text-xs text-[#785e55]">
                  All vintage 4-shot film strips and personal photographs saved during your journey.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenPhotoBooth();
                }}
                className="flex items-center gap-1.5 rounded-xl bg-[#59222c] px-3.5 py-2 text-xs font-semibold text-[#fff5ea] hover:bg-[#702936] cursor-pointer"
              >
                <Camera className="h-4 w-4 text-[#f5caa0]" />
                <span>Open Vintage Photo Booth</span>
              </button>
            </div>

            {uploadedPhotos.length === 0 ? (
              <div className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-[#e4d3c4] bg-[#fffaf5] p-10 text-center my-6">
                <Camera className="h-10 w-10 text-[#a35a6b] mb-3" />
                <h4 className="font-['Fraunces'] text-base font-semibold text-[#2d1f1b]">
                  No keepsakes in the gallery yet
                </h4>
                <p className="mt-1 max-w-sm text-xs text-[#785e55]">
                  Step into the Vintage Photo Booth in Arcade Alley (or press &ldquo;C&rdquo;) to snap your very first 4-shot black &amp; white keepsake strip together!
                </p>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenPhotoBooth();
                  }}
                  className="mt-4 rounded-xl bg-[#e69a7b] px-4 py-2 text-xs font-semibold text-[#1e1512] hover:bg-[#f0ac8e] cursor-pointer"
                >
                  Visit Photo Booth Now
                </button>
              </div>
            ) : (
              <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
                {uploadedPhotos.map((photo) => (
                  <div
                    key={photo.id}
                    onClick={() => {
                      setSelectedPhoto(photo);
                      setCaptionInput(photo.caption);
                      setEditingCaption(false);
                    }}
                    className="group relative flex flex-col rounded-2xl border border-[#e6cfd2] bg-white p-2.5 shadow-sm transition-all hover:scale-[1.03] hover:shadow-md cursor-pointer"
                  >
                    <div className="overflow-hidden rounded-xl bg-[#f5ede0]">
                      <img
                        src={photo.dataUrl}
                        alt={photo.caption}
                        className="h-48 w-full object-cover transition-transform duration-300 group-hover:scale-105"
                      />
                    </div>
                    <div className="mt-2 text-center">
                      <div className="font-['Fraunces'] text-xs font-semibold text-[#2d1f1b] truncate">
                        {photo.caption}
                      </div>
                      <div className="text-[10px] text-[#8c6b61]">
                        {photo.dateLabel || 'Melbourne Dreamland'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* =================================================================
            TAB 4: PAUSE, ENVIRONMENT LIGHTING & CONTROLS
           ================================================================= */}
        {activeTab === 'settings' && (
          <div className="mt-6 grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="rounded-2xl border border-[#e6d7c6] bg-[#fffdf9] p-5">
              <div className="flex items-center gap-2 text-sm font-semibold text-[#2d1f1b]">
                <Sun className="h-4 w-4 text-[#d98c4a]" />
                <span>Melbourne Atmosphere &amp; Audio</span>
              </div>

              <div className="mt-3 flex flex-col gap-2">
                {(
                  [
                    ['golden-hour', 'Golden Hour · Warm Romantic Sunset'],
                    ['laneway-dusk', 'Laneway Dusk · Glowing Neon & Lamps'],
                  ] as const
                ).map(([presetId, label]) => (
                  <button
                    key={presetId}
                    type="button"
                    onClick={() => onChangeLighting(presetId)}
                    className={`rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-colors cursor-pointer ${
                      lightingPreset === presetId
                        ? 'border-[#d67489] bg-[#fff2f5] text-[#2d1f1b]'
                        : 'border-[#eadccf] bg-[#faf4eb] text-[#664e46] hover:bg-[#f2e7d8]'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <div className="mt-4 pt-3 border-t border-[#efe2d5] flex items-center justify-between">
                <span className="text-xs font-medium text-[#57413a]">
                  Background Music &amp; Soundscapes (M)
                </span>
                <button
                  type="button"
                  onClick={onToggleMute}
                  className="flex items-center gap-1.5 rounded-xl bg-[#2d1f1b] px-3.5 py-2 text-xs font-semibold text-[#fbf4e8] cursor-pointer whitespace-nowrap"
                >
                  {saveData.musicMuted ? (
                    <>
                      <VolumeX className="h-3.5 w-3.5" />
                      <span>Muted</span>
                    </>
                  ) : (
                    <>
                      <Volume2 className="h-3.5 w-3.5" />
                      <span>Playing</span>
                    </>
                  )}
                </button>
              </div>

              <div className="mt-3 text-[11px] text-[#7d6259]">
                Sunny Petted Count:{' '}
                <span className="font-mono font-semibold tabular-nums">
                  {saveData.pettedSunnyCount}
                </span>{' '}
                times
              </div>
            </div>

            <div className="rounded-2xl border border-[#e6d7c6] bg-[#fffdf9] p-5">
              <div className="text-sm font-semibold text-[#2d1f1b]">
                Desktop Controls Guide
              </div>
              <dl className="mt-3 space-y-2 text-xs text-[#57413a]">
                <div className="flex justify-between gap-2 border-b border-[#f2e6d8] pb-1.5">
                  <dt className="font-semibold">Walk Around Melbourne</dt>
                  <dd className="font-mono">WASD / Arrow Keys</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#f2e6d8] pb-1.5">
                  <dt className="font-semibold">Interact / Enter / Pet Sunny</dt>
                  <dd className="font-mono">E</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#f2e6d8] pb-1.5">
                  <dt className="font-semibold">Photo Booth / Camera</dt>
                  <dd className="font-mono">C</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#f2e6d8] pb-1.5">
                  <dt className="font-semibold">Memory Journal / Keepsakes</dt>
                  <dd className="font-mono">J / I</dd>
                </div>
                <div className="flex justify-between gap-2 border-b border-[#f2e6d8] pb-1.5">
                  <dt className="font-semibold">Objectives Toggle</dt>
                  <dd className="font-mono">O</dd>
                </div>
                <div className="flex justify-between gap-2">
                  <dt className="font-semibold">Toggle Music / Pause</dt>
                  <dd className="font-mono">M / Escape</dd>
                </div>
              </dl>
            </div>
          </div>
        )}

        {/* =================================================================
            LIGHTBOX MODAL FOR INDIVIDUAL PHOTO VIEW
           ================================================================= */}
        {selectedPhoto && (
          <div
            role="dialog"
            aria-modal="true"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4"
          >
            <div className="relative flex max-h-[92vh] w-full max-w-lg flex-col items-center rounded-3xl bg-[#fbf6ee] p-5 shadow-2xl">
              <button
                type="button"
                onClick={() => setSelectedPhoto(null)}
                className="absolute right-4 top-4 rounded-xl bg-[#2a221f] p-1.5 text-white hover:bg-[#3d312d] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>

              <div className="max-h-[62vh] overflow-hidden rounded-2xl border border-[#ebd7bf] shadow-inner bg-[#1e1715]">
                <img
                  src={selectedPhoto.dataUrl}
                  alt={selectedPhoto.caption}
                  className="max-h-[60vh] w-auto object-contain"
                />
              </div>

              {/* Caption & Date */}
              <div className="mt-4 w-full text-center">
                {editingCaption ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={captionInput}
                      onChange={(e) => setCaptionInput(e.target.value)}
                      className="flex-1 rounded-xl border border-[#d6c3b0] bg-white px-3 py-1.5 text-xs text-[#2d1f1b] outline-none"
                    />
                    <button
                      type="button"
                      onClick={handleSaveCaption}
                      className="rounded-xl bg-[#59222c] px-3 py-1.5 text-xs font-semibold text-white cursor-pointer"
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <span className="font-['Fraunces'] text-base font-semibold text-[#2d1f1b]">
                      {selectedPhoto.caption}
                    </span>
                    <button
                      type="button"
                      onClick={() => setEditingCaption(true)}
                      className="text-[#9c786c] hover:text-[#2d1f1b] cursor-pointer"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                )}
                <div className="mt-1 text-xs text-[#8e7468]">
                  {selectedPhoto.dateLabel}
                </div>
              </div>

              {/* Lightbox Actions */}
              <div className="mt-4 flex w-full items-center justify-between border-t border-[#ebd7bf] pt-3">
                {deleteConfirmId === selectedPhoto.id ? (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-[#a63d40] font-medium">Delete photo?</span>
                    <button
                      type="button"
                      onClick={() => handleDeleteCurrent(selectedPhoto.id)}
                      className="rounded-lg bg-[#a63d40] px-2.5 py-1 text-xs font-semibold text-white cursor-pointer"
                    >
                      Confirm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDeleteConfirmId(null)}
                      className="text-xs text-[#785e55]"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDeleteConfirmId(selectedPhoto.id)}
                    className="flex items-center gap-1 text-xs text-[#a63d40] hover:underline cursor-pointer"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete</span>
                  </button>
                )}

                <a
                  href={selectedPhoto.dataUrl}
                  download={`melbourne-keepsake-${selectedPhoto.id}.png`}
                  className="flex items-center gap-1.5 rounded-xl bg-[#59222c] px-3.5 py-1.5 text-xs font-semibold text-[#fff6ea] hover:bg-[#6e2c38] cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5" />
                  <span>Download</span>
                </a>
              </div>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
