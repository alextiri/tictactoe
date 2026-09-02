package com.tictactoe.serverjava.dtos;

import java.util.List;

public record GameHistoryListResponse(
    List<GameHistoryResponse> history
) {}