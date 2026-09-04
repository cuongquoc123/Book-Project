import React, { useState, useEffect, useMemo } from 'react';
import {
  Users,
  Plus,
  RefreshCw,
  Search,
  User,
  Crown,
  ShieldCheck,
  X,
  UserPlus,
  Mail,
  Lock,
  Edit2,
  CheckCircle,
  Key,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { getCurrentUser, getAllUsers, createAdminUser, getAllRoles, updateUserRole, changePassword } from '../../services/api';
import { getUser, setAuthData } from '../../utils/auth';
import AdminHeader from './AdminHeader';
import AlertToast from '../../components/AlertToast';
import FormInput from '../../components/FormInput';
import '../../styles/dashboard.css';

export default function EmployeeManagement() {
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});
  const [userList, setUserList] = useState([]);
  const [rolesList, setRolesList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });
  const [updatingUserId, setUpdatingUserId] = useState(null);

  // Modal State for Creating Admin Account
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullname: '',
  });

  // Modal State for Super Admin Resetting/Changing Password of any user
  const [showPassModal, setShowPassModal] = useState(false);
  const [selectedUserForPass, setSelectedUserForPass] = useState(null);
  const [passFormData, setPassFormData] = useState({
    newPassword: '',
    confirmPassword: '',
    logoutAllClients: true,
  });
  const [showNewPassModal, setShowNewPassModal] = useState(false);
  const [showConfirmPassModal, setShowConfirmPassModal] = useState(false);
  const [submittingPass, setSubmittingPass] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setAlert({ type: '', message: '' });

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

    const [usersErr, usersRes] = await getAllUsers();
    if (usersErr) {
      setAlert({ type: 'error', message: `Lỗi tải danh sách nhân viên: ${usersErr}` });
    } else if (Array.isArray(usersRes)) {
      setUserList(usersRes);
    }

    const [rolesErr, rolesRes] = await getAllRoles();
    if (!rolesErr && Array.isArray(rolesRes)) {
      setRolesList(rolesRes);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    return userList.filter((user) => {
      const q = searchQuery.toLowerCase();
      return (
        user.username?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        user.fullName?.toLowerCase().includes(q) ||
        user.role?.toLowerCase().includes(q) ||
        user.roleDisplayName?.toLowerCase().includes(q)
      );
    });
  }, [userList, searchQuery]);

  const handleCreateAdmin = async (e) => {
    e.preventDefault();
    if (!formData.username.trim() || !formData.password.trim() || !formData.email.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng điền đầy đủ Tên đăng nhập, Mật khẩu và Email!' });
      return;
    }

    setSubmitting(true);
    const [err, data] = await createAdminUser({
      username: formData.username.trim(),
      password: formData.password.trim(),
      email: formData.email.trim(),
      fullname: formData.fullname.trim(),
    });

    setSubmitting(false);

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({
        type: 'success',
        message: `Tạo tài khoản Quản trị viên (ADMIN) '${formData.username}' thành công!`,
      });
      setShowAddModal(false);
      setFormData({ username: '', password: '', email: '', fullname: '' });
      fetchData();
    }
  };

  // Change User Role handler
  const handleUserRoleChange = async (targetUser, newRoleId) => {
    if (!newRoleId) return;
    if (targetUser.username === 'supper') {
      setAlert({ type: 'error', message: 'Không thể thay đổi Role của tài khoản Super Admin gốc!' });
      return;
    }

    setUpdatingUserId(targetUser.id);
    const [err, res] = await updateUserRole(targetUser.id, Number(newRoleId));
    setUpdatingUserId(null);

    if (err) {
      setAlert({ type: 'error', message: `Đổi Role cho '${targetUser.username}' thất bại: ${err}` });
    } else {
      setAlert({
        type: 'success',
        message: `Cập nhật Role cho người dùng '${targetUser.username}' thành '${res.roleDisplayName || res.roleName}' thành công!`,
      });
      // Refresh list to update UI
      const [usersErr, usersRes] = await getAllUsers();
      if (!usersErr && Array.isArray(usersRes)) {
        setUserList(usersRes);
      }
    }
  };

  // Open Change Password Modal for Super Admin
  const handleOpenPassModal = (user) => {
    setSelectedUserForPass(user);
    setPassFormData({
      newPassword: '',
      confirmPassword: '',
      logoutAllClients: true,
    });
    setShowNewPassModal(false);
    setShowConfirmPassModal(false);
    setShowPassModal(true);
  };

  // Submit Change Password for Target User
  const handleChangePasswordAdmin = async (e) => {
    e.preventDefault();
    if (!selectedUserForPass) return;

    if (!passFormData.newPassword.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập mật khẩu mới!' });
      return;
    }
    if (passFormData.newPassword.length < 6) {
      setAlert({ type: 'error', message: 'Mật khẩu mới phải có độ dài tối thiểu 6 ký tự!' });
      return;
    }
    if (passFormData.newPassword !== passFormData.confirmPassword) {
      setAlert({ type: 'error', message: 'Mật khẩu mới và xác nhận mật khẩu không khớp!' });
      return;
    }

    setSubmittingPass(true);
    const [err, res] = await changePassword({
      userId: selectedUserForPass.id,
      newPassword: passFormData.newPassword.trim(),
      confirmPassword: passFormData.confirmPassword.trim(),
      logoutAllClients: passFormData.logoutAllClients,
    });
    setSubmittingPass(false);

    if (err) {
      setAlert({ type: 'error', message: `Đổi mật khẩu thất bại: ${err}` });
    } else {
      setAlert({
        type: 'success',
        message: res?.message || `Đổi mật khẩu cho người dùng '${selectedUserForPass.username}' thành công!`,
      });
      setShowPassModal(false);
      setSelectedUserForPass(null);
      setPassFormData({ newPassword: '', confirmPassword: '', logoutAllClients: true });
    }
  };

  // Metrics
  const adminCount = useMemo(
    () => userList.filter((u) => u.role === 'ADMIN' || u.role === 'SUPER_ADMIN').length,
    [userList]
  );
  const clientCount = useMemo(
    () => userList.filter((u) => u.role === 'CLIENT').length,
    [userList]
  );

  return (
    <div className="dash-container">
      <AdminHeader currentUser={currentUser} />

      <main className="dash-main">
        <AlertToast type={alert.type} message={alert.message} />

        {/* Page Header */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">
              <Users size={30} color="#7C3AED" />
              <span>Quản Lý Nhân Viên & Phân Vai Trò (User Roles)</span>
            </h1>
            <p className="dash-page-subtitle">
              Tính năng dành riêng cho Super Admin và Người quản lý. Điều chỉnh linh hoạt các Role (Hệ thống hoặc Custom Role) cho người dùng.
            </p>
          </div>

          <div className="dash-action-group">
            <button
              type="button"
              className="btn-secondary-refresh"
              onClick={fetchData}
              disabled={loading}
              title="Tải lại danh sách nhân viên từ Backend"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            {isSuperAdmin && (
              <button
                type="button"
                className="btn-primary-add"
                style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6D28D9 100%)', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
                onClick={() => setShowAddModal(true)}
              >
                <UserPlus size={18} />
                <span>Thêm Nhân Viên (Admin)</span>
              </button>
            )}
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="dash-metrics-grid">
          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <ShieldCheck size={26} />
            </div>
            <div>
              <div className="metric-val">{adminCount}</div>
              <div className="metric-lbl">Tài khoản Ban Quản Trị (Admins)</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
              <User size={26} />
            </div>
            <div>
              <div className="metric-val">{clientCount}</div>
              <div className="metric-lbl">Tài khoản Độc Giả (Clients)</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <Users size={26} />
            </div>
            <div>
              <div className="metric-val">{userList.length}</div>
              <div className="metric-lbl">Tổng số Tài khoản trong CSDL</div>
            </div>
          </div>
        </div>

        {/* Search Bar */}
        <div className="dash-controls-card">
          <div className="dash-search-box">
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Tìm kiếm tài khoản theo username, họ tên, email, role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={16} />
              </button>
            )}
          </div>
        </div>

        {/* DATA TABLE VIEW */}
        <div className="dash-table-wrapper">
          {loading ? (
            <div className="dash-empty-state">
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
              <p>Đang tải danh sách tài khoản từ Backend...</p>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="dash-empty-state">
              <div className="dash-empty-icon">
                <Users size={28} />
              </div>
              <h3>Không tìm thấy tài khoản nào</h3>
              <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                Thử thay đổi từ khóa tìm kiếm hoặc cấp thêm tài khoản mới.
              </p>
            </div>
          ) : (
            <table className="dash-table">
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Tên Đăng Nhập (Username)</th>
                  <th>Họ và Tên (Full Name)</th>
                  <th>Email</th>
                  <th>Role Hiện Tại</th>
                  <th>Gán / Điều Chỉnh Role</th>
                  <th>Hành Động</th>
                  <th>Ngày Khởi Tạo</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSuper = user.role === 'SUPER_ADMIN';
                  const isAdmin = user.role === 'ADMIN';
                  const isRootSuper = user.username === 'supper';

                  return (
                    <tr key={user.id}>
                      <td style={{ fontWeight: 700, color: '#64748B' }}>#{user.id}</td>
                      <td>
                        <div style={{ fontWeight: 700, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          {isSuper ? <Crown size={16} color="#7C3AED" /> : <User size={16} color="#475569" />}
                          {user.username}
                        </div>
                      </td>
                      <td>{user.fullName || 'Chưa cập nhật'}</td>
                      <td>{user.email || 'Chưa cập nhật'}</td>
                      <td>
                        <span className={`role-tag ${isSuper ? 'super-admin' : isAdmin ? 'admin' : 'client'}`}>
                          {user.roleDisplayName || user.role}
                        </span>
                      </td>
                      <td>
                        {isRootSuper ? (
                          <span style={{ fontSize: '0.8rem', color: '#94A3B8', fontStyle: 'italic', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                            <Lock size={14} /> Gốc (Cố định)
                          </span>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <select
                              className="dash-filter-select"
                              style={{
                                padding: '0.4rem 0.65rem',
                                fontSize: '0.85rem',
                                fontWeight: 600,
                                borderRadius: '8px',
                                border: '1px solid #CBD5E1',
                                background: updatingUserId === user.id ? '#F1F5F9' : '#FFFFFF',
                                minWidth: '160px',
                              }}
                              value={user.roleId || ''}
                              onChange={(e) => handleUserRoleChange(user, e.target.value)}
                              disabled={updatingUserId === user.id}
                            >
                              <option value="" disabled>-- Chọn Role --</option>
                              {rolesList.map((r) => (
                                <option key={r.id} value={r.id}>
                                  {r.displayName || r.name} {r.isSystem ? '(System)' : '(Custom)'}
                                </option>
                              ))}
                            </select>

                            {updatingUserId === user.id && (
                              <RefreshCw size={14} className="spin" color="#4F46E5" />
                            )}
                          </div>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => handleOpenPassModal(user)}
                          title="Đổi mật khẩu cho người dùng này"
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            padding: '0.4rem 0.75rem',
                            background: '#F5F3FF',
                            color: '#7C3AED',
                            border: '1px solid #DDD6FE',
                            borderRadius: '8px',
                            fontSize: '0.825rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                            transition: 'all 0.15s ease',
                          }}
                        >
                          <KeyRound size={14} />
                          <span>Đổi Pass</span>
                        </button>
                      </td>
                      <td style={{ fontSize: '0.825rem', color: '#64748B' }}>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('vi-VN') : 'Ban đầu'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </main>

      {/* MODAL: Create Admin Employee */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header" style={{ background: '#F5F3FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#7C3AED' }}>
                <UserPlus size={22} />
                <h3 className="modal-title" style={{ color: '#5B21B6' }}>
                  Tạo Tài Khoản Quản Trị Viên (ADMIN)
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowAddModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateAdmin}>
              <div className="modal-body">
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Tên đăng nhập (Username) <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên đăng nhập nhân viên mới..."
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Mật khẩu khởi tạo <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Mật khẩu ít nhất 3-6 ký tự..."
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Địa chỉ Email <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="nhanvien@example.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Họ và Tên Nhân Viên
                  </label>
                  <input
                    type="text"
                    placeholder="Ví dụ: Nguyễn Văn A..."
                    value={formData.fullname}
                    onChange={(e) => setFormData({ ...formData, fullname: e.target.value })}
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.9rem',
                    }}
                  />
                </div>

                <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', fontSize: '0.825rem', color: '#64748B' }}>
                  ℹ️ Tài khoản khởi tạo sẽ mặc định được gán vai trò <strong>ADMIN</strong>. Sau khi khởi tạo, bạn có thể chuyển sang bất kỳ Custom Role nào khác trong bảng quản lý.
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowAddModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="modal-btn-save"
                  style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
                  disabled={submitting}
                >
                  {submitting ? 'Đang khởi tạo...' : 'Tạo Tài Khoản Admin'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Super Admin Change Password for Any User */}
      {showPassModal && selectedUserForPass && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '480px' }}>
            <div className="modal-header" style={{ background: '#F5F3FF' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#7C3AED' }}>
                <KeyRound size={22} />
                <h3 className="modal-title" style={{ color: '#5B21B6' }}>
                  Đổi Mật Khẩu Người Dùng
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowPassModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleChangePasswordAdmin}>
              <div className="modal-body">
                {/* Target User Info Header */}
                <div
                  style={{
                    background: '#F8FAFC',
                    border: '1px solid #E2E8F0',
                    padding: '0.85rem 1rem',
                    borderRadius: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                  }}
                >
                  <div
                    style={{
                      width: '40px',
                      height: '40px',
                      borderRadius: '10px',
                      background: '#EDE9FE',
                      color: '#7C3AED',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontWeight: 800,
                    }}
                  >
                    {selectedUserForPass.username ? selectedUserForPass.username.substring(0, 2).toUpperCase() : 'US'}
                  </div>
                  <div>
                    <div style={{ fontWeight: 800, fontSize: '0.95rem', color: '#0F172A' }}>
                      {selectedUserForPass.fullName || selectedUserForPass.username}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#64748B' }}>
                      @{selectedUserForPass.username} • Role: <strong>{selectedUserForPass.roleDisplayName || selectedUserForPass.role}</strong>
                    </div>
                  </div>
                </div>

                {/* New Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showNewPassModal ? 'text' : 'password'}
                      required
                      placeholder="Mật khẩu mới tối thiểu 6 ký tự..."
                      value={passFormData.newPassword}
                      onChange={(e) => setPassFormData({ ...passFormData, newPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '10px',
                        outline: 'none',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassModal(!showNewPassModal)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748B',
                      }}
                    >
                      {showNewPassModal ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label style={{ display: 'block', fontSize: '0.85rem', fontWeight: 700, marginBottom: '0.4rem', color: '#334155' }}>
                    Nhập lại mật khẩu mới <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showConfirmPassModal ? 'text' : 'password'}
                      required
                      placeholder="Xác nhận mật khẩu mới..."
                      value={passFormData.confirmPassword}
                      onChange={(e) => setPassFormData({ ...passFormData, confirmPassword: e.target.value })}
                      style={{
                        width: '100%',
                        padding: '0.65rem 2.5rem 0.65rem 0.85rem',
                        border: '1px solid #CBD5E1',
                        borderRadius: '10px',
                        outline: 'none',
                        fontSize: '0.9rem',
                        boxSizing: 'border-box',
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassModal(!showConfirmPassModal)}
                      style={{
                        position: 'absolute',
                        right: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: '#64748B',
                      }}
                    >
                      {showConfirmPassModal ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>

                {/* Logout All Clients Option */}
                <div
                  style={{
                    background: '#F5F3FF',
                    border: '1px solid #DDD6FE',
                    padding: '0.85rem 1rem',
                    borderRadius: '10px',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    cursor: 'pointer',
                  }}
                  onClick={() =>
                    setPassFormData({
                      ...passFormData,
                      logoutAllClients: !passFormData.logoutAllClients,
                    })
                  }
                >
                  <input
                    type="checkbox"
                    id="adminLogoutAll"
                    checked={passFormData.logoutAllClients}
                    onChange={(e) =>
                      setPassFormData({
                        ...passFormData,
                        logoutAllClients: e.target.checked,
                      })
                    }
                    style={{ width: '16px', height: '16px', cursor: 'pointer', accentColor: '#7C3AED' }}
                    onClick={(e) => e.stopPropagation()}
                  />
                  <label
                    htmlFor="adminLogoutAll"
                    style={{ fontSize: '0.85rem', fontWeight: 600, color: '#5B21B6', cursor: 'pointer', userSelect: 'none' }}
                  >
                    Đăng xuất và vô hiệu hóa tất cả các phiên đăng nhập đang hoạt động của người dùng này
                  </label>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={() => setShowPassModal(false)}
                >
                  Hủy bỏ
                </button>
                <button
                  type="submit"
                  className="modal-btn-save"
                  style={{ background: '#7C3AED', boxShadow: '0 4px 12px rgba(124, 58, 237, 0.25)' }}
                  disabled={submittingPass}
                >
                  {submittingPass ? (
                    <>
                      <RefreshCw size={16} className="spin" />
                      <span>Đang cập nhật...</span>
                    </>
                  ) : (
                    <>
                      <Lock size={16} />
                      <span>Cập Nhật Mật Khẩu</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
