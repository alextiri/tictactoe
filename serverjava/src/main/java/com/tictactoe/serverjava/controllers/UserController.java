package com.tictactoe.serverjava.controllers;

import com.tictactoe.serverjava.dtos.LoginRequest;
import com.tictactoe.serverjava.dtos.LoginResponse;
import com.tictactoe.serverjava.dtos.RegisterRequest;
import com.tictactoe.serverjava.dtos.RegisterResponse;
import com.tictactoe.serverjava.dtos.UserResponse;
import com.tictactoe.serverjava.models.User;
import com.tictactoe.serverjava.services.UserService;

import jakarta.validation.Valid;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
public class UserController {
    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        User user = userService.register(
            request.username(),
            request.email(),
            request.password()
        );

        UserResponse userResponse = new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getCreatedAt()
        );

        RegisterResponse response = new RegisterResponse(
            "User registered successfully",
            userResponse
        );

        return ResponseEntity.status(201).body(response);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(
            @RequestBody LoginRequest request
    ) {
        LoginResponse response = userService.login(
                request.email(),
                request.password()
        );

        return ResponseEntity.ok(response);
    }
}