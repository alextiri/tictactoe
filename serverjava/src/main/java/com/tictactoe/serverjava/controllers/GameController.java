package com.tictactoe.serverjava.controllers;

import java.util.List;
import java.util.Map;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.tictactoe.serverjava.dtos.GameHistoryListResponse;
import com.tictactoe.serverjava.dtos.GameHistoryResponse;
import com.tictactoe.serverjava.models.Game;
import com.tictactoe.serverjava.services.GameService;

@RestController
@RequestMapping("/api/games")
public class GameController {
    private final GameService gameService;

    public GameController(GameService gameService) {
        this.gameService = gameService;
    }

    @GetMapping("/history")
    public GameHistoryListResponse getHistory() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer userId = Integer.valueOf(authentication.getName());

        List<GameHistoryResponse> history = gameService.getUserGameHistory(userId);

        return new GameHistoryListResponse(history);
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getGameById(@PathVariable String id) {
        Integer gameId;
        try {
            gameId = Integer.parseInt(id);
        } catch (NumberFormatException e) {
            return ResponseEntity
                .badRequest()
                .body(Map.of("message", "Invaid game ID"));
        }

        Game game = gameService.getGameById(gameId);

        if (game == null) {
            return ResponseEntity
                .badRequest()
                .body(Map.of("message", "No game found for that ID"));
        }

        return ResponseEntity.ok(
            Map.of("game", game)
        );
    }

    @PostMapping
    public ResponseEntity<?> createGame() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer userId = Integer.valueOf(authentication.getName());

        Game game = gameService.createGame(userId);

        return ResponseEntity
            .status(201)
            .body(Map.of(
                "message", "Game created successfully",
                "game", game
            ));
    }

    @PostMapping("/join")
    public ResponseEntity<?> joinGame(@RequestBody Map<String, String> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

        Integer userId = Integer.valueOf(authentication.getName());
        Game game = gameService.joinGame(
            userId,
            request.get("gameCode")
        );

        return ResponseEntity.ok(
            Map.of(
                "message", "Game joined successfully",
                "game", game
            )
        );
    }

    @PostMapping("/{id}/move")
    public ResponseEntity<?> makeMove(
        @PathVariable Integer id,
        @RequestBody Map<String, Integer> request
    ) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer userId = Integer.valueOf(authentication.getName());

        Game game = gameService.makeMove(
            id,
            userId,
            request.get("square")
        );

        return ResponseEntity.ok(Map.of("game", game));
    }
}