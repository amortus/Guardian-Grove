/**
 * Hub Routes - Ghost System
 * API para salvar e recuperar posições de jogadores no HUB
 */

import { Router } from 'express';
import { pool } from '../db/connection';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

/**
 * POST /api/hub/position
 * Salva a posição atual do jogador no HUB
 */
router.post('/position', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const { x, y, z } = req.body;

    if (typeof x !== 'number' || typeof y !== 'number' || typeof z !== 'number') {
      return res.status(400).json({ error: 'Invalid position coordinates' });
    }

    // Buscar informações do jogador
    const playerQuery = await pool.query(
      `SELECT gs.player_name, b.line 
       FROM game_saves gs
       JOIN beasts b ON b.game_save_id = gs.id AND b.is_active = true
       WHERE gs.user_id = $1`,
      [userId]
    );

    if (playerQuery.rows.length === 0) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const { player_name, line } = playerQuery.rows[0];

    // Upsert: atualiza se existe, insere se não
    await pool.query(
      `INSERT INTO hub_positions (user_id, player_name, beast_line, position_x, position_y, position_z, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       ON CONFLICT (user_id) 
       DO UPDATE SET 
         position_x = EXCLUDED.position_x,
         position_y = EXCLUDED.position_y,
         position_z = EXCLUDED.position_z,
         updated_at = NOW()`,
      [userId, player_name, line, x, y, z]
    );

    res.json({ success: true });
  } catch (error) {
    console.error('Error saving hub position:', error);
    res.status(500).json({ error: 'Failed to save position' });
  }
});

/**
 * GET /api/hub/recent-visitors
 * Retorna visitantes recentes do HUB (últimos 5 minutos, excluindo o próprio jogador)
 */
router.get('/recent-visitors', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.id;
    const limit = parseInt(req.query.limit as string) || 5;

    const result = await pool.query(
      `SELECT 
        player_name,
        beast_line,
        position_x,
        position_y,
        position_z,
        updated_at
       FROM hub_positions
       WHERE user_id != $1
         AND updated_at > NOW() - INTERVAL '5 minutes'
       ORDER BY updated_at DESC
       LIMIT $2`,
      [userId, limit]
    );

    const visitors = result.rows.map(row => ({
      playerName: row.player_name,
      beastLine: row.beast_line,
      position: {
        x: row.position_x,
        y: row.position_y,
        z: row.position_z
      },
      timestamp: row.updated_at
    }));

    res.json({ success: true, data: { visitors } });
  } catch (error) {
    console.error('Error fetching recent visitors:', error);
    res.status(500).json({ error: 'Failed to fetch visitors' });
  }
});

export default router;

