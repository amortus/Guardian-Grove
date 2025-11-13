/**
 * Progress Controller
 * Gerencia progresso de quests e achievements
 */

import { Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';

/**
 * Salva ou atualiza progresso de uma quest
 */
export async function saveQuestProgress(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }

    const { questId, progress, isCompleted, isActive } = req.body;

    if (!questId || progress === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid questId or progress',
      } as ApiResponse);
    }

    // Buscar game_save_id
    const gameSaveResult = await query(
      'SELECT id FROM game_saves WHERE user_id = $1',
      [userId]
    );

    if (gameSaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game save not found',
      } as ApiResponse);
    }

    const gameSaveId = gameSaveResult.rows[0].id;

    // Upsert quest progress
    const result = await query(
      `INSERT INTO quests (game_save_id, quest_id, progress, is_completed, is_active)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT (game_save_id, quest_id)
       DO UPDATE SET 
         progress = $3,
         is_completed = $4,
         is_active = $5
       RETURNING *`,
      [gameSaveId, questId, JSON.stringify(progress), isCompleted || false, isActive !== false]
    );

    console.log(`[Progress] Saved quest ${questId} for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    } as ApiResponse);

  } catch (error) {
    console.error('[Progress] Save quest error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save quest progress',
    } as ApiResponse);
  }
}

/**
 * Salva ou atualiza progresso de uma achievement
 */
export async function saveAchievementProgress(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }

    const { achievementId, progress, unlocked } = req.body;

    if (!achievementId || progress === undefined) {
      return res.status(400).json({
        success: false,
        error: 'Invalid achievementId or progress',
      } as ApiResponse);
    }

    // Buscar game_save_id
    const gameSaveResult = await query(
      'SELECT id FROM game_saves WHERE user_id = $1',
      [userId]
    );

    if (gameSaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game save not found',
      } as ApiResponse);
    }

    const gameSaveId = gameSaveResult.rows[0].id;

    // Upsert achievement progress
    const unlockedAt = unlocked ? new Date() : null;
    
    const result = await query(
      `INSERT INTO achievements (game_save_id, achievement_id, progress, unlocked_at)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (game_save_id, achievement_id)
       DO UPDATE SET 
         progress = $3,
         unlocked_at = COALESCE(achievements.unlocked_at, $4)
       RETURNING *`,
      [gameSaveId, achievementId, progress, unlockedAt]
    );

    console.log(`[Progress] Saved achievement ${achievementId} for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: result.rows[0],
    } as ApiResponse);

  } catch (error) {
    console.error('[Progress] Save achievement error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to save achievement progress',
    } as ApiResponse);
  }
}

/**
 * Retorna progresso completo (quests + achievements)
 */
export async function getProgress(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }

    // Buscar game_save_id
    const gameSaveResult = await query(
      'SELECT id FROM game_saves WHERE user_id = $1',
      [userId]
    );

    if (gameSaveResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Game save not found',
      } as ApiResponse);
    }

    const gameSaveId = gameSaveResult.rows[0].id;

    // Buscar quests
    const questsResult = await query(
      'SELECT * FROM quests WHERE game_save_id = $1 ORDER BY created_at ASC',
      [gameSaveId]
    );

    // Buscar achievements
    const achievementsResult = await query(
      'SELECT * FROM achievements WHERE game_save_id = $1 ORDER BY created_at ASC',
      [gameSaveId]
    );

    console.log(`[Progress] Retrieved progress for user ${userId}: ${questsResult.rows.length} quests, ${achievementsResult.rows.length} achievements`);

    return res.status(200).json({
      success: true,
      data: {
        quests: questsResult.rows,
        achievements: achievementsResult.rows,
      },
    } as ApiResponse);

  } catch (error) {
    console.error('[Progress] Get progress error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get progress',
    } as ApiResponse);
  }
}

