package com.example.bookbe.dto;

import java.util.Set;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuthRespone {
    private Long id;
    private String username;
    private String accessToken;
    private String refreshToken;
    @Builder.Default
    private String TokenType = "Bearer";
    private String fullname;
    private String email;
    private String role;
    private String roleDisplayName;
    @Builder.Default
    private boolean canAccessAdmin = true;
    @Builder.Default
    private boolean canAccessUser = true;
    private Set<String> permissions;
}
