package com.example.bookbe.utils;

import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;


public class BCryptUtil {

    // BCryptPasswordEncoder với độ mạnh (strength factor) mặc định là 10
    private static final BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();

    private BCryptUtil() {
        // Private constructor to prevent instantiation
    }

  
    public static String hashPassword(String rawPassword) {
        if (rawPassword == null || rawPassword.isEmpty()) {
            throw new IllegalArgumentException("Mật khẩu không được để trống");
        }
        return encoder.encode(rawPassword);
    }

    public static boolean verifyPassword(String rawPassword, String hashedPassword) {
        if (rawPassword == null || hashedPassword == null) {
            return false;
        }
        return encoder.matches(rawPassword, hashedPassword);
    }
}
