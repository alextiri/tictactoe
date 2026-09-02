package com.tictactoe.serverjava.dtos;

import java.time.LocalDateTime;
import java.util.List;

public record GameHistoryResponse(
    Integer gameId,
    String gameCode,
    String winner,
    LocalDateTime createdAt,
    List<GameMoveResponse> moves
) {}