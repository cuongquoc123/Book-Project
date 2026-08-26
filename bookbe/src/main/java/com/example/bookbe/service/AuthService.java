package com.example.bookbe.service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.dto.AuthRespone;
import com.example.bookbe.dto.LoginRequest;
import com.example.bookbe.dto.RefreshTokenRequest;
import com.example.bookbe.dto.RegisterRequest;
import com.example.bookbe.dto.TokenRefreshRespone;
import com.example.bookbe.entity.RefreshToken;
import com.example.bookbe.entity.User;
import com.example.bookbe.enums.Role;
import com.example.bookbe.exception.RefreshTokenException;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.utils.JwtTokenProvider;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;

    public AuthService(UserRepository userRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username đã tồn tại!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại!");
        }

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullname())
                .role(Role.CLIENT)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User createAdminAccount(RegisterRequest request, Role role) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username đã tồn tại!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại!");
        }

        Role targetRole = (role != null) ? role : Role.ADMIN;

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullname())
                .role(targetRole)
                .build();

        return userRepository.save(user);
    }

    public AuthRespone login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại!"));

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), user.getRole().name());
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        return AuthRespone.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .TokenType("Bearer")
                .fullname(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole().name())
                .build();
    }

    public TokenRefreshRespone refreshToken(RefreshTokenRequest request) {
        String refreshTokenStr = request.getRefreshToken();
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new RefreshTokenException("Refresh token không được để trống!");
        }

        if (!jwtTokenProvider.validateToken(refreshTokenStr)) {
            throw new RefreshTokenException("Refresh token không hợp lệ!");
        }

        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr)
                .orElseThrow(() -> new RefreshTokenException("Refresh token không tồn tại trong hệ thống!"));

        refreshToken = refreshTokenService.verifyExpiration(refreshToken);
        User user = refreshToken.getUser();

        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), user.getRole().name());

        return TokenRefreshRespone.builder()
                .accessToken(newAccessToken)
                .refreshToken(refreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    public void logout(String refreshTokenStr) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenService.deleteByToken(refreshTokenStr);
        }
    }

    public Map<String, Object> getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("email", user.getEmail());
        userInfo.put("fullName", user.getFullName());
        userInfo.put("role", user.getRole());
        userInfo.put("createdAt", user.getCreatedAt());

        return userInfo;
    }

    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("email", user.getEmail());
            map.put("fullName", user.getFullName());
            map.put("role", user.getRole().name());
            map.put("createdAt", user.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }
}
