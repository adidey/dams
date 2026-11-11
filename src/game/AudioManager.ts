import { VinylRecordTrack } from './types';

type MoodId = VinylRecordTrack['moodId'];

const MOOD_CHORDS: Record<MoodId, number[][]> = {
  // Warm Melbourne lo-fi Rhodes (Fmaj9 -> Em7 -> Dm9 -> Cmaj9)
  'fitzroy-gold': [
    [174.61, 220.0, 261.63, 329.63, 392.0],
    [164.81, 196.0, 246.94, 293.66, 392.0],
    [146.83, 220.0, 261.63, 329.63, 349.23],
    [130.81, 196.0, 246.94, 293.66, 329.63],
  ],
  // Lush Velvet R&B inspired by Mariah the Scientist (Ebmaj9 -> Cm11 -> Fm9 -> Bb13sus4)
  'velvet-scientist': [
    [155.56, 196.0, 233.08, 293.66, 349.23],
    [130.81, 196.0, 233.08, 293.66, 349.23],
    [174.61, 207.65, 261.63, 311.13, 392.0],
    [116.54, 207.65, 233.08, 293.66, 392.0],
  ],
  // Sparkling Dream-Pop inspired by Ariana Grande (Abmaj7 -> Fm9 -> Dbmaj9 -> Eb9sus4)
  'daydream-grande': [
    [207.65, 261.63, 311.13, 392.0, 466.16],
    [174.61, 207.65, 261.63, 311.13, 392.0],
    [138.59, 207.65, 261.63, 311.13, 415.3],
    [155.56, 233.08, 277.18, 349.23, 466.16],
  ],
  // Gentle Southbank Yarra twilight nocturne
  'yarra-rain': [
    [196.0, 246.94, 293.66, 369.99, 440.0],
    [164.81, 246.94, 293.66, 392.0, 440.0],
    [130.81, 196.0, 246.94, 329.63, 392.0],
    [146.83, 220.0, 261.63, 329.63, 369.99],
  ],
};

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
}

export const ONLINE_AUDIO_TRACKS: Record<
  string,
  { title: string; artist: string; url: string }
> = {
  'velvet-scientist': {
    title: 'Rainy Days',
    artist: 'Mariah the Scientist',
    url: '/assets/aistudio/Mariah_the_Scientist_-_Rainy_Days__SPOTISAVER__45afa21f.mp3',
  },
  'daydream-grande': {
    title: 'needy',
    artist: 'Ariana Grande',
    url: '/assets/aistudio/Ariana_Grande_-_needy__SPOTISAVER__e6e2dcf3.mp3',
  },
};

export const MELBOURNE_PLAYLIST: MusicTrack[] = [
  {
    id: 'mariah-rainy-days',
    title: 'Rainy Days',
    artist: 'Mariah the Scientist',
    url: '/assets/aistudio/Mariah_the_Scientist_-_Rainy_Days__SPOTISAVER__45afa21f.mp3',
  },
  {
    id: 'mariah-more',
    title: 'More',
    artist: 'Mariah the Scientist',
    url: '/assets/aistudio/Mariah_the_Scientist_-_More__SPOTISAVER__0b9b0506.mp3',
  },
  {
    id: 'sza-saturn',
    title: 'Saturn',
    artist: 'SZA',
    url: '/assets/aistudio/SZA_-_Saturn__SPOTISAVER__ccc5f8fa.mp3',
  },
  {
    id: 'sza-kitchen',
    title: 'Kitchen',
    artist: 'SZA',
    url: '/assets/aistudio/SZA_-_Kitchen__SPOTISAVER__d6b00304.mp3',
  },
  {
    id: 'ariana-love-me-harder',
    title: 'Love Me Harder',
    artist: 'Ariana Grande & The Weeknd',
    url: '/assets/aistudio/Ariana_Grande__The_Weeknd_-_Love_Me_Harder__SPOTISAVER__472314cb.mp3',
  },
  {
    id: 'pinkpantheress-attracted',
    title: 'Attracted to You',
    artist: 'PinkPantheress',
    url: '/assets/aistudio/PinkPantheress_-_Attracted_to_You__SPOTISAVER__4cfd6748.mp3',
  },
  {
    id: 'ariana-needy',
    title: 'needy',
    artist: 'Ariana Grande',
    url: '/assets/aistudio/Ariana_Grande_-_needy__SPOTISAVER__e6e2dcf3.mp3',
  },
  {
    id: 'sza-supermodel',
    title: 'Supermodel',
    artist: 'SZA',
    url: '/assets/aistudio/SZA_-_Supermodel__SPOTISAVER__91d48505.mp3',
  },
  {
    id: 'flo-milli-neva',
    title: 'Neva',
    artist: 'Flo Milli & Monaleo',
    url: '/assets/aistudio/Flo_Milli__Monaleo_-_Neva__feat._Monaleo___SPOTISAVER__71647437.mp3',
  },
  {
    id: 'ariana-break-free',
    title: 'Break Free',
    artist: 'Ariana Grande & Zedd',
    url: '/assets/aistudio/Ariana_Grande__Zedd_-_Break_Free__SPOTISAVER__bc9b4dfe.mp3',
  },
  {
    id: 'sza-scorsese',
    title: 'Scorsese Baby Daddy',
    artist: 'SZA',
    url: '/assets/aistudio/SZA_-_Scorsese_Baby_Daddy__SPOTISAVER__18dae09b.mp3',
  },
  {
    id: 'sza-prom',
    title: 'Prom',
    artist: 'SZA',
    url: '/assets/aistudio/SZA_-_Prom__SPOTISAVER__86460c4f.mp3',
  },
];

