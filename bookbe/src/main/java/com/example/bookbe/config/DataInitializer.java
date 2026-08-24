package com.example.bookbe.config;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.bookbe.entity.User;
import com.example.bookbe.enums.Role;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.utils.LoggerUtil;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        if (!userRepository.existsByUsername("supper")) {
            User superAdmin = User.builder()
                    .username("supper")
                    .password(passwordEncoder.encode("123"))
                    .email("supper@example.com")
                    .fullName("Super Admin")
                    .role(Role.SUPER_ADMIN)
                    .build();

            userRepository.save(superAdmin);
            LoggerUtil.inform("Tài khoản Super Admin 'supper' đã được khởi tạo thành công trong csdl!");
        } else {
            LoggerUtil.inform("Tài khoản Super Admin 'supper' đã tồn tại trong csdl.");
        }
    }
}
