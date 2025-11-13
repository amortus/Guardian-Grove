/**
 * Friends Routes
 * Guardian Grove Server
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import {
  getFriends,
  getFriendRequests,
  sendFriendRequest,
  acceptFriendRequest,
  removeFriend,
  getOnlineFriends,
} from '../controllers/friendsController';

const router = Router();

// Todas as rotas requerem autenticação
router.use(authenticateToken);

router.get('/', getFriends);
router.get('/requests', getFriendRequests);
router.post('/request', sendFriendRequest);
router.post('/accept/:friendId', acceptFriendRequest);
router.delete('/:friendId', removeFriend);
router.get('/online', getOnlineFriends);

export default router;

