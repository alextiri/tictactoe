package com.tictactoe.serverjava.dtos;

import java.time.OffsetDateTime;

public record FriendRequestResponse(
    Integer userId,
    String username,
    OffsetDateTime createdAt
) {}