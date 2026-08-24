package com.example.bookbe.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;

import com.example.bookbe.entity.RefreshToken;
import com.example.bookbe.entity.User;


public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUser(User user);

    @Modifying
    int deleteByUser(User user);

    @Modifying
    void deleteByToken(String token);
}
