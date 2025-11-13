/**
 * Game Controller
 * Guardian Grove Server
 */

import { Response } from 'express';
import { query, getClient } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse, GameSaveDTO, BeastDTO } from '../types';
import { createStarterBeast } from '../utils/beastData';

/**
 * Initialize new game for user
 */
export async function initializeGame(req: AuthRequest, res: Response) {
  const client = await getClient();
  
  try {
    console.log('[Game] Initialize request received');
    const userId = req.user?.id;
    console.log('[Game] User ID:', userId);
    
    if (!userId) {
      console.error('[Game] No user ID found in request');
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { playerName } = req.body;
    console.log('[Game] Player name:', playerName);

    if (!playerName || playerName.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Player name is required' } as ApiResponse);
    }

    console.log('[Game] Starting transaction...');
    await client.query('BEGIN');

    // Check if user already has a game save
    const existingSave = await client.query(
      'SELECT id FROM game_saves WHERE user_id = $1',
      [userId]
    );

    if (existingSave.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ 
        success: false, 
        error: 'User already has a game save' 
      } as ApiResponse);
    }

    const gameSaveResult = await client.query(
      `INSERT INTO game_saves (user_id, player_name, needs_avatar_selection)
       VALUES ($1, $2, true)
       RETURNING id, user_id, player_name, week, coronas, victories, current_title, created_at, updated_at, needs_avatar_selection`,
      [userId, playerName.trim()]
    );

    const gameSave = gameSaveResult.rows[0];

    await client.query('COMMIT');

    console.log(`[Game] Initialized game for user ${userId}: ${playerName} (awaiting guardian selection)`);

    return res.status(201).json({
      success: true,
      data: {
        gameSave: {
          id: gameSave.id,
          userId: gameSave.user_id,
          playerName: gameSave.player_name,
          week: gameSave.week,
          coronas: gameSave.coronas,
          victories: gameSave.victories,
          currentTitle: gameSave.current_title,
          createdAt: gameSave.created_at,
          updatedAt: gameSave.updated_at,
          needsAvatarSelection: gameSave.needs_avatar_selection ?? true,
        } as GameSaveDTO,
        initialBeast: null
      }
    } as ApiResponse);

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {
      // Ignore rollback errors
    });
    console.error('[Game] Initialize error:', error);
    console.error('[Game] Error stack:', error?.stack);
    console.error('[Game] Error details:', {
      message: error?.message,
      name: error?.name,
      code: error?.code,
    });
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to initialize game',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined
    } as ApiResponse);
  } finally {
    client.release();
  }
}

/**
 * Select initial guardian (beast) for a player
 */
