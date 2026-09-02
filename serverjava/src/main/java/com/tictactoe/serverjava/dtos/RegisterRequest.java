package com.tictactoe.serverjava.dtos;

public record RegisterRequest(
    String username,
    String email,
    String password
) {
}