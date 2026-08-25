package com.example.bookbe.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
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
import com.example.bookbe.enums.Role;
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

    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> createAdmin(@RequestBody RegisterRequest request) {
        User createdAdmin = authService.createAdminAccount(request, Role.ADMIN);
        Map<String, Object> response = Map.of(
                "message", "Tạo tài khoản Quản trị viên (ADMIN) thành công!",
                "username", createdAdmin.getUsername(),
                "email", createdAdmin.getEmail(),
                "role", createdAdmin.getRole().name()
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
        TokenRefreshRespone response = authService.refreshToken(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/logout")
    public ResponseEntity<?> logout(@RequestBody(required = false) RefreshTokenRequest request) {
        if (request != null && request.getRefreshToken() != null && !request.getRefreshToken().isBlank()) {
            try {
                authService.logout(request.getRefreshToken());
            } catch (Exception e) {
                // Ignore token delete error if already invalidated
            }
        }
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

    @GetMapping("/users")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<java.util.List<Map<String, Object>>> getAllUsers() {
        java.util.List<Map<String, Object>> users = authService.getAllUsers();
        return ResponseEntity.ok(users);
    }
}
