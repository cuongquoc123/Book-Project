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
} from 'lucide-react';
import { getCurrentUser, getAllUsers, createAdminUser } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminHeader from './AdminHeader';
import AlertToast from '../../components/AlertToast';
import FormInput from '../../components/FormInput';
import '../../styles/dashboard.css';

export default function EmployeeManagement() {
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});
  const [userList, setUserList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal State for Creating Admin Account
  const [showAddModal, setShowAddModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    email: '',
    fullname: '',
  });

  const fetchData = async () => {
    setLoading(true);
    setAlert({ type: '', message: '' });

    const [userErr, userData] = await getCurrentUser();
    if (!userErr && userData) {
      setCurrentUser({
        id: userData.id,
        username: userData.username,
        email: userData.email,
        fullName: userData.fullName || userData.fullname,
        role: userData.role,
      });
    }

    const [usersErr, usersRes] = await getAllUsers();
    if (usersErr) {
      setAlert({ type: 'error', message: `Lỗi tải danh sách nhân viên: ${usersErr}` });
    } else if (Array.isArray(usersRes)) {
      setUserList(usersRes);
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
        user.role?.toLowerCase().includes(q)
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
              <span>Quản Lý Nhân Viên & Tài Khoản Hệ Thống</span>
            </h1>
            <p className="dash-page-subtitle">
              Tính năng dành riêng cho Super Admin. Quản lý danh sách tài khoản Quản trị viên và Độc giả trong hệ thống.
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
                  <th>Vai Trò (Role)</th>
                  <th>Ngày Khởi Tạo</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => {
                  const isSuper = user.role === 'SUPER_ADMIN';
                  const isAdmin = user.role === 'ADMIN';
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
                          {user.role}
                        </span>
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
                  ℹ️ Tài khoản khởi tạo sẽ mặc định được gán vai trò <strong>ADMIN</strong> có quyền Thêm/Sửa/Xóa sách và loại sách do chính mình tạo ra.
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
    </div>
  );
}
