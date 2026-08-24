package com.example.bookbe.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookbe.dto.AuthRespone;
import com.example.bookbe.dto.LoginRequest;
import com.example.bookbe.dto.RefreshTokenRequest;
import com.example.bookbe.dto.RegisterRequest;
import com.example.bookbe.dto.TokenRefreshRespone;
import com.example.bookbe.entity.User;
import com.example.bookbe.service.AuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    private boolean isUserAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null 
            && authentication.isAuthenticated() 
            && !"anonymousUser".equals(authentication.getPrincipal());
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        User registeredUser = authService.register(request);
        Map<String, Object> response = Map.of(
                "message", "Đăng ký tài khoản thành công!",
                "username", registeredUser.getUsername(),
                "email", registeredUser.getEmail()
        );
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<AuthRespone> login(@RequestBody LoginRequest request) {
        AuthRespone response = authService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/refresh")
    public ResponseEntity<?> refreshToken(@RequestBody RefreshTokenRequest request) {
        if (!isUserAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Yêu cầu đăng nhập để thực hiện làm mới token!"));
        }
        TokenRefreshRespone response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody RefreshTokenRequest request) {
        if (!isUserAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Yêu cầu đăng nhập để thực hiện đăng xuất!"));
        }
        authService.logout(request.getRefreshToken());
        return ResponseEntity.ok(Map.of("message", "Đăng xuất thành công!"));
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser() {
        if (!isUserAuthenticated()) {
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("message", "Yêu cầu đăng nhập để lấy thông tin người dùng!"));
        }
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String username = authentication.getName();
        Map<String, Object> userInfo = authService.getCurrentUser(username);
        return ResponseEntity.ok(userInfo);
    }
}
