import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { KEYS } from '../lib/storage';
import { SoundManager } from '../services/SoundManager';

export interface Settings {
  music: boolean;
  sounds: boolean;
  haptics: boolean;
  reducedMotion: boolean;
}

interface SettingsContextType {
  settings: Settings;
  updateSettings: (newSettings: Partial<Settings>) => void;
}

const defaultSettings: Settings = {
  music: true,
  sounds: true,
  haptics: true,
  reducedMotion: false,
};

const SettingsContext = createContext<SettingsContextType | null>(null);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<Settings>(defaultSettings);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const data = await AsyncStorage.getItem(KEYS.SETTINGS);
        if (data) {
          const parsed: unknown = JSON.parse(data);
          if (parsed && typeof parsed === 'object') {
            // Merge instead of replacing so saved settings from before audio controls
            // were added retain their values and receive the new defaults.
            const saved = parsed as Partial<Settings>;
            const migrated: Settings = {
              music: typeof saved.music === 'boolean' ? saved.music : defaultSettings.music,
              sounds: typeof saved.sounds === 'boolean' ? saved.sounds : defaultSettings.sounds,
              haptics: typeof saved.haptics === 'boolean' ? saved.haptics : defaultSettings.haptics,
              reducedMotion: typeof saved.reducedMotion === 'boolean'
                ? saved.reducedMotion
                : defaultSettings.reducedMotion,
            };
            setSettings(migrated);
            SoundManager.configure(migrated);
          } else {
            SoundManager.configure(defaultSettings);
          }
        } else {
          SoundManager.configure(defaultSettings);
        }
      } catch {
        // Corrupt local preferences should never block the app from opening.
        SoundManager.configure(defaultSettings);
      } finally {
        setLoaded(true);
      }
    };
    loadSettings();

    return () => SoundManager.cleanup();
  }, []);

  const updateSettings = (newSettings: Partial<Settings>) => {
    const updated = { ...settings, ...newSettings };
    setSettings(updated);
    SoundManager.configure(updated);
    AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated)).catch(() => {
      // The in-memory setting still applies if device storage is unavailable.
    });
  };

  const value = useMemo(() => ({ settings, updateSettings }), [settings]);

  if (!loaded) return null;

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used within a SettingsProvider');
  return ctx;
};
