package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.GameMove;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface GameMoveRepository extends JpaRepository<GameMove, Integer> {
    List<GameMove> findByGameIdOrderByMoveNumberAsc(Integer gameId);
    long countByGameId(Integer gameId);
    
    @Query("""
        SELECT gm.gameId, COUNT(gm)
        FROM GameMove gm
        WHERE gm.gameId IN :gameIds
        GROUP BY gm.gameId
    """)
    List<Object[]> countMovesByGameIds(@Param("gameIds") List<Integer> gameIds);
}