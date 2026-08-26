package com.example.bookbe.service;

import java.util.Collections;
import java.util.UUID;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.example.bookbe.dto.AuthRespone;
import com.example.bookbe.entity.RefreshToken;
import com.example.bookbe.entity.User;
import com.example.bookbe.enums.Role;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.utils.JwtTokenProvider;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;

@Service
public class GoogleAuthService {

    @Value("${google.client.id}")
    private String clientId;

    private final UserRepository userRepository;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final PasswordEncoder passwordEncoder;

    public GoogleAuthService(UserRepository userRepository,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,
            PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.passwordEncoder = passwordEncoder;
    }

    public AuthRespone authenticaGoogleUser(String idTokenString) throws Exception {
        GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(
                new NetHttpTransport(),
                new GsonFactory())
                .setAudience(Collections.singletonList(clientId))
                .build();
        GoogleIdToken idToken = verifier.verify(idTokenString);
        if (idToken == null) {
            throw new IllegalArgumentException("Google ID Token không hợp lệ hoặc đã hết hạn!");
        }

        GoogleIdToken.Payload payload = idToken.getPayload();
        String email = payload.getEmail();
        String name = (String) payload.get("name");

        User user = userRepository.findByEmail(email).orElseGet(() -> {
            User newUser = new User();
            newUser.setEmail(email);
            newUser.setFullName(name != null ? name : email.split("@")[0]);
            newUser.setUsername(email.split("@")[0] + "_" + UUID.randomUUID().toString().substring(0, 4));
            newUser.setPassword(passwordEncoder.encode(UUID.randomUUID().toString()));
            newUser.setRole(Role.CLIENT);
            return userRepository.save(newUser);
        });

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
}
