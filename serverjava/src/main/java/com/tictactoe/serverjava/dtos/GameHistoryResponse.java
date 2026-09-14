package com.tictactoe.serverjava.dtos;

import java.time.LocalDateTime;

public record GameHistoryResponse(
    Integer gameId,
    String gameCode,
    String winner,
    LocalDateTime createdAt,
    int moveCount,
    boolean yourTurn
) {}