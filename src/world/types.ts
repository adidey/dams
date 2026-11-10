import * as THREE from 'three';

export type DistrictId =
  | 'overview'
  | 'parkville'
  | 'cbd'
  | 'southbank'
  | 'botanic'
  | 'arcade';

export type LightingPreset = 'golden-hour' | 'sunny-afternoon' | 'laneway-dusk';

export interface DistrictPreset {
  id: DistrictId;
  name: string;
  subtitle: string;
  target: [number, number, number];
  zoom: number;
  azimuthDeg?: number;
}

export interface WorldMarker {
  id: string;
  label: string;
  category: 'landmark' | 'tram-stop' | 'laneway';
  district: DistrictId;
  position: [number, number, number];
  zoom?: number;
}

export interface TramStopData {
  id: string;
  name: string;
  routeProgress: number;
  worldPos: THREE.Vector3;
  platformSide: 'left' | 'right' | 'island';
  dwellSeconds: number;
}

export interface ObstacleBox2D {
  minX: number;
  maxX: number;
  minZ: number;
  maxZ: number;
  tag: 'building' | 'water' | 'prop';
}

export interface ProjectedMarker {
  id: string;
  label: string;
  category: 'landmark' | 'tram-stop' | 'laneway';
  district: DistrictId;
  x: number;
  y: number;
  visible: boolean;
  worldPosition: [number, number, number];
  zoom?: number;
}

export interface TramStatusSnapshot {
  id: string;
  routeCode: string;
  destination: string;
  state: 'moving' | 'boarding';
  nearStopName: string | null;
}

/**
 * Clean anchor contract so future 2D pixel-art character sprites (e.g. Adi & Damini)
 * can query exact ground height, camera billboard orientation, lighting tint, and
 * collision walkability without touching environment internals.
 */
export interface SpriteWorldAPI {
  getGroundHeight: (x: number, z: number) => number;
  isWalkableForSprite: (x: number, z: number, radius?: number) => boolean;
  getCameraQuaternion: () => THREE.Quaternion;
  attachSpriteLayer: (group: THREE.Group) => void;
}
