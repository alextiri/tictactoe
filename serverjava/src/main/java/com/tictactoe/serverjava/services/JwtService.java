package com.tictactoe.serverjava.services;

import com.tictactoe.serverjava.models.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.util.Date;

@Service
public class JwtService {
    private final SecretKey secretKey;

    public JwtService(@Value("${jwt.secret}") String secret) {
        this.secretKey = Keys.hmacShaKeyFor(secret.getBytes(StandardCharsets.UTF_8));
    }

    public String generateToken(User user) {
        Date now = new Date();
        Date expiration = new Date(
            now.getTime() + 7L * 24 * 60 * 60 * 1000
        );

        return Jwts.builder()
            .subject(user.getId().toString())
            .issuedAt(now)
            .expiration(expiration)
            .signWith(secretKey)
            .compact();
    }

    public String extractUserId(String token) {
        return Jwts.parser()
            .verifyWith(secretKey)
            .build()
            .parseSignedClaims(token)
            .getPayload()
            .getSubject();
    }
}