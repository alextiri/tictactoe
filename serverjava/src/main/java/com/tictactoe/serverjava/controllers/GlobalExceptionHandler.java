package com.tictactoe.serverjava.controllers;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {
    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<Map<String, String>> handleIllegalArgumentException(
        IllegalArgumentException exception
    ) {
        HttpStatus status = exception.getMessage().equals("User already exists")
            ? HttpStatus.CONFLICT
            : HttpStatus.BAD_REQUEST;

        return ResponseEntity
            .status(status)
            .body(Map.of("message", exception.getMessage()));
    }
}