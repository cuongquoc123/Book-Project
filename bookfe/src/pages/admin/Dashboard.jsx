import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen,
  FolderTree,
  ArrowRight,
  RefreshCw,
  Layers,
  Sparkles,
  ShieldCheck,
  Crown,
  User,
  Users,
} from 'lucide-react';
import { getCurrentUser, getAllCategories, getAllBooks } from '../../services/api';
import { getUser, hasResourcePermission, setAuthData } from '../../utils/auth';
import AdminHeader from './AdminHeader';
import AlertToast from '../../components/AlertToast';
import '../../styles/dashboard.css';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [totalBooks, setTotalBooks] = useState(0);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

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

    const [catErr, catRes] = await getAllCategories({ page: 0, size: 100 });
    if (catErr) {
      setAlert({ type: 'error', message: `Lỗi tải danh mục: ${catErr}` });
    } else if (catRes) {
      const catList = Array.isArray(catRes) ? catRes : (catRes.content || []);
      setCategories(catList);
    }

    const [bookErr, bookRes] = await getAllBooks({ page: 0, size: 50 });
    if (bookErr) {
      setAlert({ type: 'error', message: `Lỗi tải sách: ${bookErr}` });
    } else if (bookRes) {
      const list = Array.isArray(bookRes) ? bookRes : (bookRes.content || []);
      setBooks(list);
      setTotalBooks(bookRes.totalElements !== undefined ? bookRes.totalElements : list.length);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Permission check for resources using helper
  const canManageBooks = useMemo(() => hasResourcePermission(currentUser, 'BOOK'), [currentUser]);
  const canManageCategories = useMemo(() => hasResourcePermission(currentUser, 'CATEGORY'), [currentUser]);
  const canManageRoles = useMemo(() => hasResourcePermission(currentUser, 'ROLE'), [currentUser]);
  const canManageUsers = useMemo(() => isSuperAdmin || hasResourcePermission(currentUser, 'USER'), [currentUser, isSuperAdmin]);

  return (
    <div className="dash-container">
      <AdminHeader currentUser={currentUser} />

      <main className="dash-main">
        <AlertToast type={alert.type} message={alert.message} />

        {/* Page Banner */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">
              {isSuperAdmin ? <Crown size={30} color="#7C3AED" /> : <ShieldCheck size={30} color="#4F46E5" />}
              <span>Tổng Quan Hệ Thống Quản Trị</span>
            </h1>
            <p className="dash-page-subtitle">
              Chào mừng <strong style={{ color: '#0F172A' }}>{currentUser.username || 'Admin'}</strong> ({currentUser.roleDisplayName || currentUser.role || 'Admin'}) trở lại! Quản lý các tài nguyên được phân quyền trong hệ thống.
            </p>
          </div>

          <button
            type="button"
            className="btn-secondary-refresh"
            onClick={fetchData}
            disabled={loading}
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            <span>Làm mới dữ liệu</span>
          </button>
        </div>

        {/* System Metric Cards */}
        <div className="dash-metrics-grid">
          {canManageBooks && (
            <Link to="/admin/books" className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                <BookOpen size={26} />
              </div>
              <div>
                <div className="metric-val">{totalBooks}</div>
                <div className="metric-lbl">Tổng số Sách (Xem chi tiết →)</div>
              </div>
            </Link>
          )}

          {canManageCategories && (
            <Link to="/admin/categories" className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
                <FolderTree size={26} />
              </div>
              <div>
                <div className="metric-val">{categories.length}</div>
                <div className="metric-lbl">Tổng số Loại Sách (Xem chi tiết →)</div>
              </div>
            </Link>
          )}

          {canManageRoles && (
            <Link to="/admin/roles" className="metric-card">
              <div className="metric-icon-wrap" style={{ background: '#F0F9FF', color: '#0284C7' }}>
                <ShieldCheck size={26} />
              </div>
              <div>
                <div className="metric-val">Role Manager</div>
                <div className="metric-lbl">Quản Lý Ma Trận Role</div>
              </div>
            </Link>
          )}

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Sparkles size={26} />
            </div>
            <div>
              <div className="metric-val" style={{ fontSize: '1.1rem' }}>
                {currentUser.roleDisplayName || currentUser.role || 'ROLE'}
              </div>
              <div className="metric-lbl">Vai trò phân quyền hiện tại</div>
            </div>
          </div>
        </div>

        {/* Navigation Feature Portals */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>
          Chức Năng Quản Lý Được Phân Quyền
        </h2>

        <div className="dash-feature-grid">
          {/* Card 1: Book Management */}
          {canManageBooks && (
            <div className="feature-card">
              <div>
                <div className="feature-icon-box" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
                  <BookOpen size={30} />
                </div>
                <h3 className="feature-card-title">Quản Lý Sách</h3>
                <p className="feature-card-desc">
                  Thêm mới, tìm kiếm, cập nhật thông tin và xóa các cuốn sách trong hệ thống. Đơn giá, tác giả và thể loại được cập nhật tức thì.
                </p>
              </div>
              <Link
                to="/admin/books"
                className="feature-card-btn"
                style={{ background: '#4F46E5', color: 'white' }}
              >
                <span>Truy Cập Trang Quản Lý Sách ({books.length})</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* Card 2: Category Management */}
          {canManageCategories && (
            <div className="feature-card">
              <div>
                <div className="feature-icon-box" style={{ background: '#ECFDF5', color: '#10B981' }}>
                  <FolderTree size={30} />
                </div>
                <h3 className="feature-card-title">Quản Lý Loại Sách</h3>
                <p className="feature-card-desc">
                  Phân loại các danh mục sách, quản lý tên thể loại và mô tả chi tiết. Kiểm soát tên thể loại không bị trùng lặp.
                </p>
              </div>
              <Link
                to="/admin/categories"
                className="feature-card-btn"
                style={{ background: '#10B981', color: 'white' }}
              >
                <span>Truy Cập Trang Quản Lý Loại Sách ({categories.length})</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* Card 3: Role Management */}
          {canManageRoles && (
            <div className="feature-card">
              <div>
                <div className="feature-icon-box" style={{ background: '#F0F9FF', color: '#0284C7' }}>
                  <ShieldCheck size={30} />
                </div>
                <h3 className="feature-card-title">Quản Lý Custom Role</h3>
                <p className="feature-card-desc">
                  Tùy chỉnh ma trận quyền hạn cho từng Role, cấu hình cổng truy cập (Admin Portal / User Portal) linh hoạt.
                </p>
              </div>
              <Link
                to="/admin/roles"
                className="feature-card-btn"
                style={{ background: '#0284C7', color: 'white' }}
              >
                <span>Truy Cập Quản Lý Role</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          )}

          {/* Card 4: Employee Management */}
          {canManageUsers && (
            <div className="feature-card">
              <div>
                <div className="feature-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  <Users size={30} />
                </div>
                <h3 className="feature-card-title">Quản Lý Nhân Viên & Phân Role</h3>
                <p className="feature-card-desc">
                  Gán vai trò (Role) cho nhân viên, quản lý danh sách người dùng trong hệ thống.
                </p>
              </div>
              <Link
                to="/admin/users"
                className="feature-card-btn"
                style={{ background: '#7C3AED', color: 'white' }}
              >
                <span>Truy Cập Quản Lý Nhân Viên</span>
                <ArrowRight size={18} />
              </Link>
            </div>
          )}
        </div>

        {/* Quick Recent Activity / Data Summary */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '1.5rem', marginTop: '1rem' }}>
          {/* Recent Books */}
          {canManageBooks && (
            <div className="dash-table-wrapper" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <BookOpen size={18} color="#4F46E5" /> Sách Gần Đây
                </h3>
                <Link to="/admin/books" style={{ fontSize: '0.825rem', color: '#4F46E5', fontWeight: 700, textDecoration: 'none' }}>
                  Xem tất cả →
                </Link>
              </div>

              {books.slice(0, 4).map((book) => (
                <div
                  key={book.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{book.title}</div>
                    <div style={{ fontSize: '0.775rem', color: '#64748B' }}>Tác giả: {book.author || 'Chưa rõ'} • Thể loại: {book.categoryName || 'N/A'}</div>
                  </div>
                  <span className="price-pill" style={{ fontSize: '0.8rem' }}>
                    {book.price ? `${Number(book.price).toLocaleString('vi-VN')} đ` : 'Miễn phí'}
                  </span>
                </div>
              ))}
            </div>
          )}

          {/* Recent Categories */}
          {canManageCategories && (
            <div className="dash-table-wrapper" style={{ padding: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: '#0F172A', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <FolderTree size={18} color="#10B981" /> Loại Sách Gần Đây
                </h3>
                <Link to="/admin/categories" style={{ fontSize: '0.825rem', color: '#10B981', fontWeight: 700, textDecoration: 'none' }}>
                  Xem tất cả →
                </Link>
              </div>

              {categories.slice(0, 4).map((cat) => (
                <div
                  key={cat.id}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '0.75rem 0',
                    borderBottom: '1px solid #F1F5F9',
                  }}
                >
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.9rem', color: '#0F172A' }}>{cat.name}</div>
                    <div style={{ fontSize: '0.775rem', color: '#64748B' }}>{cat.description || 'Chưa có mô tả'}</div>
                  </div>
                  <span className="owner-pill self" style={{ fontSize: '0.75rem' }}>
                    <User size={12} /> {cat.createdByName || 'Hệ thống'}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
