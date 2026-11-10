import { ArrowRight, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { DialogueLine, PointOfInterest } from '../../game/types';

interface DialogueOverlayProps {
  poi: PointOfInterest;
  lineIndex: number;
  portraits: {
    adi: string;
    damini: string;
    sunny: string;
  } | null;
  onAdvance: () => void;
  onClose: () => void;
}

export function DialogueOverlay({
  poi,
  lineIndex,
  portraits,
  onAdvance,
  onClose,
}: DialogueOverlayProps) {
  const line: DialogueLine | undefined = poi.dialogue[lineIndex];
  const isLast = lineIndex >= poi.dialogue.length - 1;

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Enter') {
        e.preventDefault();
        onAdvance();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onAdvance, onClose]);

  if (!line) return null;

  const portraitSrc =
    line.speaker === 'Damini'
      ? portraits?.damini
      : line.speaker === 'Sunny'
        ? portraits?.sunny
        : portraits?.adi;

  return (
    <div className="fixed inset-0 z-30 flex items-end justify-center p-5 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, y: 18, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-2xl rounded-2xl border border-[#ebd7bf]/35 bg-[#201916]/97 p-5 text-[#fbf3e6] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#ebd7bf]/12 pb-2.5">
          <div>
            <div className="text-xs text-[#d6b99b]">
              {poi.title} <span aria-hidden="true">·</span> {poi.subtitle}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1 text-[#b8a693] hover:bg-[#332823] hover:text-[#fff5e8] cursor-pointer"
            aria-label="Close conversation"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="mt-4 flex items-center gap-4">
          {portraitSrc && (
            <div className="shrink-0 rounded-xl border border-[#ebd7bf]/30 bg-[#2d231f] p-1.5 shadow-inner">
              <img
                src={portraitSrc}
                alt={`${line.speaker} portrait`}
                className="h-16 w-16 rounded-lg object-cover [image-rendering:pixelated]"
              />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="font-['Fraunces'] text-base font-semibold text-[#f3b391]">
              {line.speaker === 'Together' ? 'Adi & Damini' : line.speaker}
            </div>
            <p className="mt-1 text-[15px] leading-relaxed text-[#fbf3e6]">
              {line.text}
            </p>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between border-t border-[#ebd7bf]/12 pt-3">
          <span className="font-mono text-[11px] tabular-nums text-[#a89684]">
            Line {lineIndex + 1} / {poi.dialogue.length} · Press Space or Enter
          </span>

          <button
            type="button"
            onClick={onAdvance}
            className="flex items-center gap-2 rounded-xl bg-[#e69a7b] px-4 py-2 text-xs font-semibold text-[#1f1613] transition-colors hover:bg-[#f2ae91] cursor-pointer whitespace-nowrap shrink-0"
          >
            <span>{isLast ? 'Open Memory Scrapbook' : 'Continue'}</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </motion.div>
    </div>
  );
}
