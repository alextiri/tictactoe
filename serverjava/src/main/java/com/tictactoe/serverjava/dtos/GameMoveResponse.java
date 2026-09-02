package com.tictactoe.serverjava.dtos;

public record GameMoveResponse(
    Integer moveNumber,
    String symbol,
    Integer square,
    String username
) {}