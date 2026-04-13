import { Platform } from 'react-native';
import nacl from 'tweetnacl';
import {
  encodeBase64,
  decodeBase64,
  encodeUTF8,
  decodeUTF8,
} from 'tweetnacl-util';

const KEYS_STORAGE_KEY = 'phantom_keypair';

class CryptoService {
  constructor() {
    this.keyPair = null;
    this.sharedKey = null;
    this.peerPublicKey = null;
  }

  async _getStore() {
    if (Platform.OS === 'web') {
      return {
        getItemAsync: async (key) => localStorage.getItem(key),
        setItemAsync: async (key, val) => localStorage.setItem(key, val),
      };
    }
    return await import('expo-secure-store');
  }

  async init() {
    try {
      const store = await this._getStore();
      const stored = await store.getItemAsync(KEYS_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        this.keyPair = {
          publicKey: decodeBase64(parsed.publicKey),
          secretKey: decodeBase64(parsed.secretKey),
        };
      } else {
        this.keyPair = nacl.box.keyPair();
        await store.setItemAsync(
          KEYS_STORAGE_KEY,
          JSON.stringify({
            publicKey: encodeBase64(this.keyPair.publicKey),
            secretKey: encodeBase64(this.keyPair.secretKey),
          })
        );
      }
    } catch (e) {
      this.keyPair = nacl.box.keyPair();
    }
  }

  getPublicKey() {
    return encodeBase64(this.keyPair.publicKey);
  }

  setPeerPublicKey(base64Key) {
    this.peerPublicKey = decodeBase64(base64Key);
    this.sharedKey = nacl.box.before(this.peerPublicKey, this.keyPair.secretKey);
  }

  encrypt(message) {
    if (!this.sharedKey) throw new Error('No shared key established');
    const nonce = nacl.randomBytes(nacl.box.nonceLength);
    const messageBytes = decodeUTF8(message);
    const encrypted = nacl.box.after(messageBytes, nonce, this.sharedKey);
    return JSON.stringify({
      nonce: encodeBase64(nonce),
      cipher: encodeBase64(encrypted),
    });
  }

  decrypt(encryptedData) {
    if (!this.sharedKey) throw new Error('No shared key established');
    try {
      const { nonce, cipher } = JSON.parse(encryptedData);
      const decrypted = nacl.box.open.after(
        decodeBase64(cipher),
        decodeBase64(nonce),
        this.sharedKey
      );
      if (!decrypted) return null;
      return encodeUTF8(decrypted);
    } catch (e) {
      return null;
    }
  }

  static generateRoomCode() {
    const bytes = nacl.randomBytes(4);
    const code = Array.from(bytes)
      .map((b) => b.toString(16).padStart(2, '0'))
      .join('')
      .toUpperCase();
    return code;
  }

  async resetKeys() {
    this.keyPair = nacl.box.keyPair();
    this.sharedKey = null;
    this.peerPublicKey = null;
    const store = await this._getStore();
    await store.setItemAsync(
      KEYS_STORAGE_KEY,
      JSON.stringify({
        publicKey: encodeBase64(this.keyPair.publicKey),
        secretKey: encodeBase64(this.keyPair.secretKey),
      })
    );
  }
}

export default new CryptoService();
