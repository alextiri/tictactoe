package com.tictactoe.serverjava.controllers;

import java.util.Map;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import com.tictactoe.serverjava.dtos.GameInvitationPageResponse;
import com.tictactoe.serverjava.models.Game;
import com.tictactoe.serverjava.services.GameInvitationService;

@RestController
@RequestMapping("/api/game-invitations")
public class GameInvitationController {
    private final GameInvitationService gameInvitationService;

    public GameInvitationController(
        GameInvitationService gameInvitationService
    ) {
        this.gameInvitationService = gameInvitationService;
    }

    @PostMapping
    public ResponseEntity<?> sendInvitation(@RequestBody Map<String, Integer> request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer senderId = Integer.valueOf(authentication.getName());

        gameInvitationService.sendInvitation(
            senderId,
            request.get("receiverId")
        );

        return ResponseEntity
            .status(201)
            .body(Map.of(
                "message", "Game invitation sent successfully"
            ));
    }

    @PostMapping("/{id}/accept")
    public ResponseEntity<?> acceptInvitation(@PathVariable Integer id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer receiverId = Integer.valueOf(authentication.getName());
        Game game = gameInvitationService.acceptInvitation(
            id,
            receiverId
        );

        return ResponseEntity.ok(
            Map.of(
                "message", "Game invitation accepted",
                "game", game
            )
        );
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> declineInvitation(@PathVariable Integer id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer receiverId = Integer.valueOf(authentication.getName());

        gameInvitationService.declineInvitation(
            id,
            receiverId
        );

        return ResponseEntity.ok(
            Map.of(
                "message", "Game invitation declined"
            )
        );
    }

    @DeleteMapping("/sent/{id}")
    public ResponseEntity<?> cancelInvitation(@PathVariable Integer id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        Integer senderId = Integer.valueOf(authentication.getName());

        gameInvitationService.deleteInvitation(
            id,
            senderId
        );

        return ResponseEntity.ok(
            Map.of(
                "message", "Game invitation cancelled"
            )
        );
    }

    @GetMapping("/all")
    public GameInvitationPageResponse getUserInvitations(
        @PageableDefault(size = 20) Pageable pageable,
        Authentication authentication
    ) {
        Integer userId = Integer.parseInt(authentication.getName());

        return gameInvitationService.getUserInvitations(
            userId,
            pageable
        );
    }
}