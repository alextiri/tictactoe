package com.tictactoe.serverjava.services;

import com.tictactoe.serverjava.dtos.GameHistoryResponse;
import com.tictactoe.serverjava.dtos.GameMoveResponse;
import com.tictactoe.serverjava.middlewares.GameWebSocketHandler;
import com.tictactoe.serverjava.models.Game;
import com.tictactoe.serverjava.models.GameMove;
import com.tictactoe.serverjava.repositories.GameMoveRepository;
import com.tictactoe.serverjava.repositories.GameRepository;
import com.tictactoe.serverjava.repositories.UserRepository;

import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;

@Service
public class GameService {
    private final GameRepository gameRepository;
    private final GameMoveRepository gameMoveRepository;
    private final UserRepository userRepository;
    private final GameWebSocketHandler gameWebSocketHandler;

    public GameService(
        GameRepository gameRepository,
        GameMoveRepository gameMoveRepository,
        GameWebSocketHandler gameWebSocketHandler,
        UserRepository userRepository
    ) {
        this.gameRepository = gameRepository;
        this.gameMoveRepository = gameMoveRepository;
        this.userRepository = userRepository;
        this.gameWebSocketHandler = gameWebSocketHandler;
    }

    public Game getGameById(Integer gameId) {
        Game game = gameRepository.findById(gameId).orElse(null);
        if(game == null) {
            return null;
        }
        return addPlayerUsernames(game);
    }

    public List<GameHistoryResponse> getUserGameHistory(Integer userId) {
        List<Game> games = gameRepository.findByPlayerXIdOrPlayerOIdOrderByCreatedAtDesc(userId, userId);
        List<GameHistoryResponse> history = new ArrayList<>();

        for (Game game : games) {
            List<GameMove> moves =
                gameMoveRepository.findByGameIdOrderByMoveNumberAsc(
                    game.getId()
                );

            List<GameMoveResponse> moveResponses = new ArrayList<>();
            for (GameMove move : moves) {
                String username = userRepository.findById(move.getPlayerId())
                    .orElseThrow()
                    .getUsername();

                moveResponses.add(
                    new GameMoveResponse(
                        move.getMoveNumber(),
                        move.getSymbol(),
                        move.getSquare(),
                        username
                    )
                );
            }

            history.add(new GameHistoryResponse(
                    game.getId(),
                    game.getGameCode(),
                    game.getWinner(),
                    game.getCreatedAt(),
                    moveResponses
                )
            );
        }

        return history;
    }

    public Game createGame(Integer userId) {
        String gameCode;
        do {
            gameCode = UUID.randomUUID()
                .toString()
                .substring(0, 6)
                .toUpperCase();
        } while (gameRepository.existsByGameCode(gameCode));

        Game game = new Game();

        game.setGameCode(gameCode);
        game.setPlayerXId(userId);
        game.setPlayerOId(null);
        game.setBoard(new ArrayList<>(Collections.nCopies(9, "")));
        game.setCurrentTurn("X");
        game.setWinner(null);
        game.setStatus("ongoing");

        Game savedGame = gameRepository.save(game);
        return addPlayerUsernames(savedGame);
    }

    public Game joinGame(Integer userId, String gameCode) {
        if (gameCode == null || gameCode.isBlank()) {
            throw new IllegalArgumentException("Game code is required");
        }

        Game game = gameRepository
            .findByGameCode(gameCode.toUpperCase()).orElseThrow(() ->
                new IllegalArgumentException("No game found for that code")
            );

        if ("finished".equals(game.getStatus())) {
            throw new IllegalArgumentException("Game is already finished");
        }

        if (game.getPlayerXId().equals(userId) || userId.equals(game.getPlayerOId())) {
            return game;
        }

        if (game.getPlayerOId() == null) {
            game.setPlayerOId(userId);
            Game savedGame = gameRepository.save(game);
            return addPlayerUsernames(savedGame);
        }

        throw new IllegalArgumentException("Game is full");
    }

    public Game makeMove(Integer gameId, Integer userId, Integer square) {
        if (square == null || square < 0 || square > 8) {
            throw new IllegalArgumentException("Invalid square");
        }

        Game game = gameRepository.findById(gameId).orElseThrow(() ->
                new IllegalArgumentException("No game found for that ID")
            );

        if ("finished".equals(game.getStatus())) {
            throw new IllegalArgumentException("Game is already finished");
        }

        List<GameMove> moves = gameMoveRepository.findByGameIdOrderByMoveNumberAsc(gameId);
        List<String> board = new ArrayList<>(game.getBoard());

        if (!board.get(square).isEmpty()) {
            throw new IllegalArgumentException("Square is already occupied");
        }

        String symbol;

        if (game.getPlayerXId().equals(userId)) {
            symbol = "X";
        } else if (game.getPlayerOId() != null && game.getPlayerOId().equals(userId)) {
            symbol = "O";
        } else {
            throw new IllegalArgumentException("You are not a player in this game");
        }

        if (!game.getCurrentTurn().equals(symbol)) {
            throw new IllegalArgumentException("It is not your turn");
        }

        GameMove move = new GameMove();
        move.setGameId(gameId);
        move.setPlayerId(userId);
        move.setMoveNumber(moves.size() + 1);
        move.setSymbol(symbol);
        move.setSquare(square);

        gameMoveRepository.save(move);

        board.set(square, symbol);

        String winner = null;
        List<Integer> winningPattern = null;

        int[][] winningPatterns = {
                {0, 1, 2},
                {3, 4, 5},
                {6, 7, 8},
                {0, 3, 6},
                {1, 4, 7},
                {2, 5, 8},
                {0, 4, 8},
                {2, 4, 6}
        };

        for (int[] pattern : winningPatterns) {
            String a = board.get(pattern[0]);
            String b = board.get(pattern[1]);
            String c = board.get(pattern[2]);

            if (!a.isEmpty() && a.equals(b) && a.equals(c)) {
                winner = a;
                winningPattern = List.of(
                        pattern[0],
                        pattern[1],
                        pattern[2]
                );
                break;
            }
        }

        game.setWinningPattern(winningPattern);

        game.setBoard(board);

        if (winner != null) {
            game.setWinner(winner);
            game.setStatus("finished");
        } else if (!board.contains("")) {
            game.setWinner(null);
            game.setStatus("finished");
        } else {
            game.setCurrentTurn("X".equals(symbol) ? "O" : "X");
        }

        Game savedGame = gameRepository.save(game);
        savedGame = addPlayerUsernames(savedGame);

        gameWebSocketHandler.broadcastGame(savedGame);
        return savedGame;
    }

    private Game addPlayerUsernames(Game game) {
        if (game.getPlayerXId() != null) {
            userRepository.findById(game.getPlayerXId())
                .ifPresent(user -> game.setPlayerXUsername(user.getUsername()));
        }

        if (game.getPlayerOId() != null) {
            userRepository.findById(game.getPlayerOId())
                .ifPresent(user -> game.setPlayerOUsername(user.getUsername()));
        }

        return game;
    }
}