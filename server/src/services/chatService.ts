/**
 * Chat Service
 * Gerencia comunicação em tempo real via WebSocket (Socket.IO)
 * Guardian Grove Server
 */

import { Server as HttpServer } from 'http';
import { Server as SocketServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { query } from '../db/connection';

const JWT_SECRET_KEY = process.env.JWT_SECRET || 'your-secret-key';

// Tipos de mensagem
export interface ChatMessage {
  id: string;
  channel: 'global' | 'group' | 'trade' | 'whisper' | 'system';
  sender: string;
  senderUserId: number;
  recipient?: string;
  message: string;
  timestamp: number;
  color: string;
}

interface ConnectedUser {
  userId: number;
  username: string;
  socketId: string;
  connectedAt: number;
}

// Cores de mensagem (padrão WoW)
const CHAT_COLORS = {
  global: '#FFFFFF',      // branco
  group: '#AAD372',       // verde
  trade: '#FFC864',       // laranja/amarelo
  whisper: '#FF7FD4',     // rosa
  system: '#FFFF00',      // amarelo
  error: '#FF0000',       // vermelho
};

// Usuários conectados (em memória)
const connectedUsers = new Map<string, ConnectedUser>(); // socketId -> user
const userSockets = new Map<number, Set<string>>(); // userId -> Set<socketId>

// PERFORMANCE: Sistema de batch inserts para mensagens
const messageQueue: ChatMessage[] = [];
let saveInterval: NodeJS.Timeout | null = null;
const BATCH_SIZE = 10; // Salvar quando atingir 10 mensagens
const BATCH_DELAY = 500; // Ou a cada 500ms

// PERFORMANCE: Cache de histórico por canal
const channelHistoryCache = new Map<string, { messages: ChatMessage[]; timestamp: number }>();
const CACHE_TTL = 60000; // Cache válido por 1 minuto

let io: SocketServer | null = null;

/**
 * Autentica socket connection via JWT token
 */
async function authenticateSocket(socket: Socket): Promise<{ userId: number; username: string } | null> {
  const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];
  
  if (!token) {
    socket.emit('chat:error', { message: 'Authentication token required' });
    return null;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET_KEY) as any;
    
    // Buscar username do banco
    const userResult = await query(
      'SELECT id, display_name FROM users WHERE id = $1',
      [decoded.id]
    );

    if (userResult.rows.length === 0) {
      socket.emit('chat:error', { message: 'User not found' });
      return null;
    }

    return {
      userId: decoded.id,
      username: userResult.rows[0].display_name,
    };
  } catch (error) {
    socket.emit('chat:error', { message: 'Invalid token' });
    return null;
  }
}

/**
 * PERFORMANCE: Salva mensagem no banco de dados (agora usa batch inserts)
 */
async function saveMessage(msg: ChatMessage): Promise<void> {
  // Adicionar à queue
  messageQueue.push(msg);
  
  // Se atingiu o tamanho do batch, salvar imediatamente
  if (messageQueue.length >= BATCH_SIZE) {
    await flushMessageQueue();
  } else if (!saveInterval) {
    // Agendar salvamento após delay
    saveInterval = setTimeout(async () => {
      await flushMessageQueue();
      saveInterval = null;
    }, BATCH_DELAY);
  }
}

/**
 * PERFORMANCE: Salva múltiplas mensagens em batch (reduz queries de N para 1)
 */
