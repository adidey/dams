export interface CharacterSpritePalette {
  id: 'adi' | 'damini' | 'sunny';
  displayName: string;
  roleLabel: string;
  /**
   * Optional custom PNG sprite sheet path under /public/sprites/.
   * If a user drops `adi.png`, `damini.png`, or `sunny.png` into `/public/sprites/`
   * and sets `customSpriteSheetUrl`, the sprite factory loads it cleanly while
   * keeping crisp NearestFilter pixel-art rendering.
   */
  customSpriteSheetUrl?: string;
  worldHeightMeters: number;
  worldWidthMeters: number;
  shadowRadius: number;
}

export const CHARACTERS_CONFIG: Record<'adi' | 'damini' | 'sunny', CharacterSpritePalette> = {
  adi: {
    id: 'adi',
    displayName: 'Adi',
    roleLabel: 'Exploring Melbourne',
    worldHeightMeters: 2.28,
    worldWidthMeters: 2.28,
    shadowRadius: 0.68,
  },
  damini: {
    id: 'damini',
    displayName: 'Damini',
    roleLabel: 'Right beside you',
    worldHeightMeters: 2.14,
    worldWidthMeters: 2.14,
    shadowRadius: 0.64,
  },
  sunny: {
    id: 'sunny',
    displayName: 'Sunny',
    roleLabel: 'Golden Retriever',
    worldHeightMeters: 1.58,
    worldWidthMeters: 1.82,
    shadowRadius: 0.6,
  },
};

export const INITIAL_SPAWN = {
  adi: [-76.5, 0, -76.5] as [number, number, number],
  damini: [-78.6, 0, -77.1] as [number, number, number],
  sunny: [-74.5, 0, -77.3] as [number, number, number],
};
