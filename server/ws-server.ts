/**
 * Servidor WebSocket de exemplo para testes locais
 * Uso: node --loader ts-node/esm server/ws-server.ts
 * Ou compile com tsc e rode: node server/ws-server.js
 */

import { WebSocketServer, WebSocket } from 'ws';

const PORT = 8080;

const wss = new WebSocketServer({ port: PORT });

console.log(`[WS Server] Listening on ws://localhost:${PORT}`);

// Sala simples: broadcast para todos os clientes
const clients = new Set<WebSocket>();

wss.on('connection', (ws: WebSocket) => {
  console.log('[WS Server] Client connected');
  clients.add(ws);

  ws.on('message', (data: Buffer) => {
    try {
      const message = JSON.parse(data.toString());
      console.log('[WS Server] Received:', message);

      // Ecoa para todos os outros clientes
      const response = JSON.stringify({
        type: 'broadcast',
        data: message,
        timestamp: Date.now(),
      });

      clients.forEach(client => {
        if (client !== ws && client.readyState === WebSocket.OPEN) {
          client.send(response);
        }
      });
    } catch (err) {
      console.error('[WS Server] Invalid message:', err);
    }
  });

  ws.on('close', () => {
    console.log('[WS Server] Client disconnected');
    clients.delete(ws);
  });

  ws.on('error', err => {
    console.error('[WS Server] Error:', err);
  });

  // Mensagem de boas-vindas
  ws.send(JSON.stringify({ type: 'welcome', message: 'Connected to game server' }));
});

wss.on('error', err => {
  console.error('[WS Server] Server error:', err);
});

process.on('SIGINT', () => {
  console.log('\n[WS Server] Shutting down...');
  wss.close(() => {
    process.exit(0);
  });
});

