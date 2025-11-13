/**
 * Cliente WebSocket opcional com reconexão exponencial
 * Para multiplayer ou comunicação com servidor
 */

export interface WSClient {
  connect(): void;
  disconnect(): void;
  send(data: object): void;
  on(callback: (data: any) => void): void;
  isConnected(): boolean;
}

/**
 * Cria um cliente WebSocket com reconexão automática
 */
export function createWSClient(url: string): WSClient {
  let ws: WebSocket | null = null;
  let reconnectAttempts = 0;
  let maxReconnectDelay = 30000; // 30s max
  let reconnectTimer: number | null = null;
  let messageCallback: ((data: any) => void) | null = null;
  let shouldReconnect = true;

  /**
   * Calcula delay de reconexão exponencial
   */
  function getReconnectDelay(): number {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay);
    return delay + Math.random() * 1000; // Jitter
  }

  /**
   * Conecta ao servidor WebSocket
   */
  function connect() {
    if (ws && (ws.readyState === WebSocket.CONNECTING || ws.readyState === WebSocket.OPEN)) {
      return;
    }

    try {
      console.log('[WS] Connecting to', url);
      ws = new WebSocket(url);

      ws.onopen = () => {
        console.log('[WS] Connected');
        reconnectAttempts = 0;
        if (reconnectTimer) {
          clearTimeout(reconnectTimer);
          reconnectTimer = null;
        }
      };

      ws.onmessage = event => {
        try {
          const data = JSON.parse(event.data);
          if (messageCallback) {
            messageCallback(data);
          }
        } catch (err) {
          console.error('[WS] Failed to parse message:', err);
        }
      };

      ws.onerror = error => {
        console.error('[WS] Error:', error);
      };

      ws.onclose = () => {
        console.log('[WS] Disconnected');
        ws = null;

        // Reconexão automática
        if (shouldReconnect) {
          const delay = getReconnectDelay();
          console.log(`[WS] Reconnecting in ${(delay / 1000).toFixed(1)}s...`);

          reconnectTimer = window.setTimeout(() => {
            reconnectAttempts++;
            connect();
          }, delay);
        }
      };
    } catch (err) {
      console.error('[WS] Failed to create WebSocket:', err);
    }
  }

  /**
   * Desconecta do servidor
   */
  function disconnect() {
    shouldReconnect = false;
    if (reconnectTimer) {
      clearTimeout(reconnectTimer);
      reconnectTimer = null;
    }
    if (ws) {
      ws.close();
      ws = null;
    }
  }

  /**
   * Envia mensagem JSON para o servidor
   */
  function send(data: object) {
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    } else {
      console.warn('[WS] Cannot send: not connected');
    }
  }

  /**
   * Registra callback para mensagens recebidas
   */
  function on(callback: (data: any) => void) {
    messageCallback = callback;
  }

  /**
   * Verifica se está conectado
   */
  function isConnected(): boolean {
    return ws !== null && ws.readyState === WebSocket.OPEN;
  }

  return {
    connect,
    disconnect,
    send,
    on,
    isConnected,
  };
}

/**
 * Exemplo de uso (comentado):
 *
 * const client = createWSClient('ws://localhost:8080');
 *
 * client.on(data => {
 *   console.log('Received:', data);
 *   if (data.type === 'player_update') {
 *     // Atualiza posição de outros players
 *   }
 * });
 *
 * client.connect();
 *
 * // Enviar posição do player
 * client.send({
 *   type: 'player_position',
 *   x: player.pos.x,
 *   y: player.pos.y,
 * });
 */

