package com.example.bookbe.enums;

public enum PurchaseStatus {
    PENDING,   // Chờ duyệt
    BORROWED,  // Đang mượn (đã được duyệt)
    RETURNED,  // Đã trả
    REJECTED,  // Bị từ chối
    CANCELLED  // Đã hủy
}

