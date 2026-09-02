package com.tictactoe.serverjava.repositories;

import com.tictactoe.serverjava.models.Game;
import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface GameRepository extends JpaRepository<Game, Integer> {
    List<Game> findByPlayerXIdOrPlayerOIdOrderByCreatedAtDesc(Integer playerXId, Integer playerOId);
    boolean existsByGameCode(String gameCode);
    Optional<Game> findByGameCode(String gameCode);
}