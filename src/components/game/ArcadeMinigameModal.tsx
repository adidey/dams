import { RotateCcw, Sparkles, Trophy, X } from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AudioManager } from '../../game/AudioManager';
import {
  GameSaveData,
  MinigameId,
  StoredUploadedPhoto,
} from '../../game/types';

interface ArcadeMinigameModalProps {
  activeGame: MinigameId;
  saveData: GameSaveData;
  uploadedPhotos: StoredUploadedPhoto[];
  audio: AudioManager | null;
  onSwitchGame: (id: MinigameId) => void;
  onRecordResult: (
    gameId: MinigameId,
    score: number,
    rewardCollectibleId?: string
  ) => void;
  onClose: () => void;
}

// ============================================================================
// MINIGAME A — MEMORY MATCH (Couple Keepsakes + Real Uploaded Photos!)
// ============================================================================
interface MatchCard {
  uid: string;
  pairKey: string;
  label: string;
  accent: string;
  photoSrc?: string;
  flipped: boolean;
  matched: boolean;
}

const BASE_PAIRS = [
  { key: 'pizza', label: '11" Gnocchi & Slice', accent: '#e6846e' },
  { key: 'tram', label: 'W-Class Tram 96', accent: '#7bd4a0' },
  { key: 'sunny', label: 'Sunny Golden Pup', accent: '#f0c465' },
  { key: 'vinyl', label: 'Velvet R&B Vinyl', accent: '#e896b0' },
  { key: 'gardens', label: 'Botanic Birthday', accent: '#9fd68b' },
  { key: 'bibiji', label: 'Bibi Ji Naan & Chai', accent: '#f2ac63' },
];

