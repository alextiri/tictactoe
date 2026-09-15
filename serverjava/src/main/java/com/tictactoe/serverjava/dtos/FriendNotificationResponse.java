package com.tictactoe.serverjava.dtos;

import java.time.OffsetDateTime;

public record FriendNotificationResponse(
    Integer id,
    Integer userId,
    String username,
    OffsetDateTime createdAt,
    String status
) {}