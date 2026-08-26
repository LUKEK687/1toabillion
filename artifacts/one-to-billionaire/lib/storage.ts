import AsyncStorage from '@react-native-async-storage/async-storage';

export const KEYS = {
  GAME_STATE: 'one_to_billionaire_game_state',
  GLOBAL_STATS: 'one_to_billionaire_global_stats',
  SETTINGS: 'one_to_billionaire_settings',
};

export const clearAllData = async () => {
  await AsyncStorage.multiRemove([KEYS.GAME_STATE, KEYS.GLOBAL_STATS, KEYS.SETTINGS]);
};
