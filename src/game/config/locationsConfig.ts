import { PointOfInterest, TramDestinationOption } from '../types';

/**
 * Reusable data-driven Points of Interest across the existing Melbourne 2.5D world.
 * Adding a new memory location in the future only requires appending one entry here
 * and one photo list entry in `photosConfig.ts`.
 */
export const CORE_MEMORY_IDS = [
  'international-house',
  '11-inch-pizza',
  'bibi-ji',
  'botanic-gardens',
  'the-black-prince',
] as const;

export const POINTS_OF_INTEREST: PointOfInterest[] = [
  // =========================================================================
  // 1. INTERNATIONAL HOUSE (Parkville — Where Everything Started)
  // =========================================================================
  {
    id: 'international-house',
    chapterNumber: 1,
    title: 'International House',
    subtitle: 'Parkville · Where Everything Started',
    district: 'parkville',
    category: 'memory',
    position: [-76.5, 0, -85.5],
    radius: 5.8,
    promptLabel: 'Remember International House',
    dateHint: 'Chapter 1 · The Beginning',
    journalDescription:
      'Leafy plane trees, campus hallways, and the exact place in Parkville where Adi and Damini first crossed paths and started writing their story.',
    rewardCollectibleId: 'keepsake-ih-keytag',
    dialogue: [
      {
        speaker: 'Adi',
        portraitMood: 'warm',
        text: 'Hard to believe everything between us started right here at International House.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'playful',
        text: 'Excuse me, I distinctly remember you pretending to look very cool in the courtyard while trying to figure out what to say first.',
      },
      {
        speaker: 'Adi',
        portraitMood: 'laugh',
        text: 'Hey, whatever strategy I used clearly worked — look who’s still walking around Melbourne with me.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'blush',
        text: 'Best coincidence in Parkville. Come on, let’s open the scrapbook page for our very first chapter.',
      },
    ],
  },

  // =========================================================================
  // 2. 11 INCH PIZZA (Melbourne CBD — Gnocchi & Pizza Revelation)
  // =========================================================================
  {
    id: '11-inch-pizza',
    chapterNumber: 2,
    title: '11 Inch Pizza',
    subtitle: 'Melbourne CBD · Gnocchi & Slices',
    district: 'cbd',
    category: 'memory',
    position: [-15.4, 0, -45.0],
    radius: 5.0,
    promptLabel: 'Visit 11 Inch Pizza',
    dateHint: 'Chapter 2 · CBD Favourite',
    journalDescription:
      'Tucked into a warm brick Melbourne CBD nook — the iconic spot where Damini introduced Adi to cloud-soft gnocchi alongside crisp thin-crust pizza.',
    rewardCollectibleId: 'keepsake-gnocchi-card',
    dialogue: [
      {
        speaker: 'Damini',
        portraitMood: 'playful',
        text: 'Behold: 11 Inch Pizza. Site of my greatest culinary victory — convincing you to order gnocchi at a pizza place.',
      },
      {
        speaker: 'Adi',
        portraitMood: 'laugh',
        text: 'I was sceptical for approximately four seconds, and then that first bite completely rewired my brain.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'happy',
        text: 'Moral of the story: always trust my menu instincts. Half pizza, half gnocchi, zero regrets.',
      },
      {
        speaker: 'Adi',
        portraitMood: 'warm',
        text: 'Deal. For life. Let’s tuck this one into our scrapbook.',
      },
    ],
  },

  // =========================================================================
  // 3. BIBI JI (Melbourne CBD — Unforgettable Indian Feast)
  // =========================================================================
  {
    id: 'bibi-ji',
    chapterNumber: 3,
    title: 'Bibi Ji',
    subtitle: 'Flinders Quarter · Spice & Warmth',
    district: 'cbd',
    category: 'memory',
    position: [16.4, 0, -1.2],
    radius: 5.0,
    promptLabel: 'Remember Dinner at Bibi Ji',
    dateHint: 'Chapter 3 · Table for Two',
    journalDescription:
      'Glowing amber lights and rich aromas in the heart of town — sharing incredible Indian dishes at Bibi Ji and losing track of time together.',
    rewardCollectibleId: 'keepsake-bibiji-menu',
    dialogue: [
      {
        speaker: 'Adi',
        portraitMood: 'warm',
        text: 'Even walking past Bibi Ji makes me hungry again. Every single dish we ordered that night hit a ten out of ten.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'happy',
        text: 'And we still somehow ordered extra garlic naan “just in case” when the table barely had room for our glasses!',
      },
      {
        speaker: 'Adi',
        portraitMood: 'blush',
        text: 'Honestly, sitting across from you over great Indian food while trams rumble outside is peak Melbourne happiness.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'warm',
        text: 'Couldn’t agree more. Let’s save our Bibi Ji memory page.',
      },
    ],
  },

  // =========================================================================
  // 4. ROYAL BOTANIC GARDENS (Adi's Birthday — Sunlit Floral Day)
  // =========================================================================
  {
    id: 'botanic-gardens',
    chapterNumber: 4,
    title: 'Royal Botanic Gardens',
    subtitle: 'Ornamental Lake · Adi’s Birthday',
    district: 'botanic',
    category: 'memory',
    position: [83.5, 0, 66.5],
    radius: 5.8,
    promptLabel: 'Relive Adi’s Birthday Picnic',
    dateHint: 'Chapter 4 · Adi’s Birthday',
    journalDescription:
      'Weeping willows, blooming garden beds, and dappled golden light beside the Ornamental Lake on the sweetest birthday spent together.',
    rewardCollectibleId: 'keepsake-botanic-bloom',
    dialogue: [
      {
        speaker: 'Damini',
        portraitMood: 'blush',
        text: 'Look at the light on the lake, Adi! Still feels just as peaceful as your birthday afternoon here.',
      },
      {
        speaker: 'Sunny',
        portraitMood: 'happy',
        text: 'Woof! *Sunny does a delighted spin in the clover and wags his tail.*',
      },
      {
        speaker: 'Adi',
        portraitMood: 'warm',
        text: 'Hands down my favourite birthday. No rush, green trees everywhere, and just getting to spend the whole sunlit day with you.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'warm',
        text: 'Happy birthday all over again, birthday boy. Let’s frame our Gardens memory.',
      },
    ],
  },

  // =========================================================================
  // 5. THE BLACK PRINCE (Brilliant Meal & Damini's Dad Roasting Adi)
  // =========================================================================
  {
    id: 'the-black-prince',
    chapterNumber: 5,
    title: 'The Black Prince',
    subtitle: 'Melbourne CBD · Dinner & Dad Jokes',
    district: 'cbd',
    category: 'memory',
    position: [-41.5, 0, -1.2],
    radius: 5.2,
    promptLabel: 'Remember The Black Prince',
    dateHint: 'Chapter 5 · Unforgettable Table',
    journalDescription:
      'A brilliant meal at The Black Prince made ten times funnier when Damini’s dad affectionately roasted Adi right across the dinner table.',
    rewardCollectibleId: 'keepsake-black-prince-coaster',
    dialogue: [
      {
        speaker: 'Damini',
        portraitMood: 'laugh',
        text: 'Oh no, Adi — we’re back at The Black Prince. Scene of phenomenal food… and my dad roasting you into next week!',
      },
      {
        speaker: 'Adi',
        portraitMood: 'laugh',
        text: 'Look, his comedic timing was immaculate. I couldn’t even defend myself because I was laughing too hard — and you were zero help!',
      },
      {
        speaker: 'Damini',
        portraitMood: 'playful',
        text: 'Hey! Making fun of you only means he genuinely likes you. That’s practically an official badge of honour.',
      },
      {
        speaker: 'Adi',
        portraitMood: 'warm',
        text: 'Worth every bit of banter for a night that good. Let’s add The Black Prince to our journal.',
      },
    ],
  },

  // =========================================================================
  // FINAL ROMANTIC DESTINATION (Unlocks after all 5 Core Memories!)
  // =========================================================================
  {
    id: 'yarra-overlook',
    chapterNumber: 6,
    title: 'Yarra River Twilight Overlook',
    subtitle: 'Southbank Promenade · The Big Question 💕',
    district: 'southbank',
    category: 'final-memory',
    position: [-26.0, 0, 44.2],
    radius: 5.8,
    promptLabel: 'Ask Damini Out Under the Twilight Sky',
    dateHint: 'Finale · The Big Question 💕',
    requiresAllCoreMemories: false,
    rewardCollectibleId: 'keepsake-yarra-lantern',
    journalDescription:
      'Where the Yarra mirrors Princes Bridge and the glowing city skyline — the unforgettable moment when Adi asked Damini out, and she said yes!',
    dialogue: [
      {
        speaker: 'Damini',
        portraitMood: 'blush',
        text: 'From Parkville all the way down to the river… seeing all our little corners of Melbourne together feels kind of magical.',
      },
      {
        speaker: 'Adi',
        portraitMood: 'warm',
        text: 'It’s never really been about the buildings or the trams anyway. Every single spot on this map means something because you were there with me.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'playful',
        text: 'Adi... you’re being unusually sentimental tonight. What’s going on?',
      },
      {
        speaker: 'Adi',
        portraitMood: 'blush',
        text: 'I didn’t just bring you here to look back on old memories, Damini.',
      },
      {
        speaker: 'Damini',
        portraitMood: 'warm',
        text: 'What do you mean?',
      },
      {
        speaker: 'Adi',
        portraitMood: 'warm',
        text: 'I brought you here because there’s something I’ve wanted to ask you from the very beginning…',
      },
    ],
  },

  // =========================================================================
  // INTERACTIVE CBD ENTERTAINMENT VENUES (Vinyl Cafe & Arcade)
  // =========================================================================
  {
    id: 'venue-vinyl-cafe',
    title: 'Wax & Groove Vinyl Cafe',
    subtitle: 'Arcade Alley · Espresso & Records',
    district: 'arcade',
    category: 'vinyl-cafe',
    position: [96.0, 0, -20.5],
    radius: 4.8,
    promptLabel: 'Step Inside Wax & Groove Vinyl Cafe',
    journalDescription:
      'A cosy timber-and-brick listening cafe stocked with crates of soul, R&B, and pop vinyls — including tributes to Damini’s favourites.',
    dialogue: [],
  },
  {
    id: 'venue-starlight-arcade',
    title: 'Starlight Coin-Op Arcade',
    subtitle: 'Arcade Alley · Retro Minigames & Prizes',
    district: 'arcade',
    category: 'arcade',
    position: [88.2, 0, -16.5],
    radius: 5.0,
    promptLabel: 'Enter Starlight Arcade',
    journalDescription:
      'Glowing neon marquees and playable arcade cabinets: Starlight Tetris and Damini’s Cricket Challenge.',
    dialogue: [],
  },
  {
    id: 'venue-photobooth',
    title: 'Vintage B&W Photo Booth',
    subtitle: 'Arcade Alley · 4-Shot Monochrome Strips',
    district: 'arcade',
    category: 'photo-booth',
    position: [82.5, 0, -16.5],
    radius: 4.8,
    promptLabel: 'Step into Vintage Photo Booth',
    journalDescription:
      'A classic vintage Melbourne arcade booth with velvet curtains, illuminated marquee, and black & white analog film strips to capture keepsakes together.',
    dialogue: [],
  },

  // =========================================================================
  // INTERACTIVE MELBOURNE TRAM STOPS (Routes A, B & C)
  // =========================================================================
  {
    id: 'poi-stop-parkville',
    title: 'Parkville · Stop 1',
    subtitle: 'Route A · International House & Campus',
    district: 'parkville',
    category: 'tram-stop',
    tramStopId: 'stop-parkville',
    position: [4.8, 0, -78.0],
    radius: 5.2,
    promptLabel: 'Board Melbourne Tram',
    journalDescription: 'Yarra Trams shelter connecting Parkville to the CBD, Southbank, and Botanic Gardens.',
    dialogue: [],
  },
  {
    id: 'poi-stop-bourke',
    title: 'Bourke & Laneways · Stop 5',
    subtitle: 'Route A / B · Melbourne CBD North',
    district: 'cbd',
    category: 'tram-stop',
    tramStopId: 'stop-bourke',
    position: [-4.8, 0, -24.0],
    radius: 5.2,
    promptLabel: 'Board Melbourne Tram',
    journalDescription: 'Central CBD tram platform close to 11 Inch Pizza, Degraves Lane, and Arcade Alley.',
    dialogue: [],
  },
  {
    id: 'poi-stop-flinders',
    title: 'Flinders & Yarra · Stop 13',
    subtitle: 'Route B · CBD South & Princes Bridge',
    district: 'cbd',
    category: 'tram-stop',
    tramStopId: 'stop-flinders',
    position: [4.8, 0, -3.5],
    radius: 5.2,
    promptLabel: 'Board Melbourne Tram',
    journalDescription: 'Steps away from Bibi Ji, The Black Prince, Flinders Dome, and Southbank across Princes Bridge.',
    dialogue: [],
  },
  {
    id: 'poi-stop-southbank',
    title: 'Southbank & Gardens · Stop 14',
    subtitle: 'Route B / C · Arts Precinct & Botanic Gate',
    district: 'botanic',
    category: 'tram-stop',
    tramStopId: 'stop-southbank',
    position: [4.8, 0, 69.0],
    radius: 5.4,
    promptLabel: 'Board Melbourne Tram',
    journalDescription: 'Gateway stop for the Southbank Riverfront Promenade and the Royal Botanic Gardens.',
    dialogue: [],
  },
];

