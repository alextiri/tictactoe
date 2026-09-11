package com.tictactoe.serverjava.dtos;

import java.time.OffsetDateTime;

public record GameInvitationResponse(
    Integer id,
    Integer userId,
    String username,
    OffsetDateTime createdAt,
    String status,
    String gameCode
) {}