/**
 * Friends Controller
 * Guardian Grove Server
 */

import { Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';
import { notifyFriendUpdate } from '../services/chatService';

/**
 * Garante que a tabela friendships existe
 */
async function ensureFriendshipsTable(): Promise<void> {
  try {
    // Verificar se tabela existe
    const checkResult = await query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'friendships'
      );
    `);
    
    if (!checkResult.rows[0].exists) {
      console.log('[Friends] Creating friendships table...');
      await query(`
        BEGIN;
        CREATE TABLE friendships (
          id SERIAL PRIMARY KEY,
          user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          status VARCHAR(20) NOT NULL DEFAULT 'pending',
          requested_at TIMESTAMP DEFAULT NOW(),
          accepted_at TIMESTAMP,
          UNIQUE(user_id, friend_id),
          CHECK (user_id != friend_id)
        );
        CREATE INDEX idx_friendships_user ON friendships(user_id, status);
        CREATE INDEX idx_friendships_friend ON friendships(friend_id, status);
        COMMIT;
      `);
      console.log('[Friends] Table friendships created successfully');
    }
  } catch (error: any) {
    // Se já existe, tudo bem
    if (error.code !== '42P07' && !error.message?.includes('already exists')) {
      throw error;
    }
  }
}

/**
 * Listar amigos aceitos
 */
export async function getFriends(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    // Verificar se tabela existe, criar se necessário
    await ensureFriendshipsTable();

    const result = await query(
      `SELECT 
        f.id,
        f.user_id,
        f.friend_id,
        u.display_name as friend_name,
        f.status,
        EXTRACT(EPOCH FROM f.requested_at) * 1000 as requested_at,
        EXTRACT(EPOCH FROM f.accepted_at) * 1000 as accepted_at
      FROM friendships f
      JOIN users u ON (
        CASE 
          WHEN f.user_id = $1 THEN f.friend_id = u.id
          ELSE f.user_id = u.id
        END
      )
      WHERE (f.user_id = $1 OR f.friend_id = $1)
      AND f.status = 'accepted'
      ORDER BY f.accepted_at DESC`,
      [userId]
    );

    const friends = result.rows.map(row => ({
      id: row.id,
      userId: row.user_id,
      friendId: row.friend_id === userId ? row.user_id : row.friend_id,
      friendName: row.friend_name,
      status: row.status,
      requestedAt: parseInt(row.requested_at),
      acceptedAt: row.accepted_at ? parseInt(row.accepted_at) : undefined,
    }));

    return res.status(200).json({
      success: true,
      data: friends
    } as ApiResponse);
  } catch (error: any) {
    console.error('[Friends] Get friends error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get friends' 
    } as ApiResponse);
  }
}

/**
 * Listar pedidos de amizade (enviados e recebidos)
 */
export async function getFriendRequests(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    await ensureFriendshipsTable();

    const result = await query(
      `SELECT 
        f.id,
        f.user_id as from_user_id,
        u_from.display_name as from_username,
        f.friend_id as to_user_id,
        u_to.display_name as to_username,
        f.status,
        EXTRACT(EPOCH FROM f.requested_at) * 1000 as requested_at
      FROM friendships f
      JOIN users u_from ON f.user_id = u_from.id
      JOIN users u_to ON f.friend_id = u_to.id
      WHERE (f.user_id = $1 OR f.friend_id = $1)
      AND f.status = 'pending'
      ORDER BY f.requested_at DESC`,
      [userId]
    );

    const requests = result.rows.map(row => ({
      id: row.id,
      fromUserId: row.from_user_id,
      fromUsername: row.from_username,
      toUserId: row.to_user_id,
      toUsername: row.to_username,
      status: row.status,
      requestedAt: parseInt(row.requested_at),
      direction: row.from_user_id === userId ? 'sent' as const : 'received' as const,
    }));

    return res.status(200).json({
      success: true,
      data: requests
    } as ApiResponse);
  } catch (error: any) {
    console.error('[Friends] Get requests error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get friend requests' 
    } as ApiResponse);
  }
}

/**
 * Enviar pedido de amizade
 */
export async function sendFriendRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { username } = req.body;

    if (!username) {
      return res.status(400).json({ 
        success: false, 
        error: 'Username is required' 
      } as ApiResponse);
    }

    // Limpar e normalizar o nome de usuário (remove espaços extras)
    const searchUsername = username.trim();

    // Buscar usuário por display_name (case-insensitive e ignora espaços extras)
    // Usa LOWER e TRIM para garantir que encontre mesmo com diferenças de case/espaços
    const userResult = await query(
      `SELECT id, display_name 
       FROM users 
       WHERE LOWER(TRIM(display_name)) = LOWER(TRIM($1))`,
      [searchUsername]
    );

    if (userResult.rows.length === 0) {
      console.log(`[Friends] User not found: "${searchUsername}"`);
      return res.status(404).json({ 
        success: false, 
        error: `Usuário "${searchUsername}" não encontrado` 
      } as ApiResponse);
    }

    const friendId = userResult.rows[0].id;

    if (friendId === userId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot send friend request to yourself' 
      } as ApiResponse);
    }

    // Verificar se já existe amizade ou pedido
    const existingResult = await query(
      `SELECT id, status FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendId]
    );

    if (existingResult.rows.length > 0) {
      const existing = existingResult.rows[0];
      if (existing.status === 'accepted') {
        return res.status(409).json({ 
          success: false, 
          error: 'Already friends' 
        } as ApiResponse);
      }
      if (existing.status === 'pending') {
        return res.status(409).json({ 
          success: false, 
          error: 'Friend request already pending' 
        } as ApiResponse);
      }
    }

    // Criar pedido
    try {
      await query(
        `INSERT INTO friendships (user_id, friend_id, status) 
         VALUES ($1, $2, 'pending')`,
        [userId, friendId]
      );

      // Buscar informações do amigo para notificação
      const friendResult = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [friendId]
      );
      const friendName = friendResult.rows[0]?.display_name || 'Unknown';

      // Notificar o remetente (que enviou o pedido)
      notifyFriendUpdate(userId, 'request-sent', {
        friendId: friendId,
        friendName: friendName,
      });

      // Notificar o destinatário (que recebeu o pedido)
      const senderResult = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [userId]
      );
      const senderName = senderResult.rows[0]?.display_name || 'Unknown';
      notifyFriendUpdate(friendId, 'request-sent', {
        friendId: userId,
        friendName: senderName,
      });

      return res.status(200).json({
        success: true,
        message: 'Friend request sent'
      } as ApiResponse);
    } catch (dbError: any) {
      // Verificar se é erro de tabela não existir
      if (dbError.code === '42P01') {
        console.error('[Friends] Table friendships does not exist. Creating it automatically...');
        
        try {
          // Criar tabela automaticamente se não existir
          await query(`
            BEGIN;
            CREATE TABLE IF NOT EXISTS friendships (
              id SERIAL PRIMARY KEY,
              user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              friend_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
              status VARCHAR(20) NOT NULL DEFAULT 'pending',
              requested_at TIMESTAMP DEFAULT NOW(),
              accepted_at TIMESTAMP,
              UNIQUE(user_id, friend_id),
              CHECK (user_id != friend_id)
            );
            CREATE INDEX IF NOT EXISTS idx_friendships_user ON friendships(user_id, status);
            CREATE INDEX IF NOT EXISTS idx_friendships_friend ON friendships(friend_id, status);
            COMMIT;
          `);
          
          console.log('[Friends] Table friendships created successfully');
          
          // Tentar inserir novamente
          await query(
            `INSERT INTO friendships (user_id, friend_id, status) 
             VALUES ($1, $2, 'pending')`,
            [userId, friendId]
          );

          // Buscar informações do amigo para notificação
          const friendResult = await query(
            `SELECT display_name FROM users WHERE id = $1`,
            [friendId]
          );
          const friendName = friendResult.rows[0]?.display_name || 'Unknown';

          // Notificar o remetente (que enviou o pedido)
          notifyFriendUpdate(userId, 'request-sent', {
            friendId: friendId,
            friendName: friendName,
          });

          // Notificar o destinatário (que recebeu o pedido)
          const senderResult = await query(
            `SELECT display_name FROM users WHERE id = $1`,
            [userId]
          );
          const senderName = senderResult.rows[0]?.display_name || 'Unknown';
          notifyFriendUpdate(friendId, 'request-sent', {
            friendId: userId,
            friendName: senderName,
          });

          return res.status(200).json({
            success: true,
            message: 'Friend request sent'
          } as ApiResponse);
        } catch (createError: any) {
          console.error('[Friends] Failed to create table:', createError);
          return res.status(500).json({ 
            success: false, 
            error: 'Erro ao configurar sistema de amigos. Tente novamente em alguns instantes.' 
          } as ApiResponse);
        }
      }
      
      // Re-lançar se for outro erro
      throw dbError;
    }
  } catch (error: any) {
    console.error('[Friends] Send request error:', error);
    console.error('[Friends] Error details:', JSON.stringify(error, null, 2));
    return res.status(500).json({ 
      success: false, 
      error: error.message || 'Failed to send friend request' 
    } as ApiResponse);
  }
}

