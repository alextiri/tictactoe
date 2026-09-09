package com.tictactoe.serverjava.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.socket.config.annotation.EnableWebSocket;
import org.springframework.web.socket.config.annotation.WebSocketConfigurer;
import org.springframework.web.socket.config.annotation.WebSocketHandlerRegistry;

import com.tictactoe.serverjava.middlewares.GameWebSocketHandler;
import com.tictactoe.serverjava.middlewares.PresenceWebSocketHandler;

@Configuration
@EnableWebSocket
public class WebSocketConfig implements WebSocketConfigurer {
    private final GameWebSocketHandler gameWebSocketHandler;
    private final PresenceWebSocketHandler presenceWebSocketHandler;

    public WebSocketConfig(GameWebSocketHandler gameWebSocketHandler, PresenceWebSocketHandler presenceWebSocketHandler) {
        this.gameWebSocketHandler = gameWebSocketHandler;
        this.presenceWebSocketHandler = presenceWebSocketHandler;
    }

    @Override
    public void registerWebSocketHandlers(WebSocketHandlerRegistry registry) {
        registry
            .addHandler(gameWebSocketHandler, "/ws/games")
            .setAllowedOrigins(
                "http://localhost:5173",
                "https://tictactoe-rho-kohl.vercel.app"
            );

        registry
            .addHandler(presenceWebSocketHandler, "/ws/presence")
            .setAllowedOrigins(
                "http://localhost:5173",
                "https://tictactoe-rho-kohl.vercel.app"
            );
    }
}   