export const TRAM_DESTINATIONS: TramDestinationOption[] = [
  {
    stopId: 'stop-parkville',
    routeBadge: 'Route A',
    routeName: 'International House / Parkville ↔ Melbourne CBD',
    title: 'International House · Parkville (Stop 1)',
    districtLabel: 'Parkville',
    description: 'Leafy university avenues right beside International House.',
    exitPosition: [5.4, 0, -78.0],
  },
  {
    stopId: 'stop-bourke',
    routeBadge: 'Route A',
    routeName: 'International House / Parkville ↔ Melbourne CBD',
    title: 'Melbourne CBD · Bourke & Laneways (Stop 5)',
    districtLabel: 'Melbourne CBD',
    description: 'Heart of the CBD for 11 Inch Pizza, Wax & Groove Vinyl Cafe, and Starlight Arcade.',
    exitPosition: [-5.4, 0, -24.0],
  },
  {
    stopId: 'stop-flinders',
    routeBadge: 'Route B',
    routeName: 'Melbourne CBD ↔ Southbank / Yarra River',
    title: 'Flinders Quarter & Yarra Northbank (Stop 13)',
    districtLabel: 'CBD & Riverfront',
    description: 'Steps from Bibi Ji, The Black Prince, and Princes Bridge over the Yarra.',
    exitPosition: [5.4, 0, -3.5],
  },
  {
    stopId: 'stop-southbank',
    routeBadge: 'Route C',
    routeName: 'Southbank / Yarra River ↔ Royal Botanic Gardens',
    title: 'Southbank Promenade & Royal Botanic Gardens (Stop 14)',
    districtLabel: 'Southbank & Gardens',
    description: 'Alight here for the Yarra Promenade Overlook and Adi’s Birthday spot in the Botanic Gardens.',
    exitPosition: [5.6, 0, 69.0],
  },
];