export async function selectInitialBeast(req: AuthRequest, res: Response) {
  const client = await getClient();

  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { line, name } = req.body as { line?: string; name?: string };
    if (!line || typeof line !== 'string') {
      return res.status(400).json({ success: false, error: 'Guardian line is required' } as ApiResponse);
    }

    const allowedLines = ['feralis', 'mirella', 'olgrim', 'raukor', 'sylphid', 'ignar', 'terravox'];
    const normalizedLine = line.toLowerCase();

    if (!allowedLines.includes(normalizedLine)) {
      return res.status(400).json({ success: false, error: 'Invalid guardian line' } as ApiResponse);
    }

    await client.query('BEGIN');

    const saveResult = await client.query(
      `SELECT id, needs_avatar_selection FROM game_saves WHERE user_id = $1 FOR UPDATE`,
      [userId]
    );

    if (saveResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ success: false, error: 'Game save not found' } as ApiResponse);
    }

    const gameSave = saveResult.rows[0];

    if (!gameSave.needs_avatar_selection) {
      await client.query('ROLLBACK');
      return res.status(409).json({ success: false, error: 'Guardian already selected' } as ApiResponse);
    }

    const starter = createStarterBeast(normalizedLine, name);

    // Ensure no other beast is active for this save
    await client.query(
      `UPDATE beasts SET is_active = false WHERE game_save_id = $1`,
      [gameSave.id]
    );

    const now = Date.now();

    const columnCheck = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beasts' 
      AND column_name IN (
        'birth_date', 'last_update', 'age_in_days', 'last_day_processed',
        'level', 'experience', 'current_action', 'last_exploration',
        'last_tournament', 'exploration_count', 'work_bonus_count'
      )
    `);

    const availableColumns = columnCheck.rows.map((r) => r.column_name);

    const baseColumns = [
      'game_save_id', 'name', 'line', 'blood', 'affinity', 'is_active',
      'current_hp', 'max_hp', 'essence', 'max_essence',
      'might', 'wit', 'focus', 'agility', 'ward', 'vitality',
      'loyalty', 'stress', 'fatigue', 'techniques', 'traits'
    ];

    const baseValues = [
      gameSave.id,
      starter.name,
      starter.line,
      starter.blood,
      starter.affinity,
      true,
      starter.currentHp,
      starter.maxHp,
      starter.essence,
      starter.maxEssence,
      starter.attributes.might,
      starter.attributes.wit,
      starter.attributes.focus,
      starter.attributes.agility,
      starter.attributes.ward,
      starter.attributes.vitality,
      starter.secondaryStats.loyalty,
      starter.secondaryStats.stress,
      starter.secondaryStats.fatigue,
      JSON.stringify(starter.techniques),
      JSON.stringify(starter.traits)
    ];

    let insertColumns = [...baseColumns];
    let insertValues = [...baseValues];

    if (availableColumns.includes('level')) {
      insertColumns.push('level');
      insertValues.push(1);
    }

    if (availableColumns.includes('experience')) {
      insertColumns.push('experience');
      insertValues.push(0);
    }

    if (availableColumns.includes('birth_date')) {
      insertColumns.push('birth_date');
      insertValues.push(now);
    }

    if (availableColumns.includes('last_update')) {
      insertColumns.push('last_update');
      insertValues.push(now);
    }

    if (availableColumns.includes('age_in_days')) {
      insertColumns.push('age_in_days');
      insertValues.push(0);
    }

    if (availableColumns.includes('last_day_processed')) {
      const midnight = new Date();
      midnight.setHours(0, 0, 0, 0);
      insertColumns.push('last_day_processed');
      insertValues.push(midnight.getTime());
    }

    if (availableColumns.includes('current_action')) {
      insertColumns.push('current_action');
      insertValues.push(null);
    }

    if (availableColumns.includes('last_exploration')) {
      insertColumns.push('last_exploration');
      insertValues.push(0);
    }

    if (availableColumns.includes('last_tournament')) {
      insertColumns.push('last_tournament');
      insertValues.push(0);
    }

    if (availableColumns.includes('exploration_count')) {
      insertColumns.push('exploration_count');
      insertValues.push(0);
    }

    if (availableColumns.includes('work_bonus_count')) {
      insertColumns.push('work_bonus_count');
      insertValues.push(0);
    }

    const placeholders = insertValues.map((_, i) => `$${i + 1}`).join(', ');
    const insertQuery = `INSERT INTO beasts (${insertColumns.join(', ')}) VALUES (${placeholders}) RETURNING *`;

    const beastResult = await client.query(insertQuery, insertValues);
    const beast = beastResult.rows[0];

    await client.query(
      `UPDATE game_saves SET needs_avatar_selection = false WHERE id = $1`,
      [gameSave.id]
    );

    await client.query('COMMIT');

    return res.status(201).json({
      success: true,
      data: beast
    } as ApiResponse<BeastDTO>);

  } catch (error: any) {
    await client.query('ROLLBACK').catch(() => {});
    console.error('[Game] selectInitialBeast error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to create guardian',
      details: process.env.NODE_ENV === 'development' ? error?.message : undefined,
    } as ApiResponse);
  } finally {
    client.release();
  }
}

/**
 * Get game save for current user
 */
export async function getGameSave(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    // Get game save
    const saveResult = await query(
      `SELECT id, user_id, player_name, week, coronas, victories, current_title,
              win_streak, lose_streak, total_trains, total_crafts, total_spent,
              needs_avatar_selection,
              created_at, updated_at
       FROM game_saves
       WHERE user_id = $1`,
      [userId]
    );

    if (saveResult.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'No game save found' } as ApiResponse);
    }

    const gameSave = saveResult.rows[0];

    // Get beasts
    const beastsResult = await query(
      'SELECT * FROM beasts WHERE game_save_id = $1',
      [gameSave.id]
    );

    // Get inventory
    const inventoryResult = await query(
      'SELECT * FROM inventory WHERE game_save_id = $1',
      [gameSave.id]
    );

    // Get quests
    const questsResult = await query(
      'SELECT * FROM quests WHERE game_save_id = $1',
      [gameSave.id]
    );

    // Get achievements
    const achievementsResult = await query(
      'SELECT * FROM achievements WHERE game_save_id = $1',
      [gameSave.id]
    );

    return res.status(200).json({
      success: true,
      data: {
        gameSave,
        beasts: beastsResult.rows,
        inventory: inventoryResult.rows,
        quests: questsResult.rows,
        achievements: achievementsResult.rows
      }
    } as ApiResponse);

  } catch (error) {
    console.error('[Game] Get save error:', error);
    return res.status(500).json({ success: false, error: 'Failed to get game save' } as ApiResponse);
  }
}

/**
 * Update game save
 */
export async function updateGameSave(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { week, coronas, victories, currentTitle, winStreak, loseStreak, totalTrains, totalCrafts, totalSpent } = req.body;

    const result = await query(
      `UPDATE game_saves
       SET week = COALESCE($2, week),
           coronas = COALESCE($3, coronas),
           victories = COALESCE($4, victories),
           current_title = COALESCE($5, current_title),
           win_streak = COALESCE($6, win_streak),
           lose_streak = COALESCE($7, lose_streak),
           total_trains = COALESCE($8, total_trains),
           total_crafts = COALESCE($9, total_crafts),
           total_spent = COALESCE($10, total_spent)
       WHERE user_id = $1
       RETURNING *`,
      [userId, week, coronas, victories, currentTitle, winStreak, loseStreak, totalTrains, totalCrafts, totalSpent]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Game save not found' } as ApiResponse);
    }

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('[Game] Update save error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update game save' } as ApiResponse);
  }
}

/**
 * Update beast data
 */
export async function updateBeast(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ success: false, error: 'Not authenticated' } as ApiResponse);
    }

    const { beastId } = req.params;
    const beastData = req.body;

    // Verify beast belongs to user's game save
    const ownershipCheck = await query(
      `SELECT b.id FROM beasts b
       JOIN game_saves gs ON b.game_save_id = gs.id
       WHERE b.id = $1 AND gs.user_id = $2`,
      [beastId, userId]
    );

    if (ownershipCheck.rows.length === 0) {
      return res.status(404).json({ success: false, error: 'Beast not found' } as ApiResponse);
    }

    // Verificar quais colunas existem na tabela beasts
    const columnCheck = await query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'beasts' 
      AND column_name IN ('elixir_usage', 'current_action', 'last_exploration', 'last_tournament', 
                          'exploration_count', 'birth_date', 'last_update', 'work_bonus_count', 
                          'age_in_days', 'last_day_processed', 'level', 'experience')
    `);
    
    const availableColumns = columnCheck.rows.map(r => r.column_name);
    const hasElixirUsage = availableColumns.includes('elixir_usage');
    const hasCurrentAction = availableColumns.includes('current_action');
    const hasLastExploration = availableColumns.includes('last_exploration');
    const hasLastTournament = availableColumns.includes('last_tournament');
    const hasExplorationCount = availableColumns.includes('exploration_count');
    const hasBirthDate = availableColumns.includes('birth_date');
    const hasLastUpdate = availableColumns.includes('last_update');
    const hasWorkBonusCount = availableColumns.includes('work_bonus_count');
    const hasAgeInDays = availableColumns.includes('age_in_days');
    const hasLastDayProcessed = availableColumns.includes('last_day_processed');
    const hasLevel = availableColumns.includes('level');
    const hasExperience = availableColumns.includes('experience');
    const hasAge = availableColumns.includes('age');

    // Construir UPDATE dinamicamente
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let paramIndex = 2;
    
    // Campos obrigatórios sempre presentes
    const baseFields = [
      { field: 'name', value: beastData.name },
      { field: 'current_hp', value: beastData.currentHp },
      { field: 'max_hp', value: beastData.maxHp },
      { field: 'essence', value: beastData.essence },
      { field: 'max_essence', value: beastData.maxEssence },
      { field: 'might', value: beastData.attributes?.might },
      { field: 'wit', value: beastData.attributes?.wit },
      { field: 'focus', value: beastData.attributes?.focus },
      { field: 'agility', value: beastData.attributes?.agility },
      { field: 'ward', value: beastData.attributes?.ward },
      { field: 'vitality', value: beastData.attributes?.vitality },
      { field: 'loyalty', value: beastData.secondaryStats?.loyalty },
      { field: 'stress', value: beastData.secondaryStats?.stress },
      { field: 'fatigue', value: beastData.secondaryStats?.fatigue },
      { field: 'techniques', value: beastData.techniques ? JSON.stringify(beastData.techniques) : null },
      { field: 'traits', value: beastData.traits ? JSON.stringify(beastData.traits) : null },
    ];

    baseFields.forEach(({ field, value }) => {
      updateFields.push(`${field} = COALESCE($${paramIndex++}, ${field})`);
      updateValues.push(value);
    });

    if (hasAge) {
      updateFields.push(`age = COALESCE($${paramIndex++}, age)`);
      updateValues.push(beastData.secondaryStats?.age);
    }

    if (hasLevel) {
      updateFields.push(`level = COALESCE($${paramIndex++}, level)`);
      updateValues.push(beastData.level);
    }

    if (hasExperience) {
      updateFields.push(`experience = COALESCE($${paramIndex++}, experience)`);
      updateValues.push(beastData.experience);
    }

    if (hasElixirUsage) {
      updateFields.push(`elixir_usage = COALESCE($${paramIndex++}, elixir_usage)`);
      updateValues.push(beastData.elixirUsage ? JSON.stringify(beastData.elixirUsage) : null);
    }

    if (hasCurrentAction) {
      updateFields.push(`current_action = COALESCE($${paramIndex++}, current_action)`);
      updateValues.push(beastData.currentAction ? JSON.stringify(beastData.currentAction) : null);
    }

    if (hasLastExploration) {
      updateFields.push(`last_exploration = COALESCE($${paramIndex++}, last_exploration)`);
      updateValues.push(beastData.lastExploration);
    }

    if (hasLastTournament) {
      updateFields.push(`last_tournament = COALESCE($${paramIndex++}, last_tournament)`);
      updateValues.push(beastData.lastTournament);
    }

    if (hasExplorationCount) {
      updateFields.push(`exploration_count = COALESCE($${paramIndex++}, exploration_count)`);
      updateValues.push(beastData.explorationCount);
    }

    if (hasBirthDate) {
      updateFields.push(`birth_date = COALESCE($${paramIndex++}, birth_date)`);
      updateValues.push(beastData.birthDate);
    }

    if (hasLastUpdate) {
      updateFields.push(`last_update = COALESCE($${paramIndex++}, last_update)`);
      updateValues.push(beastData.lastUpdate);
    }

    if (hasWorkBonusCount) {
      updateFields.push(`work_bonus_count = COALESCE($${paramIndex++}, work_bonus_count)`);
      updateValues.push(beastData.workBonusCount);
    }

    if (hasAgeInDays) {
      updateFields.push(`age_in_days = COALESCE($${paramIndex++}, age_in_days)`);
      updateValues.push(beastData.ageInDays);
    }

    if (hasLastDayProcessed) {
      updateFields.push(`last_day_processed = COALESCE($${paramIndex++}, last_day_processed)`);
      updateValues.push(beastData.lastDayProcessed);
    }

    updateFields.push('updated_at = NOW()');

    const updateQuery = `UPDATE beasts SET ${updateFields.join(', ')} WHERE id = $1 RETURNING *`;
    
    const result = await query(updateQuery, [beastId, ...updateValues]);

    console.log(`[Game] Beast ${beastId} updated for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: result.rows[0]
    } as ApiResponse);

  } catch (error) {
    console.error('[Game] Update beast error:', error);
    return res.status(500).json({ success: false, error: 'Failed to update beast' } as ApiResponse);
  }
}

