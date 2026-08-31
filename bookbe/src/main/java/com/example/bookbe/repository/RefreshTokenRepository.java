package com.example.bookbe.repository;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.bookbe.entity.RefreshToken;
import com.example.bookbe.entity.User;


public interface RefreshTokenRepository extends JpaRepository<RefreshToken, Long> {
    Optional<RefreshToken> findByToken(String token);
    Optional<RefreshToken> findByUser(User user);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.isDeleted = true WHERE r.user = :user")
    int softDeleteByUser(@Param("user") User user);

    @Modifying
    @Query("UPDATE RefreshToken r SET r.isDeleted = true WHERE r.token = :token")
    int softDeleteByToken(@Param("token") String token);

    @Modifying
    int deleteByUser(User user);

    @Modifying
    void deleteByToken(String token);
}
