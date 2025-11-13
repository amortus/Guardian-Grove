/**
 * Inventory Routes
 * Rotas para gerenciar inventário dos jogadores
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  addInventoryItem, 
  removeInventoryItem, 
  getInventory 
} from '../controllers/inventoryController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * GET /api/inventory
 * Retorna todo o inventário do jogador
 */
router.get('/', getInventory);

/**
 * POST /api/inventory/add
 * Adiciona item ao inventário
 * Body: { itemId: string, quantity: number }
 */
router.post('/add', addInventoryItem);

/**
 * POST /api/inventory/remove
 * Remove item do inventário
 * Body: { itemId: string, quantity: number }
 */
router.post('/remove', removeInventoryItem);

export default router;

