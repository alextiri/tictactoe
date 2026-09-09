package com.tictactoe.serverjava.services;

import java.time.Duration;
import java.util.Set;
import java.io.IOException;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.stereotype.Service;
import org.springframework.web.socket.TextMessage;
import org.springframework.web.socket.WebSocketSession;

import org.springframework.data.redis.core.StringRedisTemplate;
import org.springframework.scheduling.annotation.Scheduled;

@Service
public class PresenceService {
    private final Map<Integer, Set<WebSocketSession>> userSessions = new ConcurrentHashMap<>();
    private final StringRedisTemplate redisTemplate;

    public PresenceService(StringRedisTemplate redisTemplate) {
        this.redisTemplate = redisTemplate;
    }

    public boolean userConnected(Integer userId, WebSocketSession session) {
        Set<WebSocketSession> sessions =
            userSessions.computeIfAbsent(
                userId,
                key -> ConcurrentHashMap.newKeySet()
            );

        boolean wasOffline = sessions.isEmpty();
        sessions.add(session);

        if (wasOffline) {
            redisTemplate
                .opsForValue()
                .set(
                    "presence:user:" + userId,
                    "online",
                    Duration.ofSeconds(30)
                );
        }

        return wasOffline;
    }

    public boolean userDisconnected(Integer userId, WebSocketSession session) {
        Set<WebSocketSession> sessions = userSessions.get(userId);

        if (sessions == null) {
            return false;
        }

        sessions.remove(session);

        if (sessions.isEmpty()) {
            userSessions.remove(userId);
            redisTemplate.delete("presence:user:" + userId);
            return true;
        }

        return false;
    }

    public boolean isOnline(Integer userId) {
        return Boolean.TRUE.equals(
            redisTemplate.hasKey("presence:user:" + userId)
        );
    }

    public Set<WebSocketSession> getUserSessions(Integer userId) {
        return userSessions.getOrDefault(userId, Set.of());
    }

    public void sendToUser(Integer userId, String message) {
        Set<WebSocketSession> sessions = getUserSessions(userId);

        for (WebSocketSession session : sessions) {
            if (session.isOpen()) {
                try {
                    session.sendMessage(new TextMessage(message));
                } catch (IOException e) {
                    System.out.println(
                        "Presence WebSocket error: " + e.getMessage()
                    );
                }
            }
        }
    }

    public void refreshPresence(Integer userId) {
        redisTemplate.expire(
            "presence:user:" + userId,
            Duration.ofSeconds(30)
        );
    }

    @Scheduled(fixedRate = 10000, initialDelay = 1000)
    public void refreshOnlineUsers() {
        for (Integer userId : userSessions.keySet()) {
            refreshPresence(userId);
        }
    }
}