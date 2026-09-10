package com.example.bookbe.service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
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

    public BorrowService(PurchaseRepository purchaseRepository, BookRepository bookRepository) {
        this.purchaseRepository = purchaseRepository;
        this.bookRepository = bookRepository;
    }

    /**
     * Độc giả gửi yêu cầu mượn sách kèm ngày hẹn trả
     */
    @Transactional
    public Purchase BorrowBook(Long bookId, LocalDate dueDate, String note, User currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để mượn sách");
        }

        if (dueDate == null) {
            throw new IllegalArgumentException("Vui lòng chọn ngày hẹn trả sách!");
        }

        if (dueDate.isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Ngày hẹn trả không được ở trong quá khứ!");
        }

        // 1. Kiểm tra xem độc giả đã có đơn PENDING hoặc BORROWED cho CHÍNH cuốn sách này chưa
        boolean alreadyBorrowingThisBook = purchaseRepository.existsByUserIdAndBookIdAndStatusIn(
                currentUser.getId(), 
                bookId,
                List.of(PurchaseStatus.PENDING, PurchaseStatus.BORROWED)
        );

        if (alreadyBorrowingThisBook) {
            throw new IllegalArgumentException("Bạn đang có 1 đơn mượn cuốn sách này (đang chờ duyệt hoặc đang đọc). Vui lòng hoàn tất trước khi tạo thêm đơn mượn cuốn này!");
        }

        Book book = bookRepository.findById(bookId)
                    .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy sách với ID " + bookId));
        
        int totalStock = book.getTotalStock() != null ? book.getTotalStock() : 10;
        
        // 2. Số lượng sách được mượn tối đa là 50% tổng số sách, làm tròn xuống (ví dụ 5 * 50% = 2)
        int maxBorrowable = (int) Math.floor(totalStock * 0.5);
        if (maxBorrowable <= 0) {
            throw new IllegalStateException("Đầu sách này có tổng số lượng là " + totalStock + " cuốn nên không đủ điều kiện cho mượn ra ngoài (giới hạn 50% làm tròn xuống là 0 cuốn).");
        }

        long currentlyBorrowed = purchaseRepository.countByBookIdAndStatusIn(
                bookId, 
                List.of(PurchaseStatus.PENDING, PurchaseStatus.BORROWED)
        );

        if (currentlyBorrowed >= maxBorrowable) {
            throw new IllegalStateException("Đầu sách \"" + book.getTitle() + "\" đã đạt giới hạn cho mượn tối đa (" + maxBorrowable + "/" + totalStock + " cuốn - 50% tổng số sách). Vui lòng chọn sách khác hoặc chờ độc giả khác hoàn trả!");
        }

        int avail = book.getAvailableStock() != null ? book.getAvailableStock() : totalStock;
        if (avail <= 0) {
            throw new IllegalStateException("Sách này hiện tại đã hết bản sao khả dụng trong kho. Vui lòng chọn quyển khác!");
        }

        Purchase borrow = Purchase.builder()
                                    .book(book)
                                    .user(currentUser)
                                    .dueDate(dueDate)
                                    .note(note)
                                    .status(PurchaseStatus.PENDING)
                                    .build();

        return purchaseRepository.save(borrow);
    }

    /**
     * Admin / Super Admin duyệt yêu cầu mượn sách
     */
    @Transactional
    public Purchase approveBorrow(Long borrowId, User adminUser) {
        if (adminUser == null || (!adminUser.isAdmin() && !adminUser.isSuperAdmin())) {
            throw new IllegalArgumentException("Bạn không có quyền duyệt yêu cầu mượn sách!");
        }

        Purchase borrow = purchaseRepository.findById(borrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu mượn sách với ID " + borrowId));

        if (borrow.getStatus() != PurchaseStatus.PENDING) {
            throw new IllegalStateException("Yêu cầu mượn sách này không ở trạng thái chờ duyệt (Trạng thái hiện tại: " + borrow.getStatus() + ")!");
        }

        Book book = borrow.getBook();
        int avail = book.getAvailableStock() != null ? book.getAvailableStock() : (book.getTotalStock() != null ? book.getTotalStock() : 10);
        if (avail <= 0) {
            throw new IllegalStateException("Sách \"" + book.getTitle() + "\" hiện tại đã hết số lượng khả dụng trong kho!");
        }

        // Trừ tồn kho khả dụng
        book.setAvailableStock(avail - 1);
        bookRepository.save(book);

        // Cập nhật trạng thái sang BORROWED và ghi nhận thời gian mượn thực tế
        borrow.setStatus(PurchaseStatus.BORROWED);
        borrow.setBorrowedAt(LocalDateTime.now());

        return purchaseRepository.save(borrow);
    }

    /**
     * Admin / Super Admin từ chối yêu cầu mượn sách
     */
    @Transactional
    public Purchase rejectBorrow(Long borrowId, User adminUser) {
        if (adminUser == null || (!adminUser.isAdmin() && !adminUser.isSuperAdmin())) {
            throw new IllegalArgumentException("Bạn không có quyền từ chối yêu cầu mượn sách!");
        }

        Purchase borrow = purchaseRepository.findById(borrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy yêu cầu mượn sách với ID " + borrowId));

        if (borrow.getStatus() != PurchaseStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể từ chối các yêu cầu đang ở trạng thái chờ duyệt!");
        }

        borrow.setStatus(PurchaseStatus.REJECTED);
        return purchaseRepository.save(borrow);
    }

    /**
     * Trả sách (Độc giả tự trả hoặc Admin xác nhận thu hồi sách)
     */
    @Transactional
    public Purchase returnBook(Long borrowId, User currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để thực hiện trả sách");
        }

        Purchase borrow = purchaseRepository.findById(borrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin mượn sách"));

        boolean isOwner = currentUser.getId() != null && currentUser.getId().equals(borrow.getUser().getId());
        boolean isManager = currentUser.isSuperAdmin() || currentUser.isAdmin();
        if (!isOwner && !isManager) {
            throw new IllegalArgumentException("Bạn không có quyền thực hiện thao tác này!");
        }

        if (borrow.getStatus() == PurchaseStatus.RETURNED) {
            throw new IllegalArgumentException("Sách này đã được trả trước đó!");
        }

        if (borrow.getStatus() == PurchaseStatus.PENDING) {
            // Nếu hủy yêu cầu mượn khi chưa duyệt
            borrow.setStatus(PurchaseStatus.CANCELLED);
            return purchaseRepository.save(borrow);
        }

        boolean wasBorrowed = borrow.getStatus() == PurchaseStatus.BORROWED;

        borrow.setStatus(PurchaseStatus.RETURNED);
        borrow.setReturnedAt(LocalDateTime.now());
        
        if (wasBorrowed) {
            Book book = borrow.getBook();
            int currentAvail = book.getAvailableStock() != null ? book.getAvailableStock() : 0;
            int totalStock = book.getTotalStock() != null ? book.getTotalStock() : 10;
            book.setAvailableStock(Math.min(totalStock, currentAvail + 1));
            bookRepository.save(book);
        }

        return purchaseRepository.save(borrow);
    }

    /**
     * Độc giả hủy yêu cầu mượn sách khi đang ở trạng thái PENDING (Chờ duyệt)
     */
    @Transactional
    public Purchase cancelBorrow(Long borrowId, User currentUser) {
        if (currentUser == null) {
            throw new IllegalArgumentException("Vui lòng đăng nhập để thực hiện hủy yêu cầu mượn sách");
        }

        Purchase borrow = purchaseRepository.findById(borrowId)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy thông tin yêu cầu mượn sách"));

        boolean isOwner = currentUser.getId() != null && currentUser.getId().equals(borrow.getUser().getId());
        boolean isManager = currentUser.isSuperAdmin() || currentUser.isAdmin();
        if (!isOwner && !isManager) {
            throw new IllegalArgumentException("Bạn không có quyền hủy yêu cầu này!");
        }

        if (borrow.getStatus() != PurchaseStatus.PENDING) {
            throw new IllegalStateException("Chỉ có thể hủy yêu cầu mượn sách khi đang ở trạng thái Chờ Duyệt (PENDING)!");
        }

        borrow.setStatus(PurchaseStatus.CANCELLED);
        return purchaseRepository.save(borrow);
    }

    /**
     * Lấy lượt mượn đang active hoặc pending gần nhất của độc giả
     */
    @Transactional(readOnly = true)
    public Purchase getMyActiveBorrow(User currentUser) {
        if (currentUser == null) {
            return null;
        }  
        return purchaseRepository.findFirstByUserIdAndStatusInOrderByCreatedAtDesc(
                currentUser.getId(), 
                List.of(PurchaseStatus.PENDING, PurchaseStatus.BORROWED)
        ).orElse(null);
    }

    /**
     * Lấy danh sách tất cả các lượt mượn đang active hoặc pending của độc giả
     */
    @Transactional(readOnly = true)
    public List<Purchase> getMyActiveBorrows(User currentUser) {
        if (currentUser == null) {
            return List.of();
        }
        return purchaseRepository.findByUserIdAndStatusInOrderByCreatedAtDesc(
                currentUser.getId(),
                List.of(PurchaseStatus.PENDING, PurchaseStatus.BORROWED)
        );
    }

    /**
     * Lấy lịch sử mượn trả phân trang của độc giả
     */
    @Transactional(readOnly = true)
    public Page<Purchase> getUserBorrowHistory(User currentUser, Pageable pageable) {
        if (currentUser == null) {
            return Page.empty(pageable);
        }
        return purchaseRepository.findByUserIdWithBook(currentUser.getId(), pageable);
    }

    /**
     * Lấy toàn bộ lịch sử mượn trả của độc giả
     */
    @Transactional(readOnly = true)
    public List<Purchase> getUserBorrowHistory(User currentUser) {
        if (currentUser == null) {
            return List.of();
        }
        return purchaseRepository.findByUserIdWithBookOrderByCreatedAtDesc(currentUser.getId());
    }

    /**
     * Lấy danh sách mượn sách phân trang cho Admin quản lý
     */
    @Transactional(readOnly = true)
    public Page<Purchase> getAllBorrowsForAdmin(Pageable pageable) {
        return purchaseRepository.findAllWithDetails(pageable);
    }

    /**
     * Lấy toàn bộ danh sách mượn sách cho Admin quản lý
     */
    @Transactional(readOnly = true)
    public List<Purchase> getAllBorrowsForAdmin() {
        return purchaseRepository.findAllWithDetails();
    }
}

