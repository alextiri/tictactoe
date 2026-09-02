package com.tictactoe.serverjava.dtos;

import java.time.LocalDateTime;

public record UserResponse(
    Integer id,
    String username,
    String email,
    LocalDateTime createdAt
) {
}