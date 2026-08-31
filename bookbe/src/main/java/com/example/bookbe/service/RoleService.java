package com.example.bookbe.service;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.example.bookbe.dto.PermissionResponse;
import com.example.bookbe.dto.RoleRequest;
import com.example.bookbe.dto.RoleResponse;
import com.example.bookbe.entity.Permission;
import com.example.bookbe.entity.RoleEntity;
import com.example.bookbe.exception.ResourceNotFoundException;
import com.example.bookbe.repository.PermissionRepository;
import com.example.bookbe.repository.RoleRepository;
import com.example.bookbe.repository.UserRepository;

@Service
public class RoleService {

    private final RoleRepository roleRepository;
    private final PermissionRepository permissionRepository;
    private final UserRepository userRepository;

    public RoleService(RoleRepository roleRepository,
                       PermissionRepository permissionRepository,
                       UserRepository userRepository) {
        this.roleRepository = roleRepository;
        this.permissionRepository = permissionRepository;
        this.userRepository = userRepository;
    }

    public List<RoleResponse> getAllRoles() {
        return roleRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public RoleResponse getRoleById(Long id) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + id));
        return mapToResponse(role);
    }

    @Transactional
    public RoleResponse createRole(RoleRequest request) {
        if (request.getName() == null || request.getName().trim().isEmpty()) {
            throw new IllegalArgumentException("Tên role không được để trống!");
        }

        String roleName = request.getName().trim().toUpperCase();
        if (roleRepository.existsByName(roleName)) {
            throw new IllegalArgumentException("Role với tên " + roleName + " đã tồn tại!");
        }

        Set<Permission> permissions = new HashSet<>();
        if (request.getPermissionIds() != null && !request.getPermissionIds().isEmpty()) {
            permissions.addAll(permissionRepository.findAllById(request.getPermissionIds()));
        }

        RoleEntity role = RoleEntity.builder()
                .name(roleName)
                .displayName(request.getDisplayName() != null ? request.getDisplayName() : roleName)
                .description(request.getDescription())
                .isSystem(false)
                .canAccessAdmin(request.getCanAccessAdmin() != null ? request.getCanAccessAdmin() : true)
                .canAccessUser(request.getCanAccessUser() != null ? request.getCanAccessUser() : true)
                .permissions(permissions)
                .build();

        RoleEntity savedRole = roleRepository.save(role);
        return mapToResponse(savedRole);
    }

    @Transactional
    public RoleResponse updateRole(Long id, RoleRequest request) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + id));

        if (role.isSystem()) {
            throw new IllegalArgumentException("Không thể chỉnh sửa Role hệ thống!");
        }

        if (request.getDisplayName() != null) {
            role.setDisplayName(request.getDisplayName());
        }

        if (request.getDescription() != null) {
            role.setDescription(request.getDescription());
        }

        if (request.getCanAccessAdmin() != null) {
            role.setCanAccessAdmin(request.getCanAccessAdmin());
        }

        if (request.getCanAccessUser() != null) {
            role.setCanAccessUser(request.getCanAccessUser());
        }

        if (request.getPermissionIds() != null) {
            Set<Permission> permissions = new HashSet<>(permissionRepository.findAllById(request.getPermissionIds()));
            role.setPermissions(permissions);
        }

        RoleEntity updatedRole = roleRepository.save(role);
        return mapToResponse(updatedRole);
    }

    @Transactional
    public void deleteRole(Long id) {
        RoleEntity role = roleRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy Role với ID: " + id));

        if (role.isSystem()) {
            throw new IllegalArgumentException("Không thể xóa Role hệ thống!");
        }

        if (userRepository.existsByRoleId(id)) {
            throw new IllegalStateException("Không thể xóa Role này vì đang có người dùng được gán Role!");
        }

        roleRepository.delete(role);
    }

    public Map<String, List<PermissionResponse>> getPermissionsGroupedByResource() {
        List<Permission> permissions = permissionRepository.findAll();
        return permissions.stream()
                .map(this::mapPermissionToResponse)
                .collect(Collectors.groupingBy(p -> p.getResource()));
    }

    public List<PermissionResponse> getAllPermissions() {
        return permissionRepository.findAll().stream()
                .map(this::mapPermissionToResponse)
                .toList();
    }

    private RoleResponse mapToResponse(RoleEntity role) {
        Set<PermissionResponse> permissionResponses = role.getPermissions().stream()
                .map(this::mapPermissionToResponse)
                .collect(Collectors.toSet());

        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .displayName(role.getDisplayName())
                .description(role.getDescription())
                .isSystem(role.isSystem())
                .canAccessAdmin(role.isCanAccessAdmin())
                .canAccessUser(role.isCanAccessUser())
                .permissions(permissionResponses)
                .createdAt(role.getCreatedAt())
                .updatedAt(role.getUpdatedAt())
                .build();
    }

    private PermissionResponse mapPermissionToResponse(Permission permission) {
        return PermissionResponse.builder()
                .id(permission.getId())
                .name(permission.getName())
                .resource(permission.getResource())
                .action(permission.getAction())
                .description(permission.getDescription())
                .build();
    }
}
