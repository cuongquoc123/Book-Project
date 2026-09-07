package com.example.bookbe.service;

import java.time.LocalDateTime;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.entity.Book;
import com.example.bookbe.entity.Purchase;
import com.example.bookbe.entity.User;
import com.example.bookbe.enums.PurchaseStatus;
import com.example.bookbe.exception.ResourceNotFoundException;
import com.example.bookbe.repository.BookRepository;
import com.example.bookbe.repository.PurchaseRepository;

@Service 
public class BorrowService {
    
    private final PurchaseRepository purchaseRepository;
    private final BookRepository bookRepository;

    public  BorrowService (PurchaseRepository purchaseRepository, BookRepository bookRepository) {
        this.purchaseRepository = purchaseRepository;
        this.bookRepository = bookRepository;
    }

    @Transactional
    public Purchase BorrowBook(Long bookId, User currenUser) {
        if (currenUser == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để mượn sách");
        }

        boolean hasBorow = purchaseRepository.existsByUserIdAndStatus(currenUser.getId(), PurchaseStatus.BORROWED);

        if (hasBorow) {
            throw new IllegalArgumentException("Bạn đang mượn 1 cuốn sách. Hãy trả sách hiện tại trước khi mượn cuốn mới!");
        }

        Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID " + bookId));
        
        int avail = book.getAvailableStock() != null ? book.getAvailableStock() : (book.getTotalStock() != null ? book.getTotalStock() : 10);
        if (avail <= 0) {
            throw new IllegalStateException("Sách đã được mượn hết. Vui lòng chọn quyển khác!");
        }

        book.setAvailableStock(avail - 1);
        bookRepository.save(book);

        Purchase borrow =  Purchase.builder()
                                    .book(book)
                                    .user(currenUser)
                                    .borrowedAt(LocalDateTime.now())
                                    .status(PurchaseStatus.BORROWED)
                                    .build();

        return  purchaseRepository.save(borrow);
    }

    @Transactional
    public  Purchase returnBook(Long borrowId, User currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để trả sách");
        }
        // Tìm kiếm thông tin mượn sách
        Purchase borrow = purchaseRepository.findById(borrowId)
                                            .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin mượn sách"));
        // Kiểm tra quyền thực hiện giao tác (chỉ người mượn hoặc Admin mới được trả)
        boolean isOwner = currentUser.getId() != null && currentUser.getId().equals(borrow.getUser().getId());
        boolean isManager = currentUser.isSuperAdmin() || currentUser.isAdmin();
        if (!isOwner && !isManager) {
            throw new IllegalArgumentException("Bạn không có quyền thực hiện!");
        }
        // Kiểm tra nếu sách đã trả trước đó thì không thực hiện tiếp
        if (borrow.getStatus() == PurchaseStatus.RETURNED) {
            throw new IllegalArgumentException("Sách đã đươc trả không thể thực hiện lại");
        }

        borrow.setStatus(PurchaseStatus.RETURNED);
        borrow.setReturnedAt(LocalDateTime.now());
        
        Book book = borrow.getBook();
        int currentAvail = book.getAvailableStock() != null ? book.getAvailableStock() : 0;
        int totalStock = book.getTotalStock() != null ? book.getTotalStock() : 10;
        book.setAvailableStock(Math.min(totalStock, currentAvail + 1));
        bookRepository.save(book);

        return purchaseRepository.save(borrow);
    }

    @Transactional(readOnly=true)
    public  Purchase getMyActiveBorrow(User currenUser) {
      if (currenUser == null) {
        return null;
      }  
      return purchaseRepository.findByUserIdAndStatus(currenUser.getId(), PurchaseStatus.BORROWED)
                                .orElse(null);
    }

    @Transactional(readOnly=true)
    public java.util.List<Purchase> getUserBorrowHistory(User currentUser) {
        if (currentUser == null) {
            return java.util.Collections.emptyList();
        }
        return purchaseRepository.findByUserIdOrderByCreatedAtDesc(currentUser.getId());
    }
}
