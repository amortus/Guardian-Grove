/**
 * Inventory Controller
 * Gerencia inventário dos jogadores
 */

import { Response } from 'express';
import { query } from '../db/connection';
import { AuthRequest } from '../middleware/auth';
import { ApiResponse } from '../types';

/**
 * Adiciona item ao inventário do jogador
 * Se o item já existe, incrementa a quantidade
 */
export async function addInventoryItem(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }

    const { itemId, quantity } = req.body;

    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid itemId or quantity',
      } as ApiResponse);
    }

    // Buscar game_save_id do usuário
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

    // Verificar se item já existe no inventário
    const existingItem = await query(
      'SELECT * FROM inventory WHERE game_save_id = $1 AND item_id = $2',
      [gameSaveId, itemId]
    );

    if (existingItem.rows.length > 0) {
      // Item já existe, incrementar quantidade
      const result = await query(
        `UPDATE inventory 
         SET quantity = quantity + $1 
         WHERE game_save_id = $2 AND item_id = $3
         RETURNING *`,
        [quantity, gameSaveId, itemId]
      );

      console.log(`[Inventory] Added ${quantity}x ${itemId} to user ${userId}'s inventory (total: ${result.rows[0].quantity})`);

      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Added ${quantity}x ${itemId}`,
      } as ApiResponse);
    } else {
      // Item não existe, inserir novo
      const result = await query(
        `INSERT INTO inventory (game_save_id, item_id, quantity)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [gameSaveId, itemId, quantity]
      );

      console.log(`[Inventory] Created ${quantity}x ${itemId} in user ${userId}'s inventory`);

      return res.status(201).json({
        success: true,
        data: result.rows[0],
        message: `Added ${quantity}x ${itemId}`,
      } as ApiResponse);
    }

  } catch (error) {
    console.error('[Inventory] Add item error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to add item to inventory',
    } as ApiResponse);
  }
}

/**
 * Remove item do inventário do jogador
 * Se quantidade chegar a 0, remove o registro
 */
export async function removeInventoryItem(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }

    const { itemId, quantity } = req.body;

    if (!itemId || !quantity || quantity <= 0) {
      return res.status(400).json({
        success: false,
        error: 'Invalid itemId or quantity',
      } as ApiResponse);
    }

    // Buscar game_save_id do usuário
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

    // Verificar se item existe
    const existingItem = await query(
      'SELECT * FROM inventory WHERE game_save_id = $1 AND item_id = $2',
      [gameSaveId, itemId]
    );

    if (existingItem.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in inventory',
      } as ApiResponse);
    }

    const currentQuantity = existingItem.rows[0].quantity;

    // Verificar se tem quantidade suficiente
    if (currentQuantity < quantity) {
      return res.status(400).json({
        success: false,
        error: `Insufficient quantity (has ${currentQuantity}, needs ${quantity})`,
      } as ApiResponse);
    }

    // Se vai chegar a 0, deletar
    if (currentQuantity === quantity) {
      await query(
        'DELETE FROM inventory WHERE game_save_id = $1 AND item_id = $2',
        [gameSaveId, itemId]
      );

      console.log(`[Inventory] Removed ${quantity}x ${itemId} from user ${userId}'s inventory (deleted)`);

      return res.status(200).json({
        success: true,
        message: `Removed ${quantity}x ${itemId}`,
      } as ApiResponse);
    } else {
      // Decrementar quantidade
      const result = await query(
        `UPDATE inventory 
         SET quantity = quantity - $1 
         WHERE game_save_id = $2 AND item_id = $3
         RETURNING *`,
        [quantity, gameSaveId, itemId]
      );

      console.log(`[Inventory] Removed ${quantity}x ${itemId} from user ${userId}'s inventory (remaining: ${result.rows[0].quantity})`);

      return res.status(200).json({
        success: true,
        data: result.rows[0],
        message: `Removed ${quantity}x ${itemId}`,
      } as ApiResponse);
    }

  } catch (error) {
    console.error('[Inventory] Remove item error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to remove item from inventory',
    } as ApiResponse);
  }
}

/**
 * Retorna todo o inventário do jogador
 */
export async function getInventory(req: AuthRequest, res: Response) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        error: 'Not authenticated',
      } as ApiResponse);
    }

    // Buscar game_save_id do usuário
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

    // Buscar todos os itens do inventário
    const inventoryResult = await query(
      'SELECT * FROM inventory WHERE game_save_id = $1 ORDER BY created_at DESC',
      [gameSaveId]
    );

    console.log(`[Inventory] Retrieved ${inventoryResult.rows.length} items for user ${userId}`);

    return res.status(200).json({
      success: true,
      data: inventoryResult.rows,
    } as ApiResponse);

  } catch (error) {
    console.error('[Inventory] Get inventory error:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to get inventory',
    } as ApiResponse);
  }
}