/**
 * Aceitar pedido de amizade
 */
export async function acceptFriendRequest(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    await ensureFriendshipsTable();

    const { friendId } = req.params;
    const friendIdNum = parseInt(friendId);

    if (isNaN(friendIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid friend ID' 
      } as ApiResponse);
    }

    // Verificar se existe pedido pendente
    const existingResult = await query(
      `SELECT id, status FROM friendships 
       WHERE friend_id = $1 AND user_id = $2 AND status = 'pending'`,
      [userId, friendIdNum]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Friend request not found' 
      } as ApiResponse);
    }

    // Aceitar pedido
    await query(
      `UPDATE friendships 
       SET status = 'accepted', accepted_at = NOW() 
       WHERE id = $1`,
      [existingResult.rows[0].id]
    );

    // Buscar informações de ambos os usuários para notificação
    const friendInfo = await query(
      `SELECT u1.id as sender_id, u1.display_name as sender_name, u2.id as receiver_id, u2.display_name as receiver_name
       FROM friendships f
       JOIN users u1 ON f.user_id = u1.id
       JOIN users u2 ON f.friend_id = u2.id
       WHERE f.id = $1`,
      [existingResult.rows[0].id]
    );

    if (friendInfo.rows.length > 0) {
      const { sender_id, sender_name, receiver_id, receiver_name } = friendInfo.rows[0];

      // Notificar o remetente (quem enviou o pedido)
      notifyFriendUpdate(sender_id, 'request-accepted', {
        friendId: receiver_id,
        friendName: receiver_name,
      });

      // Notificar o destinatário (quem aceitou o pedido)
      notifyFriendUpdate(receiver_id, 'request-accepted', {
        friendId: sender_id,
        friendName: sender_name,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Friend request accepted'
    } as ApiResponse);
  } catch (error: any) {
    console.error('[Friends] Accept request error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to accept friend request' 
    } as ApiResponse);
  }
}

