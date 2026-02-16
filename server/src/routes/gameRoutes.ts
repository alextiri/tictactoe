import { Router } from 'express';
import {
  createGame,
  getUserGameHistory,
  getGameById,
  makeMove,
  joinGame,
  // deleteItem,
} from '../controllers/gameController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

router.get('/history', authMiddleware, getUserGameHistory)
router.get('/:id', authMiddleware, getGameById);
router.post('/join', authMiddleware, joinGame);
router.post('/', authMiddleware, createGame);
router.post('/:id/move', authMiddleware, makeMove);
// router.delete('/:id', authMiddleware, deleteItem);

export default router;