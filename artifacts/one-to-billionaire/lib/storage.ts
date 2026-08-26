import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  GAME_STATE: 'one_to_billionaire_game_state',
  GLOBAL_STATS: 'one_to_billionaire_global_stats',
  SETTINGS: 'one_to_billionaire_settings',
};

export const SAVE_VERSION = 2;
/** Storage migration is deliberately non-destructive and accepts pre-versioned saves. */
export const migrateSave = <T extends Record<string, unknown>>(raw: T): T & { version: number; holdings: Record<string, { id: string; level: number }> } => {
  const legacyBusinesses = Array.isArray(raw.businesses) ? raw.businesses.filter((id): id is string => typeof id === 'string') : [];
  const supplied = raw.holdings && typeof raw.holdings === 'object' ? raw.holdings as Record<string, { id?: string; level?: number }> : {};
  const holdings = Object.keys(supplied).reduce<Record<string, { id: string; level: number }>>((all, id) => {
    const holding = supplied[id];
    all[id] = { id, level: Math.max(1, Math.floor(holding.level || 1)) };
    return all;
  }, {});
  legacyBusinesses.forEach((id) => { if (!holdings[id]) holdings[id] = { id, level: 1 }; });
  return { ...raw, version: SAVE_VERSION, businesses: Object.keys(holdings), holdings };
};

export const clearAllData = async () => {
  await AsyncStorage.multiRemove([KEYS.GAME_STATE, KEYS.GLOBAL_STATS, KEYS.SETTINGS]);
};
