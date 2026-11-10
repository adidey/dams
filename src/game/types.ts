import { DistrictId } from '../world/types';

export type POICategory =
  | 'memory'
  | 'final-memory'
  | 'tram-stop'
  | 'vinyl-cafe'
  | 'arcade'
  | 'photo-booth'
  | 'dog-spot';

export type PhotoBoothFrameStyle =
  | 'bw-strip'
  | 'polaroid'
  | 'postcard'
  | 'romantic-pink'
  | 'arcade-retro';

export type PhotoBoothTone =
  | 'classic-bw'
  | 'bw'
  | 'normal'
  | 'noir-contrast'
  | 'warm-silver'
  | 'soft-grain'
  | 'natural';

export interface PhotoSticker {
  id: string;
  type: 'heart' | 'star' | 'tram' | 'paw' | 'adams' | 'date' | 'dreamland';
  label: string;
  xPercent: number;
  yPercent: number;
  scale?: number;
}

export type ActiveInteriorId = 'vinyl-cafe' | 'arcade' | null;

export type MinigameId = 'memory-match' | 'cricket-challenge' | 'claw-machine';

export interface DialogueLine {
  speaker: 'Adi' | 'Damini' | 'Together' | 'Sunny';
  portraitMood?: 'warm' | 'laugh' | 'blush' | 'playful' | 'happy';
  text: string;
}

export interface ConfiguredPhotoEntry {
  id: string;
  /** Optional relative URL under /memories/<location-id>/filename.jpg */
  src?: string;
  caption: string;
  dateLabel?: string;
}

export interface StoredUploadedPhoto {
  id: string;
  locationId: string;
  dataUrl: string;
  fileName: string;
  mimeType: string;
  caption: string;
  dateLabel?: string;
  createdAt: number;
  frameStyle?: PhotoBoothFrameStyle;
  tone?: PhotoBoothTone;
  isPhotoBooth?: boolean;
}

export interface PointOfInterest {
  id: string;
  chapterNumber?: number;
  title: string;
  subtitle: string;
  district: DistrictId;
  category: POICategory;
  /** World coordinates [x, y, z] in exterior Melbourne or interior room */
  position: [number, number, number];
  /** Activation radius in meters */
  radius: number;
  /** Prompt text displayed when Adi enters radius */
  promptLabel: string;
  /** Story / Journal summary */
  journalDescription: string;
  dateHint?: string;
  /** Conversation lines triggered on interaction */
  dialogue: DialogueLine[];
  /** Collectible awarded upon completing this memory/interaction */
  rewardCollectibleId?: string;
  /** Requires all 5 core memories completed first */
  requiresAllCoreMemories?: boolean;
  /** Associated tram stop ID if category === 'tram-stop' */
  tramStopId?: string;
}

export interface TramDestinationOption {
  stopId: string;
  routeBadge: 'Route A' | 'Route B' | 'Route C';
  routeName: string;
  title: string;
  districtLabel: string;
  description: string;
  exitPosition: [number, number, number];
}

export interface VinylRecordTrack {
  id: string;
  title: string;
  artistTribute: string;
  sleeveSubtitle: string;
  sleeveColor: string;
  vinylAccent: string;
  moodId: 'velvet-scientist' | 'daydream-grande' | 'fitzroy-gold' | 'yarra-rain';
  noteFromDamini: string;
  rewardCollectibleId?: string;
}

export interface CollectibleItem {
  id: string;
  name: string;
  sourceLabel: string;
  description: string;
  category: 'memory' | 'vinyl' | 'arcade' | 'companion';
  accentHex: string;
  iconKey:
    | 'key-tag'
    | 'gnocchi-fork'
    | 'spice-chai'
    | 'birthday-bloom'
    | 'dad-toast'
    | 'yarra-lantern'
    | 'vinyl-velvet'
    | 'vinyl-starlight'
    | 'sunny-collar'
    | 'arcade-card'
    | 'cricket-bat'
    | 'claw-plush';
}

export interface TramRideState {
  active: boolean;
  phase: 'approaching' | 'boarding' | 'riding' | 'arriving';
  originTitle: string;
  destinationTitle: string;
  routeBadge: string;
  progress01: number;
}

export interface ProjectedPOI {
  id: string;
  title: string;
  subtitle: string;
  category: POICategory;
  promptLabel: string;
  x: number;
  y: number;
  visible: boolean;
  inRange: boolean;
  completed: boolean;
  locked: boolean;
  distance: number;
}

export interface InteriorInteractablePrompt {
  id: string;
  label: string;
  subtitle: string;
  actionType:
    | 'exit-interior'
    | 'turntable'
    | 'cafe-barista'
    | 'minigame-memory'
    | 'minigame-cricket'
    | 'minigame-claw';
  x: number;
  y: number;
  visible: boolean;
  inRange: boolean;
}

export interface GameTelemetry {
  adiPos: [number, number, number];
  daminiPos: [number, number, number];
  sunnyPos: [number, number, number];
  sunnyState: 'following' | 'sitting' | 'playful' | 'petted';
  activeInterior: ActiveInteriorId;
  nearbyPOI: ProjectedPOI | null;
  nearbySunnyPrompt: { x: number; y: number; visible: boolean } | null;
  projectedPOIs: ProjectedPOI[];
  interiorPrompts: InteriorInteractablePrompt[];
  tramRide: TramRideState | null;
  isMoving: boolean;
}

export interface GameSaveData {
  version: number;
  completedMemoryIds: string[];
  collectedItemIds: string[];
  pettedSunnyCount: number;
  playedTrackIds: string[];
  minigameHighScores: Record<MinigameId, number>;
  musicMuted: boolean;
  activeVinylMood: VinylRecordTrack['moodId'];
  lastSavedAt: number;
}
