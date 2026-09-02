package com.tictactoe.serverjava.services;

import com.tictactoe.serverjava.dtos.LoginResponse;
import com.tictactoe.serverjava.dtos.UserResponse;
import com.tictactoe.serverjava.models.User;
import com.tictactoe.serverjava.repositories.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class UserService {
    private final UserRepository userRepository;
    private final BCryptPasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public UserService(
        UserRepository userRepository,
        BCryptPasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    public User register(String username, String email, String password) {
        if (username == null || email == null || password == null) {
            throw new IllegalArgumentException("All fields are required");
        }
        if (password.length() < 8) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters long"
            );
        }

        if (userRepository.findByEmail(email).isPresent()) {
            throw new IllegalArgumentException("User already exists");
        }

        String hashedPassword = passwordEncoder.encode(password);

        User user = new User();
        user.setUsername(username);
        user.setEmail(email);
        user.setPassword(hashedPassword);

        return userRepository.save(user);
    }

    public LoginResponse login(String email, String password) {
        if (email == null || password == null) {
            throw new IllegalArgumentException(
                "Email and password required"
            );
        }

        User user = userRepository.findByEmail(email)
            .orElseThrow(() ->
                new IllegalArgumentException(
                    "Invalid email or password"
                )
            );

        // Temporary
        boolean matches = passwordEncoder.matches(password, user.getPassword());

        System.out.println("Password matches: " + matches);

        if (!matches) {
            throw new IllegalArgumentException(
                    "Invalid email or password"
            );
        }
        // Temporary

        if (!passwordEncoder.matches(password, user.getPassword())) {
            throw new IllegalArgumentException(
                "Invalid email or password"
            );
        }

        String token = jwtService.generateToken(user);

        UserResponse userResponse = new UserResponse(
            user.getId(),
            user.getUsername(),
            user.getEmail(),
            user.getCreatedAt()
        );

        return new LoginResponse(token, userResponse);
    }
}