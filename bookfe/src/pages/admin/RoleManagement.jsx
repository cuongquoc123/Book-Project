import React, { useState, useEffect, useMemo } from 'react';
import {
  ShieldCheck,
  Plus,
  RefreshCw,
  Search,
  CheckCircle2,
  X,
  Edit,
  Trash2,
  Eye,
  CheckSquare,
  Square,
  Lock,
  Key,
  Shield,
  Monitor,
  UserCheck,
  Globe,
} from 'lucide-react';
import {
  getCurrentUser,
  getAllRoles,
  createRole,
  updateRole,
  deleteRole,
  getGroupedPermissions,
} from '../../services/api';
import { setAuthData } from '../../utils/auth';
import AdminHeader from './AdminHeader';
import AlertToast from '../../components/AlertToast';
import '../../styles/dashboard.css';

export default function RoleManagement() {
  const [currentUser, setCurrentUser] = useState(null);
  const [roles, setRoles] = useState([]);
  const [groupedPermissions, setGroupedPermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [toast, setToast] = useState(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [isReadOnly, setIsReadOnly] = useState(false);
  const [editingRoleId, setEditingRoleId] = useState(null);

  // Form State
  const [formData, setFormData] = useState({
    name: '',
    displayName: '',
    description: '',
    canAccessAdmin: true,
    canAccessUser: true,
  });
  const [selectedPermissionIds, setSelectedPermissionIds] = useState(new Set());

  // Delete Confirmation Modal State
  const [deletingRole, setDeletingRole] = useState(null);

  // Load User and Role Data
  useEffect(() => {
    fetchInitialData();
  }, []);

  const showNotification = (message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInitialData = async () => {
    setLoading(true);
    const [userErr, userData] = await getCurrentUser();
    if (!userErr && userData) {
      const updatedUser = {
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName || userData.fullname,
        role: userData.role,
        roleDisplayName: userData.roleDisplayName,
        permissions: userData.permissions || (userData.roleDetails?.permissions ? userData.roleDetails.permissions.map(p => p.name) : []),
        canAccessAdmin: userData.canAccessAdmin,
        canAccessUser: userData.canAccessUser,
      };
      setCurrentUser(updatedUser);
      setAuthData({ user: updatedUser });
    }

    await loadRolesAndPermissions();
    setLoading(false);
  };

  const loadRolesAndPermissions = async () => {
    setRefreshing(true);
    const [rolesErr, rolesData] = await getAllRoles();
    const [permsErr, permsData] = await getGroupedPermissions();

    if (rolesErr) {
      showNotification(`Lỗi tải danh sách Role: ${rolesErr}`, 'error');
    } else if (Array.isArray(rolesData)) {
      setRoles(rolesData);
    }

    if (permsErr) {
      showNotification(`Lỗi tải bảng Permissions: ${permsErr}`, 'error');
    } else if (permsData && typeof permsData === 'object') {
      setGroupedPermissions(permsData);
    }

    setRefreshing(false);
  };

  // Flattened all available permission IDs
  const allPermissionIds = useMemo(() => {
    const ids = [];
    Object.values(groupedPermissions).forEach((permList) => {
      permList.forEach((p) => ids.push(p.id));
    });
    return ids;
  }, [groupedPermissions]);

  // Filtered Roles
  const filteredRoles = useMemo(() => {
    if (!searchTerm.trim()) return roles;
    const term = searchTerm.toLowerCase();
    return roles.filter(
      (r) =>
        r.name?.toLowerCase().includes(term) ||
        r.displayName?.toLowerCase().includes(term) ||
        r.description?.toLowerCase().includes(term)
    );
  }, [roles, searchTerm]);

  // Open Create Role Modal
  const handleOpenCreate = () => {
    setIsEditing(false);
    setIsReadOnly(false);
    setEditingRoleId(null);
    setFormData({
      name: '',
      displayName: '',
      description: '',
      canAccessAdmin: true,
      canAccessUser: true,
    });
    setSelectedPermissionIds(new Set());
    setShowModal(true);
  };

  // Open Edit / View Role Modal
  const handleOpenEdit = (role, readOnly = false) => {
    setIsEditing(!readOnly);
    setIsReadOnly(readOnly);
    setEditingRoleId(role.id);
    setFormData({
      name: role.name || '',
      displayName: role.displayName || role.name || '',
      description: role.description || '',
      canAccessAdmin: role.canAccessAdmin !== false,
      canAccessUser: role.canAccessUser !== false,
    });

    const permIds = new Set((role.permissions || []).map((p) => p.id));
    setSelectedPermissionIds(permIds);
    setShowModal(true);
  };

  // Toggle individual permission
  const handleTogglePermission = (permId) => {
    if (isReadOnly) return;
    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (next.has(permId)) {
        next.delete(permId);
      } else {
        next.add(permId);
      }
      return next;
    });
  };

  // Toggle all permissions of a Resource category
  const handleToggleResourcePermissions = (resourcePerms) => {
    if (isReadOnly) return;
    const resIds = resourcePerms.map((p) => p.id);
    const allSelected = resIds.every((id) => selectedPermissionIds.has(id));

    setSelectedPermissionIds((prev) => {
      const next = new Set(prev);
      if (allSelected) {
        resIds.forEach((id) => next.delete(id));
      } else {
        resIds.forEach((id) => next.add(id));
      }
      return next;
    });
  };

  // Select/Unselect All Global Permissions
  const handleToggleAllGlobal = () => {
    if (isReadOnly) return;
    const allSelected = allPermissionIds.length > 0 && allPermissionIds.every((id) => selectedPermissionIds.has(id));
    if (allSelected) {
      setSelectedPermissionIds(new Set());
    } else {
      setSelectedPermissionIds(new Set(allPermissionIds));
    }
  };

  // Save Role Submit Handler
  const handleSubmitRole = async (e) => {
    e.preventDefault();
    if (isReadOnly) return;

    if (!formData.name.trim() && !isEditing) {
      showNotification('Vui lòng nhập tên mã Role!', 'error');
      return;
    }

    const payload = {
      name: formData.name.trim().toUpperCase(),
      displayName: formData.displayName.trim() || formData.name.trim(),
      description: formData.description.trim(),
      canAccessAdmin: Boolean(formData.canAccessAdmin),
      canAccessUser: Boolean(formData.canAccessUser),
      permissionIds: Array.from(selectedPermissionIds),
    };

    if (isEditing) {
      const [err] = await updateRole(editingRoleId, payload);
      if (err) {
        showNotification(err, 'error');
      } else {
        showNotification('Cập nhật Custom Role thành công!', 'success');
        setShowModal(false);
        loadRolesAndPermissions();
      }
    } else {
      const [err] = await createRole(payload);
      if (err) {
        showNotification(err, 'error');
      } else {
        showNotification('Tạo Custom Role mới thành công!', 'success');
        setShowModal(false);
        loadRolesAndPermissions();
      }
    }
  };

  // Delete Role Handler
  const handleConfirmDelete = async () => {
    if (!deletingRole) return;
    const [err] = await deleteRole(deletingRole.id);
    if (err) {
      showNotification(err, 'error');
    } else {
      showNotification(`Xóa Custom Role '${deletingRole.displayName || deletingRole.name}' thành công!`, 'success');
      loadRolesAndPermissions();
    }
    setDeletingRole(null);
  };

  return (
    <div className="dash-container">
      <AdminHeader currentUser={currentUser} />

      <main className="dash-main">
        {toast && <AlertToast type={toast.type} message={toast.message} />}

        {/* Page Title Header */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">
              <ShieldCheck size={30} color="#4F46E5" />
              <span>Quản Lý Role & Ma Trận Phân Quyền (RBAC)</span>
            </h1>
            <p className="dash-page-subtitle">
              Tùy chỉnh linh hoạt tập tài nguyên và thao tác (Create, Read, Update, Delete) cùng cổng truy cập (Admin/User Portal) cho các Custom Role.
            </p>
          </div>

          <div className="dash-action-group">
            <button
              type="button"
              className="btn-secondary-refresh"
              onClick={loadRolesAndPermissions}
              disabled={refreshing}
              title="Tải lại bảng phân quyền"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              className="btn-primary-add"
              onClick={handleOpenCreate}
            >
              <Plus size={18} />
              <span>Tạo Custom Role Mới</span>
            </button>
          </div>
        </div>

        {/* Search & Statistics Bar */}
        <div className="dash-controls-card">
          <div className="dash-search-box">
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Tìm kiếm Role theo tên mã, tên hiển thị, mô tả..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* ROLES CARDS GRID */}
        {loading ? (
          <div className="dash-empty-state">
            <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
            <p>Đang tải ma trận phân quyền từ Backend...</p>
          </div>
        ) : filteredRoles.length === 0 ? (
          <div className="dash-empty-state">
            <Shield size={36} color="#94A3B8" />
            <h3>Không tìm thấy Role nào</h3>
            <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
              Thử thay đổi từ khóa tìm kiếm hoặc tạo thêm Custom Role mới.
            </p>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {filteredRoles.map((role) => {
              const isSystem = Boolean(role.isSystem) || ['SUPER_ADMIN', 'ADMIN', 'CLIENT'].includes(role.name);
              const permCount = (role.permissions || []).length;
              const canAdmin = role.canAccessAdmin !== false;
              const canUser = role.canAccessUser !== false;

              return (
                <div
                  key={role.id}
                  style={{
                    background: '#FFFFFF',
                    borderRadius: '16px',
                    border: '1px solid #E2E8F0',
                    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.03)',
                    padding: '1.25rem',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div>
                    {/* Header */}
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                        <div
                          style={{
                            width: '40px',
                            height: '40px',
                            borderRadius: '10px',
                            background: isSystem
                              ? 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)'
                              : 'linear-gradient(135deg, #4F46E5 0%, #3730A3 100%)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            boxShadow: '0 4px 10px rgba(0, 0, 0, 0.1)',
                          }}
                        >
                          {isSystem ? <Lock size={20} /> : <Key size={20} />}
                        </div>
                        <div>
                          <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                            {role.displayName || role.name}
                          </h3>
                          <span style={{ fontSize: '0.8rem', fontFamily: 'monospace', color: '#64748B', fontWeight: 600 }}>
                            {role.name}
                          </span>
                        </div>
                      </div>

                      <span
                        style={{
                          fontSize: '0.725rem',
                          fontWeight: 800,
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          textTransform: 'uppercase',
                          letterSpacing: '0.05em',
                          background: isSystem ? '#F3E8FF' : '#E0F2FE',
                          color: isSystem ? '#6B21A8' : '#0369A1',
                          border: `1px solid ${isSystem ? '#E9D5FF' : '#BAE6FD'}`,
                        }}
                      >
                        {isSystem ? 'Hệ thống' : 'Custom'}
                      </span>
                    </div>

                    <p style={{ fontSize: '0.875rem', color: '#64748B', lineHeight: '1.5', minHeight: '38px', marginBottom: '0.85rem' }}>
                      {role.description || 'Không có mô tả chi tiết cho role này.'}
                    </p>

                    {/* Portal Access Badges */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginBottom: '0.85rem' }}>
                      {canAdmin && canUser ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#EEF2FF', color: '#4F46E5', border: '1px solid #C7D2FE', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Globe size={12} /> Cả Admin & User Portal
                        </span>
                      ) : canAdmin ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#F5F3FF', color: '#7C3AED', border: '1px solid #DDD6FE', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <Monitor size={12} /> Chỉ Admin Portal
                        </span>
                      ) : canUser ? (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#ECFDF5', color: '#059669', border: '1px solid #A7F3D0', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <UserCheck size={12} /> Chỉ User Portal
                        </span>
                      ) : (
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.2rem 0.55rem', borderRadius: '6px', background: '#FEF2F2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
                          ⛔ Không Cổng Truy Cập
                        </span>
                      )}
                    </div>

                    <div style={{ background: '#F8FAFC', borderRadius: '10px', padding: '0.65rem 0.85rem', marginBottom: '1rem', border: '1px solid #F1F5F9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: '0.825rem', color: '#475569', fontWeight: 600 }}>
                        Số lượng Quyền (Permissions):
                      </span>
                      <span style={{ fontSize: '0.85rem', fontWeight: 800, color: '#4F46E5', background: '#EEF2FF', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                        {permCount} quyền
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid #F1F5F9' }}>
                    {isSystem ? (
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(role, true)}
                        className="btn-secondary-refresh"
                        style={{ padding: '0.45rem 0.85rem', fontSize: '0.85rem' }}
                      >
                        <Eye size={15} />
                        <span>Xem chi tiết tập quyền</span>
                      </button>
                    ) : (
                      <>
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(role, false)}
                          className="btn-action-icon edit"
                          title="Chỉnh sửa Custom Role"
                        >
                          <Edit size={16} />
                        </button>

                        <button
                          type="button"
                          onClick={() => setDeletingRole(role)}
                          className="btn-action-icon delete"
                          title="Xóa Custom Role"
                        >
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Modal Create / Edit / View Role */}
        {showModal && (
          <div className="modal-overlay" onClick={() => setShowModal(false)}>
            <div
              className="modal-card"
              style={{ maxWidth: '840px', width: '95%' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                  <ShieldCheck size={24} color="#4F46E5" />
                  <h2 className="modal-title">
                    {isReadOnly
                      ? `Chi tiết Role Hệ Thống: ${formData.displayName}`
                      : isEditing
                      ? `Chỉnh sửa Custom Role: ${formData.displayName}`
                      : 'Tạo Custom Role Mới'}
                  </h2>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setShowModal(false)}>
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmitRole}>
                <div className="modal-body" style={{ maxHeight: '72vh', overflowY: 'auto' }}>
                  {/* Basic Info */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                        Mã Định Danh Role (Role Code) <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: CONTENT_MANAGER"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        disabled={isEditing || isReadOnly}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          outline: 'none',
                          fontSize: '0.9rem',
                          textTransform: 'uppercase',
                          fontWeight: 600,
                          background: isEditing || isReadOnly ? '#F1F5F9' : 'white',
                        }}
                        required
                      />
                      <span style={{ fontSize: '0.75rem', color: '#64748B', marginTop: '0.2rem', display: 'block' }}>
                        Mã duy nhất viết hoa không dấu (VD: SALES_STAFF).
                      </span>
                    </div>

                    <div>
                      <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                        Tên Hiển Thị (Display Name) <span style={{ color: '#DC2626' }}>*</span>
                      </label>
                      <input
                        type="text"
                        placeholder="VD: Quản Lý Nội Dung"
                        value={formData.displayName}
                        onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                        disabled={isReadOnly}
                        style={{
                          width: '100%',
                          padding: '0.65rem 0.85rem',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          outline: 'none',
                          fontSize: '0.9rem',
                          background: isReadOnly ? '#F1F5F9' : 'white',
                        }}
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      Mô Tả Vai Trò
                    </label>
                    <textarea
                      placeholder="Mô tả chức năng nhiệm vụ của vai trò này trong hệ thống..."
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      disabled={isReadOnly}
                      rows={2}
                      style={{
                        width: '100%',
                        padding: '0.65rem 0.85rem',
                        borderRadius: '10px',
                        border: '1px solid #CBD5E1',
                        outline: 'none',
                        fontSize: '0.9rem',
                        background: isReadOnly ? '#F1F5F9' : 'white',
                      }}
                    />
                  </div>

                  {/* PORTAL ACCESS SELECTION */}
                  <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '12px', padding: '1rem', marginTop: '0.75rem' }}>
                    <h4 style={{ fontSize: '0.925rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.5rem', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Monitor size={16} color="#4F46E5" /> Cấu hình Cổng Đăng Nhập (Portal Access Scope)
                    </h4>
                    <p style={{ fontSize: '0.8rem', color: '#64748B', marginBottom: '0.85rem' }}>
                      Chỉ định rõ các cổng giao diện người dùng thuộc Role này có quyền đăng nhập vào:
                    </p>

                    <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isReadOnly ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={formData.canAccessAdmin}
                          onChange={(e) => setFormData({ ...formData, canAccessAdmin: e.target.checked })}
                          disabled={isReadOnly}
                          style={{ width: '18px', height: '18px', accentColor: '#4F46E5' }}
                        />
                        <span>Cổng Quản Trị Admin (<code>/admin/login</code>)</span>
                      </label>

                      <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: isReadOnly ? 'not-allowed' : 'pointer', fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                        <input
                          type="checkbox"
                          checked={formData.canAccessUser}
                          onChange={(e) => setFormData({ ...formData, canAccessUser: e.target.checked })}
                          disabled={isReadOnly}
                          style={{ width: '18px', height: '18px', accentColor: '#059669' }}
                        />
                        <span>Trang Độc Giả User (<code>/login</code>)</span>
                      </label>
                    </div>
                  </div>

                  {/* Permission Matrix Header */}
                  <div style={{ borderTop: '1px solid #E2E8F0', paddingTop: '1.25rem', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                      <div>
                        <h4 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', margin: 0 }}>
                          Ma Trận Phân Quyền (Permission Matrix)
                        </h4>
                        <span style={{ fontSize: '0.8rem', color: '#64748B' }}>
                          Đã chọn <strong style={{ color: '#4F46E5' }}>{selectedPermissionIds.size}</strong> / {allPermissionIds.length} quyền
                        </span>
                      </div>

                      {!isReadOnly && (
                        <button
                          type="button"
                          onClick={handleToggleAllGlobal}
                          style={{
                            background: '#EEF2FF',
                            color: '#4F46E5',
                            border: '1px solid #C7D2FE',
                            padding: '0.4rem 0.8rem',
                            borderRadius: '8px',
                            fontSize: '0.8rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          {allPermissionIds.length > 0 && allPermissionIds.every((id) => selectedPermissionIds.has(id))
                            ? 'Bỏ chọn toàn bộ'
                            : 'Chọn toàn bộ hệ thống'}
                        </button>
                      )}
                    </div>

                    {/* Permissions Grouped by Resource */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                      {Object.entries(groupedPermissions).map(([resource, perms]) => {
                        const isResAllSelected = perms.every((p) => selectedPermissionIds.has(p.id));
                        const isResSomeSelected = perms.some((p) => selectedPermissionIds.has(p.id));

                        return (
                          <div
                            key={resource}
                            style={{
                              border: '1px solid #E2E8F0',
                              borderRadius: '12px',
                              overflow: 'hidden',
                            }}
                          >
                            <div
                              style={{
                                background: '#F8FAFC',
                                padding: '0.65rem 1rem',
                                borderBottom: '1px solid #E2E8F0',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'space-between',
                              }}
                            >
                              <div style={{ fontWeight: 800, color: '#1E293B', fontSize: '0.9rem', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                Tài nguyên: {resource}
                              </div>

                              {!isReadOnly && (
                                <button
                                  type="button"
                                  onClick={() => handleToggleResourcePermissions(perms)}
                                  style={{
                                    background: 'none',
                                    border: 'none',
                                    color: '#4F46E5',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {isResAllSelected ? 'Bỏ chọn thể loại' : 'Chọn tất cả thao tác'}
                                </button>
                              )}
                            </div>

                            <div
                              style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
                                gap: '0.75rem',
                                padding: '0.85rem 1rem',
                              }}
                            >
                              {perms.map((p) => {
                                const checked = selectedPermissionIds.has(p.id);
                                return (
                                  <label
                                    key={p.id}
                                    style={{
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '0.5rem',
                                      cursor: isReadOnly ? 'not-allowed' : 'pointer',
                                      padding: '0.4rem 0.6rem',
                                      borderRadius: '8px',
                                      background: checked ? '#F5F3FF' : '#FAFAFA',
                                      border: `1px solid ${checked ? '#DDD6FE' : '#F1F5F9'}`,
                                      transition: 'all 0.15s ease',
                                    }}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => handleTogglePermission(p.id)}
                                      disabled={isReadOnly}
                                      style={{ width: '16px', height: '16px', accentColor: '#7C3AED' }}
                                    />
                                    <div>
                                      <div style={{ fontSize: '0.825rem', fontWeight: 700, color: checked ? '#5B21B6' : '#334155' }}>
                                        {p.action}
                                      </div>
                                      <div style={{ fontSize: '0.725rem', color: '#64748B' }}>
                                        {p.description || p.name}
                                      </div>
                                    </div>
                                  </label>
                                );
                              })}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="modal-btn-cancel" onClick={() => setShowModal(false)}>
                    {isReadOnly ? 'Đóng' : 'Hủy bỏ'}
                  </button>
                  {!isReadOnly && (
                    <button type="submit" className="modal-btn-save">
                      {isEditing ? 'Cập Nhật Role' : 'Tạo Role Mới'}
                    </button>
                  )}
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {deletingRole && (
          <div className="modal-overlay" onClick={() => setDeletingRole(null)}>
            <div className="modal-card" style={{ maxWidth: '440px' }} onClick={(e) => e.stopPropagation()}>
              <div className="modal-header" style={{ background: '#FEF2F2' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#DC2626' }}>
                  <Trash2 size={22} />
                  <h3 className="modal-title" style={{ color: '#991B1B' }}>
                    Xác nhận xóa Role
                  </h3>
                </div>
                <button type="button" className="modal-close-btn" onClick={() => setDeletingRole(null)}>
                  <X size={18} />
                </button>
              </div>

              <div className="modal-body" style={{ textAlign: 'center', padding: '1.5rem 1rem' }}>
                <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.5' }}>
                  Bạn có chắc chắn muốn xóa Custom Role <strong>'{deletingRole.displayName || deletingRole.name}'</strong>?
                </p>
                <p style={{ fontSize: '0.825rem', color: '#DC2626', marginTop: '0.5rem', background: '#FEF2F2', padding: '0.6rem', borderRadius: '8px' }}>
                  ⚠️ Hành động này không thể hoàn tác. Việc xóa sẽ thất bại nếu còn người dùng đang được gán Role này.
                </p>
              </div>

              <div className="modal-footer">
                <button type="button" className="modal-btn-cancel" onClick={() => setDeletingRole(null)}>
                  Hủy bỏ
                </button>
                <button
                  type="button"
                  className="modal-btn-save"
                  style={{ background: '#DC2626', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}
                  onClick={handleConfirmDelete}
                >
                  Xác Nhận Xóa
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