async function flushMessageQueue(): Promise<void> {
  if (messageQueue.length === 0) {
    return;
  }

  // Copiar mensagens da queue e limpar
  const messagesToSave = messageQueue.splice(0, messageQueue.length);
  
  // Cancelar timer se existir
  if (saveInterval) {
    clearTimeout(saveInterval);
    saveInterval = null;
  }

  if (messagesToSave.length === 0) {
    return;
  }

  try {
    // Criar valores para INSERT múltiplo
    const values: any[] = [];
    const placeholders: string[] = [];
    
    messagesToSave.forEach((msg, index) => {
      const base = index * 6;
      placeholders.push(`($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`);
      values.push(
        msg.channel,
        msg.senderUserId,
        msg.sender,
        msg.recipient || null,
        msg.message,
        msg.timestamp
      );
    });

    await query(
      `INSERT INTO chat_messages (channel, sender_user_id, sender_username, recipient_username, message, timestamp)
       VALUES ${placeholders.join(', ')}`,
      values
    );

    // PERFORMANCE: Invalidar cache dos canais afetados
    const affectedChannels = new Set(messagesToSave.map(m => m.channel));
    affectedChannels.forEach(channel => {
      channelHistoryCache.delete(channel);
    });

    console.log(`[ChatService] Saved ${messagesToSave.length} messages in batch`);
  } catch (error) {
    console.error('[ChatService] Error saving messages in batch:', error);
    // Em caso de erro, tentar salvar individualmente (fallback)
    for (const msg of messagesToSave) {
      try {
        await query(
          `INSERT INTO chat_messages (channel, sender_user_id, sender_username, recipient_username, message, timestamp)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            msg.channel,
            msg.senderUserId,
            msg.sender,
            msg.recipient || null,
            msg.message,
            msg.timestamp
          ]
        );
      } catch (individualError) {
        console.error('[ChatService] Error saving individual message:', individualError);
      }
    }
  }
}

/**
 * PERFORMANCE: Carrega histórico de mensagens do canal (com cache)
 */
async function loadChannelHistory(channel: string, limit: number = 100): Promise<ChatMessage[]> {
  try {
    // Verificar cache primeiro
    const cached = channelHistoryCache.get(channel);
    const now = Date.now();
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      // Cache válido, retornar mensagens do cache (limitadas)
      return cached.messages.slice(-limit);
    }

    // Cache inválido ou não existe, buscar do banco
    const result = await query(
      `SELECT id, channel, sender_user_id, sender_username, recipient_username, message, timestamp
       FROM chat_messages
       WHERE channel = $1
       ORDER BY timestamp DESC
       LIMIT $2`,
      [channel, limit]
    );

    const messages = result.rows.reverse().map(row => ({
      id: `msg-${row.id}`,
      channel: row.channel,
      sender: row.sender_username,
      senderUserId: row.sender_user_id,
      recipient: row.recipient_username || undefined,
      message: row.message,
      timestamp: parseInt(row.timestamp),
      color: CHAT_COLORS[row.channel as keyof typeof CHAT_COLORS] || CHAT_COLORS.global,
    }));

    // Atualizar cache
    channelHistoryCache.set(channel, {
      messages,
      timestamp: now,
    });

    return messages;
  } catch (error) {
    console.error('[ChatService] Error loading history:', error);
    return [];
  }
}

/**
 * Envia mensagem para usuário específico (whisper)
 */
function sendWhisperToUser(userId: number, message: ChatMessage): void {
  const socketIds = userSockets.get(userId);
  if (!socketIds || socketIds.size === 0) return;

  socketIds.forEach(socketId => {
    io?.to(socketId).emit('chat:message', message);
  });
}

/**
 * Inicializa o serviço de chat
 */
export function initializeChatService(server: HttpServer) {
    io = new SocketServer(server, {
      cors: {
        origin: (origin, callback) => {
          // Allow requests with no origin (like mobile apps)
          if (!origin) return callback(null, true);
          
          // Allow localhost (development)
          if (origin.includes('localhost')) {
            return callback(null, true);
          }
          
          // Allow any Vercel deployment URL
          if (origin.includes('vercel.app')) {
            return callback(null, true);
          }
          
          callback(null, true); // Permitir todas as origens por enquanto
        },
        methods: ['GET', 'POST'],
        credentials: true,
      },
      path: '/socket.io/',
    });

  // Middleware de autenticação
  io.use(async (socket, next) => {
    const user = await authenticateSocket(socket);
    if (user) {
      (socket as any).user = user;
      next();
    } else {
      next(new Error('Authentication failed'));
    }
  });

  io.on('connection', async (socket: Socket & { user?: { userId: number; username: string } }) => {
    if (!socket.user) {
      socket.disconnect();
      return;
    }

    const { userId, username } = socket.user;

    // Registrar usuário conectado
    connectedUsers.set(socket.id, {
      userId,
      username,
      socketId: socket.id,
      connectedAt: Date.now(),
    });

    if (!userSockets.has(userId)) {
      userSockets.set(userId, new Set());
    }
    userSockets.get(userId)!.add(socket.id);

    console.log(`[ChatService] User connected: ${username} (${socket.id})`);

    // Notificar outros usuários
    socket.broadcast.emit('chat:user-joined', {
      username,
      timestamp: Date.now(),
    });

    // Notificar apenas amigos quando conecta
    try {
      const friendsResult = await query(
        `SELECT u.id, u.display_name 
         FROM friendships f 
         JOIN users u ON (
           CASE 
             WHEN f.user_id = $1 THEN f.friend_id = u.id
             ELSE f.user_id = u.id
           END
         )
         WHERE (f.user_id = $1 OR f.friend_id = $1) 
         AND f.status = 'accepted' 
         AND u.id != $1`,
        [userId]
      );

      // Notificar amigos online
      friendsResult.rows.forEach((friend: any) => {
        const friendSockets = userSockets.get(friend.id);
        if (friendSockets && friendSockets.size > 0) {
          friendSockets.forEach(socketId => {
            io?.to(socketId).emit('friend:online', { username });
          });
        }
      });

      // Notificar usuário atual sobre amigos que já estão online
      const onlineFriendSockets = Array.from(userSockets.entries())
        .filter(([id, sockets]) => {
          if (id === userId) return false;
          const friendRow = friendsResult.rows.find((f: any) => f.id === id);
          return friendRow && sockets.size > 0;
        });

      onlineFriendSockets.forEach(([friendId, sockets]) => {
        const friendRow = friendsResult.rows.find((f: any) => f.id === friendId);
        if (friendRow) {
          socket.emit('friend:online', { username: friendRow.display_name });
        }
      });
    } catch (error) {
      console.error('[ChatService] Error notifying friends:', error);
    }

    // Enviar mensagem de boas-vindas
    const welcomeMessage: ChatMessage = {
      id: `sys-${Date.now()}`,
      channel: 'system',
      sender: 'Sistema',
      senderUserId: 0,
      message: `Bem-vindo ao chat, ${username}!`,
      timestamp: Date.now(),
      color: CHAT_COLORS.system,
    };
    socket.emit('chat:message', welcomeMessage);

    // Event: Entrar em canal
    socket.on('chat:join', async (data: { channel: string }) => {
      const { channel } = data;
      
      // Validar canal
      const validChannels = ['global', 'group', 'trade'];
      if (!validChannels.includes(channel)) {
        socket.emit('chat:error', { message: 'Invalid channel' });
        return;
      }

      // Entrar na sala do canal
      socket.join(`channel:${channel}`);

      // Enviar histórico do canal
      const history = await loadChannelHistory(channel);
      socket.emit('chat:history', {
        channel,
        messages: history,
      });

      console.log(`[ChatService] ${username} joined channel: ${channel}`);
    });

    // Event: Enviar mensagem
    socket.on('chat:message', async (data: { channel: string; message: string }) => {
      const { channel, message } = data;

      if (!message || message.trim().length === 0) {
        return;
      }

      // Limitar tamanho da mensagem
      if (message.length > 500) {
        socket.emit('chat:error', { message: 'Message too long (max 500 characters)' });
        return;
      }

      const chatMessage: ChatMessage = {
        id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        channel: channel as ChatMessage['channel'],
        sender: username,
        senderUserId: userId,
        message: message.trim(),
        timestamp: Date.now(),
        color: CHAT_COLORS[channel as keyof typeof CHAT_COLORS] || CHAT_COLORS.global,
      };

      // PERFORMANCE: Salvar no banco usando batch inserts (exceto system)
      if (channel !== 'system') {
        saveMessage(chatMessage); // Não precisa await - salva em batch
      }

      // Enviar para sala do canal
      io?.to(`channel:${channel}`).emit('chat:message', chatMessage);

      console.log(`[ChatService] ${username} sent message to ${channel}: ${message.substring(0, 50)}...`);
    });

    // Event: Whisper (mensagem privada)
    socket.on('chat:whisper', async (data: { recipient: string; message: string }) => {
      const { recipient, message } = data;

      if (!message || message.trim().length === 0) {
        return;
      }

      // Buscar userId do destinatário (case-insensitive, igual ao sistema de amigos)
      const recipientResult = await query(
        'SELECT id, display_name FROM users WHERE LOWER(TRIM(display_name)) = LOWER(TRIM($1))',
        [recipient]
      );

      if (recipientResult.rows.length === 0) {
        socket.emit('chat:error', { message: `User "${recipient}" not found` });
        return;
      }

      // Usar o display_name real do banco (preservar case original)
      const recipientRealName = recipientResult.rows[0].display_name;
      const recipientUserId = recipientResult.rows[0].id;

      // Criar mensagem de whisper (para remetente)
      // O recipient indica para quem foi enviado (usar nome real do banco)
      const whisperToSender: ChatMessage = {
        id: `whisper-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        channel: 'whisper',
        sender: username,
        senderUserId: userId,
        recipient: recipientRealName, // Usar nome real do banco (preserva case correto)
        message: message.trim(),
        timestamp: Date.now(),
        color: CHAT_COLORS.whisper,
      };

      // Criar mensagem de whisper (para destinatário)
      // O recipient indica para quem foi enviado (ele mesmo, para identificar que é para ele)
      const whisperToRecipient: ChatMessage = {
        id: `whisper-${Date.now()}-${Math.random().toString(36).substr(2, 10)}`,
        channel: 'whisper',
        sender: username, // Quem enviou (remetente)
        senderUserId: userId,
        recipient: recipientRealName, // Usar nome real do banco (preserva case correto)
        message: message.trim(),
        timestamp: Date.now(),
        color: CHAT_COLORS.whisper,
      };

      // PERFORMANCE: Salvar no banco usando batch inserts
      saveMessage(whisperToSender); // Não precisa await - salva em batch
      saveMessage(whisperToRecipient); // Não precisa await - salva em batch

      // Enviar para remetente
      socket.emit('chat:message', whisperToSender);

      // Enviar para destinatário
      sendWhisperToUser(recipientUserId, whisperToRecipient);

      console.log(`[ChatService] ${username} whispered to ${recipient}`);
    });

    // Event: Disconnect
    socket.on('disconnect', async () => {
      console.log(`[ChatService] User disconnected: ${username} (${socket.id})`);

      // Remover de connectedUsers
      connectedUsers.delete(socket.id);

      // Remover de userSockets
      const sockets = userSockets.get(userId);
      if (sockets) {
        sockets.delete(socket.id);
        
        // Se foi o último socket do usuário, notificar amigos que ficou offline
        if (sockets.size === 0) {
          try {
            const friendsResult = await query(
              `SELECT u.id, u.display_name 
               FROM friendships f 
               JOIN users u ON (
                 CASE 
                   WHEN f.user_id = $1 THEN f.friend_id = u.id
                   ELSE f.user_id = u.id
                 END
               )
               WHERE (f.user_id = $1 OR f.friend_id = $1) 
               AND f.status = 'accepted' 
               AND u.id != $1`,
              [userId]
            );

            // Notificar amigos online
            friendsResult.rows.forEach((friend: any) => {
              const friendSockets = userSockets.get(friend.id);
              if (friendSockets && friendSockets.size > 0) {
                friendSockets.forEach(friendSocketId => {
                  io?.to(friendSocketId).emit('friend:offline', { username });
                });
              }
            });
          } catch (error) {
            console.error('[ChatService] Error notifying friends offline:', error);
          }
          
          // Remover entry se não há mais sockets
          userSockets.delete(userId);
        }
      }

      // Notificar outros usuários
      socket.broadcast.emit('chat:user-left', {
        username,
        timestamp: Date.now(),
      });
    });

    // Event: Error handling
    socket.on('error', (error) => {
      console.error(`[ChatService] Socket error for ${username}:`, error);
    });
  });

  console.log('[ChatService] Chat service initialized');
}

