import cryptoService from './crypto';

class ConnectionService {
  constructor() {
    this.ws = null;
    this.roomCode = null;
    this.isHost = false;
    this.onMessage = null;
    this.onPeerJoined = null;
    this.onPeerLeft = null;
    this.onConnected = null;
    this.onDisconnected = null;
    this.onError = null;
    this.reconnectTimer = null;
    this.serverUrl = null;
    this.peerConnected = false;
  }

  connect(serverUrl, roomCode, isHost) {
    this.serverUrl = serverUrl;
    this.roomCode = roomCode;
    this.isHost = isHost;

    return new Promise((resolve, reject) => {
      try {
        const wsUrl = serverUrl.replace(/^http/, 'ws');
        this.ws = new WebSocket(`${wsUrl}?room=${roomCode}`);

        const timeout = setTimeout(() => {
          reject(new Error('Connection timeout'));
          this.ws?.close();
        }, 10000);

        this.ws.onopen = () => {
          clearTimeout(timeout);
          // Send our public key for key exchange
          this.ws.send(
            JSON.stringify({
              type: 'key_exchange',
              publicKey: cryptoService.getPublicKey(),
            })
          );
          this.onConnected?.();
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            this._handleMessage(data);
          } catch (e) {
            // Ignore malformed messages
          }
        };

        this.ws.onclose = () => {
          this.peerConnected = false;
          this.onDisconnected?.();
          this._scheduleReconnect();
        };

        this.ws.onerror = (error) => {
          clearTimeout(timeout);
          this.onError?.(error);
          reject(new Error('Connection failed'));
        };
      } catch (e) {
        reject(e);
      }
    });
  }

  _handleMessage(data) {
    switch (data.type) {
      case 'key_exchange':
        cryptoService.setPeerPublicKey(data.publicKey);
        this.peerConnected = true;
        this.onPeerJoined?.();
        break;

      case 'encrypted_message':
        const decrypted = cryptoService.decrypt(data.payload);
        if (decrypted) {
          try {
            const msg = JSON.parse(decrypted);
            this.onMessage?.(msg);
          } catch {
            this.onMessage?.({ text: decrypted, timestamp: Date.now() });
          }
        }
        break;

      case 'peer_joined':
        // New peer in room, send our key
        this.ws?.send(
          JSON.stringify({
            type: 'key_exchange',
            publicKey: cryptoService.getPublicKey(),
          })
        );
        break;

      case 'peer_left':
        this.peerConnected = false;
        this.onPeerLeft?.();
        break;

      case 'error':
        this.onError?.(new Error(data.message));
        break;
    }
  }

  sendMessage(messageObj) {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      throw new Error('Not connected');
    }
    if (!this.peerConnected) {
      throw new Error('Peer not connected');
    }

    const encrypted = cryptoService.encrypt(JSON.stringify(messageObj));
    this.ws.send(
      JSON.stringify({
        type: 'encrypted_message',
        payload: encrypted,
      })
    );
  }

  sendTypingIndicator(isTyping) {
    if (this.ws?.readyState === WebSocket.OPEN && this.peerConnected) {
      const encrypted = cryptoService.encrypt(
        JSON.stringify({ type: 'typing', isTyping })
      );
      this.ws.send(
        JSON.stringify({
          type: 'encrypted_message',
          payload: encrypted,
        })
      );
    }
  }

  _scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      if (this.serverUrl && this.roomCode) {
        this.connect(this.serverUrl, this.roomCode, this.isHost).catch(() => {});
      }
    }, 3000);
  }

  disconnect() {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.serverUrl = null;
    this.roomCode = null;
    this.peerConnected = false;
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
    }
  }
}

export default new ConnectionService();
