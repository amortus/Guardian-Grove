/**
 * Skin System Routes - Guardian Grove
 * Handles skin purchasing and changing
 */

import { Router } from 'express';
import { requireAuth, type AuthRequest } from '../middleware/auth';
import { pool } from '../db/connection';
import { ALL_SKINS } from '../../../client/src/data/skins';

const router = Router();

// ===== GET /api/skins - Get player's skins =====
router.get('/', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    
    // Get player's owned skins
    const result = await pool.query(
      'SELECT owned_skins, active_skin_id FROM game_saves WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Save not found',
      });
    }
    
    const ownedSkins = result.rows[0].owned_skins || ['feralis', 'terramor', 'aqualis']; // Default starters
    const activeSkinId = result.rows[0].active_skin_id || 'feralis';
    
    res.json({
      success: true,
      data: {
        ownedSkins,
        activeSkinId,
      },
    });
  } catch (error) {
    console.error('[SKINS] Error getting skins:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get skins',
    });
  }
});

// ===== POST /api/skins/purchase - Purchase a skin =====
router.post('/purchase', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { skinId } = req.body;
    
    if (!skinId) {
      return res.status(400).json({
        success: false,
        error: 'Skin ID is required',
      });
    }
    
    // Find skin data
    const skin = ALL_SKINS.find(s => s.id === skinId);
    
    if (!skin) {
      return res.status(404).json({
        success: false,
        error: 'Skin not found',
      });
    }
    
    // Get current game save
    const result = await pool.query(
      'SELECT owned_skins, active_skin_id, coronas FROM game_saves WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Save not found',
      });
    }
    
    const ownedSkins = result.rows[0].owned_skins || ['feralis', 'terramor', 'aqualis'];
    const currentCoronas = result.rows[0].coronas || 0;
    
    // Check if already owned
    if (ownedSkins.includes(skinId)) {
      return res.status(400).json({
        success: false,
        error: 'You already own this skin!',
      });
    }
    
    // Check if player has enough coronas
    if (currentCoronas < skin.price) {
      return res.status(400).json({
        success: false,
        error: `Insufficient Coronas! You need ${skin.price - currentCoronas} more.`,
      });
    }
    
    // Purchase skin
    const newOwnedSkins = [...ownedSkins, skinId];
    const newBalance = currentCoronas - skin.price;
    
    await pool.query(
      'UPDATE game_saves SET owned_skins = $1, coronas = $2 WHERE user_id = $3',
      [JSON.stringify(newOwnedSkins), newBalance, userId]
    );
    
    console.log(`[SKINS] ✅ User ${userId} purchased skin: ${skinId} for ${skin.price} Coronas`);
    
    res.json({
      success: true,
      data: {
        newBalance,
      },
    });
  } catch (error) {
    console.error('[SKINS] Error purchasing skin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to purchase skin',
    });
  }
});

// ===== POST /api/skins/change - Change active skin =====
router.post('/change', requireAuth, async (req, res) => {
  try {
    const userId = (req as AuthRequest).userId;
    const { skinId } = req.body;
    
    if (!skinId) {
      return res.status(400).json({
        success: false,
        error: 'Skin ID is required',
      });
    }
    
    // Get current game save
    const result = await pool.query(
      'SELECT owned_skins FROM game_saves WHERE user_id = $1',
      [userId]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Save not found',
      });
    }
    
    const ownedSkins = result.rows[0].owned_skins || ['feralis', 'terramor', 'aqualis'];
    
    // Check if player owns this skin
    if (!ownedSkins.includes(skinId)) {
      return res.status(400).json({
        success: false,
        error: 'You do not own this skin!',
      });
    }
    
    // Change active skin
    await pool.query(
      'UPDATE game_saves SET active_skin_id = $1 WHERE user_id = $2',
      [skinId, userId]
    );
    
    // Also update in hub_positions for ghost system
    await pool.query(
      'UPDATE hub_positions SET beast_line = $1 WHERE user_id = $2',
      [skinId, userId]
    );
    
    console.log(`[SKINS] ✅ User ${userId} changed skin to: ${skinId}`);
    
    res.json({
      success: true,
      data: {
        success: true,
      },
    });
  } catch (error) {
    console.error('[SKINS] Error changing skin:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to change skin',
    });
  }
});

export default router;

