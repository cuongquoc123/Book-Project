package com.example.bookbe.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.example.bookbe.entity.Purchase;
import com.example.bookbe.entity.User;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.service.BorrowService;

import jakarta.websocket.server.PathParam;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;


@RestController 
@RequestMapping("/api/borrow")
public class BorrowController {
    private  final BorrowService borrowService;
    private  final UserRepository userRepository;

    public  BorrowController(BorrowService borrowService, UserRepository userRepository) {
        this.borrowService = borrowService;
        this.userRepository = userRepository;

    }

    private  User getCurrentUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || !auth.isAuthenticated() || "anonymousUser".equals(auth.getPrincipal())) {
            return null;
        }
        return  userRepository.findByUsername(auth.getName()).orElse(null);
    }
    // Mượn sách
    @PostMapping("/{bookId}")
    public ResponseEntity<?> borrowBook(@PathVariable long bookId) {
        User currentUser = this.getCurrentUser();
        Purchase borrow = borrowService.BorrowBook(bookId, currentUser);
        return ResponseEntity.ok(borrow);
    }
    // Trả sách
    @PostMapping("/return/{borrowId}")
    public ResponseEntity<?> returnBook(@PathVariable  Long borrowId) {
        User currentUser = this.getCurrentUser();
        Purchase borrow = borrowService.returnBook(borrowId, currentUser);
        return ResponseEntity.ok(borrow);
    }
    
    @GetMapping("/my-borrow")
    public  ResponseEntity<?> myBorrow() {
        User currenUser = this.getCurrentUser();
        Purchase borrow = borrowService.getMyActiveBorrow(currenUser);
        return ResponseEntity.ok(borrow);
    }

    @GetMapping("/history")
    public ResponseEntity<?> getBorrowHistory() {
        User currentUser = this.getCurrentUser();
        return ResponseEntity.ok(borrowService.getUserBorrowHistory(currentUser));
    }
}
