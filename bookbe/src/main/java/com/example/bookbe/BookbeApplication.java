package com.example.bookbe;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling 
public class BookbeApplication {

	public static void main(String[] args) {
		SpringApplication.run(BookbeApplication.class, args);
	}

}
