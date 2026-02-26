import type { Request, Response, NextFunction } from 'express';
import crypto from 'crypto';
import { User, Game, GameMove } from '../models/associations.js';
import { Op } from 'sequelize';

interface IdParams {
  id: string;
}

export const createGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user;

    const gameCode = crypto.randomBytes(3).toString('hex').toUpperCase();

    const newGame = await Game.create({
      player_x_id: userId,
      game_code: gameCode,
      current_turn: 'X',
      board: Array(9).fill("")
    })

    res.status(201).json({
      message: 'Game created successfully',
      game: newGame.toJSON(),
    });
  } catch (error) {
    console.log('Error creating game', error);
    next(error);
  }
};

export const getUserGameHistory = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { userId } = (req as any).user;

    const games = await Game.findAll({
      where: {
        [Op.or]: [
          { player_x_id: userId },
          { player_o_id: userId }
        ]
      },
      include: [
        {
          model: GameMove,
          as: 'moves',
          include: [
            {
              model: User,
              as: 'player',
              attributes: ['username']
            }
          ],
          order: [['move_number', 'ASC']]
        }
      ],
      order: [['id', 'ASC']]
    })

    const history = games.map(game => ({
      gameId: game.id,
      gameCode: game.game_code,
      winner: game.winner,
      createdAt: game.createdAt.toISOString(),
      moves: (game.moves ?? []).map(move => ({
        moveNumber: move.move_number,
        symbol: move.symbol,
        square: move.square,
        username: move.player!.username
      }))
    }));

    res.json({ history });
  } catch (error) {
    next(error);
  }
};


export const getGameById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as unknown as IdParams;
    const gameId = parseInt(id, 10);

    if(isNaN(gameId)) {
      return res.status(400).json({ message: 'Invaid game ID' });
    }

    const game = await Game.findByPk(gameId);
    if(!game) {
      return res.status(400).json({ message: 'No game found for that ID' });
    }

    res.json({ game: game.toJSON() });
  } catch (error) {
    next(error);
  }
};

export const joinGame = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { gameCode } = req.body;
    const { userId } = (req as any).user;

    if(!gameCode || typeof gameCode !== 'string') {
      return res.status(400).json({ message: 'Game code required' });
    }

    const game = await Game.findOne({
      where: { game_code: gameCode.toUpperCase() }
    });

    if(!game) {
      return res.status(400).json({ message: 'Game not found' });
    }

    if(game.status === 'finished') {
      return res.status(400).json({ message: 'Game already finished' });
    }

    if (game.player_x_id === userId || game.player_o_id === userId) {
      return res.json({
        message: 'Rejoined game',
        game: game.toJSON()
      });
    }

    if (game.player_x_id && game.player_o_id) {
      return res.status(400).json({ message: 'Game is already full' });
    }

    if (!game.player_o_id) {
      game.player_o_id = userId;
      await game.save();

      return res.json({
        message: 'Joined game as player O',
        game: game.toJSON()
      });
    }

    return res.status(400).json({ message: 'Unable to join game' });
  } catch(error) {
    next(error);
  }
}

export const makeMove = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params as unknown as IdParams;
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
      [2,4,6]
    ];

    if (square === undefined || square < 0 || square > 8) {
      return res.status(400).json({ message: 'Invalid square' });
    }

    const game = await Game.findByPk(gameId);
    if (!game) {
      return res.status(400).json({ message: 'Game not found' });
    }

    if (userId !== game.player_x_id && userId !== game.player_o_id) {
      return res.status(403).json({ message: 'Not a player in this game' });
    }

    if (game.status === 'finished') {
      return res.status(400).json({ message: 'Game already finished' });
    }

    const moves = await GameMove.findAll({
      where: { game_id: gameId },
      order: [['move_number', 'ASC']],
    });

    const board: string[] = Array(9).fill('');
    for (const move of moves) {
      board[move.square] = move.symbol;
    }

    if (board[square] !== '') {
      return res.status(400).json({ message: 'Square already occupied' });
    }

    let playerSymbol: 'X' | 'O' = 'X';
    const xCount = board.filter(cell => cell === 'X').length;
    const oCount = board.filter(cell => cell === 'O').length;
    playerSymbol = xCount <= oCount ? 'X' : 'O';

    board[square] = playerSymbol;

    const moveNumber = moves.length + 1;
    await GameMove.create({
      game_id: gameId,
      move_number: moveNumber,
      player_id: userId,
      symbol: playerSymbol,
      square,
    });

    let winnerChar: 'X' | 'O' | null = null;
    let winnerPattern: number[] | null = null;
    for (const pattern of WIN_PATTERNS) {
      const [a, b, c] = pattern;
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        winnerChar = playerSymbol;
        winnerPattern = pattern;
        break;
      }
    }

    const isDraw = !winnerChar && board.every(cell => cell !== '');

    game.board = board;
    game.current_turn = playerSymbol === 'X' ? 'O' : 'X';
    game.winner = winnerChar;
    game.status = winnerChar || isDraw ? 'finished' : 'ongoing';

    await game.save();

    res.json({
      game: {
        id: game.id,
        player_x_id: game.player_x_id,
        player_o_id: game.player_o_id,
        game_code: game.game_code,
        current_turn: game.current_turn,
        board,
        winner: game.winner,
        status: game.status,
        winningPattern: winnerPattern,
      }
    });

  } catch (error) {
    next(error);
  }
};