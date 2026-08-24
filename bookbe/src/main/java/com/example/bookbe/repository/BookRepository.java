package com.example.bookbe.repository;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;

import com.example.bookbe.entity.Book;

public interface BookRepository extends JpaRepository<Book, Long> {
    List<Book> findByCreatedById(Long userId);
}
