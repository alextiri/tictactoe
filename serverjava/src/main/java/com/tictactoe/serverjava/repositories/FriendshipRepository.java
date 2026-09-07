package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.Friendship;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

public interface FriendshipRepository extends JpaRepository<Friendship, Integer> {
    List<Friendship> findByUserId(Integer userId);
    
    boolean existsByUserIdAndFriendId(
        Integer userId,
        Integer friendId
    );

    void deleteByUserIdAndFriendId(
        Integer userId,
        Integer friendId
    );
}