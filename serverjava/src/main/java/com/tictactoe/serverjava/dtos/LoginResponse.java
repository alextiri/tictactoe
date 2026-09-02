package com.tictactoe.serverjava.dtos;

public record LoginResponse(
    String token,
    UserResponse user
) {
}