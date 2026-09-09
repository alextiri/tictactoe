package com.tictactoe.serverjava.dtos;

import java.time.OffsetDateTime;

public record FriendResponse(
    Integer userId,
    String username,
    OffsetDateTime friendsSince,
    boolean online
) {}