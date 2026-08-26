package com.example.bookbe.service;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.dto.CategoryRequest;
import com.example.bookbe.dto.CategoryResponse;
import com.example.bookbe.entity.Category;
import com.example.bookbe.entity.User;
import com.example.bookbe.exception.ResourceNotFoundException;
import com.example.bookbe.repository.CategoryRepository;

@Service
public class CategoryService {

    private final CategoryRepository categoryRepository;

    public CategoryService(CategoryRepository categoryRepository) {
        this.categoryRepository = categoryRepository;
    }

    @Transactional
    public CategoryResponse createCategory(CategoryRequest request, User currentUser) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên loại sách không được để trống!");
        }

        if (categoryRepository.existsByName(request.getName().trim())) {
            throw new IllegalArgumentException("Tên loại sách đã tồn tại!");
        }

        Category category = Category.builder()
                .name(request.getName().trim())
                .description(request.getDescription())
                .createdBy(currentUser)
                .build();

        Category savedCategory = categoryRepository.save(category);
        return mapToResponse(savedCategory);
    }

    @Transactional(readOnly = true)
    public Page<CategoryResponse> getAllCategories(Pageable pageable) {
        return categoryRepository.findAll(pageable)
                .map(cate -> mapToResponse(cate));
    }

    @Transactional(readOnly = true)
    public CategoryResponse getCategoryById(Long id) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại sách với ID: " + id));
        return mapToResponse(category);
    }

    @Transactional
    public CategoryResponse updateCategory(Long id, CategoryRequest request, User currentUser) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại sách với ID: " + id));

        // Permission check: Super Admin OR Owner Admin
        if (!category.canManage(currentUser)) {
            throw new AccessDeniedException(
                    "Bạn không có quyền chỉnh sửa loại sách này! Chỉ người tạo ra loại sách hoặc Super Admin mới có quyền.");
        }

        if (request.getName() != null && !request.getName().trim().isEmpty()) {
            String newName = request.getName().trim();
            if (!newName.equalsIgnoreCase(category.getName()) && categoryRepository.existsByName(newName)) {
                throw new IllegalArgumentException("Tên loại sách '" + newName + "' đã tồn tại!");
            }
            category.setName(newName);
        }

        if (request.getDescription() != null) {
            category.setDescription(request.getDescription());
        }

        Category updatedCategory = categoryRepository.save(category);
        return mapToResponse(updatedCategory);
    }

    @Transactional
    public void deleteCategory(Long id, User currentUser) {
        Category category = categoryRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy loại sách với ID: " + id));

        // Permission check: Super Admin OR Owner Admin
        if (!category.canManage(currentUser)) {
            throw new AccessDeniedException(
                    "Bạn không có quyền xóa loại sách này! Chỉ người tạo ra loại sách hoặc Super Admin mới có quyền.");
        }

        categoryRepository.delete(category);
    }

    public CategoryResponse mapToResponse(Category category) {
        if (category == null)
            return null;
        return CategoryResponse.builder()
                .id(category.getId())
                .name(category.getName())
                .description(category.getDescription())
                .createdByUserId(category.getCreatedBy() != null ? category.getCreatedBy().getId() : null)
                .createdByName(category.getCreatedBy() != null ? category.getCreatedBy().getUsername() : "Hệ thống")
                .createdAt(category.getCreatedAt())
                .updatedAt(category.getUpdatedAt())
                .build();
    }
}
