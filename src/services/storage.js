import { Platform } from 'react-native';

const PIN_KEY = 'phantom_pin';
const SETTINGS_KEY = 'phantom_settings';
const SERVER_KEY = 'phantom_server_url';

const DEFAULT_SETTINGS = {
  disappearingMessages: false,
  disappearTimer: 30,
  screenSecurity: true,
  notificationPreview: false,
};

// Use localStorage on web, SecureStore on native
let SecureStore = null;

const webStorage = {
  getItemAsync: async (key) => {
    try { return localStorage.getItem(key); } catch { return null; }
  },
  setItemAsync: async (key, value) => {
    try { localStorage.setItem(key, value); } catch {}
  },
  deleteItemAsync: async (key) => {
    try { localStorage.removeItem(key); } catch {}
  },
};

const getStore = async () => {
  if (Platform.OS === 'web') return webStorage;
  if (!SecureStore) {
    SecureStore = await import('expo-secure-store');
  }
  return SecureStore;
};

class StorageService {
  async setPin(pin) {
    const store = await getStore();
    await store.setItemAsync(PIN_KEY, pin);
  }

  async getPin() {
    const store = await getStore();
    return await store.getItemAsync(PIN_KEY);
  }

  async hasPin() {
    const store = await getStore();
    const pin = await store.getItemAsync(PIN_KEY);
    return pin !== null;
  }

  async verifyPin(input) {
    const store = await getStore();
    const stored = await store.getItemAsync(PIN_KEY);
    return stored === input;
  }

  async removePin() {
    const store = await getStore();
    await store.deleteItemAsync(PIN_KEY);
  }

  async getSettings() {
    try {
      const store = await getStore();
      const stored = await store.getItemAsync(SETTINGS_KEY);
      if (stored) {
        return { ...DEFAULT_SETTINGS, ...JSON.parse(stored) };
      }
    } catch (e) {}
    return { ...DEFAULT_SETTINGS };
  }

  async saveSettings(settings) {
    const store = await getStore();
    await store.setItemAsync(SETTINGS_KEY, JSON.stringify(settings));
  }

  async getServerUrl() {
    try {
      const store = await getStore();
      return await store.getItemAsync(SERVER_KEY);
    } catch {
      return null;
    }
  }

  async saveServerUrl(url) {
    const store = await getStore();
    await store.setItemAsync(SERVER_KEY, url);
  }
}

export default new StorageService();
