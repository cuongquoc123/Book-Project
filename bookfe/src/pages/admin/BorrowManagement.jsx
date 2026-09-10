import React, { useState, useEffect, useMemo } from 'react';
import {
  BookmarkCheck,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Search,
  RefreshCw,
  X,
  Clock,
  BookOpen,
  User,
  Calendar,
  AlertTriangle,
  FileText,
  Tag,
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  Crown,
} from 'lucide-react';
import {
  getCurrentUser,
  getAllBorrowsForAdmin,
  approveBorrow,
  rejectBorrow,
  returnBook,
  getAllCategories,
} from '../../services/api';
import { getUser, setAuthData } from '../../utils/auth';
import AdminHeader from '../../components/AdminHeader';
import AlertToast from '../../components/AlertToast';
import '../../styles/dashboard.css';

export default function BorrowManagement() {
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});

  // Data states
  const [borrowList, setBorrowList] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'PENDING' | 'BORROWED' | 'RETURNED' | 'REJECTED'
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'OLDEST' | 'DUE_DATE_ASC'

  // Pagination states
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(8);

  // Action Modals State
  const [actionModal, setActionModal] = useState({
    isOpen: false,
    type: '', // 'APPROVE' | 'REJECT' | 'RETURN'
    item: null,
  });
  const [actionModalError, setActionModalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setAlert({ type: '', message: '' });

    // Fetch user profile
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

    // Fetch categories for filtering
    const [catErr, catRes] = await getAllCategories({ page: 0, size: 100 });
    if (!catErr && catRes) {
      const catList = Array.isArray(catRes) ? catRes : (catRes.content || []);
      setCategories(catList);
    }

    // Fetch all borrow records
    const [borrowErr, borrowData] = await getAllBorrowsForAdmin({ page: 0, size: 200 });
    if (borrowErr) {
      setAlert({ type: 'error', message: `Không thể tải danh sách mượn sách: ${borrowErr}` });
      setBorrowList([]);
    } else if (borrowData?.content) {
      setBorrowList(borrowData.content);
    } else if (Array.isArray(borrowData)) {
      setBorrowList(borrowData);
    } else {
      setBorrowList([]);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Handle Approve
  const handleConfirmApprove = async () => {
    if (!actionModal.item?.id) return;
    setActionModalError('');
    setSubmitting(true);
    const [err, data] = await approveBorrow(actionModal.item.id);
    setSubmitting(false);

    if (err) {
      setActionModalError(`Lỗi duyệt đơn: ${err}`);
    } else {
      setAlert({
        type: 'success',
        message: `Đã duyệt thành công đơn mượn cuốn sách "${actionModal.item.book?.title}" cho độc giả ${actionModal.item.user?.fullName || actionModal.item.user?.username}!`,
      });
      setActionModalError('');
      setActionModal({ isOpen: false, type: '', item: null });
      fetchData();
    }
  };

  // Handle Reject
  const handleConfirmReject = async () => {
    if (!actionModal.item?.id) return;
    setActionModalError('');
    setSubmitting(true);
    const [err, data] = await rejectBorrow(actionModal.item.id);
    setSubmitting(false);

    if (err) {
      setActionModalError(`Lỗi từ chối đơn: ${err}`);
    } else {
      setAlert({
        type: 'success',
        message: `Đã từ chối đơn mượn sách #${actionModal.item.id} của độc giả ${actionModal.item.user?.fullName || actionModal.item.user?.username}.`,
      });
      setActionModalError('');
      setActionModal({ isOpen: false, type: '', item: null });
      fetchData();
    }
  };

  // Handle Return
  const handleConfirmReturn = async () => {
    if (!actionModal.item?.id) return;
    setActionModalError('');
    setSubmitting(true);
    const [err, data] = await returnBook(actionModal.item.id);
    setSubmitting(false);

    if (err) {
      setActionModalError(`Lỗi xác nhận trả sách: ${err}`);
    } else {
      setAlert({
        type: 'success',
        message: `Đã xác nhận thu hồi sách "${actionModal.item.book?.title}" thành công. Tồn kho khả dụng của sách đã được cộng lại!`,
      });
      setActionModalError('');
      setActionModal({ isOpen: false, type: '', item: null });
      fetchData();
    }
  };

  // Statistics calculation
  const totalCount = borrowList.length;
  const pendingCount = useMemo(() => borrowList.filter((b) => b.status === 'PENDING').length, [borrowList]);
  const borrowedCount = useMemo(() => borrowList.filter((b) => b.status === 'BORROWED').length, [borrowList]);
  const returnedCount = useMemo(() => borrowList.filter((b) => b.status === 'RETURNED').length, [borrowList]);
  const rejectedCount = useMemo(() => borrowList.filter((b) => b.status === 'REJECTED' || b.status === 'CANCELLED').length, [borrowList]);

  // Unique borrowers count
  const uniqueBorrowersCount = useMemo(() => {
    const activeUsers = new Set();
    borrowList.filter((b) => b.status === 'BORROWED').forEach((b) => {
      if (b.user?.id) activeUsers.add(b.user.id);
    });
    return activeUsers.size;
  }, [borrowList]);

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    return borrowList.filter((item) => {
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        item.book?.title?.toLowerCase().includes(q) ||
        item.book?.author?.toLowerCase().includes(q) ||
        item.user?.fullName?.toLowerCase().includes(q) ||
        item.user?.username?.toLowerCase().includes(q) ||
        item.user?.email?.toLowerCase().includes(q) ||
        String(item.id).includes(q);

      const matchStatus = statusFilter === 'ALL' || item.status === statusFilter;

      const matchCategory =
        categoryFilter === 'ALL' ||
        String(item.book?.category?.id) === String(categoryFilter);

      return matchSearch && matchStatus && matchCategory;
    }).sort((a, b) => {
      if (sortBy === 'NEWEST') {
        const timeA = new Date(a.createdAt || a.borrowedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.borrowedAt || 0).getTime();
        return timeB - timeA;
      }
      if (sortBy === 'OLDEST') {
        const timeA = new Date(a.createdAt || a.borrowedAt || 0).getTime();
        const timeB = new Date(b.createdAt || b.borrowedAt || 0).getTime();
        return timeA - timeB;
      }
      if (sortBy === 'DUE_DATE_ASC') {
        const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 9999999999999;
        const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 9999999999999;
        return dateA - dateB;
      }
      return 0;
    });
  }, [borrowList, searchQuery, statusFilter, categoryFilter, sortBy]);

  // Pagination Slicing
  const totalPages = Math.ceil(filteredList.length / pageSize) || 1;
  const paginatedList = useMemo(() => {
    const start = page * pageSize;
    return filteredList.slice(start, start + pageSize);
  }, [filteredList, page, pageSize]);

  // Check if a record is overdue
  const isOverdue = (item) => {
    if (item.status !== 'BORROWED' || !item.dueDate) return false;
    const due = new Date(item.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return due < today;
  };

  return (
    <div className="dash-container">
      <AdminHeader currentUser={currentUser} />

      <main className="dash-main">
        <AlertToast type={alert.type} message={alert.message} />

        {/* Page Header */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">
              <BookmarkCheck size={28} color="#4F46E5" />
              <span>Quản Lý Mượn Sách & Phê Duyệt</span>
            </h1>
            <p className="dash-page-subtitle">
              Kiểm tra các độc giả đang mượn sách, sách được mượn, hạn trả và phê duyệt yêu cầu mượn sách từ người dùng.
            </p>
          </div>

          <div className="dash-action-group">
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="btn-secondary-refresh"
              title="Làm mới dữ liệu"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="dash-metrics-grid">
          <div className="metric-card" style={{ borderLeft: '4px solid #F59E0B' }}>
            <div className="metric-icon-wrap" style={{ background: '#FEF3C7', color: '#D97706' }}>
              <Clock size={24} />
            </div>
            <div>
              <div className="metric-val" style={{ color: '#D97706' }}>{pendingCount}</div>
              <div className="metric-lbl">Chờ Phê Duyệt</div>
            </div>
          </div>

          <div className="metric-card" style={{ borderLeft: '4px solid #3B82F6' }}>
            <div className="metric-icon-wrap" style={{ background: '#EFF6FF', color: '#2563EB' }}>
              <BookOpen size={24} />
            </div>
            <div>
              <div className="metric-val" style={{ color: '#2563EB' }}>{borrowedCount}</div>
              <div className="metric-lbl">Đang Được Mượn</div>
            </div>
          </div>

          <div className="metric-card" style={{ borderLeft: '4px solid #10B981' }}>
            <div className="metric-icon-wrap" style={{ background: '#ECFDF5', color: '#059669' }}>
              <CheckCircle2 size={24} />
            </div>
            <div>
              <div className="metric-val" style={{ color: '#059669' }}>{returnedCount}</div>
              <div className="metric-lbl">Đã Trả Hoàn Tất</div>
            </div>
          </div>

          <div className="metric-card" style={{ borderLeft: '4px solid #8B5CF6' }}>
            <div className="metric-icon-wrap" style={{ background: '#F5F3FF', color: '#7C3AED' }}>
              <User size={24} />
            </div>
            <div>
              <div className="metric-val" style={{ color: '#7C3AED' }}>{uniqueBorrowersCount}</div>
              <div className="metric-lbl">Độc Giả Đang Giữ Sách</div>
            </div>
          </div>
        </div>

        {/* Status Filter Tabs */}
        <div
          style={{
            display: 'flex',
            gap: '0.5rem',
            marginBottom: '1.25rem',
            overflowX: 'auto',
            paddingBottom: '0.25rem',
          }}
        >
          <button
            type="button"
            onClick={() => { setStatusFilter('ALL'); setPage(0); }}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              border: statusFilter === 'ALL' ? '1.5px solid #4F46E5' : '1px solid #E2E8F0',
              background: statusFilter === 'ALL' ? '#EEF2FF' : 'white',
              color: statusFilter === 'ALL' ? '#4F46E5' : '#64748B',
              fontWeight: statusFilter === 'ALL' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <span>Tất cả</span>
            <span
              style={{
                background: statusFilter === 'ALL' ? '#4F46E5' : '#F1F5F9',
                color: statusFilter === 'ALL' ? 'white' : '#64748B',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {totalCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('PENDING'); setPage(0); }}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              border: statusFilter === 'PENDING' ? '1.5px solid #D97706' : '1px solid #E2E8F0',
              background: statusFilter === 'PENDING' ? '#FEF3C7' : 'white',
              color: statusFilter === 'PENDING' ? '#B45309' : '#64748B',
              fontWeight: statusFilter === 'PENDING' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <Clock size={15} />
            <span>Chờ Duyệt</span>
            <span
              style={{
                background: statusFilter === 'PENDING' ? '#D97706' : '#FDE68A',
                color: statusFilter === 'PENDING' ? 'white' : '#92400E',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {pendingCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('BORROWED'); setPage(0); }}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              border: statusFilter === 'BORROWED' ? '1.5px solid #2563EB' : '1px solid #E2E8F0',
              background: statusFilter === 'BORROWED' ? '#EFF6FF' : 'white',
              color: statusFilter === 'BORROWED' ? '#1D4ED8' : '#64748B',
              fontWeight: statusFilter === 'BORROWED' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <BookOpen size={15} />
            <span>Đang Mượn</span>
            <span
              style={{
                background: statusFilter === 'BORROWED' ? '#2563EB' : '#DBEAFE',
                color: statusFilter === 'BORROWED' ? 'white' : '#1E40AF',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {borrowedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('RETURNED'); setPage(0); }}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              border: statusFilter === 'RETURNED' ? '1.5px solid #059669' : '1px solid #E2E8F0',
              background: statusFilter === 'RETURNED' ? '#ECFDF5' : 'white',
              color: statusFilter === 'RETURNED' ? '#047857' : '#64748B',
              fontWeight: statusFilter === 'RETURNED' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <CheckCircle2 size={15} />
            <span>Đã Trả</span>
            <span
              style={{
                background: statusFilter === 'RETURNED' ? '#059669' : '#D1FAE5',
                color: statusFilter === 'RETURNED' ? 'white' : '#065F46',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {returnedCount}
            </span>
          </button>

          <button
            type="button"
            onClick={() => { setStatusFilter('REJECTED'); setPage(0); }}
            style={{
              padding: '0.55rem 1.1rem',
              borderRadius: '12px',
              border: statusFilter === 'REJECTED' ? '1.5px solid #DC2626' : '1px solid #E2E8F0',
              background: statusFilter === 'REJECTED' ? '#FEF2F2' : 'white',
              color: statusFilter === 'REJECTED' ? '#B91C1C' : '#64748B',
              fontWeight: statusFilter === 'REJECTED' ? 700 : 600,
              fontSize: '0.875rem',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              transition: 'all 0.15s ease',
            }}
          >
            <XCircle size={15} />
            <span>Từ Chối / Hủy</span>
            <span
              style={{
                background: statusFilter === 'REJECTED' ? '#DC2626' : '#FEE2E2',
                color: statusFilter === 'REJECTED' ? 'white' : '#991B1B',
                padding: '0.1rem 0.45rem',
                borderRadius: '999px',
                fontSize: '0.75rem',
                fontWeight: 800,
              }}
            >
              {rejectedCount}
            </span>
          </button>
        </div>

        {/* Filter & Search Bar */}
        <div className="dash-controls-card">
          <div className="dash-search-box">
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Tìm theo tên sách, tác giả, độc giả, username, email hoặc mã lượt..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setPage(0);
              }}
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8' }}
              >
                <X size={15} />
              </button>
            )}
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <select
              className="dash-filter-select"
              value={categoryFilter}
              onChange={(e) => {
                setCategoryFilter(e.target.value);
                setPage(0);
              }}
            >
              <option value="ALL">Tất cả thể loại</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>

            <select
              className="dash-filter-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="NEWEST">Mới nhất trước</option>
              <option value="OLDEST">Cũ nhất trước</option>
              <option value="DUE_DATE_ASC">Hạn trả gần nhất</option>
            </select>
          </div>
        </div>

        {/* Table Container */}
        <div className="dash-table-wrapper">
          <div className="dash-table-scroll">
            <table className="dash-table">
              <thead>
                <tr>
                  <th style={{ width: '80px' }}>Mã Lượt</th>
                  <th>Độc Giả (Người Mượn)</th>
                  <th>Sách Được Mượn</th>
                  <th>Ngày Yêu Cầu / Mượn</th>
                  <th>Hạn Trả (Due Date)</th>
                  <th>Ngày Trả Thực Tế</th>
                  <th>Trạng Thái</th>
                  <th style={{ textAlign: 'right', minWidth: '180px' }}>Hành Động</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '3.5rem' }}>
                      <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: '#4F46E5' }} />
                      <div style={{ color: '#64748B', fontWeight: 600 }}>Đang tải dữ liệu mượn sách...</div>
                    </td>
                  </tr>
                ) : paginatedList.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <div className="dash-empty-state">
                        <div className="dash-empty-icon">
                          <BookmarkCheck size={32} />
                        </div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#0F172A', marginBottom: '0.4rem' }}>
                          Không tìm thấy lượt mượn sách nào
                        </h3>
                        <p style={{ fontSize: '0.875rem' }}>
                          {searchQuery || statusFilter !== 'ALL' || categoryFilter !== 'ALL'
                            ? 'Thử điều chỉnh lại bộ lọc tìm kiếm hoặc từ khóa.'
                            : 'Hiện tại chưa có yêu cầu mượn sách nào trong hệ thống.'}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  paginatedList.map((item) => {
                    const isPending = item.status === 'PENDING';
                    const isBorrowed = item.status === 'BORROWED';
                    const isReturned = item.status === 'RETURNED';
                    const isRejected = item.status === 'REJECTED';
                    const isCancelled = item.status === 'CANCELLED';
                    const overdue = isOverdue(item);

                    const userRole = item.user?.role?.name || item.user?.role || 'CLIENT';
                    const isUserSuperAdmin = userRole === 'SUPER_ADMIN';
                    const isUserAdmin = userRole === 'ADMIN';

                    return (
                      <tr key={item.id}>
                        {/* ID */}
                        <td style={{ fontWeight: 800, color: '#4F46E5' }}>#{item.id}</td>

                        {/* User info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            <div
                              style={{
                                width: '38px',
                                height: '38px',
                                borderRadius: '10px',
                                background: isUserSuperAdmin ? '#F5F3FF' : isUserAdmin ? '#EFF6FF' : '#F1F5F9',
                                color: isUserSuperAdmin ? '#7C3AED' : isUserAdmin ? '#2563EB' : '#64748B',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontWeight: 800,
                                fontSize: '0.9rem',
                                border: '1px solid #E2E8F0',
                                flexShrink: 0,
                              }}
                            >
                              {isUserSuperAdmin ? <Crown size={18} /> : isUserAdmin ? <ShieldCheck size={18} /> : <User size={18} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem' }}>
                                {item.user?.fullName || item.user?.username || 'Chưa cập nhật'}
                              </div>
                              <div style={{ fontSize: '0.775rem', color: '#64748B' }}>
                                @{item.user?.username || 'unknown'} • {item.user?.email || 'No email'}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Book info */}
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                            {item.book?.coverUrl ? (
                              <img
                                src={item.book.coverUrl}
                                alt={item.book.title}
                                style={{
                                  width: '36px',
                                  height: '48px',
                                  objectFit: 'cover',
                                  borderRadius: '6px',
                                  border: '1px solid #E2E8F0',
                                  flexShrink: 0,
                                }}
                              />
                            ) : (
                              <div
                                style={{
                                  width: '36px',
                                  height: '48px',
                                  borderRadius: '6px',
                                  background: '#F1F5F9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  color: '#94A3B8',
                                  fontSize: '0.65rem',
                                  flexShrink: 0,
                                }}
                              >
                                <BookOpen size={16} />
                              </div>
                            )}
                            <div>
                              <div style={{ fontWeight: 700, color: '#0F172A', fontSize: '0.9rem', maxWidth: '220px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.book?.title}>
                                {item.book?.title || 'Không rõ tên sách'}
                              </div>
                              <div style={{ fontSize: '0.775rem', color: '#64748B', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                <span>{item.book?.author || 'Tác giả ẩn'}</span>
                                {item.book?.category && (
                                  <>
                                    <span>•</span>
                                    <span style={{ color: '#4F46E5', fontWeight: 600 }}>{item.book.category.name}</span>
                                  </>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Request/Borrow date */}
                        <td>
                          <div style={{ fontSize: '0.85rem', color: '#1E293B', fontWeight: 600 }}>
                            {item.borrowedAt
                              ? `${new Date(item.borrowedAt).toLocaleDateString('vi-VN')} ${new Date(item.borrowedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                              : item.createdAt
                              ? `${new Date(item.createdAt).toLocaleDateString('vi-VN')} ${new Date(item.createdAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
                              : '---'}
                          </div>
                          {isPending && (
                            <div style={{ fontSize: '0.75rem', color: '#D97706', fontStyle: 'italic' }}>
                              (Đang đợi duyệt)
                            </div>
                          )}
                        </td>

                        {/* Due date */}
                        <td>
                          {item.dueDate ? (
                            <div>
                              <div style={{ fontSize: '0.85rem', fontWeight: 700, color: overdue ? '#DC2626' : '#0F172A', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                <Calendar size={14} color={overdue ? '#DC2626' : '#64748B'} />
                                <span>{new Date(item.dueDate).toLocaleDateString('vi-VN')}</span>
                              </div>
                              {overdue && (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.2rem',
                                    background: '#FEE2E2',
                                    color: '#DC2626',
                                    fontSize: '0.7rem',
                                    fontWeight: 800,
                                    padding: '0.1rem 0.4rem',
                                    borderRadius: '6px',
                                    marginTop: '0.2rem',
                                  }}
                                >
                                  <AlertTriangle size={11} /> QUÁ HẠN
                                </span>
                              )}
                            </div>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>---</span>
                          )}
                        </td>

                        {/* Return date */}
                        <td>
                          {item.returnedAt ? (
                            <div style={{ fontSize: '0.85rem', color: '#059669', fontWeight: 600 }}>
                              {new Date(item.returnedAt).toLocaleDateString('vi-VN')} {new Date(item.returnedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          ) : isBorrowed ? (
                            <span style={{ fontSize: '0.8rem', color: '#D97706', fontStyle: 'italic', fontWeight: 600 }}>Chưa trả</span>
                          ) : (
                            <span style={{ color: '#94A3B8' }}>---</span>
                          )}
                        </td>

                        {/* Status Badge */}
                        <td>
                          {isPending && (
                            <span style={{ background: '#FEF3C7', color: '#B45309', border: '1px solid #FCD34D', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <Clock size={12} /> CHỜ DUYỆT
                            </span>
                          )}
                          {isBorrowed && (
                            <span style={{ background: overdue ? '#FEE2E2' : '#EFF6FF', color: overdue ? '#B91C1C' : '#1D4ED8', border: overdue ? '1px solid #FCA5A5' : '1px solid #BFDBFE', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <BookOpen size={12} /> ĐANG MƯỢN
                            </span>
                          )}
                          {isReturned && (
                            <span style={{ background: '#ECFDF5', color: '#047857', border: '1px solid #A7F3D0', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <CheckCircle2 size={12} /> ĐÃ TRẢ
                            </span>
                          )}
                          {(isRejected || isCancelled) && (
                            <span style={{ background: '#F1F5F9', color: '#64748B', border: '1px solid #CBD5E1', padding: '0.25rem 0.65rem', borderRadius: '8px', fontSize: '0.775rem', fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                              <XCircle size={12} /> {isRejected ? 'TỪ CHỐI' : 'ĐÃ HỦY'}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td style={{ textAlign: 'right' }}>
                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
                            {isPending && (
                              <>
                                <button
                                  type="button"
                                  onClick={() => setActionModal({ isOpen: true, type: 'APPROVE', item })}
                                  style={{
                                    padding: '0.4rem 0.75rem',
                                    background: '#059669',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                    boxShadow: '0 2px 6px rgba(5, 150, 105, 0.25)',
                                  }}
                                  title="Phê duyệt đơn mượn sách"
                                >
                                  <CheckCircle2 size={14} /> Duyệt
                                </button>

                                <button
                                  type="button"
                                  onClick={() => setActionModal({ isOpen: true, type: 'REJECT', item })}
                                  style={{
                                    padding: '0.4rem 0.75rem',
                                    background: '#DC2626',
                                    color: 'white',
                                    border: 'none',
                                    borderRadius: '8px',
                                    fontWeight: 700,
                                    fontSize: '0.8rem',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.3rem',
                                  }}
                                  title="Từ chối đơn mượn sách"
                                >
                                  <XCircle size={14} /> Từ chối
                                </button>
                              </>
                            )}

                            {isBorrowed && (
                              <button
                                type="button"
                                onClick={() => setActionModal({ isOpen: true, type: 'RETURN', item })}
                                style={{
                                  padding: '0.4rem 0.85rem',
                                  background: '#D97706',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '8px',
                                  fontWeight: 700,
                                  fontSize: '0.8rem',
                                  cursor: 'pointer',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '0.35rem',
                                  boxShadow: '0 2px 6px rgba(217, 119, 6, 0.25)',
                                }}
                                title="Xác nhận độc giả đã trả sách"
                              >
                                <RotateCcw size={14} /> Thu hồi sách
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '1rem 1.5rem',
                borderTop: '1px solid #E2E8F0',
                background: '#F8FAFC',
                flexWrap: 'wrap',
                gap: '1rem',
              }}
            >
              <div style={{ fontSize: '0.875rem', color: '#64748B' }}>
                Hiển thị <strong>{paginatedList.length}</strong> trên tổng số <strong>{filteredList.length}</strong> bản ghi (Trang {page + 1}/{totalPages})
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <button
                  type="button"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: 'white',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                    opacity: page === 0 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  <ChevronLeft size={16} /> Trước
                </button>

                {Array.from({ length: totalPages }, (_, i) => i).map((pIndex) => {
                  if (
                    pIndex === 0 ||
                    pIndex === totalPages - 1 ||
                    (pIndex >= page - 1 && pIndex <= page + 1)
                  ) {
                    return (
                      <button
                        key={pIndex}
                        type="button"
                        onClick={() => setPage(pIndex)}
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '8px',
                          border: page === pIndex ? 'none' : '1px solid #E2E8F0',
                          background: page === pIndex ? '#4F46E5' : 'white',
                          color: page === pIndex ? 'white' : '#475569',
                          fontWeight: page === pIndex ? 700 : 600,
                          cursor: 'pointer',
                          fontSize: '0.85rem',
                        }}
                      >
                        {pIndex + 1}
                      </button>
                    );
                  }
                  if (pIndex === page - 2 || pIndex === page + 2) {
                    return <span key={pIndex} style={{ color: '#94A3B8' }}>...</span>;
                  }
                  return null;
                })}

                <button
                  type="button"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  style={{
                    padding: '0.4rem 0.75rem',
                    background: 'white',
                    border: '1px solid #CBD5E1',
                    borderRadius: '8px',
                    cursor: page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    opacity: page >= totalPages - 1 ? 0.5 : 1,
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.2rem',
                    fontSize: '0.85rem',
                    fontWeight: 600,
                  }}
                >
                  Tiếp <ChevronRight size={16} />
                </button>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* MODAL PHÊ DUYỆT (APPROVE) */}
      {actionModal.isOpen && actionModal.type === 'APPROVE' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#059669' }}>
                <CheckCircle2 size={22} color="#059669" />
                <span>Phê Duyệt Đơn Mượn Sách</span>
              </h2>
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: '', item: null })}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <AlertToast type="error" message={actionModalError} />
              <p style={{ color: '#334155', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn <strong>phê duyệt</strong> yêu cầu mượn sách sau đây?
              </p>

              <div style={{ background: '#F8FAFC', padding: '1rem 1.25rem', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div>
                  <strong>Độc giả:</strong> {actionModal.item?.user?.fullName || actionModal.item?.user?.username} (@{actionModal.item?.user?.username})
                </div>
                <div>
                  <strong>Sách mượn:</strong> {actionModal.item?.book?.title} ({actionModal.item?.book?.author})
                </div>
                <div>
                  <strong>Hạn trả dự kiến:</strong>{' '}
                  <span style={{ color: '#2563EB', fontWeight: 700 }}>
                    {actionModal.item?.dueDate ? new Date(actionModal.item.dueDate).toLocaleDateString('vi-VN') : '7 ngày'}
                  </span>
                </div>
                {actionModal.item?.note && (
                  <div>
                    <strong>Ghi chú từ độc giả:</strong> <em>"{actionModal.item.note}"</em>
                  </div>
                )}
              </div>

              <div style={{ fontSize: '0.85rem', color: '#64748B' }}>
                * Sau khi duyệt, số lượng sách khả dụng trong kho sẽ tự động giảm đi 1 cuốn và độc giả sẽ chính thức được ghi nhận đang mượn.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: '', item: null })}
                disabled={submitting}
                className="modal-btn-cancel"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmApprove}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.4rem',
                  background: '#059669',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                <span>Xác Nhận Duyệt Đơn</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TỪ CHỐI (REJECT) */}
      {actionModal.isOpen && actionModal.type === 'REJECT' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#DC2626' }}>
                <XCircle size={22} color="#DC2626" />
                <span>Từ Chối Đơn Mượn Sách</span>
              </h2>
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: '', item: null })}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <AlertToast type="error" message={actionModalError} />
              <p style={{ color: '#334155', lineHeight: 1.6 }}>
                Bạn có chắc chắn muốn <strong>từ chối</strong> đơn mượn cuốn sách <strong>"{actionModal.item?.book?.title}"</strong> của độc giả <strong>{actionModal.item?.user?.fullName || actionModal.item?.user?.username}</strong>?
              </p>
              <div style={{ background: '#FEF2F2', padding: '0.85rem 1rem', borderRadius: '10px', color: '#991B1B', fontSize: '0.875rem' }}>
                Đơn mượn này sẽ chuyển sang trạng thái <strong>TỪ CHỐI</strong> và độc giả có thể gửi yêu cầu mượn cuốn sách khác.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: '', item: null })}
                disabled={submitting}
                className="modal-btn-cancel"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                disabled={submitting}
                className="modal-btn-danger"
              >
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <XCircle size={16} />}
                <span>Xác Nhận Từ Chối</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL THU HỒI / XÁC NHẬN TRẢ SÁCH (RETURN) */}
      {actionModal.isOpen && actionModal.type === 'RETURN' && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#D97706' }}>
                <RotateCcw size={22} color="#D97706" />
                <span>Xác Nhận Thu Hồi / Trả Sách</span>
              </h2>
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: '', item: null })}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <AlertToast type="error" message={actionModalError} />
              <p style={{ color: '#334155', lineHeight: 1.6 }}>
                Xác nhận độc giả <strong>{actionModal.item?.user?.fullName || actionModal.item?.user?.username}</strong> đã trả lại cuốn sách <strong>"{actionModal.item?.book?.title}"</strong> về thư viện?
              </p>
              <div style={{ background: '#FEF3C7', padding: '0.85rem 1rem', borderRadius: '10px', color: '#92400E', fontSize: '0.875rem' }}>
                Sau khi xác nhận, số lượng sách khả dụng trong kho sẽ <strong>tăng thêm 1 cuốn</strong> và đơn mượn được chuyển sang trạng thái <strong>ĐÃ TRẢ</strong>.
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                onClick={() => setActionModal({ isOpen: false, type: '', item: null })}
                disabled={submitting}
                className="modal-btn-cancel"
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                onClick={handleConfirmReturn}
                disabled={submitting}
                style={{
                  padding: '0.6rem 1.4rem',
                  background: '#D97706',
                  border: 'none',
                  color: 'white',
                  borderRadius: '10px',
                  fontWeight: 600,
                  cursor: submitting ? 'not-allowed' : 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                }}
              >
                {submitting ? <RefreshCw size={16} className="animate-spin" /> : <RotateCcw size={16} />}
                <span>Xác Nhận Nhận Lại Sách</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
