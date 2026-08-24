package com.example.bookbe.repository;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.bookbe.entity.Category;


public interface CategoryRepository extends JpaRepository<Category, Long> {
    boolean existsByName(String name);
}
