package com.example.bookbe.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.bookbe.entity.RevokedToken;

public interface RevokedTokenRepository extends JpaRepository<RevokedToken, Long> {
    boolean existsByToken(String token);
}
