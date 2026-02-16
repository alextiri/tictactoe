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

export const getUserGameHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user;
    const result = await pool.query(`
      SELECT 
        g.id AS game_id,
        g.game_code,
        g.winner,
        g.created_at,
        gm.move_number,
        gm.symbol,
        gm.square,
        u.username
      FROM games g
      JOIN game_moves gm ON g.id = gm.game_id
      JOIN users u ON gm.player_id = u.id
      WHERE g.player_x_id = $1 OR g.player_o_id = $1
      ORDER BY g.id, gm.move_number
    `, [userId]);

    const history: {
      gameId: number;
      gameCode: string;
      winner: string | null;
      createdAt: string;
      moves: { moveNumber: number; symbol: string; square: number; username: string }[];
    }[] = [];

    let currentGameId: number | null = null;
    let currentGame: typeof history[0] | null = null;

    for (const row of result.rows) {
      if (row.game_id !== currentGameId) {
        if (currentGame) history.push(currentGame);
        currentGameId = row.game_id;
        currentGame = {
          gameId: row.game_id,
          gameCode: row.game_code,
          winner: row.winner,
          createdAt: row.created_at,
          moves: []
        };
      }

      if (currentGame) {
        currentGame.moves.push({
          moveNumber: row.move_number,
          symbol: row.symbol,
          square: row.square,
          username: row.username
        });
      }
    }
    if (currentGame) history.push(currentGame);
    res.json({ history });
  } catch (error) {
    next(error);
  }
};


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

export const joinGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameCode } = req.body;
    const { userId } = (req as any).user;

    if(!gameCode || typeof(gameCode) !== "string") {
      return res.status(400).json({ message: "Game code is required"});
    }

    const gameResult = await pool.query(
      `SELECT * FROM games WHERE game_code = $1`,
      [gameCode.toUpperCase()]
    );

    if(gameResult.rows.length === 0) {
      return res.status(400).json({ message: "Game not found"});
    }

    const game = gameResult.rows[0];

    if(game.status === "finished") {
      return res.status(400).json({ message: "Game already finished"});
    }
    if(game.player_x_id === userId || game.player_o_id === userId) {
      return res.json({
        message: "Rejoined game",
        game
      });
    }
    if(game.player_x_id && game.player_o_id) {
      return res.status(400).json({ message: "Game is already full" });
    }

    if (!game.player_o_id) {
      const updated = await pool.query(
        `UPDATE games
         SET player_o_id = $1,
             updated_at = NOW()
         WHERE id = $2
         RETURNING *`,
        [userId, game.id]
      );

      return res.json({
        message: "Joined game as player O",
        game: updated.rows[0]
      });
    }
    return res.status(400).json({ message: "Unable to join game" });
  } catch(error) {
    next(error);
  }
}

export const makeMove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as unknown as IdParams
    const gameId = parseInt(id, 10);
    const { square } = req.body;
    const { userId } = (req as any).user;

    const WIN_PATTERNS: [number, number, number][] = [
      [0,1,2],
      [3,4,5],
      [6,7,8],
      [0,3,6],
      [1,4,7],
      [2,5,8],
      [0,4,8],
      [2,4,6],
    ];

    const checkWinner = (board: string[]): number[] | 'DRAW' | null => {
      for (const pattern of WIN_PATTERNS) {
        const [a, b, c] = pattern;
        if (board[a] !== "" && board[a] === board[b] && board[a] === board[c]) {
          return pattern;
        }
      }
      if (board.every(cell => cell !== "")) return 'DRAW';
      return null;
    };

    if (square === undefined || square < 0 || square > 8) {
      return res.status(400).json({ message: "Invalid square" });
    }

    const gameResult = await pool.query(
      `SELECT * FROM games WHERE id = $1`,
      [gameId]
    );
    if (gameResult.rows.length === 0) {
      return res.status(404).json({ message: "Game not found" });
    }

    const game = gameResult.rows[0];
    if (userId !== game.player_x_id && userId !== game.player_o_id) {
      return res.status(403).json({ message: "Not a player in this game" });
    }
    if (game.status === 'finished') {
      return res.status(400).json({ message: "Game already finished" });
    }

    // const playerSymbol =
    // userId === game.player_x_id ? 'X' :
    // userId === game.player_o_id ? 'O' : null;

    // if (playerSymbol !== game.current_turn) {
    //   return res.status(400).json({ message: "Not your turn" });
    // }
    let playerSymbol = 'X';
    if (game.board.cells.filter(cell => cell === 'X').length <= game.board.cells.filter(cell => cell === 'O').length) {
        playerSymbol = 'X';
    } else {
        playerSymbol = 'O';
    }

    game.current_turn = playerSymbol;
    const board = game.board.cells;
    if (board[square] !== "") {
      return res.status(400).json({ message: "Square already occupied" });
    }

    board[square] = playerSymbol;
    const nextTurn = playerSymbol === 'X' ? 'O' : 'X';
    const moveCountResult = await pool.query(
      `SELECT COUNT(*) FROM game_moves WHERE game_id = $1`,
      [gameId]
    );

    const moveNumber = parseInt(moveCountResult.rows[0].count, 10) + 1;

    await pool.query(
      `INSERT INTO game_moves (game_id, move_number, player_id, symbol, square)
      VALUES ($1, $2, $3, $4, $5)`,
      [gameId, moveNumber, userId, playerSymbol, square]
    );

    await pool.query(
      `UPDATE games
      SET board = $1,
          current_turn = $2,
          last_move_at = NOW(),
          updated_at = NOW()
      WHERE id = $3`,
      [{ cells: board }, nextTurn, gameId]
    );

    const winnerPattern = checkWinner(board);
    let status = 'ongoing';
    let winnerChar = null;

    if (winnerPattern && winnerPattern !== 'DRAW') {
        status = 'finished';
        winnerChar = playerSymbol;
    } else if (winnerPattern === 'DRAW') {
        status = 'finished';
    }

    await pool.query(
      `UPDATE games
      SET board = $1,
          current_turn = $2,
          winner = $3,
          status = $4,
          last_move_at = NOW(),
          updated_at = NOW()
      WHERE id = $5`,
      [{ cells: board }, nextTurn, winnerChar, status, gameId]
    );

    const updatedGame = await pool.query(
      `SELECT * FROM games WHERE id = $1`,
      [gameId]
    );
    const updatedGameRow = updatedGame.rows[0];
    res.json({
      game: {
        id: updatedGameRow.id,
        player_x_id: updatedGameRow.player_x_id,
        player_o_id: updatedGameRow.player_o_id,
        game_code: updatedGameRow.game_code,
        current_turn: nextTurn,
        board: { cells: board },
        winner: winnerChar,
        status,
        winningPattern: winnerPattern === 'DRAW' ? null : winnerPattern
      }
    });
    } catch (error) {
    next(error);
  }
}

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