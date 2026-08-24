package com.example.bookbe.dto;

import java.time.LocalDateTime;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ErrorRespone {
    private int status;
    private String message;
    private LocalDateTime time;

    public ErrorRespone(int status, String message) {
        this.time = LocalDateTime.now();
        this.status = status;
        this.message = message;
    }
}