function MemoryMatchGame({
  uploadedPhotos,
  audio,
  bestScore,
  onWin,
}: {
  uploadedPhotos: StoredUploadedPhoto[];
  audio: AudioManager | null;
  bestScore: number;
  onWin: (score: number) => void;
}) {
  const createDeck = useCallback((): MatchCard[] => {
    const customPairs = uploadedPhotos.slice(0, 3).map((p, idx) => ({
      key: `real-photo-${idx}`,
      label: p.caption.slice(0, 18) || 'Our Photo',
      accent: '#f0a5b8',
      photoSrc: p.dataUrl,
    }));
    const chosen: Array<{
      key: string;
      label: string;
      accent: string;
      photoSrc?: string;
    }> = [
      ...customPairs,
      ...BASE_PAIRS.slice(0, 6 - customPairs.length),
    ];
    const doubled: MatchCard[] = [];
    chosen.forEach((item) => {
      doubled.push(
        {
          uid: `${item.key}-a-${Math.random()}`,
          pairKey: item.key,
          label: item.label,
          accent: item.accent,
          photoSrc: item.photoSrc,
          flipped: false,
          matched: false,
        },
        {
          uid: `${item.key}-b-${Math.random()}`,
          pairKey: item.key,
          label: item.label,
          accent: item.accent,
          photoSrc: item.photoSrc,
          flipped: false,
          matched: false,
        }
      );
    });
    for (let i = doubled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [doubled[i], doubled[j]] = [doubled[j], doubled[i]];
    }
    return doubled;
  }, [uploadedPhotos]);

  const [cards, setCards] = useState<MatchCard[]>(() => createDeck());
  const [moves, setMoves] = useState(0);
  const [locked, setLocked] = useState(false);
  const [won, setWon] = useState(false);

  const handleRestart = () => {
    setCards(createDeck());
    setMoves(0);
    setLocked(false);
    setWon(false);
  };

  const handleFlip = (idx: number) => {
    if (locked || cards[idx].flipped || cards[idx].matched) return;
    audio?.playArcadeSFX('flip');

    const next = cards.map((c, i) => (i === idx ? { ...c, flipped: true } : c));
    const openUnmatched = next.filter((c) => c.flipped && !c.matched);
    setCards(next);

    if (openUnmatched.length === 2) {
      const nextMoves = moves + 1;
      setMoves(nextMoves);
      const [first, second] = openUnmatched;

      if (first.pairKey === second.pairKey) {
        audio?.playArcadeSFX('match');
        const matchedDeck = next.map((c) =>
          c.pairKey === first.pairKey ? { ...c, matched: true } : c
        );
        setCards(matchedDeck);
        if (matchedDeck.every((c) => c.matched)) {
          setWon(true);
          audio?.playArcadeSFX('win');
          const pts = Math.max(100, 700 - nextMoves * 25);
          onWin(pts);
        }
      } else {
        setLocked(true);
        window.setTimeout(() => {
          setCards((curr) =>
            curr.map((c) => (c.matched ? c : { ...c, flipped: false }))
          );
          setLocked(false);
        }, 560);
      }
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#cfc4df]">
        <div>
          Flip two cards to match Adi &amp; Damini’s Melbourne keepsakes!
        </div>
        <div className="flex items-center gap-3 font-mono tabular-nums">
          <span>Moves: {moves}</span>
          <span>·</span>
          <span>Best: {bestScore} pts</span>
          <button
            type="button"
            onClick={handleRestart}
            className="flex items-center gap-1 rounded-lg bg-[#352d47] px-2.5 py-1 text-[#f4ecff] hover:bg-[#463b5e] cursor-pointer whitespace-nowrap"
          >
            <RotateCcw className="h-3 w-3" />
            <span>Shuffle</span>
          </button>
        </div>
      </div>

      <div className="mt-4 grid grid-cols-4 gap-2.5">
        {cards.map((card, i) => {
          const revealed = card.flipped || card.matched;
          return (
            <button
              key={card.uid}
              type="button"
              onClick={() => handleFlip(i)}
              className={`relative flex h-24 flex-col items-center justify-center overflow-hidden rounded-2xl border p-2 text-center transition-transform duration-150 cursor-pointer ${
                card.matched
                  ? 'border-[#8be0b0]/65 bg-[#233830]'
                  : revealed
                    ? 'border-[#f2c48d]/70 bg-[#322942]'
                    : 'border-[#ebd7bf]/15 bg-[#231d30] hover:scale-[1.02] hover:border-[#ebd7bf]/35'
              }`}
            >
              {revealed ? (
                card.photoSrc ? (
                  <img
                    src={card.photoSrc}
                    alt={card.label}
                    className="h-full w-full rounded-xl object-cover"
                  />
                ) : (
                  <>
                    <div
                      className="h-3.5 w-3.5 rounded-full"
                      style={{ backgroundColor: card.accent }}
                    />
                    <span className="mt-1.5 text-xs font-semibold leading-tight text-[#fff6ea]">
                      {card.label}
                    </span>
                  </>
                )
              ) : (
                <span className="font-['Fraunces'] text-lg italic text-[#8c7da6]">
                  ★
                </span>
              )}
            </button>
          );
        })}
      </div>

      {won && (
        <div className="mt-4 flex items-center justify-between rounded-2xl border border-[#8be0b0]/45 bg-[#1d3328] px-4 py-3 text-xs text-[#eafff2]">
          <div className="flex items-center gap-2 font-semibold">
            <Trophy className="h-4 w-4 text-[#f5cf70]" />
            <span>
              Cleared in {moves} moves! Starlight Photo Strip Token unlocked!
            </span>
          </div>
          <button
            type="button"
            onClick={handleRestart}
            className="rounded-lg bg-[#8be0b0] px-3 py-1.5 font-semibold text-[#15261d] cursor-pointer whitespace-nowrap"
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// MINIGAME B — DAMINI'S CRICKET CHALLENGE (Timing-Based Batting!)
// ============================================================================
function CricketChallengeGame({
  audio,
  bestScore,
  onWin,
}: {
  audio: AudioManager | null;
  bestScore: number;
  onWin: (runs: number) => void;
}) {
  const TOTAL_BALLS = 6;
  const [ballPos, setBallPos] = useState(0); // 0 (bowler) -> 100 (stumps), sweet spot: 76..88
  const [ballActive, setBallActive] = useState(false);
  const [ballsBowled, setBallsBowled] = useState(0);
  const [runs, setRuns] = useState(0);
  const [lastCall, setLastCall] = useState(
    'Step up to the crease! Press Space or Swing Bat when the ball enters the golden zone.'
  );
  const [overComplete, setOverComplete] = useState(false);
  const speedRef = useRef(68);
  const swungRef = useRef(false);

  const launchNextBall = useCallback(() => {
    swungRef.current = false;
    speedRef.current = 58 + Math.random() * 34; // Varied pace deliveries!
    setBallPos(0);
    setBallActive(true);
  }, []);

  const startNewOver = () => {
    setRuns(0);
    setBallsBowled(0);
    setOverComplete(false);
    setLastCall('Bowler running in… watch the ball onto the willow!');
    launchNextBall();
  };

  const finishDelivery = useCallback(
    (earnedRuns: number, commentary: string) => {
      setBallActive(false);
      const nextRuns = runs + earnedRuns;
      const nextBalls = ballsBowled + 1;
      setRuns(nextRuns);
      setBallsBowled(nextBalls);
      setLastCall(commentary);

      if (nextBalls >= TOTAL_BALLS) {
        setOverComplete(true);
        if (nextRuns >= 12) {
          audio?.playArcadeSFX('win');
        }
        onWin(nextRuns);
      } else {
        window.setTimeout(() => {
          launchNextBall();
        }, 850);
      }
    },
    [audio, ballsBowled, launchNextBall, onWin, runs]
  );

  useEffect(() => {
    if (!ballActive) return;
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      setBallPos((prev) => {
        const next = prev + speedRef.current * dt;
        if (next >= 98 && !swungRef.current) {
          swungRef.current = true;
          audio?.playArcadeSFX('miss');
          finishDelivery(0, 'Dot ball! Zipped right past the off-stump.');
          return 98;
        }
        return next;
      });
      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [audio, ballActive, finishDelivery]);

  const swingBat = useCallback(() => {
    if (!ballActive || swungRef.current) return;
    swungRef.current = true;

    if (ballPos >= 78 && ballPos <= 86) {
      audio?.playArcadeSFX('bat-hit');
      finishDelivery(
        6,
        'SIX RUNS! Damini middles it cleanly over the MCG sightscreen! Adi is cheering wildly!'
      );
    } else if (ballPos >= 70 && ballPos <= 92) {
      audio?.playArcadeSFX('bat-hit');
      finishDelivery(
        4,
        'FOUR! Crisp cover drive racing across the turf to the boundary rope!'
      );
    } else if (ballPos >= 60 && ballPos < 70) {
      audio?.playArcadeSFX('flip');
      finishDelivery(2, 'Timed slightly early — scampered back for two quick runs!');
    } else {
      audio?.playArcadeSFX('miss');
      finishDelivery(0, 'Swing and a miss! Wait for the golden crease zone.');
    }
  }, [audio, ballActive, ballPos, finishDelivery]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (!ballActive && ballsBowled === 0 && !overComplete) {
          startNewOver();
        } else {
          swingBat();
        }
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  });

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#cfe3d4]">
        <span>6-Ball Over · Score 12+ runs to win the Signed Willow Bat!</span>
        <span className="font-mono tabular-nums">
          Runs: {runs} · Ball: {ballsBowled}/{TOTAL_BALLS} · Best: {bestScore}
        </span>
      </div>

      {/* Turf Cricket Pitch Arena */}
      <div className="relative mt-4 h-40 overflow-hidden rounded-2xl border border-[#8ed49c]/30 bg-[#1e4229] p-4">
        {/* Turf mow stripes */}
        <div className="absolute inset-0 flex">
          {[0, 1, 2, 3, 4, 5].map((s) => (
            <div
              key={s}
              className={`flex-1 ${s % 2 === 0 ? 'bg-white/[0.03]' : ''}`}
            />
          ))}
        </div>

        {/* Center tan pitch strip */}
        <div className="relative mx-auto mt-6 h-16 w-full rounded-xl border border-[#e8d5b0]/35 bg-[#c9ad7c]">
          {/* Sweet-spot batting zone (70%..90%, bulls-eye 78%..86%) */}
          <div
            style={{ left: '70%', width: '22%' }}
            className="absolute inset-y-1 rounded-lg bg-[#f5cf64]/35 border border-[#ffe28a]"
          />
          <div
            style={{ left: '78%', width: '8%' }}
            className="absolute inset-y-1 rounded bg-[#6be08e]/55"
          />

          {/* Stumps at right (93%) */}
          <div
            style={{ left: '93%' }}
            className="absolute inset-y-2 w-1.5 rounded bg-[#fff6e0]"
          />

          {/* Cricket Ball */}
          {ballActive && (
            <div
              style={{
                transform: `translate3d(${ballPos * 4.9}px, 0, 0)`,
              }}
              className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 rounded-full border-2 border-[#ffd8d6] bg-[#c9342e] shadow"
            />
          )}
        </div>

        <div className="relative mt-3 text-center text-xs font-medium text-[#f2faee]">
          {lastCall}
        </div>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        {!ballActive && (ballsBowled === 0 || overComplete) ? (
          <button
            type="button"
            onClick={startNewOver}
            className="w-full rounded-xl bg-[#86db9a] py-3 text-xs font-semibold text-[#132618] hover:bg-[#9be6ad] cursor-pointer whitespace-nowrap"
          >
            {overComplete
              ? `Over Complete (${runs} Runs) · Bowl Another Over`
              : 'Start 6-Ball Over (Space)'}
          </button>
        ) : (
          <button
            type="button"
            onClick={swingBat}
            className="w-full rounded-xl bg-[#f2be66] py-3 text-xs font-semibold text-[#21180d] hover:bg-[#fad082] cursor-pointer whitespace-nowrap"
          >
            Swing Willow Bat! (Space)
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MINIGAME C — STARLIGHT CLAW MACHINE (Collectible Plush Catcher!)
// ============================================================================
interface ClawPrize {
  id: string;
  name: string;
  x: number; // 14 .. 86
  color: string;
  caught: boolean;
}

function ClawMachineGame({
  audio,
  bestScore,
  onWin,
}: {
  audio: AudioManager | null;
  bestScore: number;
  onWin: (caughtCount: number) => void;
}) {
  const initialPrizes = useMemo<ClawPrize[]>(
    () => [
      { id: 'p1', name: 'Golden Pup Plush', x: 20, color: '#f2c464', caught: false },
      { id: 'p2', name: 'Mini W-Class Tram', x: 38, color: '#6fd49b', caught: false },
      { id: 'p3', name: 'Velvet Heart Cushion', x: 56, color: '#eb8ca5', caught: false },
      { id: 'p4', name: 'Gnocchi Dumpling Plush', x: 73, color: '#f5dec0', caught: false },
      { id: 'p5', name: 'Starlight Bell Charm', x: 86, color: '#8ad4e6', caught: false },
    ],
    []
  );

  const [prizes, setPrizes] = useState<ClawPrize[]>(initialPrizes);
  const [clawX, setClawX] = useState(50);
  const [clawY, setClawY] = useState(0); // 0 top -> 76 bottom
  const [phase, setPhase] = useState<'aiming' | 'dropping' | 'lifting'>('aiming');
  const [holdingId, setHoldingId] = useState<string | null>(null);
  const [statusMsg, setStatusMsg] = useState(
    'Use A / D (or Left / Right buttons) to position the crane, then press Space to drop!'
  );

  const moveClaw = useCallback(
    (dir: -1 | 1) => {
      if (phase !== 'aiming') return;
      setClawX((x) => Math.max(14, Math.min(88, x + dir * 5)));
    },
    [phase]
  );

  const dropClaw = useCallback(() => {
    if (phase !== 'aiming') return;
    audio?.playArcadeSFX('flip');
    setPhase('dropping');
  }, [audio, phase]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const k = e.key.toLowerCase();
      if (k === 'a' || k === 'arrowleft') moveClaw(-1);
      else if (k === 'd' || k === 'arrowright') moveClaw(1);
      else if (k === ' ') {
        e.preventDefault();
        dropClaw();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropClaw, moveClaw]);

  useEffect(() => {
    if (phase === 'aiming') return;
    let raf = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;

      if (phase === 'dropping') {
        setClawY((y) => {
          const ny = y + 95 * dt;
          if (ny >= 74) {
            // Check prize grab!
            const target = prizes.find(
              (p) => !p.caught && Math.abs(p.x - clawX) <= 6.5
            );
            if (target) {
              setHoldingId(target.id);
              audio?.playArcadeSFX('match');
              setStatusMsg(`Got a grip on ${target.name}! Lifting gently…`);
            } else {
              audio?.playArcadeSFX('miss');
              setStatusMsg('Claw closed on thin air — line up directly over a plush!');
            }
            setPhase('lifting');
            return 74;
          }
          return ny;
        });
      } else if (phase === 'lifting') {
        setClawY((y) => {
          const ny = y - 85 * dt;
          if (ny <= 0) {
            if (holdingId) {
              setPrizes((curr) => {
                const updated = curr.map((p) =>
                  p.id === holdingId ? { ...p, caught: true } : p
                );
                const caughtTotal = updated.filter((p) => p.caught).length;
                audio?.playArcadeSFX('win');
                setStatusMsg(
                  `Caught! (${caughtTotal} prize${caughtTotal > 1 ? 's' : ''} won for Damini!)`
                );
                onWin(caughtTotal);
                return updated;
              });
              setHoldingId(null);
            }
            setPhase('aiming');
            return 0;
          }
          return ny;
        });
      }

      raf = requestAnimationFrame(step);
    };

    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [audio, clawX, holdingId, onWin, phase, prizes]);

  const caughtCount = prizes.filter((p) => p.caught).length;

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#ebd2d8]">
        <span>Catch any plush capsule to unlock the Starlight Claw Keepsake!</span>
        <span className="font-mono tabular-nums">
          Caught: {caughtCount}/{prizes.length} · Best: {bestScore}
        </span>
      </div>

      {/* Glass Crane Cabinet */}
      <div className="relative mt-4 h-48 overflow-hidden rounded-2xl border border-[#f29f8a]/35 bg-[#1f1929]">
        {/* Top brass rail */}
        <div className="h-2.5 w-full bg-[#bd9248]" />

        {/* Crane Cable + Prongs */}
        <div
          style={{ left: `${clawX}%` }}
          className="absolute top-2.5 -translate-x-1/2 flex flex-col items-center"
        >
          <div
            style={{ height: `${14 + clawY * 1.35}px` }}
            className="w-0.5 bg-[#e6c37a]"
          />
          <div className="h-4 w-7 rounded-b-lg border-2 border-t-0 border-[#f5d58e]" />
          {holdingId && (
            <div
              className="mt-[-4px] h-7 w-7 rounded-full border-2 border-white/50 shadow"
              style={{
                backgroundColor:
                  prizes.find((p) => p.id === holdingId)?.color ?? '#f2c464',
              }}
            />
          )}
        </div>

        {/* Plush Prizes along cabinet floor */}
        {prizes.map((p) => {
          if (p.caught || p.id === holdingId) return null;
          return (
            <div
              key={p.id}
              style={{ left: `${p.x}%`, backgroundColor: p.color }}
              title={p.name}
              className="absolute bottom-3 h-8 w-8 -translate-x-1/2 rounded-full border-2 border-white/45 shadow-md"
            />
          );
        })}
      </div>

      <p className="mt-2.5 text-center text-xs text-[#e8d6dc]">{statusMsg}</p>

      <div className="mt-3 flex items-center justify-center gap-2.5">
        <button
          type="button"
          onClick={() => moveClaw(-1)}
          className="rounded-xl border border-[#ebd7bf]/20 bg-[#2e253b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3c314d] cursor-pointer whitespace-nowrap"
        >
          ← Move Left (A)
        </button>
        <button
          type="button"
          onClick={dropClaw}
          className="rounded-xl bg-[#f0937d] px-6 py-2.5 text-xs font-semibold text-[#211310] hover:bg-[#f7a692] cursor-pointer whitespace-nowrap"
        >
          Drop Claw! (Space)
        </button>
        <button
          type="button"
          onClick={() => moveClaw(1)}
          className="rounded-xl border border-[#ebd7bf]/20 bg-[#2e253b] px-4 py-2.5 text-xs font-semibold text-white hover:bg-[#3c314d] cursor-pointer whitespace-nowrap"
        >
          Move Right (D) →
        </button>
        {caughtCount === prizes.length && (
          <button
            type="button"
            onClick={() => setPrizes(initialPrizes)}
            className="rounded-xl bg-[#7cd4b2] px-3.5 py-2.5 text-xs font-semibold text-[#13241d] cursor-pointer whitespace-nowrap"
          >
            Restock
          </button>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// MASTER ARCADE CABINET MODAL
// ============================================================================
export function ArcadeMinigameModal({
  activeGame,
  saveData,
  uploadedPhotos,
  audio,
  onSwitchGame,
  onRecordResult,
  onClose,
}: ArcadeMinigameModalProps) {
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

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#f2b880]/30 bg-[#191524] p-6 text-[#faf3eb] shadow-2xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex items-center gap-1.5 text-xs text-[#f2be7e]">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Starlight Coin-Op Arcade · Melbourne Entertainment Quarter</span>
            </div>
            <h2 className="mt-0.5 font-['Fraunces'] text-2xl font-semibold text-white">
              Arcade Date Night
            </h2>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl p-2 text-[#b8afc9] hover:bg-white/10 hover:text-white cursor-pointer"
            aria-label="Close arcade cabinet"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Segmented Cabinet Switcher */}
        <div className="mt-4 flex items-center gap-1.5 rounded-xl bg-[#110e1a] p-1">
          {(
            [
              ['memory-match', 'Memory Match'],
              ['cricket-challenge', 'Damini’s Cricket Challenge'],
              ['claw-machine', 'Starlight Claw Machine'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSwitchGame(id)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                activeGame === id
                  ? 'bg-[#342b4a] text-[#fff6ea] shadow-sm'
                  : 'text-[#a59bb8] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {activeGame === 'memory-match' && (
            <MemoryMatchGame
              uploadedPhotos={uploadedPhotos}
              audio={audio}
              bestScore={saveData.minigameHighScores['memory-match'] ?? 0}
              onWin={(pts) =>
                onRecordResult('memory-match', pts, 'keepsake-arcade-match')
              }
            />
          )}

          {activeGame === 'cricket-challenge' && (
            <CricketChallengeGame
              audio={audio}
              bestScore={saveData.minigameHighScores['cricket-challenge'] ?? 0}
              onWin={(runs) =>
                onRecordResult(
                  'cricket-challenge',
                  runs,
                  runs >= 12 ? 'keepsake-cricket-bat' : undefined
                )
              }
            />
          )}

          {activeGame === 'claw-machine' && (
            <ClawMachineGame
              audio={audio}
              bestScore={saveData.minigameHighScores['claw-machine'] ?? 0}
              onWin={(count) =>
                onRecordResult('claw-machine', count, 'keepsake-claw-plush')
              }
            />
          )}
        </div>
      </motion.div>
    </div>
  );
}
