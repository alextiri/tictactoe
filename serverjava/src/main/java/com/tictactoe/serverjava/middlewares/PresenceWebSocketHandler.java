package com.tictactoe.serverjava.middlewares;

import org.springframework.web.socket.WebSocketSession;
import org.springframework.stereotype.Component;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.handler.TextWebSocketHandler;
import org.springframework.web.socket.TextMessage;

import com.tictactoe.serverjava.services.FriendRequestService;
import com.tictactoe.serverjava.services.JwtService;
import com.tictactoe.serverjava.services.PresenceService;

@Component
public class PresenceWebSocketHandler extends TextWebSocketHandler {
    private final PresenceService presenceService;
    private final JwtService jwtService;
    private final FriendRequestService friendRequestService;

    public PresenceWebSocketHandler(
        PresenceService presenceService,
        JwtService jwtService,
        FriendRequestService friendRequestService
    ) {
        this.presenceService = presenceService;
        this.jwtService = jwtService;
        this.friendRequestService = friendRequestService;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        Integer userId = getUserId(session);
        
        if (userId != null) {
            boolean cameOnline = presenceService.userConnected(userId, session);

            if (cameOnline) {
                System.out.println("User " + userId + " is online");

                for (Integer friendId : friendRequestService.getFriendIds(userId)) {
                    presenceService.sendToUser(
                        friendId,
                        "online: " + userId
                    );
                }
            }
        }
    }

    @Override
    public void handleTextMessage(WebSocketSession session, TextMessage message) {
        if (!message.getPayload().equals("logout")) {
            return;
        }

        Integer userId = getUserId(session);

        if (userId != null) {
            boolean wentOffline = presenceService.userDisconnected(userId, session);

            if (wentOffline) {
                System.out.println("User " + userId + " is offline");

                for (Integer friendId : friendRequestService.getFriendIds(userId)) {
                    presenceService.sendToUser(
                        friendId,
                        "offline:" + userId
                    );
                }
            }
        }
    }

    @Override
    public void afterConnectionClosed(WebSocketSession session, CloseStatus status) {
        Integer userId = getUserId(session);

        if (userId != null) {
            boolean wentOffline = presenceService.userDisconnected(userId, session);

            if (wentOffline) {
                System.out.println("User " + userId + " is offline");

                for (Integer friendId : friendRequestService.getFriendIds(userId)) {
                    presenceService.sendToUser(
                        friendId,
                        "offline: " + userId
                    );
                }
            }
        }
    }

    private Integer getUserId(WebSocketSession session) {
        String query = session.getUri().getQuery();

        if (query == null) {
            return null;
        }

        for (String parameter : query.split("&")) {
            String[] parts = parameter.split("=", 2);

            if (parts.length == 2 && parts[0].equals("token")) {
                String userId = jwtService.extractUserId(parts[1]);
                return Integer.valueOf(userId);
            }
        }

        return null;
    }
}