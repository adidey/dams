import { ConfiguredPhotoEntry } from '../types';

/**
 * Data-driven real photograph configuration for every relationship memory location.
 *
 * IMPORTANT:
 * - No AI-generated or invented couple images are ever placed here.
 * - Add local image paths under `/public/memories/<location-id>/...` (JPG, JPEG, PNG, WEBP)
 *   to `src` below, OR upload real photographs directly inside the in-game Scrapbook / Memory Journal
 *   (which persists them safely in IndexedDB across refreshes).
 */
export const PHOTO_MEMORY_CONFIG: Record<string, ConfiguredPhotoEntry[]> = {
  'international-house': [
    {
      id: 'ih-slot-1',
      // Example: src: '/memories/international-house/our-beginning.jpg',
      caption: 'Parkville mornings at International House — where our Melbourne story quietly began.',
      dateLabel: 'Chapter I · Parkville',
    },
  ],
  '11-inch-pizza': [
    {
      id: 'pizza-slot-1',
      // Example: src: '/memories/11-inch-pizza/gnocchi-night.jpg',
      caption: '11 Inch Pizza — the night Damini introduced Adi to proper pillowy gnocchi alongside a piping-hot pizza.',
      dateLabel: 'Chapter II · Melbourne CBD',
    },
  ],
  'bibi-ji': [
    {
      id: 'bibiji-slot-1',
      // Example: src: '/memories/bibi-ji/dinner-together.jpg',
      caption: 'Warm plates, bold spices, and effortless laughter across the table at Bibi Ji.',
      dateLabel: 'Chapter III · Flinders Quarter',
    },
  ],
  'botanic-gardens': [
    {
      id: 'gardens-slot-1',
      // Example: src: '/memories/botanic-gardens/adi-birthday.jpg',
      caption: 'Golden sunlight, lakeside willows, and the sweetest birthday afternoon together at the Royal Botanic Gardens.',
      dateLabel: 'Chapter IV · Adi’s Birthday',
    },
  ],
  'the-black-prince': [
    {
      id: 'black-prince-slot-1',
      // Example: src: '/memories/the-black-prince/dad-roast.jpg',
      caption: 'A brilliant meal at The Black Prince — complete with Damini’s dad roasting Adi to perfection.',
      dateLabel: 'Chapter V · Heritage Dining',
    },
  ],
  'yarra-overlook': [
    {
      id: 'yarra-slot-1',
      // Example: src: '/memories/yarra-overlook/twilight-river.jpg',
      caption: 'All our favourite corners of Melbourne leading right back to each other along the Yarra.',
      dateLabel: 'Finale · Southbank Promenade',
    },
  ],
};
