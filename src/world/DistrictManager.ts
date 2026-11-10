import * as THREE from 'three';
import { DistrictId, DistrictPreset, ProjectedMarker, WorldMarker } from './types';

const _projVec = new THREE.Vector3();

export const DISTRICT_PRESETS: DistrictPreset[] = [
  {
    id: 'overview',
    name: 'City Overview',
    subtitle: 'All five connected Melbourne districts across the Yarra',
    target: [4, 0, -2],
    zoom: 0.62,
    azimuthDeg: 42.3,
  },
  {
    id: 'cbd',
    name: 'Melbourne CBD',
    subtitle: 'Flinders Dome · Bluestone Laneways · Swanston Tram Spine',
    target: [-10, 0, -11],
    zoom: 1.52,
    azimuthDeg: 42.3,
  },
  {
    id: 'parkville',
    name: 'Parkville',
    subtitle: 'Sandstone University Quad · Victorian Filigree Terraces · Grattan St',
    target: [-56, 0, -76],
    zoom: 1.28,
    azimuthDeg: 38.0,
  },
  {
    id: 'southbank',
    name: 'Southbank & Yarra',
    subtitle: 'Princes Bridge · Waterfront Dining · Arts Spire · Ferry',
    target: [-32, 0, 42],
    zoom: 1.28,
    azimuthDeg: 44.0,
  },
  {
    id: 'botanic',
    name: 'Botanic Gardens',
    subtitle: 'Ornamental Lake · Moreton Bay Figs · Heritage Rotunda',
    target: [84, 0, 82],
    zoom: 1.22,
    azimuthDeg: 40.0,
  },
  {
    id: 'arcade',
    name: 'Arcade Quarter',
    subtitle: 'Starlight Coin-Op Arcade · Vinyl Store · Lantern Bistro Alley',
    target: [91, 0, -24],
    zoom: 1.68,
    azimuthDeg: 48.0,
  },
];

export const WORLD_DEBUG_MARKERS: WorldMarker[] = [
  // Landmarks & Laneways
  {
    id: 'mk-flinders-dome',
    label: 'Flinders Heritage Dome',
    category: 'landmark',
    district: 'cbd',
    position: [-14, 15.5, -5],
    zoom: 1.85,
  },
  {
    id: 'mk-degraves',
    label: 'Degraves & Hosier Laneway',
    category: 'laneway',
    district: 'cbd',
    position: [-28, 4.8, -18],
    zoom: 2.35,
  },
  {
    id: 'mk-centre-place',
    label: 'Centre Place Espresso Lane',
    category: 'laneway',
    district: 'cbd',
    position: [26, 4.8, -18],
    zoom: 2.35,
  },
  {
    id: 'mk-uni-quad',
    label: 'Old Quad & Clocktower',
    category: 'landmark',
    district: 'parkville',
    position: [-75, 16.5, -96],
    zoom: 1.55,
  },
  {
    id: 'mk-parkville-terraces',
    label: 'Faraday Filigree Terraces',
    category: 'landmark',
    district: 'parkville',
    position: [-22, 7.8, -84],
    zoom: 1.95,
  },
  {
    id: 'mk-princes-bridge',
    label: 'Princes Bridge',
    category: 'landmark',
    district: 'southbank',
    position: [0, 4.2, 28],
    zoom: 1.65,
  },
  {
    id: 'mk-southbank-prom',
    label: 'Southbank Waterfront',
    category: 'landmark',
    district: 'southbank',
    position: [-42, 4.5, 48],
    zoom: 1.75,
  },
  {
    id: 'mk-arts-spire',
    label: 'Arts Precinct Spire',
    category: 'landmark',
    district: 'southbank',
    position: [-19.5, 22, 76],
    zoom: 1.35,
  },
  {
    id: 'mk-botanic-lake',
    label: 'Ornamental Lake Bridge',
    category: 'landmark',
    district: 'botanic',
    position: [92, 3.2, 85],
    zoom: 1.75,
  },
  {
    id: 'mk-rotunda',
    label: 'Garden Rotunda Pavilion',
    category: 'landmark',
    district: 'botanic',
    position: [118, 8.8, 88],
    zoom: 1.85,
  },
  {
    id: 'mk-arcade',
    label: 'Starlight Arcade & Vinyl Alley',
    category: 'laneway',
    district: 'arcade',
    position: [92, 7.2, -20],
    zoom: 2.25,
  },

  // Tram Stops
  {
    id: 'mk-stop-1',
    label: 'Tram Stop 1 · Parkville Uni',
    category: 'tram-stop',
    district: 'parkville',
    position: [3.55, 3.4, -78],
    zoom: 2.0,
  },
  {
    id: 'mk-stop-5',
    label: 'Tram Stop 5 · Bourke St',
    category: 'tram-stop',
    district: 'cbd',
    position: [-3.55, 3.4, -24],
    zoom: 2.0,
  },
  {
    id: 'mk-stop-13',
    label: 'Tram Stop 13 · Flinders St',
    category: 'tram-stop',
    district: 'cbd',
    position: [3.55, 3.4, -3.5],
    zoom: 2.0,
  },
  {
    id: 'mk-stop-14',
    label: 'Tram Stop 14 · Arts & Gardens',
    category: 'tram-stop',
    district: 'southbank',
    position: [3.55, 3.4, 69],
    zoom: 2.0,
  },
];

export class DistrictManager {
  public getPreset(id: DistrictId): DistrictPreset {
    return DISTRICT_PRESETS.find((p) => p.id === id) ?? DISTRICT_PRESETS[0];
  }

  public detectDistrictAt(x: number, z: number, zoom: number): DistrictId {
    if (zoom < 0.72) return 'overview';
    if (z < -44 && x < 20) return 'parkville';
    if (x > 56 && z < 14) return 'arcade';
    if (z > 20 && x > 26) return 'botanic';
    if (z > 18 && x <= 26) return 'southbank';
    return 'cbd';
  }

  public projectMarkers(
    camera: THREE.OrthographicCamera,
    width: number,
    height: number
  ): ProjectedMarker[] {
    const out: ProjectedMarker[] = [];
    for (const mk of WORLD_DEBUG_MARKERS) {
      _projVec.set(mk.position[0], mk.position[1], mk.position[2]);
      _projVec.project(camera);

      const inFrustum =
        _projVec.x >= -0.96 &&
        _projVec.x <= 0.96 &&
        _projVec.y >= -0.92 &&
        _projVec.y <= 0.94 &&
        _projVec.z >= -1 &&
        _projVec.z <= 1;

      const sx = (_projVec.x * 0.5 + 0.5) * width;
      const sy = (-_projVec.y * 0.5 + 0.5) * height;

      out.push({
        id: mk.id,
        label: mk.label,
        category: mk.category,
        district: mk.district,
        x: sx,
        y: sy,
        visible: inFrustum,
        worldPosition: mk.position,
        zoom: mk.zoom,
      });
    }
    return out;
  }
}
