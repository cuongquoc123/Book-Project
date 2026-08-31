package com.example.bookbe.config;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import com.example.bookbe.entity.Permission;
import com.example.bookbe.entity.RoleEntity;
import com.example.bookbe.entity.User;
import com.example.bookbe.repository.PermissionRepository;
import com.example.bookbe.repository.RoleRepository;
import com.example.bookbe.repository.UserRepository;
import com.example.bookbe.utils.LoggerUtil;

@Component
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final PasswordEncoder passwordEncoder;

    public DataInitializer(UserRepository userRepository,
                           RoleRepository roleRepository,
                           PermissionRepository permissionRepository,
                           PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) throws Exception {
        initPermissionsAndRoles();
        initSuperAdminUser();
    }

    private void initPermissionsAndRoles() {
        // 1. Define standard permissions for resources
        String[][] permissionMatrix = {
            {"BOOK", "READ", "Xem danh sách và chi tiết sách"},
            {"BOOK", "CREATE", "Thêm sách mới"},
            {"BOOK", "UPDATE", "Chỉnh sửa thông tin sách"},
            {"BOOK", "DELETE", "Xóa sách"},

            {"CATEGORY", "READ", "Xem loại sách"},
            {"CATEGORY", "CREATE", "Thêm loại sách mới"},
            {"CATEGORY", "UPDATE", "Chỉnh sửa loại sách"},
            {"CATEGORY", "DELETE", "Xóa loại sách"},

            {"USER", "READ", "Xem danh sách người dùng"},
            {"USER", "CREATE", "Tạo người dùng mới"},
            {"USER", "UPDATE", "Chỉnh sửa người dùng"},
            {"USER", "DELETE", "Xóa người dùng"},

            {"PURCHASE", "READ", "Xem thông tin mua hàng"},
            {"PURCHASE", "CREATE", "Thực hiện mua hàng"},
            {"PURCHASE", "UPDATE", "Cập nhật đơn hàng"},
            {"PURCHASE", "DELETE", "Hủy đơn hàng"},

            {"ROLE", "READ", "Xem danh sách Role và Permission"},
            {"ROLE", "CREATE", "Tạo Custom Role mới"},
            {"ROLE", "UPDATE", "Chỉnh sửa Custom Role"},
            {"ROLE", "DELETE", "Xóa Custom Role"}
        };

        Set<Permission> allPermissions = new HashSet<>();

        for (String[] perm : permissionMatrix) {
            String resource = perm[0];
            String action = perm[1];
            String desc = perm[2];
            String permName = resource + "_" + action;

            Permission permission = permissionRepository.findByName(permName)
                    .orElseGet(() -> permissionRepository.save(Permission.builder()
                            .name(permName)
                            .resource(resource)
                            .action(action)
                            .description(desc)
                            .build()));
            allPermissions.add(permission);
        }

        // 2. Initialize SUPER_ADMIN role (Has ALL permissions)
        RoleEntity superAdminRole = roleRepository.findByName("SUPER_ADMIN").orElseGet(() -> {
            return roleRepository.save(RoleEntity.builder()
                    .name("SUPER_ADMIN")
                    .displayName("Super Admin")
                    .description("Quản trị viên tối cao với toàn quyền truy cập")
                    .isSystem(true)
                    .canAccessAdmin(true)
                    .canAccessUser(true)
                    .permissions(new HashSet<>(allPermissions))
                    .build());
        });
        // Ensure super admin has full permissions set
        if (superAdminRole.getPermissions() == null || superAdminRole.getPermissions().size() < allPermissions.size()) {
            superAdminRole.setPermissions(new HashSet<>(allPermissions));
            roleRepository.save(superAdminRole);
        }

        // 3. Initialize ADMIN role
        roleRepository.findByName("ADMIN").orElseGet(() -> {
            Set<Permission> adminPerms = new HashSet<>();
            for (Permission p : allPermissions) {
                if (!p.getName().startsWith("ROLE_CREATE") && !p.getName().startsWith("ROLE_DELETE") && !p.getName().startsWith("ROLE_UPDATE")) {
                    adminPerms.add(p);
                }
            }
            return roleRepository.save(RoleEntity.builder()
                    .name("ADMIN")
                    .displayName("Quản trị viên")
                    .description("Quản trị viên hệ thống có quyền quản lý sản phẩm, loại sách, người dùng")
                    .isSystem(true)
                    .canAccessAdmin(true)
                    .canAccessUser(false)
                    .permissions(adminPerms)
                    .build());
        });

        // 4. Initialize CLIENT role
        RoleEntity clientRole = roleRepository.findByName("CLIENT").orElseGet(() -> {
            Set<Permission> clientPerms = new HashSet<>();
            for (Permission p : allPermissions) {
                if (p.getName().equals("BOOK_READ") || p.getName().equals("CATEGORY_READ")
                        || p.getName().equals("PURCHASE_CREATE") || p.getName().equals("PURCHASE_READ")) {
                    clientPerms.add(p);
                }
            }
            return roleRepository.save(RoleEntity.builder()
                    .name("CLIENT")
                    .displayName("Khách hàng")
                    .description("Khách hàng mặc định")
                    .isSystem(true)
                    .canAccessAdmin(false)
                    .canAccessUser(true)
                    .permissions(clientPerms)
                    .build());
        });

        // Ensure existing CLIENT role has canAccessAdmin=false and canAccessUser=true
        if (clientRole.isCanAccessAdmin() || !clientRole.isCanAccessUser()) {
            clientRole.setCanAccessAdmin(false);
            clientRole.setCanAccessUser(true);
            roleRepository.save(clientRole);
        }

        // Ensure system roles (SUPER_ADMIN, ADMIN, CLIENT) are marked as isSystem=true
        List.of("SUPER_ADMIN", "ADMIN", "CLIENT").forEach(roleName -> {
            roleRepository.findByName(roleName).ifPresent(role -> {
                if (!role.isSystem()) {
                    role.setSystem(true);
                    roleRepository.save(role);
                }
            });
        });

        LoggerUtil.inform("Khởi tạo hệ thống Role & Permission thành công!");
    }

    private void initSuperAdminUser() {
        RoleEntity superAdminRole = roleRepository.findByName("SUPER_ADMIN").orElse(null);

        if (!userRepository.existsByUsername("supper")) {
            User superAdmin = User.builder()
                    .username("supper")
                    .password(passwordEncoder.encode("123"))
                    .email("supper@example.com")
                    .fullName("Super Admin")
                    .role(superAdminRole)
                    .build();

            userRepository.save(superAdmin);
            LoggerUtil.inform("Tài khoản Super Admin 'supper' đã được khởi tạo thành công trong csdl!");
        } else {
            // Update role if missing
            User user = userRepository.findByUsername("supper").orElse(null);
            if (user != null && user.getRole() == null) {
                user.setRole(superAdminRole);
                userRepository.save(user);
            }
            LoggerUtil.inform("Tài khoản Super Admin 'supper' đã tồn tại trong csdl.");
        }
    }
}
