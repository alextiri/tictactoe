package com.tictactoe.serverjava.controllers;

import com.tictactoe.serverjava.dtos.FriendRequestResponse;
import com.tictactoe.serverjava.dtos.FriendResponse;
import com.tictactoe.serverjava.services.FriendRequestService;

import java.util.List;

import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.bind.annotation.RequestMapping;

@RestController
@RequestMapping("/api/friends")
public class FriendRequestController {
    private final FriendRequestService friendRequestService;

    public FriendRequestController(FriendRequestService friendRequestService) {
        this.friendRequestService = friendRequestService;
    }

    @GetMapping("/user")
    public Integer getUserIdByUsername(@RequestParam String username) {
        return friendRequestService.getUserIdByUsername(username);
    }

    @GetMapping("/requests")
    public List<FriendRequestResponse> getPendingRequests(Authentication authentication) {
        Integer userId = Integer.parseInt(authentication.getName());

        return friendRequestService.getPendingRequests(userId);
    }

    @PostMapping("/requests")
    public void sendFriendRequest(@RequestParam String username, Authentication authentication) {
        Integer senderId = Integer.parseInt(authentication.getName());

        friendRequestService.sendRequest(senderId, username);
    }

    @GetMapping
    public List<FriendResponse> getFriends(Authentication authentication) {
        Integer userId = Integer.parseInt(authentication.getName());

        return friendRequestService.getFriends(userId);
    }

    @DeleteMapping("/requests")
    public void declineFriendRequest(@RequestParam Integer senderId, Authentication authentication) {
        Integer receiverId = Integer.parseInt(authentication.getName());
        friendRequestService.declineRequest(receiverId, senderId);
    }

    @DeleteMapping
    public void removeFriend(@RequestParam Integer friendId, Authentication authentication) {
        Integer userId = Integer.parseInt(authentication.getName());
        friendRequestService.removeFriend(userId, friendId);
    }
}