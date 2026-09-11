package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.Game;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface GameRepository extends JpaRepository<Game, Integer> {
    @Query("""
        SELECT g
        FROM Game g
        WHERE g.playerXId = :userId
        OR g.playerOId = :userId
        ORDER BY
            CASE WHEN g.status = 'ongoing' THEN 0 ELSE 1 END,
            g.createdAt DESC
    """)
    List<Game> findUserGameHistory(@Param("userId") Integer userId);

    boolean existsByGameCode(String gameCode);
    
    Optional<Game> findByGameCode(String gameCode);
}