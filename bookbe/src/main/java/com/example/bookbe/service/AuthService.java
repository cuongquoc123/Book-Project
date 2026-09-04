package com.example.bookbe.service;

import java.util.Collections;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.dto.AuthRespone;
import com.example.bookbe.dto.ChangePasswordRequest;
import com.example.bookbe.dto.LoginRequest;
import com.example.bookbe.dto.RefreshTokenRequest;
import com.example.bookbe.dto.RegisterRequest;
import com.example.bookbe.dto.TokenRefreshRespone;
import com.example.bookbe.entity.Permission;
import com.example.bookbe.entity.RefreshToken;
import com.example.bookbe.entity.RoleEntity;
import com.example.bookbe.entity.User;
import com.example.bookbe.exception.RefreshTokenException;
import com.example.bookbe.repository.RoleRepository;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.utils.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Value;
import jakarta.mail.MessagingException;

import java.time.LocalDateTime;
import org.springframework.security.access.AccessDeniedException;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtTokenProvider jwtTokenProvider;
    private final RefreshTokenService refreshTokenService;
    private final RateLimiterService rateLimiterService;
    private final EmailService emailService;

    @Value("${app.frontend.url:http://localhost:5173}")
    private String frontEndUR;

    public AuthService(UserRepository userRepository,
            RoleRepository roleRepository,
            PasswordEncoder passwordEncoder,
            AuthenticationManager authenticationManager,
            JwtTokenProvider jwtTokenProvider,
            RefreshTokenService refreshTokenService,
            RateLimiterService rateLimiterService,
            EmailService emailService) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.passwordEncoder = passwordEncoder;
        this.authenticationManager = authenticationManager;
        this.jwtTokenProvider = jwtTokenProvider;
        this.refreshTokenService = refreshTokenService;
        this.rateLimiterService = rateLimiterService;
        this.emailService = emailService;
    }

    @Transactional
    public User register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username đã tồn tại!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại!");
        }

        RoleEntity clientRole = roleRepository.findByName("CLIENT")
                .orElse(null);

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullname())
                .role(clientRole)
                .build();

        return userRepository.save(user);
    }

    @Transactional
    public User createAdminAccount(RegisterRequest request, String roleName) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username đã tồn tại!");
        }

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email đã tồn tại!");
        }

        String targetRoleName = (roleName != null && !roleName.isBlank()) ? roleName.toUpperCase() : "ADMIN";
        RoleEntity roleEntity = roleRepository.findByName(targetRoleName)
                .orElseThrow(() -> new IllegalArgumentException("Role " + targetRoleName + " không tồn tại!"));

        User user = User.builder()
                .username(request.getUsername())
                .password(passwordEncoder.encode(request.getPassword()))
                .email(request.getEmail())
                .fullName(request.getFullname())
                .role(roleEntity)
                .build();

        return userRepository.save(user);
    }

    public AuthRespone login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword()));

        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("Người dùng không tồn tại!"));

        String roleStr = user.getRole() != null ? user.getRole().getName() : "CLIENT";
        String roleDisplayName = user.getRole() != null ? user.getRole().getDisplayName() : roleStr;
        boolean canAccessAdmin = user.getRole() != null ? user.getRole().isCanAccessAdmin() : true;
        boolean canAccessUser = user.getRole() != null ? user.getRole().isCanAccessUser() : true;

        String accessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), roleStr);
        RefreshToken refreshToken = refreshTokenService.createRefreshToken(user.getUsername());

        Set<String> permissionNames = user.getRole() != null && user.getRole().getPermissions() != null
                ? user.getRole().getPermissions().stream()
                        .map(Permission::getName)
                        .collect(Collectors.toSet())
                : Collections.emptySet();

        return AuthRespone.builder()
                .id(user.getId())
                .username(user.getUsername())
                .accessToken(accessToken)
                .refreshToken(refreshToken.getToken())
                .TokenType("Bearer")
                .fullname(user.getFullName())
                .email(user.getEmail())
                .role(roleStr)
                .roleDisplayName(roleDisplayName)
                .canAccessAdmin(canAccessAdmin)
                .canAccessUser(canAccessUser)
                .permissions(permissionNames)
                .build();
    }

    public TokenRefreshRespone refreshToken(RefreshTokenRequest request) {
        String refreshTokenStr = request.getRefreshToken();
        if (refreshTokenStr == null || refreshTokenStr.isBlank()) {
            throw new RefreshTokenException("Refresh token không được để trống!");
        }

        if (!jwtTokenProvider.validateToken(refreshTokenStr)) {
            throw new RefreshTokenException("Refresh token không hợp lệ!");
        }

        RefreshToken refreshToken = refreshTokenService.findByToken(refreshTokenStr)
                .orElseThrow(() -> new RefreshTokenException("Refresh token không tồn tại trong hệ thống!"));

        refreshToken = refreshTokenService.verifyExpiration(refreshToken);
        User user = refreshToken.getUser();

        // Soft delete token cũ khi đã được sử dụng
        refreshTokenService.deleteByToken(refreshTokenStr);

        // Tạo Refresh Token mới cho người dùng
        RefreshToken newRefreshToken = refreshTokenService.createRefreshToken(user.getUsername());
        String roleStr = user.getRole() != null ? user.getRole().getName() : "CLIENT";
        String newAccessToken = jwtTokenProvider.generateAccessToken(user.getUsername(), roleStr);

        return TokenRefreshRespone.builder()
                .accessToken(newAccessToken)
                .refreshToken(newRefreshToken.getToken())
                .tokenType("Bearer")
                .build();
    }

    public void logout(String refreshTokenStr) {
        if (refreshTokenStr != null && !refreshTokenStr.isBlank()) {
            refreshTokenService.deleteByToken(refreshTokenStr);
        }
    }

    public Map<String, Object> getCurrentUser(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng: " + username));

        Set<String> permissionNames = user.getRole() != null && user.getRole().getPermissions() != null
                ? user.getRole().getPermissions().stream()
                        .map(Permission::getName)
                        .collect(Collectors.toSet())
                : Collections.emptySet();

        Map<String, Object> userInfo = new HashMap<>();
        userInfo.put("id", user.getId());
        userInfo.put("username", user.getUsername());
        userInfo.put("email", user.getEmail());
        userInfo.put("fullName", user.getFullName());
        userInfo.put("role", user.getRole() != null ? user.getRole().getName() : null);
        userInfo.put("roleDisplayName", user.getRole() != null ? user.getRole().getDisplayName() : null);
        userInfo.put("canAccessAdmin", user.getRole() != null ? user.getRole().isCanAccessAdmin() : true);
        userInfo.put("canAccessUser", user.getRole() != null ? user.getRole().isCanAccessUser() : true);
        userInfo.put("permissions", permissionNames);
        userInfo.put("roleDetails", user.getRole());
        userInfo.put("createdAt", user.getCreatedAt());

        return userInfo;
    }

    public List<Map<String, Object>> getAllUsers() {
        return userRepository.findAll().stream().map(user -> {
            Map<String, Object> map = new HashMap<>();
            map.put("id", user.getId());
            map.put("username", user.getUsername());
            map.put("email", user.getEmail());
            map.put("fullName", user.getFullName());
            map.put("roleId", user.getRole() != null ? user.getRole().getId() : null);
            map.put("role", user.getRole() != null ? user.getRole().getName() : null);
            map.put("roleDisplayName", user.getRole() != null ? user.getRole().getDisplayName() : null);
            map.put("canAccessAdmin", user.getRole() != null ? user.getRole().isCanAccessAdmin() : true);
            map.put("canAccessUser", user.getRole() != null ? user.getRole().isCanAccessUser() : true);
            map.put("createdAt", user.getCreatedAt());
            return map;
        }).collect(Collectors.toList());
    }

    @Transactional
    public Map<String, Object> updateUserRole(Long userId, Long roleId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy người dùng với ID: " + userId));

        if ("supper".equalsIgnoreCase(user.getUsername())) {
            throw new IllegalArgumentException("Không thể thay đổi Role của tài khoản Super Admin gốc!");
        }

        RoleEntity role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy Role với ID: " + roleId));

        user.setRole(role);
        User updatedUser = userRepository.save(user);

        Map<String, Object> res = new HashMap<>();
        res.put("id", updatedUser.getId());
        res.put("username", updatedUser.getUsername());
        res.put("roleId", role.getId());
        res.put("roleName", role.getName());
        res.put("roleDisplayName", role.getDisplayName());
        return res;
    }

    @Transactional
    public Map<String, Object> changePassword(ChangePasswordRequest request, String currentUsername,
            String currentToken) {
        if (currentUsername == null || currentUsername.isBlank()) {
            throw new IllegalArgumentException("Yêu cầu xác thực người dùng!");
        }

        User currentUser = userRepository.findByUsername(currentUsername)
                .orElseThrow(
                        () -> new IllegalArgumentException("Không tìm thấy người dùng hiện tại: " + currentUsername));

        boolean isSuperAdmin = currentUser.isSuperAdmin();

        User targetUser;
        boolean isChangingSelf = (request.getUserId() == null || request.getUserId().equals(currentUser.getId()));

        if (isChangingSelf) {
            targetUser = currentUser;
            // Bắt buộc kiểm tra mật khẩu cũ đối với tài khoản tự đổi
            if (request.getOldPassword() == null || request.getOldPassword().isBlank()) {
                throw new IllegalArgumentException("Vui lòng nhập mật khẩu hiện tại!");
            }
            if (!passwordEncoder.matches(request.getOldPassword(), targetUser.getPassword())) {
                throw new IllegalArgumentException("Mật khẩu hiện tại không chính xác!");
            }
        } else {
            // Đổi mật khẩu cho người khác -> CHỈ SUPER_ADMIN mới có quyền
            if (!isSuperAdmin) {
                throw new AccessDeniedException("Bạn không có quyền đổi mật khẩu của người dùng khác!");
            }
            targetUser = userRepository.findById(request.getUserId())
                    .orElseThrow(() -> new IllegalArgumentException(
                            "Không tìm thấy người dùng với ID: " + request.getUserId()));
        }

        // Validate mật khẩu mới
        String newPassword = request.getNewPassword();
        if (newPassword == null || newPassword.isBlank()) {
            throw new IllegalArgumentException("Vui lòng nhập mật khẩu mới!");
        }
        if (newPassword.trim().length() < 6) {
            throw new IllegalArgumentException("Mật khẩu mới phải có độ dài tối thiểu 6 ký tự!");
        }

        // Kiểm tra mật khẩu mới không được trùng với mật khẩu cũ
        if (passwordEncoder.matches(newPassword, targetUser.getPassword())) {
            throw new IllegalArgumentException("Mật khẩu mới không được trùng với mật khẩu hiện tại!");
        }

        // Cập nhật mật khẩu mới
        targetUser.setPassword(passwordEncoder.encode(newPassword));

        // Xử lý logout tất cả clients / vô hiệu hóa toàn bộ token nếu được yêu cầu
        boolean loggedOutAll = false;
        if (request.isLogoutAllClients()) {
            // 1. Đặt mốc thời gian vô hiệu hóa toàn bộ Access Token của user này
            targetUser.setTokenInvalidBefore(LocalDateTime.now().minusSeconds(1));

            // 2. Soft-delete toàn bộ Refresh Token của user này
            refreshTokenService.deleteByUserId(targetUser.getId());

            // 3. Nếu người đổi là chính mình và có token hiện tại, đưa token này vào
            // blacklist
            if (isChangingSelf && currentToken != null && !currentToken.isBlank()) {
                rateLimiterService.revokeToken(currentToken);
            }
            loggedOutAll = true;
        }

        userRepository.save(targetUser);

        Map<String, Object> result = new HashMap<>();
        result.put("message", isChangingSelf
                ? "Đổi mật khẩu thành công!"
                : "Đổi mật khẩu cho người dùng '" + targetUser.getUsername() + "' thành công!");
        result.put("username", targetUser.getUsername());
        result.put("userId", targetUser.getId());
        result.put("logoutAllClients", loggedOutAll);
        return result;
    }

    public void processForgotPassword(String email) throws MessagingException {

        User user = userRepository.findByEmail(email.trim())
                .orElseThrow(() -> new IllegalArgumentException("email chưa được liên kết tài khoản"));
        String resetToken = jwtTokenProvider.generateResetPasswordToken(user.getEmail());
        String resetLink = frontEndUR + "/reset-password?token=" + resetToken;
        emailService.sendEmailResetPassword(email, resetLink);
    }

    @Transactional
    public void processResetPassword(String token, String newPassword) {
        String email = jwtTokenProvider.getEmailFromResetToken(token);
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Không tìm thấy tài khoản tương ứng!"));
        user.setPassword(passwordEncoder.encode(newPassword.trim()));
        userRepository.save(user);
    }
}