/**
 * Remover amigo ou rejeitar pedido
 */
export async function removeFriend(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    await ensureFriendshipsTable();

    const { friendId } = req.params;
    const friendIdNum = parseInt(friendId);

    if (isNaN(friendIdNum)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid friend ID' 
      } as ApiResponse);
    }

    // Buscar informações do amigo antes de remover
    const friendInfo = await query(
      `SELECT u.id, u.display_name
       FROM users u
       WHERE u.id = $1`,
      [friendIdNum]
    );

    // Verificar se existe amizade
    const existingResult = await query(
      `SELECT id FROM friendships 
       WHERE (user_id = $1 AND friend_id = $2) OR (user_id = $2 AND friend_id = $1)`,
      [userId, friendIdNum]
    );

    if (existingResult.rows.length === 0) {
      return res.status(404).json({ 
        success: false, 
        error: 'Friendship not found' 
      } as ApiResponse);
    }

    // Remover amizade
    await query(
      `DELETE FROM friendships WHERE id = $1`,
      [existingResult.rows[0].id]
    );

    // Notificar ambos os usuários
    if (friendInfo.rows.length > 0) {
      const friendName = friendInfo.rows[0].display_name;

      // Notificar o usuário atual
      notifyFriendUpdate(userId, 'friend-removed', {
        friendId: friendIdNum,
        friendName: friendName,
      });

      // Notificar o amigo removido
      const currentUserInfo = await query(
        `SELECT display_name FROM users WHERE id = $1`,
        [userId]
      );
      const currentUserName = currentUserInfo.rows[0]?.display_name || 'Unknown';
      notifyFriendUpdate(friendIdNum, 'friend-removed', {
        friendId: userId,
        friendName: currentUserName,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Friend removed'
    } as ApiResponse);
  } catch (error: any) {
    console.error('[Friends] Remove friend error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to remove friend' 
    } as ApiResponse);
  }
}

/**
 * Listar amigos online
 */
export async function getOnlineFriends(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    // Esta lista será populada pelo chatService com usuários conectados
    // Por enquanto retorna lista vazia, será implementado depois
    return res.status(200).json({
      success: true,
      data: []
    } as ApiResponse);
  } catch (error: any) {
    console.error('[Friends] Get online friends error:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get online friends' 
    } as ApiResponse);
  }
}

