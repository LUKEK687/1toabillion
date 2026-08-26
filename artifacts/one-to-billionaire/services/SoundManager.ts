import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';
import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';

export type SoundName =
  | 'tap' | 'swipe' | 'gain' | 'loss' | 'coins' | 'purchase' | 'sale'
  | 'income' | 'upgrade' | 'mysteryShake' | 'mysteryReveal' | 'rare'
  | 'wheelSpin' | 'wheelStop' | 'perfect' | 'miss' | 'achievement'
  | 'world' | 'jackpot' | 'bankruptcy' | 'millionaire' | 'billionaire';

type AudioPreferences = { music: boolean; sounds: boolean; haptics: boolean };
type HapticKind = 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error';
type Player = ReturnType<typeof createAudioPlayer>;

const tap = require('../assets/sounds/tap.wav');
const coin = require('../assets/sounds/coin.wav');
const gain = require('../assets/sounds/gain.wav');
const loss = require('../assets/sounds/loss.wav');
const spin = require('../assets/sounds/spin.wav');
const reveal = require('../assets/sounds/reveal.wav');
const jackpot = require('../assets/sounds/jackpot.wav');
const alert = require('../assets/sounds/alert.wav');
const musicLoop = require('../assets/sounds/music-loop.wav');

/** Locally generated placeholder tones. Swap these requires for final mastered assets later. */
export const SOUND_ASSET_REGISTRY: Record<SoundName, number> = {
  tap, swipe: tap, gain, loss, coins: coin, purchase: coin, sale: gain,
  income: coin, upgrade: reveal, mysteryShake: spin, mysteryReveal: reveal,
  rare: jackpot, wheelSpin: spin, wheelStop: reveal, perfect: gain, miss: loss,
  achievement: reveal, world: alert, jackpot, bankruptcy: loss,
  millionaire: jackpot, billionaire: jackpot,
};

const HAPTIC_FOR_SOUND: Record<SoundName, HapticKind> = {
  tap: 'light', swipe: 'light', gain: 'success', loss: 'warning', coins: 'light',
  purchase: 'medium', sale: 'medium', income: 'success', upgrade: 'success',
  mysteryShake: 'light', mysteryReveal: 'medium', rare: 'success', wheelSpin: 'light',
  wheelStop: 'medium', perfect: 'success', miss: 'warning', achievement: 'success',
  world: 'heavy', jackpot: 'heavy', bankruptcy: 'error', millionaire: 'heavy',
  billionaire: 'heavy',
};

const MIN_REPLAY_MS = 80;
let preferences: AudioPreferences = { music: true, sounds: true, haptics: true };
let isMusicDucked = false;
let cleanedUp = false;
let musicPlayer: Player | null = null;
const players = new Map<SoundName, Player>();
const lastPlayedAt = new Map<SoundName, number>();

void setAudioModeAsync({
  playsInSilentMode: true,
  shouldPlayInBackground: false,
  interruptionMode: 'doNotMix',
}).catch(() => undefined);

function triggerHaptic(kind: HapticKind) {
  if (!preferences.haptics || Platform.OS === 'web') return;
  const action = kind === 'success'
    ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)
    : kind === 'warning'
      ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
      : kind === 'error'
        ? Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error)
        : Haptics.impactAsync(
            kind === 'heavy'
              ? Haptics.ImpactFeedbackStyle.Heavy
              : kind === 'medium'
                ? Haptics.ImpactFeedbackStyle.Medium
                : Haptics.ImpactFeedbackStyle.Light,
          );
  void action.catch(() => undefined);
}

function getPlayer(name: SoundName) {
  const existing = players.get(name);
  if (existing) return existing;
  const player = createAudioPlayer(SOUND_ASSET_REGISTRY[name], { keepAudioSessionActive: true });
  player.volume = name === 'jackpot' || name === 'billionaire' ? 0.65 : 0.42;
  players.set(name, player);
  return player;
}

function updateMusicVolume() {
  if (musicPlayer) musicPlayer.volume = isMusicDucked ? 0.025 : 0.09;
}

export const SoundManager = {
  configure(next: Partial<AudioPreferences>) {
    const previousMusic = preferences.music;
    preferences = { ...preferences, ...next };
    cleanedUp = false;
    if (!preferences.music) this.stopMusic();
    else if (!previousMusic) this.startMusic();
  },

  play(name: SoundName) {
    const now = Date.now();
    if ((lastPlayedAt.get(name) ?? 0) + MIN_REPLAY_MS > now) return;
    lastPlayedAt.set(name, now);
    triggerHaptic(HAPTIC_FOR_SOUND[name]);
    if (!preferences.sounds || cleanedUp) return;
    const major = ['world', 'jackpot', 'bankruptcy', 'millionaire', 'billionaire'].includes(name);
    if (major) {
      this.setMusicDucked(true);
      setTimeout(() => this.setMusicDucked(false), 1200);
    }
    try {
      const player = getPlayer(name);
      void player.seekTo(0).then(() => player.play()).catch(() => undefined);
    } catch {
      // Audio feedback must never interrupt the game loop.
    }
  },

  startMusic() {
    if (!preferences.music || cleanedUp) return;
    try {
      if (!musicPlayer) {
        musicPlayer = createAudioPlayer(musicLoop, { keepAudioSessionActive: true });
        musicPlayer.loop = true;
      }
      updateMusicVolume();
      musicPlayer.play();
    } catch {
      // Expo Go/web can briefly reject autoplay; the next interaction retries.
    }
  },

  stopMusic() {
    try { musicPlayer?.pause(); } catch { /* no-op */ }
  },

  setMusicDucked(ducked: boolean) {
    isMusicDucked = ducked;
    updateMusicVolume();
  },

  get musicDucked() { return isMusicDucked; },

  cleanup() {
    cleanedUp = true;
    isMusicDucked = false;
    for (const player of players.values()) {
      try { player.remove(); } catch { /* no-op */ }
    }
    players.clear();
    try { musicPlayer?.remove(); } catch { /* no-op */ }
    musicPlayer = null;
    lastPlayedAt.clear();
  },
};