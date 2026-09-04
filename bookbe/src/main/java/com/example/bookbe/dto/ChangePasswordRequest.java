package com.example.bookbe.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ChangePasswordRequest {

    private Long userId;

    private String oldPassword;

    private String newPassword;

    private String confirmPassword;

    @Builder.Default
    private boolean logoutAllClients = false;
}
