package com.tictactoe.serverjava.dtos;

import java.util.List;

public record FriendPageResponse(
    List<FriendResponse> friends,
    boolean hasNext
) {}