import { Router } from 'express';
import {
  createGame,
  // getGames,
  getGameById,
  // updateItem,
  // deleteItem,
} from '../controllers/gameController.js';
import { authMiddleware } from '../middlewares/authMiddleware.js';

const router = Router();

// router.get('/', authMiddleware, getGames);
router.get('/:id', authMiddleware, getGameById);
router.post('/', authMiddleware, createGame);
// router.put('/:id', authMiddleware, updateItem);
// router.delete('/:id', authMiddleware, deleteItem);

export default router;