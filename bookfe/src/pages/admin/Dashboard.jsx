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
  Plus,
} from 'lucide-react';
import { getCurrentUser, getAllCategories, getAllBooks } from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminHeader from './AdminHeader';
import AlertToast from '../../components/AlertToast';
import '../../styles/dashboard.css';

export default function Dashboard() {
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

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

    const [catErr, catRes] = await getAllCategories();
    if (catErr) {
      setAlert({ type: 'error', message: `Lỗi tải danh mục: ${catErr}` });
    } else if (Array.isArray(catRes)) {
      setCategories(catRes);
    }

    const [bookErr, bookRes] = await getAllBooks();
    if (bookErr) {
      setAlert({ type: 'error', message: `Lỗi tải sách: ${bookErr}` });
    } else if (Array.isArray(bookRes)) {
      setBooks(bookRes);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  const canManage = (item) => {
    if (!item) return false;
    if (isSuperAdmin) return true;
    if (currentUser.role === 'ADMIN') {
      if (item.createdByUserId && currentUser.id) {
        return item.createdByUserId === currentUser.id;
      }
      if (item.createdByName && currentUser.username) {
        return item.createdByName === currentUser.username;
      }
    }
    return false;
  };

  const myCreatedBooksCount = useMemo(
    () => books.filter((b) => canManage(b)).length,
    [books, currentUser]
  );
  const myCreatedCatCount = useMemo(
    () => categories.filter((c) => canManage(c)).length,
    [categories, currentUser]
  );

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
              Chào mừng <strong style={{ color: '#0F172A' }}>{currentUser.username || 'Admin'}</strong> trở lại! Quản lý toàn bộ danh mục sách và phân quyền dữ liệu.
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
          <Link to="/admin/books" className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#EEF2FF', color: '#4F46E5' }}>
              <BookOpen size={26} />
            </div>
            <div>
              <div className="metric-val">{books.length}</div>
              <div className="metric-lbl">Tổng số Sách (Xem chi tiết →)</div>
            </div>
          </Link>

          <Link to="/admin/categories" className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#ECFDF5', color: '#10B981' }}>
              <FolderTree size={26} />
            </div>
            <div>
              <div className="metric-val">{categories.length}</div>
              <div className="metric-lbl">Tổng số Loại Sách (Xem chi tiết →)</div>
            </div>
          </Link>

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#F0F9FF', color: '#0284C7' }}>
              <Layers size={26} />
            </div>
            <div>
              <div className="metric-val">
                {isSuperAdmin ? 'Toàn quyền (All)' : `${myCreatedBooksCount} Sách / ${myCreatedCatCount} Loại`}
              </div>
              <div className="metric-lbl">Mục có quyền Sửa/Xóa</div>
            </div>
          </div>

          <div className="metric-card">
            <div className="metric-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <Sparkles size={26} />
            </div>
            <div>
              <div className="metric-val" style={{ fontSize: '1.2rem' }}>
                {isSuperAdmin ? 'SUPER ADMIN' : 'ADMIN'}
              </div>
              <div className="metric-lbl">
                {isSuperAdmin ? 'Có quyền chỉnh sửa mọi mục' : 'Quyền hạn người tạo'}
              </div>
            </div>
          </div>
        </div>

        {/* Navigation Feature Portals */}
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, marginBottom: '1rem', color: '#0F172A' }}>
          Chức Năng Quản Lý Chính
        </h2>

        <div className="dash-feature-grid">
          {/* Card 1: Book Management */}
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

          {/* Card 2: Category Management */}
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

          {/* Card 3: Employee Management (Super Admin Only) */}
          {isSuperAdmin && (
            <div className="feature-card">
              <div>
                <div className="feature-icon-box" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
                  <Sparkles size={30} />
                </div>
                <h3 className="feature-card-title">Quản Lý Nhân Viên</h3>
                <p className="feature-card-desc">
                  Quyền hạn dành riêng cho Super Admin: Khởi tạo tài khoản Quản trị viên (Admin) mới và giám sát danh sách nhân viên.
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
                  justify: 'space-between',
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

          {/* Recent Categories */}
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
                  justify: 'space-between',
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
        </div>
      </main>
    </div>
  );
}
