import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppSettings, DownloadedItem } from '../types/media';

const KEYS = {
  HISTORY: '@mediafetch/history_v1',
  SETTINGS: '@mediafetch/settings_v1',
} as const;

export const DEFAULT_SETTINGS: AppSettings = {
  defaultFormat: 'mp4',
  defaultVideoQuality: '720',
  defaultAudioQuality: '192',
  autoAnalyzeOnPaste: true,
  useBrowserCookies: true,
  updateChannel: 'stable',
};

export const storageService = {
  async loadHistory(): Promise<DownloadedItem[]> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.HISTORY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  },

  async saveHistory(items: DownloadedItem[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.HISTORY, JSON.stringify(items.slice(0, 150)));
    } catch {
      // Ignore non-fatal storage errors
    }
  },

  async loadSettings(): Promise<AppSettings> {
    try {
      const raw = await AsyncStorage.getItem(KEYS.SETTINGS);
      if (!raw) {
        return DEFAULT_SETTINGS;
      }
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  },

  async saveSettings(settings: AppSettings): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
    } catch {
      // Ignore non-fatal storage errors
    }
  },
};
