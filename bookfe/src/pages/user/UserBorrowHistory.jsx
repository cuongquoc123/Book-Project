import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  User,
  Search,
  RefreshCw,
  X,
  CheckCircle2,
  Clock,
  BookmarkCheck,
  ShieldCheck,
  ArrowLeft,
  Calendar,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { logoutUser, getCurrentUser, getMyBorrow, getBorrowHistory, returnBook } from '../../services/api';
import { clearAuth, getRefreshToken, getUser } from '../../utils/auth';
import AlertToast from '../../components/AlertToast';
import '../../styles/auth.css';

export default function UserBorrowHistory() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});

  // Data states
  const [myActiveBorrow, setMyActiveBorrow] = useState(null);
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'BORROWED' | 'RETURNED'

  const fetchData = async () => {
    setLoading(true);
    setAlert({ type: '', message: '' });

    // Fetch user profile
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

    // Fetch current active borrow
    const [activeErr, activeData] = await getMyBorrow();
    if (!activeErr && activeData) {
      setMyActiveBorrow(activeData);
    } else {
      setMyActiveBorrow(null);
    }

    // Fetch full borrow history
    const [historyErr, historyData] = await getBorrowHistory();
    if (!historyErr && Array.isArray(historyData)) {
      setHistoryList(historyData);
    } else {
      setHistoryList([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleReturn = async (borrowId) => {
    if (!borrowId) return;
    setSubmitting(true);
    const [err, data] = await returnBook(borrowId);
    setSubmitting(false);

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({ type: 'success', message: 'Trả sách thành công! Cảm ơn bạn đã đọc và giữ gìn sách.' });
      fetchData();
    }
  };

  const handleLogout = async () => {
    const refreshToken = getRefreshToken();
    if (refreshToken) {
      await logoutUser(refreshToken);
    } else {
      clearAuth();
    }

    const userRole = currentUser.role || 'CLIENT';
    if (userRole === 'ADMIN' || userRole === 'SUPER_ADMIN') {
      navigate('/admin/login', { replace: true });
    } else {
      navigate('/login', { replace: true });
    }
  };

  const isAdmin = currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN';

  // Filtered History
  const filteredHistory = useMemo(() => {
    return historyList.filter((item) => {
      const matchSearch =
        item.book?.title?.toLowerCase().includes(searchQuery.toLowerCase().trim()) ||
        item.book?.author?.toLowerCase().includes(searchQuery.toLowerCase().trim());

      const matchStatus =
        statusFilter === 'ALL' || item.status === statusFilter;

      return matchSearch && matchStatus;
    });
  }, [historyList, searchQuery, statusFilter]);

  // Statistics
  const activeCount = useMemo(() => historyList.filter((h) => h.status === 'BORROWED').length, [historyList]);
  const returnedCount = useMemo(() => historyList.filter((h) => h.status === 'RETURNED').length, [historyList]);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#F8FAFC',
        color: '#0F172A',
        display: 'flex',
        flexDirection: 'column',
        fontFamily: "'Inter', system-ui, -apple-system, sans-serif",
      }}
    >
      {/* Header Bar */}
      <header
        style={{
          background: 'white',
          borderBottom: '1px solid #E2E8F0',
          position: 'sticky',
          top: 0,
          zIndex: 40,
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div
          style={{
            maxWidth: '1280px',
            margin: '0 auto',
            padding: '0.85rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '1rem',
          }}
        >
          <Link to="/home" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', textDecoration: 'none' }}>
            <div
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)',
                color: 'white',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              }}
            >
              <BookOpen size={22} />
            </div>
            <span style={{ fontWeight: 800, fontSize: '1.25rem', color: '#0F172A', letterSpacing: '-0.02em' }}>
              Athenaeum Library
            </span>
          </Link>

          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <Link
              to="/home"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                background: '#F1F5F9',
                color: '#334155',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                textDecoration: 'none',
                border: '1px solid #E2E8F0',
              }}
            >
              <ArrowLeft size={16} />
              <span>Kho Sách</span>
            </Link>

            {isAdmin && (
              <Link
                to="/dashboard"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.45rem 0.9rem',
                  background: '#EEF2FF',
                  color: '#4F46E5',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  textDecoration: 'none',
                  border: '1px solid #C7D2FE',
                }}
              >
                <ShieldCheck size={16} />
                <span>Cổng Quản Trị</span>
              </Link>
            )}

            <Link
              to="/profile"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.6rem',
                background: '#F1F5F9',
                padding: '0.4rem 0.85rem',
                borderRadius: '9999px',
                border: '1px solid #E2E8F0',
                textDecoration: 'none',
              }}
              title="Xem thông tin cá nhân"
            >
              <User size={16} color="#059669" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                {currentUser.username || 'Độc giả'}
              </span>
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.5rem 0.9rem',
                background: '#FEF2F2',
                color: '#DC2626',
                border: '1px solid #FCA5A5',
                borderRadius: '10px',
                fontWeight: 600,
                fontSize: '0.85rem',
                cursor: 'pointer',
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>
        <AlertToast type={alert.type} message={alert.message} />

        {/* Hero Header Banner */}
        <div
          style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #0F172A 100%)',
            borderRadius: '24px',
            padding: '2.25rem 2rem',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: '0 12px 30px rgba(15, 23, 42, 0.2)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1.5rem',
          }}
        >
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.1)', padding: '0.35rem 0.85rem', borderRadius: '20px', fontSize: '0.8rem', fontWeight: 700, marginBottom: '0.75rem', color: '#38BDF8' }}>
              <BookmarkCheck size={16} /> Quản Lý Độc Giả
            </div>
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.4rem', color: 'white' }}>
              Sách Đang Mượn & Lịch Sử Mượn Trả
            </h1>
            <p style={{ fontSize: '0.925rem', color: '#94A3B8', maxWidth: '560px' }}>
              Theo dõi chi tiết cuốn sách bạn đang mượn, ngày mượn và toàn bộ nhật ký mượn trả từ trước tới nay.
            </p>
          </div>

          {/* Quick Metrics */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '0.85rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>ĐANG MƯỢN</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#F59E0B' }}>{activeCount} cuốn</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '0.85rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>ĐÃ TRẢ</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#10B981' }}>{returnedCount} lần</div>
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.08)', backdropFilter: 'blur(8px)', padding: '0.85rem 1.25rem', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.1)' }}>
              <div style={{ fontSize: '0.75rem', color: '#94A3B8', fontWeight: 600 }}>TỔNG SỐ LƯỢT</div>
              <div style={{ fontSize: '1.5rem', fontWeight: 800, color: '#38BDF8' }}>{historyList.length} lượt</div>
            </div>
          </div>
        </div>

        {/* SECTION 1: SÁCH ĐANG MƯỢN (ACTIVE BORROW) */}
        <div style={{ marginBottom: '2.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <Clock size={20} color="#D97706" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0F172A' }}>
              Cuốn Sách Bạn Đang Mượn Hiện Tại
            </h2>
          </div>

          {loading ? (
            <div style={{ background: 'white', borderRadius: '20px', padding: '3rem', textAlign: 'center', border: '1px solid #E2E8F0', color: '#64748B' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#D97706' }} />
              <div>Đang tải thông tin mượn sách...</div>
            </div>
          ) : myActiveBorrow && myActiveBorrow.book ? (
            <div
              style={{
                background: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
                borderRadius: '20px',
                border: '1.5px solid #FCD34D',
                padding: '1.75rem 2rem',
                boxShadow: '0 8px 24px rgba(245, 158, 11, 0.12)',
                display: 'flex',
                gap: '1.75rem',
                alignItems: 'center',
                flexWrap: 'wrap',
              }}
            >
              {/* Cover Image */}
              {myActiveBorrow.book.coverUrl ? (
                <img
                  src={myActiveBorrow.book.coverUrl}
                  alt={myActiveBorrow.book.title}
                  style={{
                    width: '110px',
                    height: '150px',
                    objectFit: 'cover',
                    borderRadius: '12px',
                    boxShadow: '0 6px 16px rgba(0,0,0,0.12)',
                    border: '1px solid #F59E0B',
                    flexShrink: 0,
                  }}
                />
              ) : (
                <div
                  style={{
                    width: '110px',
                    height: '150px',
                    borderRadius: '12px',
                    background: '#FDE68A',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#B45309',
                    flexShrink: 0,
                  }}
                >
                  <BookOpen size={40} />
                  <span style={{ fontSize: '0.75rem', fontWeight: 700, marginTop: '0.3rem' }}>Bìa Sách</span>
                </div>
              )}

              {/* Borrow Info */}
              <div style={{ flex: 1, minWidth: '260px' }}>
                <div
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    background: '#D97706',
                    color: 'white',
                    padding: '0.25rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    marginBottom: '0.65rem',
                    textTransform: 'uppercase',
                  }}
                >
                  <Clock size={12} /> Đang mượn
                </div>

                <h3 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#78350F', marginBottom: '0.4rem', lineHeight: '1.3' }}>
                  {myActiveBorrow.book.title}
                </h3>

                <div style={{ fontSize: '0.9rem', color: '#92400E', marginBottom: '0.85rem' }}>
                  Tác giả: <strong>{myActiveBorrow.book.author || 'Chưa rõ'}</strong>
                </div>

                <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap', fontSize: '0.85rem', color: '#B45309', background: 'rgba(255, 255, 255, 0.6)', padding: '0.65rem 1rem', borderRadius: '10px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <Calendar size={15} />
                    <span>Ngày mượn: <strong>{myActiveBorrow.borrowedAt ? new Date(myActiveBorrow.borrowedAt).toLocaleDateString('vi-VN') + ' ' + new Date(myActiveBorrow.borrowedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' }) : 'Vừa mượn'}</strong></span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <FileText size={15} />
                    <span>Mã lượt mượn: <strong>#{myActiveBorrow.id}</strong></span>
                  </div>
                </div>
              </div>

              {/* Action Button */}
              <div style={{ flexShrink: 0 }}>
                <button
                  type="button"
                  onClick={() => handleReturn(myActiveBorrow.id)}
                  disabled={submitting}
                  style={{
                    padding: '0.85rem 1.75rem',
                    background: '#D97706',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    fontWeight: 800,
                    fontSize: '0.95rem',
                    cursor: submitting ? 'not-allowed' : 'pointer',
                    boxShadow: '0 4px 14px rgba(217, 119, 6, 0.35)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <RotateCcw size={18} className={submitting ? 'animate-spin' : ''} />
                  <span>Trả Sách Này Ngay</span>
                </button>
              </div>
            </div>
          ) : (
            <div
              style={{
                background: 'white',
                borderRadius: '20px',
                padding: '2.5rem 2rem',
                border: '1px solid #E2E8F0',
                textAlign: 'center',
                color: '#64748B',
              }}
            >
              <div
                style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: '#F1F5F9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 0.75rem auto',
                  color: '#94A3B8',
                }}
              >
                <CheckCircle2 size={28} />
              </div>
              <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.3rem' }}>
                Bạn hiện tại không mượn cuốn sách nào
              </h3>
              <p style={{ fontSize: '0.875rem', maxWidth: '420px', margin: '0 auto 1.25rem auto' }}>
                Mỗi độc giả chỉ được mượn 1 cuốn sách tại một thời điểm. Truy cập kho sách để chọn mượn tác phẩm yêu thích.
              </p>
              <Link
                to="/home"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  padding: '0.65rem 1.25rem',
                  background: '#10B981',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: 700,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
                }}
              >
                <BookOpen size={16} />
                <span>Khám Phá Kho Sách Ngay</span>
              </Link>
            </div>
          )}
        </div>

        {/* SECTION 2: LỊCH SỬ MƯỢN TRẢ SÁCH */}
        <div style={{ background: 'white', borderRadius: '20px', border: '1px solid #E2E8F0', padding: '1.5rem 1.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.02)' }}>
          {/* Header Bar of History Section */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <FileText size={20} color="#059669" />
              <h2 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A' }}>
                Nhật Ký & Lịch Sử Mượn Trả ({filteredHistory.length})
              </h2>
            </div>

            {/* Filter & Search Bar */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div className="dash-search-box" style={{ minWidth: '240px' }}>
                <Search size={16} color="#94A3B8" />
                <input
                  type="text"
                  placeholder="Tìm theo tên sách, tác giả..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                {searchQuery && (
                  <button type="button" onClick={() => setSearchQuery('')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}>
                    <X size={14} />
                  </button>
                )}
              </div>

              {/* Status Filter Buttons */}
              <div style={{ display: 'flex', gap: '0.35rem', background: '#F8FAFC', padding: '0.25rem', borderRadius: '10px', border: '1px solid #E2E8F0' }}>
                <button
                  type="button"
                  onClick={() => setStatusFilter('ALL')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    background: statusFilter === 'ALL' ? 'white' : 'transparent',
                    color: statusFilter === 'ALL' ? '#0F172A' : '#64748B',
                    boxShadow: statusFilter === 'ALL' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Tất cả
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('BORROWED')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    background: statusFilter === 'BORROWED' ? '#FEF3C7' : 'transparent',
                    color: statusFilter === 'BORROWED' ? '#B45309' : '#64748B',
                    boxShadow: statusFilter === 'BORROWED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Đang mượn
                </button>
                <button
                  type="button"
                  onClick={() => setStatusFilter('RETURNED')}
                  style={{
                    padding: '0.35rem 0.75rem',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    border: 'none',
                    background: statusFilter === 'RETURNED' ? '#ECFDF5' : 'transparent',
                    color: statusFilter === 'RETURNED' ? '#047857' : '#64748B',
                    boxShadow: statusFilter === 'RETURNED' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                    cursor: 'pointer',
                  }}
                >
                  Đã trả
                </button>
              </div>

              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                style={{
                  padding: '0.45rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.3rem',
                  fontSize: '0.8rem',
                  fontWeight: 600,
                }}
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>

          {/* Table Content */}
          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.5rem auto', color: '#10B981' }} />
              <p>Đang tải lịch sử mượn trả...</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748B' }}>
              <FileText size={32} style={{ margin: '0 auto 0.5rem auto', color: '#CBD5E1' }} />
              <p style={{ fontWeight: 600, color: '#334155' }}>Không có lịch sử mượn sách nào</p>
              <p style={{ fontSize: '0.825rem', marginTop: '0.2rem' }}>Thử thay đổi bộ lọc tìm kiếm hoặc từ khóa.</p>
            </div>
          ) : (
            <div className="dash-table-wrapper" style={{ boxShadow: 'none' }}>
              <div className="dash-table-scroll">
                <table className="dash-table">
                  <thead>
                    <tr>
                      <th>Mã Lượt</th>
                      <th>Bìa Sách</th>
                      <th>Tên Sách</th>
                      <th>Tác Giả</th>
                      <th>Ngày Mượn</th>
                      <th>Ngày Trả</th>
                      <th>Trạng Thái</th>
                      <th style={{ textAlign: 'right' }}>Thao Tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredHistory.map((item) => {
                      const isBorrowed = item.status === 'BORROWED';
                      const isReturned = item.status === 'RETURNED';

                      return (
                        <tr key={item.id}>
                          <td style={{ fontWeight: 700, color: '#64748B' }}>#{item.id}</td>
                          <td>
                            {item.book?.coverUrl ? (
                              <img
                                src={item.book.coverUrl}
                                alt={item.book.title}
                                style={{
                                  width: '38px',
                                  height: '52px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid #E2E8F0',
                                }}
                              />
                            ) : (
                              <div style={{ width: '38px', height: '52px', background: '#F1F5F9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94A3B8', fontSize: '0.7rem' }}>
                                No Cover
                              </div>
                            )}
                          </td>
                          <td>
                            <div style={{ fontWeight: 700, color: '#0F172A' }}>{item.book?.title || 'Chưa rõ'}</div>
                          </td>
                          <td>{item.book?.author || 'Chưa rõ'}</td>
                          <td>
                            <div style={{ fontSize: '0.825rem', color: '#334155', fontWeight: 600 }}>
                              {item.borrowedAt || item.createdAt
                                ? `${new Date(item.borrowedAt || item.createdAt).toLocaleDateString('vi-VN')} ${new Date(item.borrowedAt || item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                                : '---'}
                            </div>
                          </td>
                          <td>
                            {item.returnedAt ? (
                              <div style={{ fontSize: '0.825rem', color: '#059669', fontWeight: 600 }}>
                                {new Date(item.returnedAt).toLocaleDateString('vi-VN')} {new Date(item.returnedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                              </div>
                            ) : isBorrowed ? (
                              <span style={{ fontSize: '0.8rem', color: '#D97706', fontStyle: 'italic', fontWeight: 600 }}>Chưa trả</span>
                            ) : (
                              <span style={{ color: '#94A3B8' }}>---</span>
                            )}
                          </td>
                          <td>
                            {isBorrowed ? (
                              <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800 }}>
                                ĐANG MƯỢN
                              </span>
                            ) : isReturned ? (
                              <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800 }}>
                                ĐÃ TRẢ
                              </span>
                            ) : (
                              <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800 }}>
                                {item.status}
                              </span>
                            )}
                          </td>
                          <td style={{ textAlign: 'right' }}>
                            {isBorrowed && (
                              <button
                                type="button"
                                onClick={() => handleReturn(item.id)}
                                disabled={submitting}
                                style={{
                                  padding: '0.4rem 0.85rem',
                                  background: '#D97706',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: submitting ? 'not-allowed' : 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                }}
                              >
                                <RotateCcw size={14} /> Trả sách
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
