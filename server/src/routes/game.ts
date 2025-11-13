/**
 * Game Routes
 * Guardian Grove Server
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  initializeGame,
  getGameSave,
  updateGameSave,
  updateBeast
} from '../controllers/gameController';
import {
  getServerTime,
  startBeastAction,
  completeBeastAction,
  cancelBeastAction,
  processDailyCycle
} from '../controllers/timeController';

const router = Router();

// All game routes require authentication
router.use(authenticateToken);

// Initialize new game
router.post('/initialize', initializeGame);

// Game save
router.get('/save', getGameSave);
router.put('/save', updateGameSave);

// Beast management
router.put('/beast/:beastId', updateBeast);

// Time and actions
router.get('/time', getServerTime);
router.post('/beast/:beastId/action/start', startBeastAction);
router.post('/beast/:beastId/action/complete', completeBeastAction);
router.post('/beast/:beastId/action/cancel', cancelBeastAction);
router.post('/beast/:beastId/daily-cycle', processDailyCycle);

export default router;

