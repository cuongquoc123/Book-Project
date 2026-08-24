package com.example.bookbe.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.bookbe.entity.Purchase;
import com.example.bookbe.enums.PurchaseStatus;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, PurchaseStatus status);
}
