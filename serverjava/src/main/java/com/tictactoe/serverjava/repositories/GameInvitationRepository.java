package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.GameInvitation;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GameInvitationRepository extends JpaRepository<GameInvitation, Integer> {
    @Query("""
        SELECT COUNT(i) > 0
        FROM GameInvitation i
        WHERE
            (
                (i.senderId = :user1 AND i.receiverId = :user2)
                OR
                (i.senderId = :user2 AND i.receiverId = :user1)
            )
            AND i.status = 'PENDING'
    """)
    boolean existsBetweenUsers(
        @Param("user1") Integer user1,
        @Param("user2") Integer user2
    );

    @Query("""
        SELECT i
        FROM GameInvitation i
        WHERE i.senderId = :userId
        OR (i.receiverId = :userId AND i.status = 'PENDING')
        ORDER BY i.createdAt DESC
    """)
    Page<GameInvitation> findUserInvitations(
        @Param("userId") Integer userId,
        Pageable pageable
    );

    List<GameInvitation> findByReceiverIdAndStatus(
        Integer receiverId,
        String status
    );

    List<GameInvitation> findBySenderId(Integer senderId);
}