package com.example.bookbe.service;

import java.util.List;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.dto.BookRequest;
import com.example.bookbe.dto.BookResponse;
import com.example.bookbe.entity.Book;
import com.example.bookbe.entity.Category;
import com.example.bookbe.entity.User;
import com.example.bookbe.enums.PurchaseStatus;
import com.example.bookbe.exception.ResourceNotFoundException;
import com.example.bookbe.repository.BookRepository;
import com.example.bookbe.repository.CategoryRepository;
import com.example.bookbe.repository.PurchaseRepository;

@Service
public class BookService {

    private final BookRepository bookRepository;
    private final CategoryRepository categoryRepository;
    private final PurchaseRepository purchaseRepository;

    public BookService(BookRepository bookRepository,
                       CategoryRepository categoryRepository,
                       PurchaseRepository purchaseRepository) {
        this.bookRepository = bookRepository;
        this.categoryRepository = categoryRepository;
        this.purchaseRepository = purchaseRepository;
    }

    @Transactional
    public BookResponse createBook(BookRequest request, User currentUser) {
        if (request.getTitle() == null || request.getTitle().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên sách không được để trống!");
        }

        if (request.getCategoryId() == null) {
            throw new IllegalArgumentException("Vui lòng chọn loại sách!");
        }

        Category category = categoryRepository.findById(request.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại sách với ID: " + request.getCategoryId()));

        Book book = Book.builder()
                .title(request.getTitle().trim())
                .author(request.getAuthor())
                .description(request.getDescription())
                .coverUrl(request.getCoverUrl())
                .price(request.getPrice())
                .category(category)
                .createdBy(currentUser)
                .build();

        Book savedBook = bookRepository.save(book);
        return mapToResponse(savedBook, currentUser);
    }

    @Transactional(readOnly = true)
    public Page<BookResponse> getAllBooks(Pageable pageable,User currentUser) {
        return bookRepository.findAll(pageable).map(
            book -> mapToResponse(book, currentUser)
        );
    }

    @Transactional(readOnly = true)
    public BookResponse getBookById(Long id, User currentUser) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));
        return mapToResponse(book, currentUser);
    }

    @Transactional
    public BookResponse updateBook(Long id, BookRequest request, User currentUser) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));

        // Permission check: Super Admin OR Creator Admin
        if (!book.canManage(currentUser)) {
            throw new AccessDeniedException("Bạn không có quyền chỉnh sửa sách này! Chỉ người tạo ra sách hoặc Super Admin mới có quyền.");
        }

        if (request.getTitle() != null && !request.getTitle().trim().isEmpty()) {
            book.setTitle(request.getTitle().trim());
        }
        if (request.getAuthor() != null) {
            book.setAuthor(request.getAuthor());
        }
        if (request.getDescription() != null) {
            book.setDescription(request.getDescription());
        }
        if (request.getCoverUrl() != null) {
            book.setCoverUrl(request.getCoverUrl());
        }
        if (request.getPrice() != null) {
            book.setPrice(request.getPrice());
        }
        if (request.getCategoryId() != null) {
            Category category = categoryRepository.findById(request.getCategoryId())
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại sách với ID: " + request.getCategoryId()));
            book.setCategory(category);
        }

        Book updatedBook = bookRepository.save(book);
        return mapToResponse(updatedBook, currentUser);
    }

    @Transactional
    public void deleteBook(Long id, User currentUser) {
        Book book = bookRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID: " + id));

        // Permission check: Super Admin OR Creator Admin
        if (!book.canManage(currentUser)) {
            throw new AccessDeniedException("Bạn không có quyền xóa sách này! Chỉ người tạo ra sách hoặc Super Admin mới có quyền.");
        }

        bookRepository.delete(book);
    }

    public BookResponse mapToResponse(Book book, User currentUser) {
        if (book == null) return null;

        boolean isPurchased = false;
        boolean hasFullAccess = false;
        String notice = "Bạn cần mua sách này để đọc toàn bộ nội dung.";

        if (currentUser != null) {
            // Super Admin or Admin who created the book or has manage permission
            if (currentUser.isSuperAdmin() || book.canManage(currentUser)) {
                isPurchased = true;
                hasFullAccess = true;
                notice = "Bạn có quyền quản trị toàn bộ tài nguyên sách này.";
            } else {
                // Client user check purchase status
                isPurchased = purchaseRepository.existsByUserIdAndBookIdAndStatus(
                        currentUser.getId(), book.getId(), PurchaseStatus.COMPLETED);

                if (isPurchased) {
                    hasFullAccess = true;
                    notice = "Đã mua - Bạn có quyền đọc toàn bộ nội dung cuốn sách này.";
                } else {
                    hasFullAccess = false;
                    notice = "Xem trước giới thiệu - Bạn cần mua cuốn sách này để đọc toàn bộ nội dung.";
                }
            }
        }

        return BookResponse.builder()
                .id(book.getId())
                .title(book.getTitle())
                .author(book.getAuthor())
                .description(book.getDescription())
                .coverUrl(book.getCoverUrl())
                .price(book.getPrice())
                .categoryId(book.getCategory() != null ? book.getCategory().getId() : null)
                .categoryName(book.getCategory() != null ? book.getCategory().getName() : null)
                .createdByUserId(book.getCreatedBy() != null ? book.getCreatedBy().getId() : null)
                .createdByName(book.getCreatedBy() != null ? book.getCreatedBy().getUsername() : "Hệ thống")
                .createdAt(book.getCreatedAt())
                .updatedAt(book.getUpdatedAt())
                .isPurchased(isPurchased)
                .hasFullAccess(hasFullAccess)
                .notice(notice)
                .build();
    }
}
