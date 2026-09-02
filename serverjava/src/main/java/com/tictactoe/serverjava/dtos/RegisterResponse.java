package com.tictactoe.serverjava.dtos;

public record RegisterResponse(
    String message,
    UserResponse user
) {
}