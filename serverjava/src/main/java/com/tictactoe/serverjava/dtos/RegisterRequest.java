package com.tictactoe.serverjava.dtos;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

public record RegisterRequest(
    @NotBlank String username,
    
    @NotBlank
    @Pattern(
        regexp = "^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$",
        message = "Please enter a valid email address"
    )
    String email,

    @NotBlank String password
) {}