export interface TrackStatusInfo {
  track: MusicTrack;
  index: number;
  total: number;
  isPlaying: boolean;
  isShuffle: boolean;
  isMuted: boolean;
}

/**
 * Romantic Melbourne Dreamland Audio Manager:
 * Plays authentic high-fidelity MP3 soundtrack (Mariah the Scientist, SZA, Ariana Grande,
 * PinkPantheress, Flo Milli) with shuffle, next/prev skip, auto-play queue,
 * plus cozy lo-fi synth chords for offline/ambient mode.
 */
export class AudioManager {
  private ctx: AudioContext | null = null;
  private muted: boolean;
  private currentMood: MoodId;
  private chordIndex = 0;
  private loopTimer: number | null = null;
  private started = false;
  private streamElement: HTMLAudioElement | null = null;

  // Real MP3 Playlist Engine
  private trackIndex = 0;
  private shuffleEnabled = true;
  private isUserPlaying = true;
  private statusListeners: Array<(info: TrackStatusInfo) => void> = [];

  constructor(initialMuted = false, initialMood: MoodId = 'fitzroy-gold') {
    this.muted = initialMuted;
    this.currentMood = initialMood;
  }

  private initAudioElement(): HTMLAudioElement {
    if (!this.streamElement) {
      this.streamElement = new Audio();
      this.streamElement.crossOrigin = 'anonymous';
      this.streamElement.volume = 0.8;
      this.streamElement.onended = () => {
        this.nextTrack();
      };
      this.streamElement.onerror = () => {
        // If an audio file fails to load, gracefully step to next
        setTimeout(() => this.nextTrack(), 1000);
      };
    }
    return this.streamElement;
  }

