import {
  Camera,
  ChevronLeft,
  ChevronRight,
  Heart,
  ImagePlus,
  Sparkles,
  Trash2,
  X,
} from 'lucide-react';
import { motion } from 'motion/react';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { COLLECTIBLES_CONFIG } from '../../game/config/collectiblesConfig';
import { PHOTO_MEMORY_CONFIG } from '../../game/config/photosConfig';
import { PointOfInterest, StoredUploadedPhoto } from '../../game/types';
import { CollectibleIcon } from './CollectibleIcon';

interface PhotoScrapbookModalProps {
  poi: PointOfInterest;
  uploadedPhotos: StoredUploadedPhoto[];
  onUploadFiles: (
    locationId: string,
    files: FileList,
    caption: string
  ) => Promise<void>;
  onUpdateCaption: (photoId: string, caption: string) => Promise<void>;
  onDeletePhoto: (photoId: string) => Promise<void>;
  onClose: () => void;
}

interface UnifiedSlide {
  id: string;
  src?: string;
  caption: string;
  dateLabel?: string;
  isUploaded: boolean;
}

/**
 * Warm Cream & Dusty-Pink Handwritten Scrapbook Photo Memory Screen.
 * Strictly displays real photographs (local `/public/memories/...` assets + IndexedDB browser uploads)
 * in JPG, JPEG, PNG, and WEBP formats — never inventing or modifying couple photos.
 */
