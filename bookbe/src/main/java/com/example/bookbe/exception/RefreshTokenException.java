package com.example.bookbe.exception;

public class RefreshTokenException extends RuntimeException {
    public RefreshTokenException() {
        super("Refresh Token đã hết hạn hoặc không hợp lệ");
    }

    public RefreshTokenException(String message) {
        super(message);
    }
}
