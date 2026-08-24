package com.example.bookbe.exception;

public class ResourceNotFoundException extends RuntimeException {
    public ResourceNotFoundException(String Message) {
        super(Message);
    }
}
