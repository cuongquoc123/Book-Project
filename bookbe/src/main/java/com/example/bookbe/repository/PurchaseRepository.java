package com.example.bookbe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.bookbe.entity.Purchase;
import com.example.bookbe.enums.PurchaseStatus;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    boolean existsByUserIdAndStatus(Long userId, PurchaseStatus status);
    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, PurchaseStatus status);
    
    // Lấy lượt mượn đang active của User
    Optional<Purchase> findByUserIdAndStatus(Long userId, PurchaseStatus status);
    
    // Kiểm tra user có đang mượn đúng cuốn sách này không
    Optional<Purchase> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, PurchaseStatus status);

    // Lấy tất cả lịch sử mượn/trả của User
    List<Purchase> findByUserIdOrderByCreatedAtDesc(Long userId);

    @Modifying
    @Query("DELETE FROM Purchase p WHERE p.book.id = :bookId")
    void deleteByBookId(@Param("bookId") Long bookId);
}

