package com.example.bookbe.service;

import java.time.Instant;
import java.util.Optional;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.entity.RefreshToken;
import com.example.bookbe.entity.User;
import com.example.bookbe.exception.RefreshTokenException;
import com.example.bookbe.repository.RefreshTokenRepository;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.utils.JwtTokenProvider;

@Service
public class RefreshTokenService {

    @Value("${app.jwt.refresh-token-expiration-ms:86400000}")
    private Long refreshTokenDurationMs;

    private final RefreshTokenRepository refreshTokenRepository;
    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;

    public RefreshTokenService(RefreshTokenRepository refreshTokenRepository,
                               UserRepository userRepository,
                               JwtTokenProvider jwtTokenProvider) {
        this.refreshTokenRepository = refreshTokenRepository;
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
    }

    public Optional<RefreshToken> findByToken(String token) {
        return refreshTokenRepository.findByToken(token);
    }

    @Transactional
    public RefreshToken createRefreshToken(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        String tokenStr = jwtTokenProvider.generateRefreshToken(username);
        Instant expiryDate = Instant.now().plusMillis(refreshTokenDurationMs);

        Optional<RefreshToken> existingTokenOpt = refreshTokenRepository.findByUser(user);
        RefreshToken refreshToken;
        if (existingTokenOpt.isPresent()) {
            refreshToken = existingTokenOpt.get();
            refreshToken.setToken(tokenStr);
            refreshToken.setExpiryDate(expiryDate);
            refreshToken.setDeleted(false);
        } else {
            refreshToken = RefreshToken.builder()
                    .user(user)
                    .token(tokenStr)
                    .expiryDate(expiryDate)
                    .isDeleted(false)
                    .build();
        }

        return refreshTokenRepository.save(refreshToken);
    }

    public RefreshToken verifyExpiration(RefreshToken token) {
        if (token.isDeleted()) {
            throw new RefreshTokenException("Refresh token đã bị vô hiệu hóa hoặc đã được sử dụng!");
        }
        if (token.getExpiryDate().compareTo(Instant.now()) < 0) {
            token.setDeleted(true);
            refreshTokenRepository.save(token);
            throw new RefreshTokenException("Refresh token đã hết hạn. Vui lòng thực hiện đăng nhập lại!");
        }
        return token;
    }

    @Transactional
    public void deleteByToken(String token) {
        refreshTokenRepository.softDeleteByToken(token);
    }

    @Transactional
    public int deleteByUserId(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));
        return refreshTokenRepository.softDeleteByUser(user);
    }
}
