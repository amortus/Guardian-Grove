/**
 * Progress Routes
 * Rotas para gerenciar progresso de quests e achievements
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { 
  saveQuestProgress,
  saveAchievementProgress,
  getProgress
} from '../controllers/progressController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

/**
 * GET /api/progress
 * Retorna progresso de quests e achievements
 */
router.get('/', getProgress);

/**
 * POST /api/progress/quest
 * Salva progresso de uma quest
 * Body: { questId: string, progress: object, isCompleted: boolean, isActive: boolean }
 */
router.post('/quest', saveQuestProgress);

/**
 * POST /api/progress/achievement
 * Salva progresso de uma achievement
 * Body: { achievementId: string, progress: number, unlocked: boolean }
 */
router.post('/achievement', saveAchievementProgress);

export default router;

