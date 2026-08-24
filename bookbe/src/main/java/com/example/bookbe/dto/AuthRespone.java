package com.example.bookbe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRespone {
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String TokenType = "Bearer";
    private String fullname;
    private String email;
    private String role;
}
