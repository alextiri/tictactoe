package com.tictactoe.serverjava.services;

import com.tictactoe.serverjava.repositories.FriendRequestRepository;
import com.tictactoe.serverjava.repositories.FriendshipRepository;
import com.tictactoe.serverjava.repositories.UserRepository;

import java.util.ArrayList;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;

import com.tictactoe.serverjava.dtos.FriendNotificationResponse;
import com.tictactoe.serverjava.dtos.FriendPageResponse;
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
    private final PresenceService presenceService;

    public FriendRequestService(
        FriendRequestRepository friendRequestRepository,
        FriendshipRepository friendshipRepository,
        UserRepository userRepository,
        PresenceService presenceService
    ) {
        this.friendRequestRepository = friendRequestRepository;
        this.friendshipRepository = friendshipRepository;
        this.userRepository = userRepository;
        this.presenceService = presenceService;
    }

    public Integer getUserIdByUsername(String username) {
        return userRepository.findByUsername(username)
            .map(User::getId)
            .orElseThrow(() ->
                new IllegalArgumentException("User not found")
            );
    }

    public FriendPageResponse getFriends(Integer userId, int page, int size) {
        Page<Friendship> friendships = friendshipRepository.findByUserId(
                userId,
                PageRequest.of(page, size)
            );

        List<FriendResponse> friends = new ArrayList<>();

        for (Friendship friendship : friendships.getContent()) {
            User user = userRepository.findById(friendship.getFriendId())
                .orElseThrow();

            friends.add(
                new FriendResponse(
                    user.getId(),
                    user.getUsername(),
                    friendship.getCreatedAt(),
                    presenceService.isOnline(user.getId())
                )
            );
        }
        
        return new FriendPageResponse(
            friends,
            friendships.hasNext()
        );
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

    public List<Integer> getFriendIds(Integer userId) {
        return friendshipRepository.findByUserId(userId)
            .stream()
            .map(Friendship::getFriendId)
            .toList();
    }

    @Transactional
    public void sendRequest(Integer senderId, String receiverUsername) {
        User receiver = userRepository.findByUsername(receiverUsername)
            .orElseThrow(() -> new IllegalArgumentException("User not found"));

        Integer receiverId = receiver.getId();

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
            .findBySenderIdAndReceiverIdAndStatus(
                receiverId,
                senderId,
                "PENDING"
            )
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

            presenceService.sendToUser(
                receiverId,
                "friend-request:accepted"
            );

            return;
        }

        FriendRequest request = new FriendRequest();
        request.setSenderId(senderId);
        request.setReceiverId(receiverId);
        request.setStatus("PENDING");

        friendRequestRepository.save(request);

        presenceService.sendToUser(
            receiverId,
            "friend-request:new"
        );
    }

    @Transactional
    public void declineRequest(Integer receiverId, Integer senderId) {
        FriendRequest request = friendRequestRepository
            .findBySenderIdAndReceiverId(senderId, receiverId)
            .orElseThrow(() ->
                new IllegalArgumentException("Friend request not found")
            );

        request.setStatus("DECLINED");
        friendRequestRepository.save(request);

        presenceService.sendToUser(
            senderId,
            "friend-request:declined"
        );
    }

    @Transactional
    public void removeFriend(Integer userId, Integer friendId) {
        friendshipRepository.deleteByUserIdAndFriendId(userId, friendId);
        friendshipRepository.deleteByUserIdAndFriendId(friendId, userId);

        friendRequestRepository.deleteBySenderIdAndReceiverId(userId, friendId);
        friendRequestRepository.deleteBySenderIdAndReceiverId(friendId, userId);

        presenceService.sendToUser(
            userId,
            "friend:removed"
        );

        presenceService.sendToUser(
            friendId,
            "friend:removed"
        );
    }

    public List<FriendNotificationResponse> getFriendNotifications(Integer userId) {
        List<FriendRequest> requests =
            friendRequestRepository.findBySenderIdAndStatusIn(
                userId,
                List.of("ACCEPTED", "DECLINED")
            );

        List<FriendNotificationResponse> responses = new ArrayList<>();

        for (FriendRequest request : requests) {
            User user = userRepository.findById(request.getReceiverId())
                .orElseThrow();

            responses.add(
                new FriendNotificationResponse(
                    request.getId(),
                    user.getId(),
                    user.getUsername(),
                    request.getCreatedAt(),
                    request.getStatus()
                )
            );
        }

        return responses;
    }

    @Transactional
    public void deleteFriendNotification(Integer userId, Integer requestId) {
        FriendRequest request = friendRequestRepository.findById(requestId)
            .orElseThrow(() ->
                new IllegalArgumentException("Friend request not found")
            );

        if (!request.getSenderId().equals(userId)) {
            throw new IllegalArgumentException(
                "You cannot delete this notification"
            );
        }

        if (request.getStatus().equals("DECLINED")) {
            friendRequestRepository.delete(request);
            return;
        }

        if (request.getStatus().equals("ACCEPTED")) {
            request.setStatus("ARCHIVED");
            friendRequestRepository.save(request);
            return;
        }

        throw new IllegalArgumentException(
            "This is not a friend notification"
        );
    }
}