/**
 * Chat Client Service
 * Gerencia conexão Socket.IO e eventos de chat
 * Guardian Grove Client
 */

import { io, Socket } from 'socket.io-client';
import type { ChatMessage } from '../types';

const CHAT_COLORS = {
  global: '#FFFFFF',      // branco
  group: '#AAD372',       // verde
  trade: '#FFC864',       // laranja/amarelo
  whisper: '#FF7FD4',     // rosa
  system: '#FFFF00',      // amarelo
  error: '#FF0000',       // vermelho
};

let socket: Socket | null = null;
let isConnected = false;

// Callbacks
const messageCallbacks: ((msg: ChatMessage) => void)[] = [];
const historyCallbacks: ((data: { channel: string; messages: ChatMessage[] }) => void)[] = [];
const userJoinedCallbacks: ((data: { username: string; timestamp: number }) => void)[] = [];
const userLeftCallbacks: ((data: { username: string; timestamp: number }) => void)[] = [];
const friendOnlineCallbacks: ((data: { username: string }) => void)[] = [];
const friendOfflineCallbacks: ((data: { username: string }) => void)[] = [];
const friendUpdateCallbacks: ((data: { type: string; data?: any; timestamp: number }) => void)[] = [];
const errorCallbacks: ((error: { message: string }) => void)[] = [];
const connectCallbacks: (() => void)[] = [];
const disconnectCallbacks: (() => void)[] = [];

/**
 * Conecta ao servidor de chat
 */
export function connect(token: string, serverUrl?: string): void {
  if (socket?.connected) {
    console.log('[ChatClient] Already connected');
    return;
  }

  // Se já existe socket desconectado, desconectar primeiro
  if (socket) {
    socket.disconnect();
    socket = null;
  }

  // Usar a mesma URL base da API
  const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  let fullUrl = serverUrl || API_BASE_URL.replace('/api', '');
  
  // Garantir que não tem /api no final
  if (fullUrl.endsWith('/api')) {
    fullUrl = fullUrl.substring(0, fullUrl.length - 4);
  }

  console.log('[ChatClient] Connecting to:', fullUrl);

  socket = io(fullUrl, {
    path: '/socket.io/',
    auth: {
      token: token,
    },
    transports: ['websocket', 'polling'],
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000,
    reconnectionAttempts: 5,
  });

  socket.on('connect', () => {
    console.log('[ChatClient] Connected to chat server');
    isConnected = true;
    connectCallbacks.forEach(cb => cb());
  });

  socket.on('disconnect', (reason) => {
    console.log('[ChatClient] Disconnected:', reason);
    isConnected = false;
    disconnectCallbacks.forEach(cb => cb());
  });

  socket.on('connect_error', (error) => {
    console.error('[ChatClient] Connection error:', error);
  });

  socket.on('chat:message', (msg: ChatMessage) => {
    // Garantir que a cor está definida
    if (!msg.color) {
      msg.color = CHAT_COLORS[msg.channel as keyof typeof CHAT_COLORS] || CHAT_COLORS.global;
    }
    messageCallbacks.forEach(cb => cb(msg));
  });

  socket.on('chat:history', (data: { channel: string; messages: ChatMessage[] }) => {
    // Garantir cores para mensagens do histórico
    data.messages.forEach(msg => {
      if (!msg.color) {
        msg.color = CHAT_COLORS[msg.channel as keyof typeof CHAT_COLORS] || CHAT_COLORS.global;
      }
    });
    historyCallbacks.forEach(cb => cb(data));
  });

  socket.on('chat:user-joined', (data: { username: string; timestamp: number }) => {
    userJoinedCallbacks.forEach(cb => cb(data));
  });

  socket.on('chat:user-left', (data: { username: string; timestamp: number }) => {
    userLeftCallbacks.forEach(cb => cb(data));
  });

  socket.on('friend:online', (data: { username: string }) => {
    friendOnlineCallbacks.forEach(cb => cb(data));
  });

  socket.on('friend:offline', (data: { username: string }) => {
    friendOfflineCallbacks.forEach(cb => cb(data));
  });

  socket.on('friend:update', (data: { type: string; data?: any; timestamp: number }) => {
    friendUpdateCallbacks.forEach(cb => cb(data));
  });

  socket.on('chat:error', (error: { message: string }) => {
    console.error('[ChatClient] Error:', error.message);
    errorCallbacks.forEach(cb => cb(error));
  });
}

