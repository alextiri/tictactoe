package com.tictactoe.serverjava.services;

import com.tictactoe.serverjava.models.Game;
import com.tictactoe.serverjava.models.GameInvitation;
import com.tictactoe.serverjava.models.User;
import com.tictactoe.serverjava.repositories.GameInvitationRepository;
import com.tictactoe.serverjava.repositories.UserRepository;

import com.tictactoe.serverjava.dtos.GameInvitationPageResponse;
import com.tictactoe.serverjava.dtos.GameInvitationPageItem;

import java.time.ZoneOffset;
import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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
    public Integer sendInvitation(Integer senderId, Integer receiverId) {
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

        return invitation.getId();
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

    @Transactional
    public void deleteInvitation(Integer invitationId, Integer senderId) {
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

    public GameInvitationPageResponse getUserInvitations(Integer userId, Pageable pageable) {
        Page<GameInvitation> invitations =
            gameInvitationRepository.findUserInvitations(
                userId,
                pageable
            );

        List<GameInvitationPageItem> responses = new ArrayList<>();

        for (GameInvitation invitation : invitations) {
            boolean isSender =
                invitation.getSenderId().equals(userId);

            Integer otherUserId =
                isSender
                    ? invitation.getReceiverId()
                    : invitation.getSenderId();

            User otherUser = userRepository.findById(otherUserId)
                .orElseThrow();

            String type;

            if (!isSender) {
                type = "received";
            } else if (invitation.getStatus().equals("ACCEPTED")) {
                type = "notification";
            } else if (invitation.getStatus().equals("DECLINED")) {
                type = "declined";
            } else {
                type = "sent";
            }

            responses.add(
                new GameInvitationPageItem(
                    invitation.getId(),
                    otherUser.getId(),
                    otherUser.getUsername(),
                    invitation.getCreatedAt().atOffset(ZoneOffset.UTC),
                    invitation.getStatus(),
                    invitation.getGameId() != null
                        ? gameService
                            .getGameById(invitation.getGameId())
                            .getGameCode()
                        : null,
                    type
                )
            );
        }

        return new GameInvitationPageResponse(
            responses,
            invitations.hasNext()
        );
    }
}