export function PhotoScrapbookModal({
  poi,
  uploadedPhotos,
  onUploadFiles,
  onUpdateCaption,
  onDeletePhoto,
  onClose,
}: PhotoScrapbookModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [activeSlideIdx, setActiveSlideIdx] = useState(0);
  const [brokenUrls, setBrokenUrls] = useState<Record<string, boolean>>({});
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const [captionDraft, setCaptionDraft] = useState('');
  const [editingCaptionId, setEditingCaptionId] = useState<string | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const locationUploads = useMemo(
    () => uploadedPhotos.filter((p) => p.locationId === poi.id),
    [uploadedPhotos, poi.id]
  );

  const configuredEntries = useMemo(
    () => PHOTO_MEMORY_CONFIG[poi.id] ?? [],
    [poi.id]
  );

  const slides: UnifiedSlide[] = useMemo(() => {
    const uploadedSlides: UnifiedSlide[] = locationUploads.map((u) => ({
      id: u.id,
      src: u.dataUrl,
      caption: u.caption,
      dateLabel: u.dateLabel ?? poi.dateHint,
      isUploaded: true,
    }));

    const localFileSlides: UnifiedSlide[] = configuredEntries
      .filter((c) => Boolean(c.src))
      .map((c) => ({
        id: c.id,
        src: c.src,
        caption: c.caption,
        dateLabel: c.dateLabel ?? poi.dateHint,
        isUploaded: false,
      }));

    const combined = [...uploadedSlides, ...localFileSlides];
    if (combined.length > 0) return combined;

    // Default authentic empty scrapbook frame ready for the user's real photograph
    const fallbackCaption =
      configuredEntries[0]?.caption ?? poi.journalDescription;
    return [
      {
        id: `empty-${poi.id}`,
        src: undefined,
        caption: fallbackCaption,
        dateLabel: configuredEntries[0]?.dateLabel ?? poi.dateHint,
        isUploaded: false,
      },
    ];
  }, [locationUploads, configuredEntries, poi]);

  const safeIdx = Math.min(activeSlideIdx, Math.max(0, slides.length - 1));
  const currentSlide = slides[safeIdx];

  const rewardItem = useMemo(
    () =>
      COLLECTIBLES_CONFIG.find((c) => c.id === poi.rewardCollectibleId) ?? null,
    [poi.rewardCollectibleId]
  );

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const defaultCap = configuredEntries[0]?.caption ?? `${poi.title} together`;
    await onUploadFiles(poi.id, e.target.files, defaultCap);
    setActiveSlideIdx(0);
    e.target.value = '';
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const defaultCap =
        configuredEntries[0]?.caption ?? `${poi.title} together`;
      await onUploadFiles(poi.id, e.dataTransfer.files, defaultCap);
      setActiveSlideIdx(0);
    }
  };

  const hasValidImage =
    Boolean(currentSlide?.src) && !brokenUrls[currentSlide.id];

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 p-4 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDraggingOver(true);
        }}
        onDragLeave={() => setIsDraggingOver(false)}
        onDrop={handleDrop}
        className="relative max-h-[92vh] w-full max-w-3xl overflow-y-auto rounded-3xl border border-[#e6cad0] bg-[#fbf4e8] p-6 md:p-8 text-[#382924] shadow-2xl"
        style={{
          backgroundImage:
            'radial-gradient(rgba(217, 132, 150, 0.09) 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      >
        {/* Hidden real photo input supporting JPG, JPEG, PNG, WEBP */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
          multiple
          onChange={handleFileChange}
          className="hidden"
        />

        {/* Scrapbook Header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#e5cfd2] pb-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-[#9e5b6a]">
              <Heart className="h-3.5 w-3.5 fill-[#e393a3] text-[#e393a3]" />
              <span>{currentSlide?.dateLabel ?? poi.subtitle}</span>
              <span aria-hidden="true">·</span>
              <span>{poi.subtitle}</span>
            </div>
            <h2 className="mt-1 font-['Fraunces'] text-2xl md:text-3xl italic font-semibold tracking-tight text-[#2f201c] [text-wrap:balance]">
              {poi.title}
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-[#e3cbd0] bg-[#fffaf2] p-2 text-[#6e524a] transition-colors hover:bg-[#f7e5e8] hover:text-[#2f201c] cursor-pointer"
            aria-label="Close scrapbook"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Main Rounded Scrapbook Photograph Frame */}
        <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-12 md:items-center">
          <div className="md:col-span-7">
            <div
              className={`relative rounded-2xl border-2 bg-[#fffdf9] p-3 shadow-md transition-colors ${
                isDraggingOver
                  ? 'border-[#d66d82] bg-[#fff2f5]'
                  : 'border-[#ead6d9]'
              }`}
            >
              {hasValidImage ? (
                <div className="relative overflow-hidden rounded-xl bg-[#f2e8da]">
                  <img
                    src={currentSlide.src}
                    alt={currentSlide.caption}
                    referrerPolicy="no-referrer"
                    onError={() =>
                      setBrokenUrls((prev) => ({
                        ...prev,
                        [currentSlide.id]: true,
                      }))
                    }
                    className="max-h-[340px] w-full rounded-xl object-contain bg-[#f5ede0]"
                  />

                  {slides.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlideIdx(
                            (safeIdx - 1 + slides.length) % slides.length
                          )
                        }
                        className="absolute left-2.5 top-1/2 -translate-y-1/2 rounded-full bg-[#241a17]/80 p-1.5 text-[#fff7eb] hover:bg-[#241a17] cursor-pointer"
                        aria-label="Previous photo"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          setActiveSlideIdx((safeIdx + 1) % slides.length)
                        }
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full bg-[#241a17]/80 p-1.5 text-[#fff7eb] hover:bg-[#241a17] cursor-pointer"
                        aria-label="Next photo"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </>
                  )}
                </div>
              ) : (
                /* Resilient Scrapbook Keepsake Slot awaiting real photograph */
                <div className="flex min-h-[250px] flex-col items-center justify-center rounded-xl border border-dashed border-[#dfb8c1] bg-[#fcf5f6] px-5 py-8 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#f7e2e7] text-[#b55d71]">
                    <Camera className="h-6 w-6" />
                  </div>
                  <p className="mt-3 font-['Fraunces'] text-lg italic font-semibold text-[#3d2925]">
                    Our {poi.title} Photograph Frame
                  </p>
                  <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-[#785c54]">
                    Add your real photo of Adi &amp; Damini here (JPG, JPEG,
                    PNG, or WEBP), or drop files into{' '}
                    <code className="rounded bg-[#f2e4e7] px-1 py-0.5 font-mono text-[11px]">
                      /public/memories/{poi.id}/
                    </code>
                    .
                  </p>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-4 flex items-center gap-2 rounded-xl bg-[#d67489] px-4 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[#c46076] cursor-pointer whitespace-nowrap"
                  >
                    <ImagePlus className="h-4 w-4" />
                    <span>Add Real Photograph</span>
                  </button>
                </div>
              )}

              {/* Handwritten-style Caption Strip below photo */}
              <div className="mt-3 px-1">
                {editingCaptionId === currentSlide.id ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={captionDraft}
                      onChange={(e) => setCaptionDraft(e.target.value)}
                      className="flex-1 rounded-lg border border-[#dfb8c1] bg-white px-2.5 py-1 text-xs text-[#382924] focus:outline-none"
                      placeholder="Write a personal memory note…"
                    />
                    <button
                      type="button"
                      onClick={async () => {
                        await onUpdateCaption(currentSlide.id, captionDraft);
                        setEditingCaptionId(null);
                      }}
                      className="rounded-lg bg-[#d67489] px-3 py-1 text-xs font-semibold text-white cursor-pointer whitespace-nowrap"
                    >
                      Save
                    </button>
                  </div>
                ) : (
                  <p className="font-['Fraunces'] text-sm italic leading-snug text-[#4f3933]">
                    “{currentSlide.caption}”
                  </p>
                )}

                <div className="mt-2 flex items-center justify-between text-[11px] text-[#8a6d65]">
                  <span className="font-mono tabular-nums">
                    {hasValidImage
                      ? `Photo ${safeIdx + 1} of ${slides.length}`
                      : 'Ready for real photo upload'}
                  </span>

                  <div className="flex items-center gap-2">
                    {hasValidImage && (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="font-medium text-[#b3576c] hover:underline cursor-pointer whitespace-nowrap"
                      >
                        + Add Another Photo
                      </button>
                    )}
                    {currentSlide.isUploaded && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCaptionId(currentSlide.id);
                            setCaptionDraft(currentSlide.caption);
                          }}
                          className="text-[#785c54] hover:text-[#2f201c] hover:underline cursor-pointer whitespace-nowrap"
                        >
                          Edit Note
                        </button>
                        <button
                          type="button"
                          onClick={() => onDeletePhoto(currentSlide.id)}
                          className="text-[#b84c58] hover:underline cursor-pointer"
                          title="Remove uploaded photo"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Story Notes & Unlocked Keepsake */}
          <div className="flex flex-col justify-between gap-4 md:col-span-5">
            <div className="rounded-2xl border border-[#ead6d9] bg-[#fffaf3] p-4">
              <div className="text-xs font-semibold text-[#a85e6e]">
                Scrapbook Entry
              </div>
              <p className="mt-2 text-sm leading-relaxed text-[#4a3630]">
                {poi.journalDescription}
              </p>
            </div>

            {rewardItem && (
              <div className="rounded-2xl border border-[#ead6d9] bg-[#fff5f7] p-4">
                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#b3576c]">
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Memory Keepsake Saved</span>
                </div>
                <div className="mt-2.5 flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#2a201d] shadow-sm shrink-0">
                    <CollectibleIcon
                      iconKey={rewardItem.iconKey}
                      accentHex={rewardItem.accentHex}
                    />
                  </div>
                  <div>
                    <div className="text-xs font-semibold text-[#2f201c]">
                      {rewardItem.name}
                    </div>
                    <p className="mt-0.5 text-[11px] leading-snug text-[#6e524a]">
                      {rewardItem.description}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={onClose}
              className="w-full rounded-xl bg-[#2f211d] px-4 py-3 text-xs font-semibold text-[#fbf4e8] transition-colors hover:bg-[#42302b] cursor-pointer whitespace-nowrap"
            >
              Save to Journal &amp; Continue (Esc)
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