/**
 * Desconecta do servidor
 */
export function disconnect(): void {
  if (socket) {
    socket.disconnect();
    socket = null;
    isConnected = false;
    console.log('[ChatClient] Disconnected');
  }
}

/**
 * Entra em um canal
 */
export function joinChannel(channel: string): void {
  if (!socket || !isConnected) {
    console.warn('[ChatClient] Not connected, cannot join channel');
    return;
  }

  socket.emit('chat:join', { channel });
  console.log('[ChatClient] Joining channel:', channel);
}

/**
 * Envia mensagem para um canal
 */
export function sendMessage(channel: string, message: string): void {
  if (!socket || !isConnected) {
    console.warn('[ChatClient] Not connected, cannot send message');
    return;
  }

  socket.emit('chat:message', { channel, message });
}

/**
 * Envia whisper (mensagem privada)
 */
export function sendWhisper(recipient: string, message: string): void {
  if (!socket || !isConnected) {
    console.warn('[ChatClient] Not connected, cannot send whisper');
    return;
  }

  socket.emit('chat:whisper', { recipient, message });
}

/**
 * Event handlers
 */
export function onMessage(callback: (msg: ChatMessage) => void): () => void {
  messageCallbacks.push(callback);
  return () => {
    const index = messageCallbacks.indexOf(callback);
    if (index > -1) messageCallbacks.splice(index, 1);
  };
}

export function onHistory(callback: (data: { channel: string; messages: ChatMessage[] }) => void): () => void {
  historyCallbacks.push(callback);
  return () => {
    const index = historyCallbacks.indexOf(callback);
    if (index > -1) historyCallbacks.splice(index, 1);
  };
}

export function onUserJoined(callback: (data: { username: string; timestamp: number }) => void): () => void {
  userJoinedCallbacks.push(callback);
  return () => {
    const index = userJoinedCallbacks.indexOf(callback);
    if (index > -1) userJoinedCallbacks.splice(index, 1);
  };
}

export function onUserLeft(callback: (data: { username: string; timestamp: number }) => void): () => void {
  userLeftCallbacks.push(callback);
  return () => {
    const index = userLeftCallbacks.indexOf(callback);
    if (index > -1) userLeftCallbacks.splice(index, 1);
  };
}

export function onError(callback: (error: { message: string }) => void): () => void {
  errorCallbacks.push(callback);
  return () => {
    const index = errorCallbacks.indexOf(callback);
    if (index > -1) errorCallbacks.splice(index, 1);
  };
}

export function onConnect(callback: () => void): () => void {
  connectCallbacks.push(callback);
  return () => {
    const index = connectCallbacks.indexOf(callback);
    if (index > -1) connectCallbacks.splice(index, 1);
  };
}

export function onDisconnect(callback: () => void): () => void {
  disconnectCallbacks.push(callback);
  return () => {
    const index = disconnectCallbacks.indexOf(callback);
    if (index > -1) disconnectCallbacks.splice(index, 1);
  };
}

export function onFriendOnline(callback: (data: { username: string }) => void): () => void {
  friendOnlineCallbacks.push(callback);
  return () => {
    const index = friendOnlineCallbacks.indexOf(callback);
    if (index > -1) friendOnlineCallbacks.splice(index, 1);
  };
}

export function onFriendOffline(callback: (data: { username: string }) => void): () => void {
  friendOfflineCallbacks.push(callback);
  return () => {
    const index = friendOfflineCallbacks.indexOf(callback);
    if (index > -1) friendOfflineCallbacks.splice(index, 1);
  };
}

export function onFriendUpdate(callback: (data: { type: string; data?: any; timestamp: number }) => void): () => void {
  friendUpdateCallbacks.push(callback);
  return () => {
    const index = friendUpdateCallbacks.indexOf(callback);
    if (index > -1) friendUpdateCallbacks.splice(index, 1);
  };
}

/**
 * Verifica se está conectado
 */
export function getConnectionStatus(): boolean {
  return isConnected && socket?.connected === true;
}

/**
 * Exportar instância do socket (para debug)
 */
export function getSocket(): Socket | null {
  return socket;
}

