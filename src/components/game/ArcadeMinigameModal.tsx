import {
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  RotateCw,
  Sparkles,
  Trophy,
  X,
  Zap,
} from 'lucide-react';
import { motion } from 'motion/react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AudioManager } from '../../game/AudioManager';
import { GameSaveData, MinigameId, StoredUploadedPhoto } from '../../game/types';

interface ArcadeMinigameModalProps {
  activeGame: MinigameId;
  saveData: GameSaveData;
  uploadedPhotos?: StoredUploadedPhoto[];
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
// MINIGAME: STARLIGHT TETRIS (Retro 8-Bit Brick Puzzle)
// ============================================================================
const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;

type TetrominoType = 'I' | 'O' | 'T' | 'S' | 'Z' | 'J' | 'L';

interface Piece {
  type: TetrominoType;
  shape: number[][];
  color: string;
  x: number;
  y: number;
}

const TETROMINOES: Record<
  TetrominoType,
  { shape: number[][]; color: string }
> = {
  I: {
    shape: [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    color: '#38bdf8', // Cyan
  },
  O: {
    shape: [
      [1, 1],
      [1, 1],
    ],
    color: '#facc15', // Yellow
  },
  T: {
    shape: [
      [0, 1, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#c084fc', // Purple
  },
  S: {
    shape: [
      [0, 1, 1],
      [1, 1, 0],
      [0, 0, 0],
    ],
    color: '#4ade80', // Green
  },
  Z: {
    shape: [
      [1, 1, 0],
      [0, 1, 1],
      [0, 0, 0],
    ],
    color: '#f87171', // Red
  },
  J: {
    shape: [
      [1, 0, 0],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#60a5fa', // Blue
  },
  L: {
    shape: [
      [0, 0, 1],
      [1, 1, 1],
      [0, 0, 0],
    ],
    color: '#fb923c', // Orange
  },
};

const TETROMINO_KEYS: TetrominoType[] = ['I', 'O', 'T', 'S', 'Z', 'J', 'L'];

function getRandomTetromino(): TetrominoType {
  const idx = Math.floor(Math.random() * TETROMINO_KEYS.length);
  return TETROMINO_KEYS[idx];
}

function createEmptyBoard(): (string | null)[][] {
  return Array.from({ length: BOARD_HEIGHT }, () =>
    Array(BOARD_WIDTH).fill(null)
  );
}

function rotateMatrix(matrix: number[][]): number[][] {
  const N = matrix.length;
  const result: number[][] = Array.from({ length: N }, () => Array(N).fill(0));
  for (let r = 0; r < N; r++) {
    for (let c = 0; c < N; c++) {
      result[c][N - 1 - r] = matrix[r][c];
    }
  }
  return result;
}

function checkCollision(
  board: (string | null)[][],
  shape: number[][],
  x: number,
  y: number
): boolean {
  for (let r = 0; r < shape.length; r++) {
    for (let c = 0; c < shape[r].length; c++) {
      if (shape[r][c]) {
        const targetX = x + c;
        const targetY = y + r;
        if (
          targetX < 0 ||
          targetX >= BOARD_WIDTH ||
          targetY >= BOARD_HEIGHT
        ) {
          return true;
        }
        if (targetY >= 0 && board[targetY][targetX] !== null) {
          return true;
        }
      }
    }
  }
  return false;
}

function TetrisGame({
  audio,
  bestScore,
  onWin,
}: {
  audio: AudioManager | null;
  bestScore: number;
  onWin: (score: number) => void;
}) {
  const [board, setBoard] = useState<(string | null)[][]>(createEmptyBoard);
  const [currentPiece, setCurrentPiece] = useState<Piece | null>(null);
  const [nextPieceType, setNextPieceType] = useState<TetrominoType>(getRandomTetromino);
  const [score, setScore] = useState(0);
  const [lines, setLines] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const spawnPiece = useCallback(
    (typeToSpawn?: TetrominoType) => {
      const type = typeToSpawn || nextPieceType;
      const nextType = getRandomTetromino();
      setNextPieceType(nextType);

      const def = TETROMINOES[type];
      const initialX = Math.floor((BOARD_WIDTH - def.shape[0].length) / 2);
      const initialY = 0;

      const newPiece: Piece = {
        type,
        shape: def.shape,
        color: def.color,
        x: initialX,
        y: initialY,
      };

      // Check game over on spawn
      setBoard((currBoard) => {
        if (checkCollision(currBoard, newPiece.shape, newPiece.x, newPiece.y)) {
          setGameOver(true);
          audio?.playArcadeSFX('miss');
          return currBoard;
        }
        return currBoard;
      });

      setCurrentPiece(newPiece);
    },
    [audio, nextPieceType]
  );

  const startNewGame = useCallback(() => {
    setBoard(createEmptyBoard());
    setScore(0);
    setLines(0);
    setLevel(1);
    setGameOver(false);
    setIsPaused(false);
    const firstType = getRandomTetromino();
    const secondType = getRandomTetromino();
    setNextPieceType(secondType);

    const def = TETROMINOES[firstType];
    const initialX = Math.floor((BOARD_WIDTH - def.shape[0].length) / 2);
    setCurrentPiece({
      type: firstType,
      shape: def.shape,
      color: def.color,
      x: initialX,
      y: 0,
    });
  }, []);

  // Initialize game on mount
  useEffect(() => {
    startNewGame();
  }, [startNewGame]);

  // Lock piece into board and clear full rows
  const lockPiece = useCallback(
    (pieceToLock: Piece) => {
      setBoard((prevBoard) => {
        const nextBoard = prevBoard.map((row) => [...row]);
        // Stamp piece
        for (let r = 0; r < pieceToLock.shape.length; r++) {
          for (let c = 0; c < pieceToLock.shape[r].length; c++) {
            if (pieceToLock.shape[r][c]) {
              const by = pieceToLock.y + r;
              const bx = pieceToLock.x + c;
              if (by >= 0 && by < BOARD_HEIGHT && bx >= 0 && bx < BOARD_WIDTH) {
                nextBoard[by][bx] = pieceToLock.color;
              }
            }
          }
        }

        // Check line clears
        const clearedRows: number[] = [];
        for (let r = 0; r < BOARD_HEIGHT; r++) {
          if (nextBoard[r].every((cell) => cell !== null)) {
            clearedRows.push(r);
          }
        }

        if (clearedRows.length > 0) {
          audio?.playArcadeSFX(clearedRows.length >= 4 ? 'win' : 'match');
          // Remove cleared rows and push empty rows on top
          const remainingRows = nextBoard.filter((_, idx) => !clearedRows.includes(idx));
          const newRows = Array.from({ length: clearedRows.length }, () =>
            Array(BOARD_WIDTH).fill(null)
          );
          const finalBoard = [...newRows, ...remainingRows];

          // Score table: 100, 300, 500, 800
          const pointMultipliers = [0, 100, 300, 500, 800];
          const pts = (pointMultipliers[clearedRows.length] || 100) * level;

          setScore((s) => {
            const nextScore = s + pts;
            if (nextScore > bestScore) {
              onWin(nextScore);
            }
            return nextScore;
          });

          setLines((l) => {
            const nextLines = l + clearedRows.length;
            setLevel(Math.floor(nextLines / 6) + 1);
            return nextLines;
          });

          return finalBoard;
        }

        audio?.playArcadeSFX('flip');
        return nextBoard;
      });

      spawnPiece();
    },
    [audio, bestScore, level, onWin, spawnPiece]
  );

  // Move piece left or right
  const moveHorizontally = useCallback(
    (dx: -1 | 1) => {
      if (!currentPiece || gameOver || isPaused) return;
      if (!checkCollision(board, currentPiece.shape, currentPiece.x + dx, currentPiece.y)) {
        setCurrentPiece((prev) => (prev ? { ...prev, x: prev.x + dx } : null));
      }
    },
    [board, currentPiece, gameOver, isPaused]
  );

  // Rotate piece clockwise
  const rotatePiece = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    const rotated = rotateMatrix(currentPiece.shape);
    // Wall kicks: try x, x-1, x+1, x-2, x+2
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!checkCollision(board, rotated, currentPiece.x + kick, currentPiece.y)) {
        setCurrentPiece((prev) =>
          prev ? { ...prev, shape: rotated, x: prev.x + kick } : null
        );
        audio?.playArcadeSFX('flip');
        return;
      }
    }
  }, [audio, board, currentPiece, gameOver, isPaused]);

  // Soft drop (down 1 step)
  const dropOne = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    if (!checkCollision(board, currentPiece.shape, currentPiece.x, currentPiece.y + 1)) {
      setCurrentPiece((prev) => (prev ? { ...prev, y: prev.y + 1 } : null));
      setScore((s) => s + 1);
    } else {
      lockPiece(currentPiece);
    }
  }, [board, currentPiece, gameOver, isPaused, lockPiece]);

  // Hard drop (drop straight down and lock immediately)
  const hardDrop = useCallback(() => {
    if (!currentPiece || gameOver || isPaused) return;
    let targetY = currentPiece.y;
    while (!checkCollision(board, currentPiece.shape, currentPiece.x, targetY + 1)) {
      targetY++;
    }
    const droppedDistance = targetY - currentPiece.y;
    setScore((s) => s + droppedDistance * 2);
    const droppedPiece = { ...currentPiece, y: targetY };
    setCurrentPiece(droppedPiece);
    lockPiece(droppedPiece);
  }, [board, currentPiece, gameOver, isPaused, lockPiece]);

  // Calculate Ghost Piece position (landing indicator)
  const ghostY = (() => {
    if (!currentPiece) return 0;
    let gy = currentPiece.y;
    while (!checkCollision(board, currentPiece.shape, currentPiece.x, gy + 1)) {
      gy++;
    }
    return gy;
  })();

  // Drop timer loop
  useEffect(() => {
    if (gameOver || isPaused || !currentPiece) return;
    const dropSpeed = Math.max(160, 680 - (level - 1) * 65);
    const interval = setInterval(() => {
      dropOne();
    }, dropSpeed);
    return () => clearInterval(interval);
  }, [dropOne, gameOver, isPaused, currentPiece, level]);

  // Keyboard controls
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      ) {
        return;
      }
      const k = e.key.toLowerCase();
      if (k === 'arrowleft' || k === 'a') {
        e.preventDefault();
        moveHorizontally(-1);
      } else if (k === 'arrowright' || k === 'd') {
        e.preventDefault();
        moveHorizontally(1);
      } else if (k === 'arrowup' || k === 'w') {
        e.preventDefault();
        rotatePiece();
      } else if (k === 'arrowdown' || k === 's') {
        e.preventDefault();
        dropOne();
      } else if (k === ' ') {
        e.preventDefault();
        hardDrop();
      } else if (k === 'p') {
        e.preventDefault();
        setIsPaused((p) => !p);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [dropOne, hardDrop, moveHorizontally, rotatePiece]);

  // Next piece matrix
  const nextPieceDef = TETROMINOES[nextPieceType];

  return (
    <div>
      {/* Top Banner info */}
      <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-[#ebd8e0]">
        <span>Clear lines to score · 300+ pts earns the Starlight Arcade Token!</span>
        <div className="flex items-center gap-3 font-mono tabular-nums">
          <span className="text-[#f5caa0]">Score: {score}</span>
          <span className="text-[#baa897]">Best: {Math.max(score, bestScore)}</span>
        </div>
      </div>

      {/* Main Arcade Cabinet Playing Field */}
      <div className="mt-4 flex flex-col md:flex-row items-center md:items-start justify-center gap-6">
        {/* Tetris Board Grid */}
        <div className="relative rounded-2xl border-2 border-[#52416b] bg-[#0c0914] p-2 shadow-2xl">
          {/* Game Over Banner */}
          {gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/85 backdrop-blur-xs p-4 text-center">
              <div className="font-['Fraunces'] text-2xl font-bold text-[#f87171]">
                Game Over
              </div>
              <p className="mt-1 text-xs text-[#e8d5be]">
                Final Score: <span className="font-mono font-bold text-[#f5caa0]">{score}</span>
              </p>
              {score >= 300 && (
                <div className="mt-2 flex items-center gap-1.5 rounded-full bg-[#f5caa0]/20 px-3 py-1 text-xs font-semibold text-[#f5caa0]">
                  <Trophy className="h-3.5 w-3.5" />
                  <span>Starlight Token Won!</span>
                </div>
              )}
              <button
                type="button"
                onClick={startNewGame}
                className="mt-4 rounded-xl bg-[#e69a7b] px-5 py-2 text-xs font-bold text-[#1f1613] hover:bg-[#f2ab8d] transition-transform active:scale-95 cursor-pointer shadow-lg"
              >
                Play Again
              </button>
            </div>
          )}

          {/* Pause overlay */}
          {isPaused && !gameOver && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center rounded-2xl bg-black/80 backdrop-blur-xs text-center">
              <div className="font-['Fraunces'] text-xl font-bold text-[#f5caa0]">
                Paused
              </div>
              <button
                type="button"
                onClick={() => setIsPaused(false)}
                className="mt-3 rounded-xl bg-[#60a5fa] px-4 py-1.5 text-xs font-semibold text-[#0f172a] hover:bg-[#93c5fd] cursor-pointer"
              >
                Resume (P)
              </button>
            </div>
          )}

          {/* 10 x 20 Cell Grid */}
          <div
            className="grid grid-cols-10 gap-[1.5px] bg-[#161224] p-[1.5px] rounded-lg"
            style={{ width: '220px', height: '440px' }}
          >
            {board.map((row, r) =>
              row.map((cellColor, c) => {
                // Check if current active piece is in this cell
                let isCurrentPiece = false;
                let activeColor = cellColor;
                if (currentPiece) {
                  const pr = r - currentPiece.y;
                  const pc = c - currentPiece.x;
                  if (
                    pr >= 0 &&
                    pr < currentPiece.shape.length &&
                    pc >= 0 &&
                    pc < currentPiece.shape[pr].length &&
                    currentPiece.shape[pr][pc]
                  ) {
                    isCurrentPiece = true;
                    activeColor = currentPiece.color;
                  }
                }

                // Check if ghost piece is in this cell
                let isGhost = false;
                if (currentPiece && !isCurrentPiece && ghostY !== currentPiece.y) {
                  const gr = r - ghostY;
                  const gc = c - currentPiece.x;
                  if (
                    gr >= 0 &&
                    gr < currentPiece.shape.length &&
                    gc >= 0 &&
                    gc < currentPiece.shape[gr].length &&
                    currentPiece.shape[gr][gc]
                  ) {
                    isGhost = true;
                  }
                }

                return (
                  <div
                    key={`${r}-${c}`}
                    className={`h-[20px] w-[20px] rounded-[3px] transition-colors duration-75 ${
                      activeColor
                        ? 'border border-white/20 shadow-xs'
                        : isGhost
                          ? 'border border-dashed border-white/25 bg-white/5'
                          : 'bg-[#120e1e]'
                    }`}
                    style={{
                      backgroundColor: activeColor || undefined,
                    }}
                  />
                );
              })
            )}
          </div>
        </div>

        {/* Side Panel: Next Piece, Stats & Legend */}
        <div className="flex flex-col gap-4 w-52 text-xs">
          {/* Next Piece Card */}
          <div className="rounded-2xl border border-[#ebd7bf]/15 bg-[#171324] p-3.5">
            <span className="text-[10px] font-mono uppercase tracking-wider text-[#baa897]">
              Next Tetromino
            </span>
            <div className="mt-2.5 flex h-20 items-center justify-center rounded-xl bg-[#0e0a17]">
              <div
                className="grid gap-1"
                style={{
                  gridTemplateColumns: `repeat(${nextPieceDef.shape[0].length}, minmax(0, 1fr))`,
                }}
              >
                {nextPieceDef.shape.map((row, r) =>
                  row.map((active, c) => (
                    <div
                      key={`next-${r}-${c}`}
                      className="h-4 w-4 rounded-xs"
                      style={{
                        backgroundColor: active ? nextPieceDef.color : 'transparent',
                      }}
                    />
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Stats: Level, Lines */}
          <div className="rounded-2xl border border-[#ebd7bf]/15 bg-[#171324] p-3.5 flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <span className="text-[#baa897]">Level</span>
              <span className="font-mono font-bold text-[#f5caa0]">{level}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#baa897]">Lines Cleared</span>
              <span className="font-mono font-bold text-[#8ed4a8]">{lines}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[#baa897]">Best Run</span>
              <span className="font-mono text-[#e69a7b]">{bestScore}</span>
            </div>
          </div>

          {/* Keyboard Controls Legend */}
          <div className="rounded-2xl border border-[#ebd7bf]/15 bg-[#171324] p-3 text-[11px] text-[#b0a4be] flex flex-col gap-1.5">
            <div className="flex justify-between">
              <span className="font-mono text-[#f5caa0]">A / D / ← / →</span>
              <span>Move</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[#f5caa0]">W / ↑</span>
              <span>Rotate</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[#f5caa0]">S / ↓</span>
              <span>Soft Drop</span>
            </div>
            <div className="flex justify-between">
              <span className="font-mono text-[#f5caa0]">Space</span>
              <span>Hard Drop</span>
            </div>
          </div>
        </div>
      </div>

      {/* Touch / Mouse On-Screen Action Pad for easy playing */}
      <div className="mt-4 flex items-center justify-center gap-2">
        <button
          type="button"
          onClick={() => moveHorizontally(-1)}
          className="flex items-center justify-center rounded-xl border border-[#ebd7bf]/20 bg-[#2b213d] p-3 text-white hover:bg-[#3b2e54] active:scale-95 cursor-pointer shadow-md"
          title="Move Left (A / ←)"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={rotatePiece}
          className="flex items-center gap-1.5 rounded-xl border border-[#c084fc]/50 bg-[#3d2757] px-4 py-3 text-xs font-bold text-[#f3e8ff] hover:bg-[#4f3370] active:scale-95 cursor-pointer shadow-md"
          title="Rotate (W / ↑)"
        >
          <RotateCw className="h-4 w-4" />
          <span>Rotate</span>
        </button>
        <button
          type="button"
          onClick={dropOne}
          className="flex items-center justify-center rounded-xl border border-[#ebd7bf]/20 bg-[#2b213d] p-3 text-white hover:bg-[#3b2e54] active:scale-95 cursor-pointer shadow-md"
          title="Soft Drop (S / ↓)"
        >
          <ArrowDown className="h-4 w-4" />
        </button>
        <button
          type="button"
          onClick={hardDrop}
          className="flex items-center gap-1.5 rounded-xl bg-[#e69a7b] px-5 py-3 text-xs font-bold text-[#1f1613] hover:bg-[#f2ab8d] active:scale-95 cursor-pointer shadow-lg"
          title="Hard Drop (Space)"
        >
          <Zap className="h-4 w-4 fill-current" />
          <span>Hard Drop</span>
        </button>
        <button
          type="button"
          onClick={() => moveHorizontally(1)}
          className="flex items-center justify-center rounded-xl border border-[#ebd7bf]/20 bg-[#2b213d] p-3 text-white hover:bg-[#3b2e54] active:scale-95 cursor-pointer shadow-md"
          title="Move Right (D / →)"
        >
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

// ============================================================================
// MINIGAME: CRICKET CHALLENGE (Inspired by Damini's Batting)
// ============================================================================
const TOTAL_BALLS = 6;

function CricketChallengeGame({
  audio,
  bestScore,
  onWin,
}: {
  audio: AudioManager | null;
  bestScore: number;
  onWin: (runs: number) => void;
}) {
  const [runs, setRuns] = useState(0);
  const [ballsBowled, setBallsBowled] = useState(0);
  const [ballActive, setBallActive] = useState(false);
  const [ballPos, setBallPos] = useState(0); // 0 (bowler) -> 100 (wicket)
  const [lastCall, setLastCall] = useState('Press Start Over to bowl delivery 1!');
  const [overComplete, setOverComplete] = useState(false);

  const speedRef = useRef(115);
  const swungRef = useRef(false);

  const startDelivery = useCallback(() => {
    swungRef.current = false;
    setBallPos(0);
    speedRef.current = 100 + Math.random() * 32;
    setBallActive(true);
    setLastCall('Ball on its way! Watch the pitch and time the drive!');
  }, []);

  const startNewOver = useCallback(() => {
    setRuns(0);
    setBallsBowled(0);
    setOverComplete(false);
    startDelivery();
  }, [startDelivery]);

  const finishDelivery = useCallback(
    (scoredRuns: number, commentary: string) => {
      setBallActive(false);
      setRuns((r) => r + scoredRuns);
      setLastCall(commentary);

      setBallsBowled((b) => {
        const nextB = b + 1;
        if (nextB >= TOTAL_BALLS) {
          setOverComplete(true);
          const finalRuns = runs + scoredRuns;
          onWin(finalRuns);
          if (finalRuns >= 12) {
            audio?.playArcadeSFX('win');
          }
        } else {
          window.setTimeout(() => {
            startDelivery();
          }, 950);
        }
        return nextB;
      });
    },
    [audio, onWin, runs, startDelivery]
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
  }, [ballActive, ballsBowled, overComplete, startNewOver, swingBat]);

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
// MASTER ARCADE CABINET MODAL
// ============================================================================
export function ArcadeMinigameModal({
  activeGame,
  saveData,
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

  // Default to 'tetris' if invalid or previous minigame passed
  const currentTab: MinigameId =
    activeGame === 'cricket-challenge' ? 'cricket-challenge' : 'tetris';

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 p-4 pointer-events-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.18, ease: [0.16, 1, 0.3, 1] }}
        className="max-h-[94vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-[#f2b880]/30 bg-[#191524] p-5 sm:p-6 text-[#faf3eb] shadow-2xl"
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
              ['tetris', 'Starlight Tetris'],
              ['cricket-challenge', 'Damini’s Cricket Challenge'],
            ] as const
          ).map(([id, label]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSwitchGame(id)}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors cursor-pointer whitespace-nowrap ${
                currentTab === id
                  ? 'bg-[#342b4a] text-[#fff6ea] shadow-sm'
                  : 'text-[#a59bb8] hover:text-white'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="mt-5">
          {currentTab === 'tetris' && (
            <TetrisGame
              audio={audio}
              bestScore={saveData.minigameHighScores['tetris'] ?? 0}
              onWin={(pts) =>
                onRecordResult(
                  'tetris',
                  pts,
                  pts >= 300 ? 'keepsake-arcade-match' : undefined
                )
              }
            />
          )}

          {currentTab === 'cricket-challenge' && (
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
        </div>
      </motion.div>
    </div>
  );
}
