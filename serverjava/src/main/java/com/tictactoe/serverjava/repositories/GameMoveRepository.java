package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.GameMove;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface GameMoveRepository extends JpaRepository<GameMove, Integer> {
    List<GameMove> findByGameIdOrderByMoveNumberAsc(Integer gameId);
}