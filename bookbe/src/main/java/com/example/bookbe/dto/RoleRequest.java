package com.example.bookbe.dto;

import java.util.Set;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RoleRequest {
    private String name;
    private String displayName;
    private String description;
    private Boolean canAccessAdmin;
    private Boolean canAccessUser;
    private Set<Long> permissionIds;

    public String getName() {
        return name;
    }

    public void setName(String name) {
        this.name = name;
    }

    public String getDisplayName() {
        return displayName;
    }

    public void setDisplayName(String displayName) {
        this.displayName = displayName;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public Boolean getCanAccessAdmin() {
        return canAccessAdmin;
    }

    public void setCanAccessAdmin(Boolean canAccessAdmin) {
        this.canAccessAdmin = canAccessAdmin;
    }

    public Boolean getCanAccessUser() {
        return canAccessUser;
    }

    public void setCanAccessUser(Boolean canAccessUser) {
        this.canAccessUser = canAccessUser;
    }

    public Set<Long> getPermissionIds() {
        return permissionIds;
    }

    public void setPermissionIds(Set<Long> permissionIds) {
        this.permissionIds = permissionIds;
    }
}
