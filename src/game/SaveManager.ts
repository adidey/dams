import { GameSaveData, MinigameId, VinylRecordTrack } from './types';

const STORAGE_KEY = 'melbourne_dreamland_save_v2';

export function createDefaultSaveData(): GameSaveData {
  return {
    version: 2,
    completedMemoryIds: [],
    collectedItemIds: [],
    pettedSunnyCount: 0,
    playedTrackIds: [],
    minigameHighScores: {
      tetris: 0,
      'memory-match': 0,
      'cricket-challenge': 0,
      'claw-machine': 0,
    },
    musicMuted: false,
    activeVinylMood: 'fitzroy-gold',
    lastSavedAt: Date.now(),
  };
}

export class SaveManager {
  public static load(): GameSaveData {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (!raw) return createDefaultSaveData();
      const parsed = JSON.parse(raw) as Partial<GameSaveData>;
      const base = createDefaultSaveData();
      return {
        ...base,
        ...parsed,
        completedMemoryIds: Array.isArray(parsed.completedMemoryIds)
          ? parsed.completedMemoryIds
          : [],
        collectedItemIds: Array.isArray(parsed.collectedItemIds)
          ? parsed.collectedItemIds
          : [],
        playedTrackIds: Array.isArray(parsed.playedTrackIds)
          ? parsed.playedTrackIds
          : [],
        minigameHighScores: {
          ...base.minigameHighScores,
          ...(parsed.minigameHighScores ?? {}),
        },
      };
    } catch {
      return createDefaultSaveData();
    }
  }

  public static save(data: GameSaveData): GameSaveData {
    const updated: GameSaveData = {
      ...data,
      lastSavedAt: Date.now(),
    };
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // Ignore storage quota errors gracefully
    }
    return updated;
  }

  public static markMemoryCompleted(
    current: GameSaveData,
    memoryId: string,
    rewardCollectibleId?: string
  ): GameSaveData {
    const completedMemoryIds = current.completedMemoryIds.includes(memoryId)
      ? current.completedMemoryIds
      : [...current.completedMemoryIds, memoryId];

    const collectedItemIds =
      rewardCollectibleId && !current.collectedItemIds.includes(rewardCollectibleId)
        ? [...current.collectedItemIds, rewardCollectibleId]
        : current.collectedItemIds;

    return this.save({
      ...current,
      completedMemoryIds,
      collectedItemIds,
    });
  }

  public static unlockCollectible(
    current: GameSaveData,
    collectibleId: string
  ): GameSaveData {
    if (current.collectedItemIds.includes(collectibleId)) return current;
    return this.save({
      ...current,
      collectedItemIds: [...current.collectedItemIds, collectibleId],
    });
  }

  public static recordSunnyPet(current: GameSaveData): GameSaveData {
    const nextCount = current.pettedSunnyCount + 1;
    const collectedItemIds =
      nextCount >= 1 && !current.collectedItemIds.includes('keepsake-sunny-tag')
        ? [...current.collectedItemIds, 'keepsake-sunny-tag']
        : current.collectedItemIds;
    return this.save({
      ...current,
      pettedSunnyCount: nextCount,
      collectedItemIds,
    });
  }

  public static recordVinylPlayed(
    current: GameSaveData,
    trackId: string,
    moodId: VinylRecordTrack['moodId'],
    rewardCollectibleId?: string
  ): GameSaveData {
    const playedTrackIds = current.playedTrackIds.includes(trackId)
      ? current.playedTrackIds
      : [...current.playedTrackIds, trackId];
    const collectedItemIds =
      rewardCollectibleId && !current.collectedItemIds.includes(rewardCollectibleId)
        ? [...current.collectedItemIds, rewardCollectibleId]
        : current.collectedItemIds;
    return this.save({
      ...current,
      playedTrackIds,
      activeVinylMood: moodId,
      collectedItemIds,
    });
  }

  public static recordMinigameScore(
    current: GameSaveData,
    gameId: MinigameId,
    score: number,
    rewardCollectibleId?: string
  ): GameSaveData {
    const prevBest = current.minigameHighScores[gameId] ?? 0;
    const collectedItemIds =
      rewardCollectibleId && !current.collectedItemIds.includes(rewardCollectibleId)
        ? [...current.collectedItemIds, rewardCollectibleId]
        : current.collectedItemIds;

    return this.save({
      ...current,
      minigameHighScores: {
        ...current.minigameHighScores,
        [gameId]: Math.max(prevBest, score),
      },
      collectedItemIds,
    });
  }

  public static reset(): GameSaveData {
    const fresh = createDefaultSaveData();
    return this.save(fresh);
  }
}
