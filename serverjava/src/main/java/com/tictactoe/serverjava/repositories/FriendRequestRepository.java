package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.FriendRequest;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendRequestRepository extends JpaRepository<FriendRequest, Integer> {
    boolean existsBySenderIdAndReceiverId(
        Integer senderId,
        Integer receiverId
    );

    Optional<FriendRequest> findBySenderIdAndReceiverId(
        Integer senderId,
        Integer receiverId
    );

    List<FriendRequest> findByReceiverIdAndStatus(
        Integer receiverId,
        String status
    );

    void deleteBySenderIdAndReceiverId(
        Integer senderId,
        Integer receiverId
    );
}