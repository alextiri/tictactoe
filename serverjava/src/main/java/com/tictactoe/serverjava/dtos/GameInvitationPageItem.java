package com.tictactoe.serverjava.dtos;

import java.time.OffsetDateTime;

public record GameInvitationPageItem(
    Integer id,
    Integer userId,
    String username,
    OffsetDateTime createdAt,
    String status,
    String gameCode,
    String type
) {}