package com.example.bookbe.controller;

import java.util.Map;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookbe.dto.AuthRespone;
import com.example.bookbe.dto.GoogleLoginRequest;
import com.example.bookbe.dto.LoginRequest;
import com.example.bookbe.dto.RefreshTokenRequest;
import com.example.bookbe.dto.RegisterRequest;
import com.example.bookbe.dto.TokenRefreshRespone;
import com.example.bookbe.entity.User;
import com.example.bookbe.service.AuthService;
import com.example.bookbe.service.GoogleAuthService;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final GoogleAuthService googleAuthService;
    private final AuthService authService;

    public AuthController(AuthService authService, GoogleAuthService googleAuthService) {
        this.authService = authService;
        this.googleAuthService = googleAuthService;
    }

    private boolean isUserAuthenticated() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        return authentication != null
                && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal());
    }

    @PostMapping("/google")
    public ResponseEntity<?> loginWithGoogle(@RequestBody GoogleLoginRequest request) throws Exception {
        AuthRespone respone = googleAuthService.authenticaGoogleUser(request.getIdToken());

        return ResponseEntity.ok(respone);
    }

    @PostMapping("/register")
    public ResponseEntity<Map<String, Object>> register(@RequestBody RegisterRequest request) {
        User registeredUser = authService.register(request);
        Map<String, Object> response = Map.of(
                "message", "Đăng ký tài khoản thành công!",
                "username", registeredUser.getUsername(),
                "email", registeredUser.getEmail());
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/create-admin")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> createAdmin(@RequestBody RegisterRequest request) {
        User createdAdmin = authService.createAdminAccount(request, "ADMIN");
        Map<String, Object> response = Map.of(
                "message", "Tạo tài khoản Quản trị viên (ADMIN) thành công!",
                "username", createdAdmin.getUsername(),
                "email", createdAdmin.getEmail(),
                "role", createdAdmin.getRole() != null ? createdAdmin.getRole().getName() : "ADMIN");
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
            authService.logout(request.getRefreshToken());

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

    @PutMapping("/users/{userId}/role")
    @PreAuthorize("hasAuthority('USER_UPDATE') or hasRole('SUPER_ADMIN')")
    public ResponseEntity<Map<String, Object>> updateUserRole(@PathVariable Long userId, @RequestBody Map<String, Object> payload) {
        Object roleIdObj = payload.get("roleId");
        if (roleIdObj == null) {
            throw new IllegalArgumentException("Vui lòng cung cấp roleId hợp lệ!");
        }
        Long roleId = Long.valueOf(roleIdObj.toString());
        Map<String, Object> result = authService.updateUserRole(userId, roleId);
        return ResponseEntity.ok(result);
    }
}
