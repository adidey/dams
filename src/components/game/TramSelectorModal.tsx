import { ArrowRight, TrainFront, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useEffect } from 'react';
import { TRAM_DESTINATIONS } from '../../game/config/locationsConfig';

interface TramSelectorModalProps {
  originStopId: string;
  onSelectDestination: (destStopId: string) => void;
  onClose: () => void;
}

export function TramSelectorModal({
  originStopId,
  onSelectDestination,
  onClose,
}: TramSelectorModalProps) {
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

  const currentStop = TRAM_DESTINATIONS.find((s) => s.stopId === originStopId);

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/68 p-4 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-xl rounded-3xl border border-[#84cca0]/35 bg-[#19241e] p-6 text-[#f4fbf6] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#84cca0]/20 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#274736] text-[#98e0b2]">
              <TrainFront className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs text-[#98e0b2]">
                Yarra Heritage Tram Network · Boarding Together
              </div>
              <h2 className="font-['Fraunces'] text-xl font-semibold text-[#f8fff9]">
                Choose Destination Stop
              </h2>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-1.5 text-[#a7c4b1] hover:bg-[#273d31] hover:text-white cursor-pointer"
            aria-label="Close tram timetable"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {currentStop && (
          <div className="mt-3 text-xs text-[#b7d1bf]">
            Currently waiting at:{' '}
            <span className="font-semibold text-[#f2fbf4]">
              {currentStop.title}
            </span>
          </div>
        )}

        <div className="mt-4 flex flex-col gap-2.5">
          {TRAM_DESTINATIONS.map((dest) => {
            const isHere = dest.stopId === originStopId;
            return (
              <button
                key={dest.stopId}
                type="button"
                disabled={isHere}
                onClick={() => onSelectDestination(dest.stopId)}
                className={`flex items-center justify-between gap-4 rounded-2xl border p-4 text-left transition-colors ${
                  isHere
                    ? 'border-[#84cca0]/15 bg-[#1f2e26]/60 opacity-60 cursor-default'
                    : 'border-[#84cca0]/25 bg-[#22352b] hover:border-[#a2e8bd]/60 hover:bg-[#2a4235] cursor-pointer'
                }`}
              >
                <div className="min-w-0">
                  <div className="text-[11px] font-medium text-[#98e0b2]">
                    {dest.routeBadge} <span aria-hidden="true">·</span>{' '}
                    {dest.routeName}
                  </div>
                  <div className="mt-0.5 text-sm font-semibold text-[#f8fff9]">
                    {dest.title}
                  </div>
                  <p className="mt-1 text-xs text-[#c2dac9]">
                    {dest.description}
                  </p>
                </div>

                <div className="shrink-0">
                  {isHere ? (
                    <span className="text-xs font-medium text-[#98e0b2]">
                      Here Now
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-xl bg-[#98e0b2] px-3 py-2 text-xs font-semibold text-[#16241c] whitespace-nowrap">
                      <span>Board</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}
