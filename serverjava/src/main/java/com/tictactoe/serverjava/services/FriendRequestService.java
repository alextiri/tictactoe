package com.tictactoe.serverjava.services;

import com.tictactoe.serverjava.repositories.FriendRequestRepository;
import com.tictactoe.serverjava.repositories.FriendshipRepository;
import com.tictactoe.serverjava.repositories.UserRepository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.tictactoe.serverjava.dtos.FriendRequestResponse;
import com.tictactoe.serverjava.dtos.FriendResponse;
import com.tictactoe.serverjava.models.FriendRequest;
import com.tictactoe.serverjava.models.Friendship;
import com.tictactoe.serverjava.models.User;

import org.springframework.transaction.annotation.Transactional;

@Service
public class FriendRequestService {
    private final FriendRequestRepository friendRequestRepository;
    private final FriendshipRepository friendshipRepository;
    private final UserRepository userRepository;

    public FriendRequestService(
        FriendRequestRepository friendRequestRepository,
        FriendshipRepository friendshipRepository,
        UserRepository userRepository
    ) {
        this.friendRequestRepository = friendRequestRepository;
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
    }

    public Integer getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
            .map(User::getId)
            .orElseThrow(() ->
                new IllegalArgumentException("User not found")
            );
    }

    public List<FriendResponse> getFriends(Integer userId) {
        List<Friendship> friendships = friendshipRepository.findByUserId(userId);
        List<FriendResponse> friends = new ArrayList<>();

        for (Friendship friendship : friendships) {
            User user = userRepository.findById(friendship.getFriendId())
                .orElseThrow();

            friends.add(
                new FriendResponse(
                    user.getId(),
                    user.getUsername(),
                    friendship.getCreatedAt()
                )
            );
        }

        return friends;
    }

    public List<FriendRequestResponse> getPendingRequests(Integer userId) {
        List<FriendRequest> requests =
            friendRequestRepository.findByReceiverIdAndStatus(userId, "PENDING");

        List<FriendRequestResponse> responses = new ArrayList<>();

        for (FriendRequest request : requests) {
            User user = userRepository.findById(request.getSenderId())
                .orElseThrow();

            responses.add(
                new FriendRequestResponse(
                    user.getId(),
                    user.getUsername(),
                    request.getCreatedAt()
                )
            );
        }

        return responses;
    }

    @Transactional
    public void sendRequest(Integer senderId, Integer receiverId) {
        if (senderId.equals(receiverId)) {
            throw new IllegalArgumentException("You cannot add yourself as a friend");
        }

        if (friendshipRepository.existsByUserIdAndFriendId(senderId, receiverId)) {
            throw new IllegalArgumentException("You are already friends");
        }

        if (friendRequestRepository.existsBySenderIdAndReceiverId(senderId, receiverId)) {
            throw new IllegalArgumentException("Friend request already exists");
        }

        FriendRequest oppositeRequest = friendRequestRepository
            .findBySenderIdAndReceiverId(receiverId, senderId)
            .orElse(null);

        if (oppositeRequest != null) {
            oppositeRequest.setStatus("ACCEPTED");
            friendRequestRepository.save(oppositeRequest);

            Friendship friendship1 = new Friendship();
            friendship1.setUserId(senderId);
            friendship1.setFriendId(receiverId);

            Friendship friendship2 = new Friendship();
            friendship2.setUserId(receiverId);
            friendship2.setFriendId(senderId);

            friendshipRepository.save(friendship1);
            friendshipRepository.save(friendship2);

            return;
        }

        FriendRequest request = new FriendRequest();
        request.setSenderId(senderId);
        request.setReceiverId(receiverId);
        request.setStatus("PENDING");

        friendRequestRepository.save(request);
    }

    @Transactional
    public void declineRequest(Integer receiverId, Integer senderId) {
        friendRequestRepository.deleteBySenderIdAndReceiverId(
            senderId,
            receiverId
        );
    }

    @Transactional
    public void removeFriend(Integer userId, Integer friendId) {
        friendshipRepository.deleteByUserIdAndFriendId(userId, friendId);
        friendshipRepository.deleteByUserIdAndFriendId(friendId, userId);

        friendRequestRepository.deleteBySenderIdAndReceiverId(userId, friendId);
        friendRequestRepository.deleteBySenderIdAndReceiverId(friendId, userId);
    }
}