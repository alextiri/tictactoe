package com.tictactoe.serverjava.models;

import jakarta.persistence.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;

@Entity
@Table(name = "friendships")
public class Friendship {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "user_id", nullable = false)
    private Integer userId;

    @Column(name = "friend_id", nullable = false)
    private Integer friendId;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    public Integer getId() {
        return id;
    }

    public Integer getUserId() {
        return userId;
    }

    public void setUserId(Integer userId) {
        this.userId = userId;
    }

    public Integer getFriendId() {
        return friendId;
    }

    public void setFriendId(Integer friendId) {
        this.friendId = friendId;
    }

    public OffsetDateTime getCreatedAt() {
        return createdAt;
    }
}