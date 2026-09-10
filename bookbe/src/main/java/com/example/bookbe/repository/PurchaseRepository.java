package com.example.bookbe.repository;

import java.util.List;
import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import com.example.bookbe.entity.Purchase;
import com.example.bookbe.enums.PurchaseStatus;

public interface PurchaseRepository extends JpaRepository<Purchase, Long> {
    boolean existsByUserIdAndStatus(Long userId, PurchaseStatus status);
    boolean existsByUserIdAndStatusIn(Long userId, List<PurchaseStatus> statuses);
    boolean existsByUserIdAndBookIdAndStatus(Long userId, Long bookId, PurchaseStatus status);
    boolean existsByUserIdAndBookIdAndStatusIn(Long userId, Long bookId, List<PurchaseStatus> statuses);

    long countByBookIdAndStatusIn(Long bookId, List<PurchaseStatus> statuses);
    
    // Lấy lượt mượn đang active của User
    Optional<Purchase> findByUserIdAndStatus(Long userId, PurchaseStatus status);

    // Lấy lượt mượn đang active hoặc pending của User
    Optional<Purchase> findFirstByUserIdAndStatusInOrderByCreatedAtDesc(Long userId, List<PurchaseStatus> statuses);
    
    // Kiểm tra user có đang mượn đúng cuốn sách này không
    Optional<Purchase> findByUserIdAndBookIdAndStatus(Long userId, Long bookId, PurchaseStatus status);
    Optional<Purchase> findFirstByUserIdAndBookIdAndStatusInOrderByCreatedAtDesc(Long userId, Long bookId, List<PurchaseStatus> statuses);

    // Lấy danh sách tất cả các lượt mượn đang active hoặc pending của User
    List<Purchase> findByUserIdAndStatusInOrderByCreatedAtDesc(Long userId, List<PurchaseStatus> statuses);

    // Lấy tất cả lịch sử mượn/trả của User kèm Book (phân trang)
    @Query(
        value = "SELECT p FROM Purchase p LEFT JOIN FETCH p.book b LEFT JOIN FETCH b.category WHERE p.user.id = :userId",
        countQuery = "SELECT count(p) FROM Purchase p WHERE p.user.id = :userId"
    )
    Page<Purchase> findByUserIdWithBook(@Param("userId") Long userId, Pageable pageable);

    // Lấy tất cả lịch sử mượn/trả của User kèm Book
    @Query("SELECT p FROM Purchase p LEFT JOIN FETCH p.book b LEFT JOIN FETCH b.category WHERE p.user.id = :userId ORDER BY p.createdAt DESC")
    List<Purchase> findByUserIdWithBookOrderByCreatedAtDesc(@Param("userId") Long userId);

    List<Purchase> findByUserIdOrderByCreatedAtDesc(Long userId);

    // Lấy tất cả danh sách mượn sách cho Admin kèm đầy đủ User, Role, Book, Category (phân trang)
    @Query(
        value = "SELECT p FROM Purchase p LEFT JOIN FETCH p.user u LEFT JOIN FETCH u.role LEFT JOIN FETCH p.book b LEFT JOIN FETCH b.category",
        countQuery = "SELECT count(p) FROM Purchase p"
    )
    Page<Purchase> findAllWithDetails(Pageable pageable);

    // Lấy tất cả danh sách mượn sách cho Admin kèm đầy đủ User, Role, Book, Category
    @Query("SELECT p FROM Purchase p LEFT JOIN FETCH p.user u LEFT JOIN FETCH u.role LEFT JOIN FETCH p.book b LEFT JOIN FETCH b.category ORDER BY p.createdAt DESC")
    List<Purchase> findAllWithDetails();

    @Query("SELECT p FROM Purchase p LEFT JOIN FETCH p.user u LEFT JOIN FETCH u.role LEFT JOIN FETCH p.book b LEFT JOIN FETCH b.category WHERE p.status = :status ORDER BY p.createdAt DESC")
    List<Purchase> findAllWithDetailsByStatus(@Param("status") PurchaseStatus status);

    @Modifying
    @Query("DELETE FROM Purchase p WHERE p.book.id = :bookId")
    void deleteByBookId(@Param("bookId") Long bookId);
}


