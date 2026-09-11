package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.Friendship;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface FriendshipRepository extends JpaRepository<Friendship, Integer> {
    List<Friendship> findByUserId(Integer userId);

    @Query("""
        SELECT f
        FROM Friendship f
        JOIN User u ON u.id = f.friendId
        WHERE f.userId = :userId
        ORDER BY u.username ASC
    """)
    Page<Friendship> findByUserId(@Param("userId") Integer userId, Pageable pageable);
    
    boolean existsByUserIdAndFriendId(
        Integer userId,
        Integer friendId
    );

    void deleteByUserIdAndFriendId(
        Integer userId,
        Integer friendId
    );
}