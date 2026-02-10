import type { Request, Response, NextFunction } from 'express';
import pool from '../db.js';
import crypto from 'crypto';

interface IdParams {
  id: string;
}

export const createGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user;
    const gameCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const initialBoard = { cells: ["", "", "", "", "", "", "", "", ""] };
    const result = await pool.query(
      `INSERT INTO games (player_x_id, game_code, current_turn, board)
      VALUES ($1, $2, 'X', $3)
      RETURNING *`,
    [userId, gameCode, initialBoard]
    );

    res.status(201).json({
      message: 'Game created succesfully',
      game: result.rows[0],
    });
  } catch (error) {
    console.log('Error creating game', error);
    next(error);
  }
};

// export const getGames = async (req: Request, res: Response, next: NextFunction) => {
//   try {
//     res.json(items);
//   } catch (error) {
//     next(error);
//   }
// };

export const getGameById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as unknown as IdParams;
    const gameId = parseInt(id, 10);

    const result = await pool.query(
      'SELECT * FROM games WHERE id = $1',
      [gameId]
    );

    if(result.rows.length === 0) {
      return res.status(404).json({ message: 'Game not found'});
    }

    res.json({ game: result.rows[0] });
  } catch (error) {
    next(error);
  }
};

// export const updateItem = (req: Request<IdParams>, res: Response, next: NextFunction) => {
//     try {
//         const id = parseInt(req.params.id, 10);
//         const { name } = req.body;
//         const itemIndex = items.findIndex((i) => i.id === id);
//         if (itemIndex === -1) {
//             res.status(404).json({ message: 'Item not found' });
//             return;
//         }

//         const item = items[itemIndex];
//         if (!item) {
//             res.status(404).json({ message: 'Item not found' });
//             return;
//         }

//         item.name = name;
//         res.json(item);
//     } catch (error) {
//         next(error);
//     }
// };

// export const deleteItem = (req: Request<IdParams>, res: Response, next: NextFunction) => {
//   try {
//     const id = parseInt(req.params.id, 10);
//     const itemIndex = items.findIndex((i) => i.id === id);
//     if (itemIndex === -1) {
//       res.status(404).json({ message: 'Item not found' });
//       return;
//     }
//     const deletedItem = items.splice(itemIndex, 1)[0];
//     res.json(deletedItem);
//   } catch (error) {
//     next(error);
//   }
// };