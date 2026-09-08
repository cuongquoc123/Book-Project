package com.example.bookbe.service;

import java.time.LocalDateTime;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.utils.LoggerUtil;

@Service
public class UserCleanupService {
    private final UserRepository userRepository;

    public UserCleanupService(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @Transactional
    @Scheduled(cron = "0 0 2 * * *" , zone = "Asia/Ho_Chi_Minh")
    public void  cleanupUnverifiedAccounts() {
        LocalDateTime cutoffTime = LocalDateTime.now().minusDays(1);

        int deleteCount = userRepository.deleteUnverifiedUsersBefore(cutoffTime);
        if (deleteCount > 0) {
            LoggerUtil.inform(" [CRON JOB] Đã tự động dọn dẹp " + deleteCount + " tài khoản chưa xác thực email (quá 24 giờ).");
        } else {
            LoggerUtil.inform(" [CRON JOB] không có tài khoản rác.");
        }
    }
}