/**
 * Função de cleanup periódico (chamada pelo event scheduler)
 */
export async function cleanupOldChatMessages() {
  try {
    await query('SELECT cleanup_old_chat_messages()');
    console.log('[ChatService] Cleaned up old chat messages');
  } catch (error) {
    console.error('[ChatService] Error cleaning up messages:', error);
  }
}

/**
 * Notifica todos os usuários online sobre eventos
 */
export function notifyOnlineUsers(message: { channel?: 'global' | 'group' | 'trade' | 'whisper' | 'system'; message: string; color?: string }) {
  if (!io) {
    console.warn('[ChatService] Socket.IO not initialized, cannot notify users');
    return;
  }

  const systemMessage: ChatMessage = {
    id: `sys-${Date.now()}`,
    channel: message.channel || 'system',
    sender: 'Sistema',
    senderUserId: 0,
    message: message.message,
    timestamp: Date.now(),
    color: message.color || CHAT_COLORS.system,
  };

  // Enviar para todos os usuários conectados
  io.emit('chat:message', systemMessage);
  console.log(`[ChatService] Notification sent to all online users: ${message.message.substring(0, 50)}...`);
}

/**
 * Notifica um usuário específico sobre mudanças em friendships
 */
export function notifyFriendUpdate(userId: number, eventType: 'request-sent' | 'request-accepted' | 'request-rejected' | 'friend-removed', data?: any) {
  if (!io) {
    console.warn('[ChatService] Socket.IO not initialized, cannot notify user');
    return;
  }

  const sockets = userSockets.get(userId);
  if (!sockets || sockets.size === 0) {
    // Usuário não está online, não precisa notificar
    return;
  }

  // Notificar todos os sockets do usuário
  sockets.forEach(socketId => {
    io?.to(socketId).emit('friend:update', {
      type: eventType,
      data: data,
      timestamp: Date.now(),
    });
  });

  console.log(`[ChatService] Friend update notification sent to user ${userId}: ${eventType}`);
}

/**
 * Obtém instância do Socket.IO (para uso externo)
 */
export function getSocketIO(): SocketServer | null {
  return io;
}

/**
 * PERFORMANCE: Garante que todas as mensagens pendentes sejam salvas (graceful shutdown)
 */
export async function flushPendingMessages(): Promise<void> {
  await flushMessageQueue();
}

