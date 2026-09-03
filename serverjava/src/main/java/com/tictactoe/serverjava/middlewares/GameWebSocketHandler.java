package com.tictactoe.serverjava.middlewares;

import com.tictactoe.serverjava.models.Game;
import org.springframework.web.socket.WebSocketHandler;
import org.springframework.web.socket.WebSocketSession;

import tools.jackson.databind.ObjectMapper;

import org.springframework.web.socket.WebSocketMessage;
import org.springframework.web.socket.CloseStatus;
import org.springframework.web.socket.TextMessage;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.util.Map;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class GameWebSocketHandler implements WebSocketHandler {
    private final Map<Integer, Set<WebSocketSession>> gameSessions =
        new ConcurrentHashMap<>();
    private final Map<WebSocketSession, Integer> sessionGames =
        new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper;

    public GameWebSocketHandler(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    @Override
    public void afterConnectionEstablished(WebSocketSession session) {
        String query = session.getUri().getQuery();
        Integer gameId = null;

        for (String parameter : query.split("&")) {
            String[] parts = parameter.split("=", 2);

            if (parts.length == 2 && parts[0].equals("gameId")) {
                gameId = Integer.parseInt(parts[1]);
                break;
            }
        }

        if (gameId == null) {
            try {
                session.close(CloseStatus.BAD_DATA);
            } catch (IOException ignored) {
            }
            return;
        }

        gameSessions
            .computeIfAbsent(gameId, key -> ConcurrentHashMap.newKeySet())
            .add(session);
        sessionGames.put(session, gameId);

        System.out.println(
            "WebSocket connected: " + session.getId()
                + " to game " + gameId
        );
    }

    @Override
    public void handleMessage(
        WebSocketSession session,
        WebSocketMessage<?> message
    ) {
        System.out.println("WebSocket message: " + message.getPayload());
    }

    @Override
    public void handleTransportError(
        WebSocketSession session,
        Throwable exception
    ) {
        System.out.println("WebSocket error: " + exception.getMessage());
    }

    @Override
    public void afterConnectionClosed(
        WebSocketSession session,
        CloseStatus status
    ) {
        Integer gameId = sessionGames.remove(session);

        if (gameId != null) {
            Set<WebSocketSession> sessions = gameSessions.get(gameId);

            if (sessions != null) {
                sessions.remove(session);
            }
        }

        System.out.println("WebSocket disconnected: " + session.getId());
    }

    @Override
    public boolean supportsPartialMessages() {
        return false;
    }

    public void broadcastGame(Game game) {
        Integer gameId = game.getId();
        Set<WebSocketSession> sessions = gameSessions.get(gameId);

        if (sessions == null) {
            return;
        }

        try {
            String message = objectMapper.writeValueAsString(game);
            for (WebSocketSession session : sessions) {
                if (session.isOpen()) {
                    session.sendMessage(new TextMessage(message));
                }
            }
        } catch (IOException e) {
            System.out.println("WebSocket broadcast error: " + e.getMessage());
        }
    }
}