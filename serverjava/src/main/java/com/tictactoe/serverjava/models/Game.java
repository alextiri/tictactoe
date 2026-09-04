package com.tictactoe.serverjava.models;

import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

@Entity
@Table(name = "games")
public class Game {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Transient
    private List<Integer> winningPattern;

    @Column(name = "game_code", nullable = false, unique = true, length = 6)
    private String gameCode;

    @Column(name = "player_x_id", nullable = false)
    private Integer playerXId;

    @Column(name = "player_o_id")
    private Integer playerOId;

    @Transient
    private String playerXUsername;

    @Transient
    private String playerOUsername;

    @Transient
    private List<GameMove> moves;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(nullable = false, columnDefinition = "json")
    private List<String> board;

    @Column(name = "current_turn", nullable = false, length = 1)
    private String currentTurn;

    @Column(length = 1)
    private String winner;

    @Column(nullable = false)
    private String status;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private LocalDateTime updatedAt;

    public Integer getId() {
        return id;
    }

    public String getGameCode() {
        return gameCode;
    }

    public void setGameCode(String gameCode) {
        this.gameCode = gameCode;
    }

    public Integer getPlayerXId() {
        return playerXId;
    }

    public void setPlayerXId(Integer playerXId) {
        this.playerXId = playerXId;
    }

    public Integer getPlayerOId() {
        return playerOId;
    }

    public void setPlayerOId(Integer playerOId) {
        this.playerOId = playerOId;
    }

    public String getPlayerXUsername() {
        return playerXUsername;
    }

    public void setPlayerXUsername(String playerXUsername) {
        this.playerXUsername = playerXUsername;
    }

    public String getPlayerOUsername() {
        return playerOUsername;
    }

    public void setPlayerOUsername(String playerOUsername) {
        this.playerOUsername = playerOUsername;
    }

    public List<GameMove> getMoves() {
        return moves;
    }

    public void setMoves(List<GameMove> moves) {
        this.moves = moves;
    }

    public List<String> getBoard() {
        return board;
    }

    public void setBoard(List<String> board) {
        this.board = board;
    }

    public String getCurrentTurn() {
        return currentTurn;
    }

    public void setCurrentTurn(String currentTurn) {
        this.currentTurn = currentTurn;
    }

    public String getWinner() {
        return winner;
    }

    public void setWinner(String winner) {
        this.winner = winner;
    }

    public String getStatus() {
        return status;
    }

    public void setStatus(String status) {
        this.status = status;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }

    public List<Integer> getWinningPattern() {
        return winningPattern;
    }

    public void setWinningPattern(List<Integer> winningPattern) {
        this.winningPattern = winningPattern;
    }

    @PrePersist
    protected void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}