  public unlockOnUserGesture(): void {
    if (!this.ctx) {
      const AudioCtx =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    if (!this.started) {
      this.started = true;
      this.startAmbientLoop();
      // Start the MP3 soundtrack!
      this.playTrack(this.trackIndex);
    }
    if (this.streamElement && !this.muted && this.isUserPlaying) {
      this.streamElement.play().catch(() => {});
    }
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(muted: boolean): void {
    this.muted = muted;
    if (this.streamElement) {
      this.streamElement.muted = muted;
      if (muted) {
        this.streamElement.pause();
      } else if (this.isUserPlaying) {
        this.streamElement.play().catch(() => {});
      }
    }
    if (!muted) {
      this.unlockOnUserGesture();
    }
    this.notifyStatus();
  }

  public toggleMute(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  // --- Playlist & Track Controls ---
  public playTrack(index: number): void {
    if (index < 0 || index >= MELBOURNE_PLAYLIST.length) {
      index = 0;
    }
    this.trackIndex = index;
    const track = MELBOURNE_PLAYLIST[index];
    const audio = this.initAudioElement();

    try {
      audio.src = track.url;
      audio.muted = this.muted;
      audio.currentTime = 0;
      this.isUserPlaying = true;
      if (!this.muted) {
        audio.play().catch(() => {
          // Playback blocked until user gesture
        });
      }
    } catch {
      // Audio playback exception
    }
    this.notifyStatus();
  }

  public nextTrack(): void {
    if (this.shuffleEnabled && MELBOURNE_PLAYLIST.length > 1) {
      let nextIdx = this.trackIndex;
      while (nextIdx === this.trackIndex) {
        nextIdx = Math.floor(Math.random() * MELBOURNE_PLAYLIST.length);
      }
      this.playTrack(nextIdx);
    } else {
      const nextIdx = (this.trackIndex + 1) % MELBOURNE_PLAYLIST.length;
      this.playTrack(nextIdx);
    }
  }

  public prevTrack(): void {
    const prevIdx =
      (this.trackIndex - 1 + MELBOURNE_PLAYLIST.length) %
      MELBOURNE_PLAYLIST.length;
    this.playTrack(prevIdx);
  }

  public togglePlayPause(): boolean {
    this.unlockOnUserGesture();
    const audio = this.initAudioElement();
    if (this.isUserPlaying && !audio.paused) {
      audio.pause();
      this.isUserPlaying = false;
    } else {
      audio.play().catch(() => {});
      this.isUserPlaying = true;
      this.muted = false;
    }
    this.notifyStatus();
    return this.isUserPlaying;
  }

  public toggleShuffle(): boolean {
    this.shuffleEnabled = !this.shuffleEnabled;
    this.notifyStatus();
    return this.shuffleEnabled;
  }

  public getTrackStatus(): TrackStatusInfo {
    const track = MELBOURNE_PLAYLIST[this.trackIndex] || MELBOURNE_PLAYLIST[0];
    const isPlaying =
      this.isUserPlaying &&
      !this.muted &&
      Boolean(this.streamElement && !this.streamElement.paused);
    return {
      track,
      index: this.trackIndex,
      total: MELBOURNE_PLAYLIST.length,
      isPlaying,
      isShuffle: this.shuffleEnabled,
      isMuted: this.muted,
    };
  }

  public subscribeStatus(listener: (info: TrackStatusInfo) => void): () => void {
    this.statusListeners.push(listener);
    listener(this.getTrackStatus());
    return () => {
      this.statusListeners = this.statusListeners.filter((l) => l !== listener);
    };
  }

  private notifyStatus(): void {
    const info = this.getTrackStatus();
    for (const listener of this.statusListeners) {
      try {
        listener(info);
      } catch {
        // Listener error
      }
    }
  }

  public setMood(mood: MoodId): void {
    this.currentMood = mood;
    this.chordIndex = 0;
    this.unlockOnUserGesture();
    this.playVinylDrop();
  }

  public getMood(): MoodId {
    return this.currentMood;
  }

  private startAmbientLoop(): void {
    if (this.loopTimer !== null) window.clearInterval(this.loopTimer);

    const stepChord = () => {
      if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
      const chords = MOOD_CHORDS[this.currentMood] ?? MOOD_CHORDS['fitzroy-gold'];
      const notes = chords[this.chordIndex % chords.length];
      this.chordIndex++;

      const now = this.ctx.currentTime;
      const waveType: OscillatorType =
        this.currentMood === 'daydream-grande' ? 'triangle' : 'sine';

      notes.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.value =
          this.currentMood === 'velvet-scientist' ? 900 : 1450;

        osc.type = waveType;
        osc.frequency.setValueAtTime(freq, now + idx * 0.055);
        const peak = idx === 0 ? 0.022 : 0.014;
        gain.gain.setValueAtTime(0.0001, now + idx * 0.055);
        gain.gain.linearRampToValueAtTime(peak, now + idx * 0.055 + 0.25);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + 3.4);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start(now + idx * 0.055);
        osc.stop(now + 3.5);
      });

      // Sparkling upper bell note for Ariana daydream mood
      if (this.currentMood === 'daydream-grande' && notes[4]) {
        const bell = this.ctx.createOscillator();
        const bGain = this.ctx.createGain();
        bell.type = 'sine';
        bell.frequency.setValueAtTime(notes[4] * 2, now + 0.65);
        bGain.gain.setValueAtTime(0.0001, now + 0.65);
        bGain.gain.linearRampToValueAtTime(0.011, now + 0.72);
        bGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.1);
        bell.connect(bGain);
        bGain.connect(this.ctx.destination);
        bell.start(now + 0.65);
        bell.stop(now + 2.2);
      }
    };

