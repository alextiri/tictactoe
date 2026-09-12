package com.tictactoe.serverjava.dtos;

import java.util.List;

public record GameInvitationPageResponse(
    List<GameInvitationPageItem> invitations,
    boolean hasNext
) {}