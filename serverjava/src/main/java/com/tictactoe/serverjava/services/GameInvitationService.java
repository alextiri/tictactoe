package com.tictactoe.serverjava.services;

import com.tictactoe.serverjava.dtos.GameInvitationResponse;
import com.tictactoe.serverjava.models.Game;
import com.tictactoe.serverjava.models.GameInvitation;
import com.tictactoe.serverjava.models.User;
import com.tictactoe.serverjava.repositories.GameInvitationRepository;
import com.tictactoe.serverjava.repositories.UserRepository;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class GameInvitationService {
    private final GameInvitationRepository gameInvitationRepository;
    private final UserRepository userRepository;
    private final GameService gameService;
    private final PresenceService presenceService;
    
    public GameInvitationService(
        GameInvitationRepository gameInvitationRepository,
        UserRepository userRepository,
        GameService gameService,
        PresenceService presenceService
    ) {
        this.gameInvitationRepository = gameInvitationRepository;
        this.userRepository = userRepository;
        this.gameService = gameService;
        this.presenceService = presenceService;
    }

    @Transactional
    public void sendInvitation(Integer senderId, Integer receiverId) {
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException(
                "You cannot invite yourself"
            );
        }

        userRepository.findById(receiverId)
            .orElseThrow(() ->
                new IllegalArgumentException("User not found")
            );

        if (gameInvitationRepository.existsBetweenUsers(
            senderId,
            receiverId
        )) {
            throw new IllegalArgumentException(
                "Game invitation already exists"
            );
        }

        GameInvitation invitation = new GameInvitation();

        invitation.setSenderId(senderId);
        invitation.setReceiverId(receiverId);
        invitation.setStatus("PENDING");

        gameInvitationRepository.save(invitation);

        presenceService.sendToUser(
            receiverId,
            "game-invitation:new"
        );
    }

    public List<GameInvitationResponse> getPendingInvitations(Integer receiverId) {
        List<GameInvitation> invitations =
            gameInvitationRepository.findByReceiverIdAndStatus(
                receiverId,
                "PENDING"
            );

        List<GameInvitationResponse> responses = new ArrayList<>();

        for (GameInvitation invitation : invitations) {
            User sender = userRepository.findById(invitation.getSenderId())
                .orElseThrow();

            responses.add(
                new GameInvitationResponse(
                    invitation.getId(),
                    sender.getId(),
                    sender.getUsername(),
                    invitation.getCreatedAt().atOffset(ZoneOffset.UTC),
                    invitation.getStatus(),
                    null
                )
            );
        }

        return responses;
    }

    @Transactional
    public Game acceptInvitation(Integer invitationId, Integer receiverId) {
        GameInvitation invitation =
            gameInvitationRepository.findById(invitationId)
                .orElseThrow(() ->
                    new IllegalArgumentException("Game invitation not found")
                );

        if (!invitation.getReceiverId().equals(receiverId)) {
            throw new IllegalArgumentException(
                "You cannot accept this invitation"
            );
        }

        Game game = gameService.createGame(
            receiverId,
            invitation.getSenderId()
        );

        invitation.setGameId(game.getId());
        invitation.setStatus("ACCEPTED");
        gameInvitationRepository.save(invitation);

        presenceService.sendToUser(
            invitation.getSenderId(),
            "game-invitation:accepted:" + receiverId + ":" + game.getGameCode()
        );

        return game;
    }

    @Transactional
    public void declineInvitation(Integer invitationId, Integer receiverId) {
        GameInvitation invitation =
            gameInvitationRepository.findById(invitationId)
                .orElseThrow(() ->
                    new IllegalArgumentException("Game invitation not found")
                );

        if (!invitation.getReceiverId().equals(receiverId)) {
            throw new IllegalArgumentException(
                "You cannot decline this invitation"
            );
        }

        invitation.setStatus("DECLINED");
        gameInvitationRepository.save(invitation);

        presenceService.sendToUser(
            invitation.getSenderId(),
            "game-invitation:declined:" + receiverId
        );
    }

    public List<GameInvitationResponse> getSentInvitations(Integer senderId) {
        List<GameInvitation> invitations = gameInvitationRepository.findBySenderId(senderId);
        List<GameInvitationResponse> responses = new ArrayList<>();

        for (GameInvitation invitation : invitations) {
            User receiver = userRepository.findById(invitation.getReceiverId())
                .orElseThrow();

            responses.add(
                new GameInvitationResponse(
                    invitation.getId(),
                    receiver.getId(),
                    receiver.getUsername(),
                    invitation.getCreatedAt().atOffset(ZoneOffset.UTC),
                    invitation.getStatus(),
                    invitation.getGameId() != null
                        ? gameService.getGameById(invitation.getGameId()).getGameCode()
                        : null
                )
            );
        }

        return responses;
    }

    @Transactional
    public void cancelInvitation(Integer invitationId, Integer senderId) {
        GameInvitation invitation =
            gameInvitationRepository.findById(invitationId)
                .orElseThrow(() ->
                    new IllegalArgumentException("Game invitation not found")
                );

        if (!invitation.getSenderId().equals(senderId)) {
            throw new IllegalArgumentException(
                "You cannot cancel this invitation"
            );
        }

        gameInvitationRepository.delete(invitation);

        presenceService.sendToUser(
            invitation.getReceiverId(),
            "game-invitation:cancelled:" + senderId
        );
    }
}