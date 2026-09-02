package com.tictactoe.serverjava.controllers;

import com.tictactoe.serverjava.models.User;
import com.tictactoe.serverjava.repositories.UserRepository;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class TestController {
    private final UserRepository userRepository;

    public TestController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping("/api/test")
    public String test() {
        return "Spring Boot server is working!";
    }

    @GetMapping("/api/test/users")
    public List<User> getUsers() {
        return userRepository.findAll();
    }
}