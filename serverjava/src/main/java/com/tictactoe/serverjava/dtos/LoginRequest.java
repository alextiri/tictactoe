package com.tictactoe.serverjava.dtos;

public record LoginRequest(
    String email,
    String password
) {
}