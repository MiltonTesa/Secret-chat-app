const { WebSocketServer } = require('ws');
const http = require('http');
const url = require('url');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 3000;
const rooms = new Map();

// Serve the web app and handle WebSocket connections on the same port
const DIST_DIR = path.join(__dirname, '..', 'dist');

const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'application/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
};

const server = http.createServer((req, res) => {
  // Serve static files from dist folder
  let filePath = req.url === '/' ? '/index.html' : req.url;
  // Remove query strings
  filePath = filePath.split('?')[0];
  const fullPath = path.join(DIST_DIR, filePath);

  // Security: prevent path traversal
  if (!fullPath.startsWith(DIST_DIR)) {
    res.writeHead(403);
    res.end('Forbidden');
    return;
  }

  fs.readFile(fullPath, (err, data) => {
    if (err) {
      // Fallback to index.html for SPA routing
      fs.readFile(path.join(DIST_DIR, 'index.html'), (err2, indexData) => {
        if (err2) {
          res.writeHead(404);
          res.end('Not found');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(indexData);
      });
      return;
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(data);
  });
});

const wss = new WebSocketServer({ server });

wss.on('connection', (ws, req) => {
  const params = url.parse(req.url, true).query;
  const roomCode = params.room;

  if (!roomCode) {
    ws.close(4001, 'Room code required');
    return;
  }

  if (!rooms.has(roomCode)) {
    rooms.set(roomCode, new Set());
  }
  const room = rooms.get(roomCode);

  if (room.size >= 2) {
    ws.close(4002, 'Room is full');
    return;
  }

  room.add(ws);
  ws.roomCode = roomCode;

  console.log(`[+] Peer joined room ${roomCode} (${room.size}/2)`);

  for (const peer of room) {
    if (peer !== ws && peer.readyState === 1) {
      peer.send(JSON.stringify({ type: 'peer_joined' }));
    }
  }

  ws.on('message', (data) => {
    const room = rooms.get(ws.roomCode);
    if (!room) return;

    for (const peer of room) {
      if (peer !== ws && peer.readyState === 1) {
        peer.send(data.toString());
      }
    }
  });

  ws.on('close', () => {
    const room = rooms.get(ws.roomCode);
    if (room) {
      room.delete(ws);
      console.log(`[-] Peer left room ${ws.roomCode} (${room.size}/2)`);

      for (const peer of room) {
        if (peer.readyState === 1) {
          peer.send(JSON.stringify({ type: 'peer_left' }));
        }
      }

      if (room.size === 0) {
        rooms.delete(ws.roomCode);
        console.log(`[x] Room ${ws.roomCode} deleted`);
      }
    }
  });

  ws.on('error', () => {});
});

// Cleanup stale rooms every 5 minutes
setInterval(() => {
  for (const [code, room] of rooms) {
    for (const ws of room) {
      if (ws.readyState > 1) room.delete(ws);
    }
    if (room.size === 0) rooms.delete(code);
  }
}, 5 * 60 * 1000);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`
  ╔══════════════════════════════════════════╗
  ║       PHANTOM RELAY SERVER               ║
  ║                                          ║
  ║  Running on port ${String(PORT).padEnd(24)}║
  ║  Web app + relay on same port!           ║
  ║  No messages stored. No logs kept.       ║
  ╚══════════════════════════════════════════╝

  Local:   http://localhost:${PORT}
  `);
});
