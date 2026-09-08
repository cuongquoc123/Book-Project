package com.example.bookbe.controller;

import java.time.LocalDate;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookbe.dto.BorrowRequest;
import com.example.bookbe.entity.Purchase;
import com.example.bookbe.entity.User;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.service.BorrowService;

@RestController 
@RequestMapping("/api/borrow")
public class BorrowController {
    private final BorrowService borrowService;
    private final UserRepository userRepository;

    public BorrowController(BorrowService borrowService, UserRepository userRepository) {
        this.borrowService = borrowService;
        this.userRepository = userRepository;
    }

    private User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return userRepository.findByUsername(auth.getName()).orElse(null);
    }

    /**
     * Độc giả gửi yêu cầu mượn sách kèm hạn trả và ghi chú
     */
    @PostMapping("/{bookId}")
    public ResponseEntity<?> borrowBook(
            @PathVariable long bookId,
            @RequestBody(required = false) BorrowRequest request
    ) {
        User currentUser = this.getCurrentUser();
        if (currentUser == null) {
            return ResponseEntity.status(401).body("Vui lòng đăng nhập để mượn sách");
        }

        LocalDate dueDate = (request != null && request.getDueDate() != null) 
                ? request.getDueDate() 
                : LocalDate.now().plusDays(7);
        String note = (request != null) ? request.getNote() : null;

        Purchase borrow = borrowService.BorrowBook(bookId, dueDate, note, currentUser);
        return ResponseEntity.ok(borrow);
    }

    /**
     * Admin duyệt yêu cầu mượn sách
     */
    @PostMapping("/approve/{borrowId}")
    public ResponseEntity<?> approveBorrow(@PathVariable Long borrowId) {
        User currentUser = this.getCurrentUser();
        if (currentUser == null || (!currentUser.isAdmin() && !currentUser.isSuperAdmin())) {
            return ResponseEntity.status(403).body("Bạn không có quyền duyệt yêu cầu mượn sách!");
        }
        Purchase approved = borrowService.approveBorrow(borrowId, currentUser);
        return ResponseEntity.ok(approved);
    }

    /**
     * Admin từ chối yêu cầu mượn sách
     */
    @PostMapping("/reject/{borrowId}")
    public ResponseEntity<?> rejectBorrow(@PathVariable Long borrowId) {
        User currentUser = this.getCurrentUser();
        if (currentUser == null || (!currentUser.isAdmin() && !currentUser.isSuperAdmin())) {
            return ResponseEntity.status(403).body("Bạn không có quyền từ chối yêu cầu mượn sách!");
        }
        Purchase rejected = borrowService.rejectBorrow(borrowId, currentUser);
        return ResponseEntity.ok(rejected);
    }

    /**
     * Trả sách (Độc giả tự trả hoặc Quản trị viên xác nhận thu hồi)
     */
    @PostMapping("/return/{borrowId}")
    public ResponseEntity<?> returnBook(@PathVariable Long borrowId) {
        User currentUser = this.getCurrentUser();
        Purchase borrow = borrowService.returnBook(borrowId, currentUser);
        return ResponseEntity.ok(borrow);
    }
    
    /**
     * Lấy lượt mượn đang active hoặc chờ duyệt của User hiện tại
     */
    @GetMapping("/my-borrow")
    public ResponseEntity<?> myBorrow() {
        User currentUser = this.getCurrentUser();
        Purchase borrow = borrowService.getMyActiveBorrow(currentUser);
        return ResponseEntity.ok(borrow);
    }

    /**
     * Lịch sử mượn trả của User hiện tại
     */
    @GetMapping("/history")
    public ResponseEntity<?> getBorrowHistory() {
        User currentUser = this.getCurrentUser();
        return ResponseEntity.ok(borrowService.getUserBorrowHistory(currentUser));
    }

    /**
     * Lấy toàn bộ danh sách mượn sách toàn hệ thống cho Admin
     */
    @GetMapping("/admin/all")
    public ResponseEntity<?> getAllBorrowsForAdmin() {
        User currentUser = this.getCurrentUser();
        if (currentUser == null || (!currentUser.isAdmin() && !currentUser.isSuperAdmin())) {
            return ResponseEntity.status(403).body("Bạn không có quyền truy cập thông tin quản lý mượn sách!");
        }
        return ResponseEntity.ok(borrowService.getAllBorrowsForAdmin());
    }
}