    stepChord();
    this.loopTimer = window.setInterval(stepChord, 3600);
  }

  public playInteractChime(): void {
    this.unlockOnUserGesture();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    [523.25, 659.25].forEach((freq, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.075);
      gain.gain.setValueAtTime(0.001, now + i * 0.075);
      gain.gain.linearRampToValueAtTime(0.05, now + i * 0.075 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0008, now + i * 0.075 + 0.34);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.075);
      osc.stop(now + i * 0.075 + 0.36);
    });
  }

  public playTramBell(): void {
    this.unlockOnUserGesture();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Iconic Melbourne W-Class double brass ding-ding!
    [0, 0.2].forEach((offset) => {
      if (!this.ctx) return;
      [1174.66, 2349.32].forEach((freq, hIdx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + offset);
        gain.gain.setValueAtTime(0.001, now + offset);
        gain.gain.linearRampToValueAtTime(
          hIdx === 0 ? 0.055 : 0.024,
          now + offset + 0.01
        );
        gain.gain.exponentialRampToValueAtTime(0.0005, now + offset + 0.52);
        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(now + offset);
        osc.stop(now + offset + 0.55);
      });
    });
  }

  public playSunnyBark(): void {
    this.unlockOnUserGesture();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Friendly cheerful golden retriever double yip
    [0, 0.15].forEach((t, idx) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'triangle';
      const base = idx === 0 ? 370 : 430;
      osc.frequency.setValueAtTime(base, now + t);
      osc.frequency.exponentialRampToValueAtTime(base * 1.38, now + t + 0.05);
      osc.frequency.exponentialRampToValueAtTime(base * 0.78, now + t + 0.11);
      gain.gain.setValueAtTime(0.001, now + t);
      gain.gain.linearRampToValueAtTime(0.055, now + t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + t + 0.12);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + t);
      osc.stop(now + t + 0.13);
    });
  }

  public playDialogueBlip(speaker: 'Adi' | 'Damini' | 'Together' | 'Sunny'): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    const base =
      speaker === 'Adi'
        ? 310
        : speaker === 'Damini'
          ? 440
          : speaker === 'Sunny'
            ? 520
            : 392;
    osc.frequency.setValueAtTime(base, now);
    gain.gain.setValueAtTime(0.022, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.09);
  }

  public playVinylDrop(): void {
    if (this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const now = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.exponentialRampToValueAtTime(58, now + 0.12);
    gain.gain.setValueAtTime(0.035, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.14);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(now);
    osc.stop(now + 0.15);
  }

  public playArcadeSFX(kind: 'flip' | 'match' | 'bat-hit' | 'win' | 'miss'): void {
    this.unlockOnUserGesture();
    if (this.muted || !this.ctx) return;
    const now = this.ctx.currentTime;
    const notes =
      kind === 'win'
        ? [523.25, 659.25, 783.99, 1046.5]
        : kind === 'match'
          ? [587.33, 880]
          : kind === 'bat-hit'
            ? [240, 660]
            : kind === 'miss'
              ? [220, 165]
              : [480];

    notes.forEach((f, i) => {
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = kind === 'bat-hit' ? 'square' : 'triangle';
      osc.frequency.setValueAtTime(f, now + i * 0.065);
      gain.gain.setValueAtTime(0.038, now + i * 0.065);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.065 + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(now + i * 0.065);
      osc.stop(now + i * 0.065 + 0.19);
    });
  }

  public dispose(): void {
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    if (this.ctx) {
      this.ctx.close().catch(() => {});
      this.ctx = null;
    }
  }
}
