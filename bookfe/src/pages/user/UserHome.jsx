import React, { useState, useEffect, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen,
  LogOut,
  User,
  Search,
  SlidersHorizontal,
  ArrowUpDown,
  ShieldCheck,
  RefreshCw,
  X,
  Tag,
  CheckCircle2,
  Lock,
  Eye,
  Info,
  Sparkles,
  Layers,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  BookmarkCheck,
  Calendar,
  Clock,
} from 'lucide-react';
import { logoutUser, getCurrentUser, getAllBooks, getAllCategories, borrowBook, returnBook, cancelBorrow, getMyBorrow, getMyActiveBorrowsList } from '../../services/api';
import { clearAuth, getRefreshToken, getUser } from '../../utils/auth';
import AlertToast from '../../components/AlertToast';
import '../../styles/auth.css';

export default function UserHome() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});

  // API Data
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [myBorrows, setMyBorrows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Pagination states (BE API: page, size)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(4); // Default 4 books/page for great layout
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Client-side Static Search, Category Filter & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC' | 'NAME_DESC'

  // Selected Book for Detail Modal
  const [selectedBook, setSelectedBook] = useState(null);

  // Borrow Modal State (User sets Due Date, Quantity & Note)
  const [borrowModalTarget, setBorrowModalTarget] = useState(null);
  const [borrowModalError, setBorrowModalError] = useState('');
  const [borrowDueDate, setBorrowDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 7);
    return d.toISOString().split('T')[0];
  });
  const [borrowQuantity, setBorrowQuantity] = useState(1);
  const [borrowNote, setBorrowNote] = useState('');
  const [submittingBorrow, setSubmittingBorrow] = useState(false);

  const fetchData = async (targetPage = page, targetSize = pageSize) => {
    setLoading(true);
    setAlert({ type: '', message: '' });

    // Fetch User Profile
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

    // Fetch Categories
    const [catErr, catRes] = await getAllCategories({ page: 0, size: 100 });
    if (!catErr && catRes) {
      const catList = Array.isArray(catRes) ? catRes : (catRes.content || []);
      setCategories(catList);
    }

    // Fetch Books from BE with pagination
    const [bookErr, bookRes] = await getAllBooks({
      page: targetPage,
      size: targetSize,
      sortBy: 'id',
      sortDir: 'desc',
    });

    if (bookErr) {
      setAlert({ type: 'error', message: `Không thể tải danh sách sách từ server: ${bookErr}` });
    } else if (bookRes) {
      if (Array.isArray(bookRes)) {
        setBooks(bookRes);
        setTotalPages(1);
        setTotalElements(bookRes.length);
        setPage(0);
      } else {
        setBooks(bookRes.content || []);
        setTotalPages(bookRes.totalPages || 0);
        setTotalElements(bookRes.totalElements || 0);
        setPage(bookRes.number !== undefined ? bookRes.number : targetPage);
      }
    }

    // Fetch user active borrows list
    const [borrowListErr, borrowListData] = await getMyActiveBorrowsList();
    if (!borrowListErr && Array.isArray(borrowListData)) {
      setMyBorrows(borrowListData);
    } else {
      const [singleErr, singleData] = await getMyBorrow();
      if (!singleErr && singleData) {
        setMyBorrows([singleData]);
      } else {
        setMyBorrows([]);
      }
    }

    setLoading(false);
  };

  const handleOpenBorrowModal = (book) => {
    if (!book) return;
    const defaultDate = new Date();
    defaultDate.setDate(defaultDate.getDate() + 7);
    setBorrowDueDate(defaultDate.toISOString().split('T')[0]);
    setBorrowQuantity(1);
    setBorrowNote('');
    setBorrowModalError('');
    setBorrowModalTarget(book);
  };

  const handleConfirmBorrow = async () => {
    if (!borrowModalTarget) return;
    setBorrowModalError('');

    const totalStock = borrowModalTarget.totalStock || 10;
    const maxBorrowable = borrowModalTarget.maxBorrowable !== undefined ? borrowModalTarget.maxBorrowable : Math.floor(totalStock * 0.5);
    const borrowedCount = borrowModalTarget.borrowedCount || 0;
    const remainingBorrowable = borrowModalTarget.remainingBorrowable !== undefined ? borrowModalTarget.remainingBorrowable : Math.max(0, maxBorrowable - borrowedCount);
    const availableStock = borrowModalTarget.availableStock !== undefined ? borrowModalTarget.availableStock : totalStock;
    const maxAllowed = Math.min(remainingBorrowable, availableStock);

    if (maxBorrowable <= 0) {
      setBorrowModalError(`Đầu sách này có tổng số lượng là ${totalStock} cuốn (50% làm tròn xuống là 0 cuốn) nên không đủ điều kiện cho mượn ra ngoài.`);
      return;
    }

    if (remainingBorrowable <= 0) {
      setBorrowModalError(`Đầu sách này đã đạt hạn mức mượn tối đa 50% (${maxBorrowable}/${totalStock} cuốn). Vui lòng chọn sách khác hoặc đợi độc giả hoàn trả!`);
      return;
    }

    if (!borrowQuantity || borrowQuantity < 1) {
      setBorrowModalError('Số lượng sách muốn mượn tối thiểu là 1 cuốn!');
      return;
    }

    if (borrowQuantity > maxAllowed) {
      setBorrowModalError(`Số lượng mượn (${borrowQuantity} cuốn) vượt quá số lượng tối đa cho phép hiện tại (${maxAllowed} cuốn)!`);
      return;
    }

    if (!borrowDueDate) {
      setBorrowModalError('Vui lòng chọn ngày hẹn trả sách!');
      return;
    }

    const selectedDate = new Date(borrowDueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (selectedDate <= today) {
      setBorrowModalError('Ngày hẹn trả sách phải từ ngày mai trở đi!');
      return;
    }

    setSubmittingBorrow(true);
    const [err, data] = await borrowBook(borrowModalTarget.id, {
      dueDate: borrowDueDate,
      note: borrowNote,
      quantity: borrowQuantity,
    });
    setSubmittingBorrow(false);

    if (err) {
      setBorrowModalError(err);
    } else {
      setAlert({
        type: 'success',
        message: `Đã gửi yêu cầu mượn ${borrowQuantity} cuốn sách "${borrowModalTarget.title}" thành công! Yêu cầu của bạn đang chờ Ban Quản Trị / Thủ Thư phê duyệt.`,
      });
      setBorrowModalError('');
      setBorrowModalTarget(null);
      if (selectedBook) setSelectedBook(null);
      fetchData();
    }
  };

  const handleReturnBook = async (borrowId) => {
    setLoading(true);
    const [err, data] = await returnBook(borrowId);
    setLoading(false);
    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({ type: 'success', message: 'Trả sách thành công! Cảm ơn bạn.' });
      if (selectedBook) setSelectedBook(null);
      fetchData();
    }
  };

  const handleCancelBorrow = async (borrowId) => {
    setLoading(true);
    const [err, data] = await cancelBorrow(borrowId);
    setLoading(false);
    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({ type: 'success', message: 'Hủy yêu cầu mượn sách thành công!' });
      if (selectedBook) setSelectedBook(null);
      fetchData();
    }
  };


  useEffect(() => {
    fetchData(0, pageSize);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 0 || (totalPages > 0 && newPage >= totalPages)) return;
    setPage(newPage);
    fetchData(newPage, pageSize);
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handlePageSizeChange = (newSize) => {
    const sizeNum = Number(newSize);
    setPageSize(sizeNum);
    setPage(0);
    fetchData(0, sizeNum);
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

  /* =========================================================
   * Client-side Static Search, Category Filtering & Sorting Logic
   * ========================================================= */
  const processedBooks = useMemo(() => {
    let result = [...books];

    // 1. Filter by Category
    if (selectedCategory !== 'ALL') {
      result = result.filter((b) => String(b.categoryId) === String(selectedCategory));
    }

    // 2. Filter by Search Query (Title, Author, Category, Description)
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(
        (b) =>
          b.title?.toLowerCase().includes(q) ||
          b.author?.toLowerCase().includes(q) ||
          b.description?.toLowerCase().includes(q) ||
          b.categoryName?.toLowerCase().includes(q)
      );
    }

    // 3. Static Client-side Sorting
    switch (sortBy) {
      case 'PRICE_ASC':
        result.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
        break;

      case 'PRICE_DESC':
        result.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
        break;

      case 'NAME_ASC':
        result.sort((a, b) => (a.title || '').localeCompare(b.title || '', 'vi'));
        break;

      case 'NAME_DESC':
        result.sort((a, b) => (b.title || '').localeCompare(a.title || '', 'vi'));
        break;

      case 'NEWEST':
      default:
        result.sort((a, b) => (b.id || 0) - (a.id || 0));
        break;
    }

    return result;
  }, [books, selectedCategory, searchQuery, sortBy]);

  // Statistics
  const freeBooksCount = useMemo(
    () => books.filter((b) => !b.price || Number(b.price) === 0).length,
    [books]
  );

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
      {/* Client Header Bar */}
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
              to="/my-borrows"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                padding: '0.45rem 0.9rem',
                background: '#FEF3C7',
                color: '#B45309',
                borderRadius: '10px',
                fontWeight: 700,
                fontSize: '0.85rem',
                textDecoration: 'none',
                border: '1px solid #FCD34D',
              }}
              title="Quản lý sách mượn và xem lịch sử"
            >
              <BookmarkCheck size={16} />
              <span>Sách Mượn & Lịch Sử</span>
            </Link>

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
                transition: 'all 0.2s ease',
              }}
              title="Xem thông tin cá nhân"
            >
              <User size={16} color="#059669" />
              <span style={{ fontWeight: 600, fontSize: '0.875rem', color: '#0F172A' }}>
                {currentUser.username || 'Độc giả'}
              </span>
              <span
                style={{
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  padding: '0.15rem 0.5rem',
                  borderRadius: '6px',
                  background: '#10B981',
                  color: 'white',
                  textTransform: 'uppercase',
                }}
              >
                {currentUser.role || 'CLIENT'}
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
                transition: 'all 0.2s ease',
              }}
            >
              <LogOut size={16} />
              <span>Đăng xuất</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1280px', width: '100%', margin: '0 auto', padding: '2rem 1.5rem', flex: 1 }}>
        <AlertToast type={alert.type} message={alert.message} />

        {/* Active Borrow Banner */}
        {myBorrows && myBorrows.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.5rem' }}>
            {myBorrows.map((borrow) => (
              <div
                key={borrow.id}
                style={{
                  background: borrow.status === 'PENDING'
                    ? 'linear-gradient(135deg, #FEF3C7 0%, #FFFBEB 100%)'
                    : 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
                  border: borrow.status === 'PENDING' ? '1.5px solid #FCD34D' : '1px solid #F59E0B',
                  borderRadius: '16px',
                  padding: '1.1rem 1.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '1rem',
                  boxShadow: '0 4px 12px rgba(245, 158, 11, 0.15)',
                  flexWrap: 'wrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  {borrow.status === 'PENDING' ? (
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#FDE68A', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#B45309' }}>
                      <Clock size={24} />
                    </div>
                  ) : (
                    <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#F59E0B', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                      <BookOpen size={24} />
                    </div>
                  )}
                  <div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: borrow.status === 'PENDING' ? '#B45309' : '#92400E', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      {borrow.status === 'PENDING' ? '⏳ ĐƠN MƯỢN ĐANG CHỜ DUYỆT' : '📖 SÁCH BẠN ĐANG MƯỢN'}
                    </div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 800, color: '#78350F', marginTop: '0.1rem' }}>
                      {borrow.book?.title} {borrow.book?.author ? `(Tác giả: ${borrow.book?.author})` : ''}
                    </div>
                    <div style={{ fontSize: '0.8rem', color: '#92400E', marginTop: '0.2rem' }}>
                      {borrow.dueDate && (
                        <span>Hạn trả dự kiến: <strong>{new Date(borrow.dueDate).toLocaleDateString('vi-VN')}</strong></span>
                      )}
                      {borrow.status === 'PENDING' && (
                        <span style={{ fontStyle: 'italic', marginLeft: '0.5rem' }}>(Vui lòng chờ Ban Quản Trị phê duyệt trước khi nhận sách)</span>
                      )}
                    </div>
                  </div>
                </div>

                {borrow.status === 'BORROWED' ? (
                  <button
                    type="button"
                    onClick={() => handleReturnBook(borrow.id)}
                    disabled={loading}
                    style={{
                      padding: '0.55rem 1.25rem',
                      background: '#D97706',
                      color: 'white',
                      border: 'none',
                      borderRadius: '10px',
                      fontWeight: 700,
                      fontSize: '0.875rem',
                      cursor: 'pointer',
                      boxShadow: '0 2px 8px rgba(217, 119, 6, 0.3)',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    Trả Sách Ngay
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <button
                      type="button"
                      onClick={() => handleCancelBorrow(borrow.id)}
                      disabled={loading}
                      style={{
                        padding: '0.55rem 1.1rem',
                        background: '#FEF2F2',
                        color: '#DC2626',
                        border: '1px solid #FCA5A5',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
                        transition: 'all 0.2s ease',
                      }}
                    >
                      Hủy Yêu Cầu
                    </button>
                    <Link
                      to="/my-borrows"
                      style={{
                        padding: '0.55rem 1.1rem',
                        background: '#B45309',
                        color: 'white',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                        textDecoration: 'none',
                        boxShadow: '0 2px 8px rgba(180, 83, 9, 0.25)',
                      }}
                    >
                      Xem Tiến Độ Duyệt
                    </Link>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}


        {/* Hero Section */}
        <div
          style={{
            background: 'linear-gradient(135deg, #064E3B 0%, #047857 50%, #059669 100%)',
            borderRadius: '24px',
            padding: '2.5rem 2rem',
            color: 'white',
            marginBottom: '2rem',
            boxShadow: '0 12px 30px rgba(5, 150, 105, 0.2)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <div style={{ maxWidth: '640px', zIndex: 2, position: 'relative' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                padding: '0.35rem 0.9rem',
                borderRadius: '20px',
                fontSize: '0.825rem',
                fontWeight: 700,
                marginBottom: '1rem',
              }}
            >
              <Sparkles size={14} /> Thư Viện Sách Trực Tuyến Độc Quyền
            </div>

            <h1 style={{ fontSize: '2.2rem', fontWeight: 800, lineHeight: '1.25', marginBottom: '0.75rem' }}>
              Khám Phá Hàng Trăm Cuốn Sách Hay.
            </h1>
            <p style={{ fontSize: '0.975rem', opacity: 0.9, lineHeight: '1.6', marginBottom: '1.75rem' }}>
              Chào mừng <strong style={{ color: '#FDE68A' }}>{currentUser.username || 'Độc giả'}</strong>! Đọc trực tuyến, tìm kiếm tác phẩm yêu thích và trải nghiệm kho sách chất lượng cao.
            </p>

            {/* Main Search Input inside Hero */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                background: 'white',
                borderRadius: '16px',
                padding: '0.4rem 0.6rem 0.4rem 1rem',
                boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
              }}
            >
              <Search size={20} color="#059669" style={{ flexShrink: 0 }} />
              <input
                type="text"
                placeholder="Nhập tên sách, tác giả, thể loại cần tìm..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  border: 'none',
                  outline: 'none',
                  background: 'transparent',
                  width: '100%',
                  padding: '0.5rem 0.75rem',
                  fontSize: '0.95rem',
                  color: '#0F172A',
                }}
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94A3B8', padding: '0.4rem' }}
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </div>

          {/* Quick Metrics Badges inside Hero */}
          <div
            style={{
              display: 'flex',
              gap: '1rem',
              marginTop: '1.75rem',
              flexWrap: 'wrap',
              zIndex: 2,
              position: 'relative',
            }}
          >
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
              📚 <strong>{books.length}</strong> Đầu sách hiện có
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
              🏷️ <strong>{categories.length}</strong> Thể loại đa dạng
            </div>
            <div style={{ background: 'rgba(255, 255, 255, 0.15)', backdropFilter: 'blur(8px)', padding: '0.5rem 1rem', borderRadius: '12px', fontSize: '0.85rem' }}>
              ✨ <strong>{freeBooksCount}</strong> Sách đọc miễn phí
            </div>
          </div>
        </div>

        {/* TOOLBAR: Category Filter Pills & Static Sort Controls */}
        <div
          style={{
            background: 'white',
            borderRadius: '20px',
            padding: '1.25rem 1.5rem',
            border: '1px solid #E2E8F0',
            marginBottom: '2rem',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.02)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.25rem',
          }}
        >
          {/* Top Row: Category Filter Pills */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
              <Layers size={16} color="#059669" />
              <span>DANH MỤC THỂ LOẠI:</span>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => setSelectedCategory('ALL')}
                style={{
                  padding: '0.45rem 1rem',
                  borderRadius: '9999px',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: selectedCategory === 'ALL' ? 'none' : '1px solid #E2E8F0',
                  background: selectedCategory === 'ALL' ? '#10B981' : '#F8FAFC',
                  color: selectedCategory === 'ALL' ? 'white' : '#475569',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease',
                  boxShadow: selectedCategory === 'ALL' ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none',
                }}
              >
                Tất cả ({books.length})
              </button>

              {categories.map((cat) => {
                const count = books.filter((b) => String(b.categoryId) === String(cat.id)).length;
                const isSelected = String(selectedCategory) === String(cat.id);
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedCategory(cat.id)}
                    style={{
                      padding: '0.45rem 1rem',
                      borderRadius: '9999px',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      border: isSelected ? 'none' : '1px solid #E2E8F0',
                      background: isSelected ? '#10B981' : '#F8FAFC',
                      color: isSelected ? 'white' : '#475569',
                      cursor: 'pointer',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? '0 4px 10px rgba(16, 185, 129, 0.25)' : 'none',
                    }}
                  >
                    {cat.name} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {/* Bottom Row: Static Sort Controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              paddingTop: '1rem',
              borderTop: '1px solid #F1F5F9',
              gap: '1rem',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ fontSize: '0.9rem', color: '#64748B' }}>
              Hiển thị <strong style={{ color: '#0F172A' }}>{processedBooks.length}</strong> kết quả
              {selectedCategory !== 'ALL' && ' thuộc thể loại đã chọn'}
              {searchQuery && ` theo từ khóa "${searchQuery}"`}
            </div>

            {/* Static Sort Buttons & Select */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', fontWeight: 700, color: '#475569' }}>
                <ArrowUpDown size={16} color="#059669" />
                <span>SẮP XẾP:</span>
              </div>

              {/* Static Sort Buttons Bar */}
              <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  onClick={() => setSortBy('NEWEST')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: sortBy === 'NEWEST' ? '1px solid #10B981' : '1px solid #CBD5E1',
                    background: sortBy === 'NEWEST' ? '#ECFDF5' : 'white',
                    color: sortBy === 'NEWEST' ? '#047857' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  ⚡ Mới nhất
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('PRICE_ASC')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: sortBy === 'PRICE_ASC' ? '1px solid #10B981' : '1px solid #CBD5E1',
                    background: sortBy === 'PRICE_ASC' ? '#ECFDF5' : 'white',
                    color: sortBy === 'PRICE_ASC' ? '#047857' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  💲 Giá thấp → cao
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('PRICE_DESC')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: sortBy === 'PRICE_DESC' ? '1px solid #10B981' : '1px solid #CBD5E1',
                    background: sortBy === 'PRICE_DESC' ? '#ECFDF5' : 'white',
                    color: sortBy === 'PRICE_DESC' ? '#047857' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  💎 Giá cao → thấp
                </button>

                <button
                  type="button"
                  onClick={() => setSortBy('NAME_ASC')}
                  style={{
                    padding: '0.4rem 0.85rem',
                    borderRadius: '10px',
                    fontSize: '0.825rem',
                    fontWeight: 700,
                    border: sortBy === 'NAME_ASC' ? '1px solid #10B981' : '1px solid #CBD5E1',
                    background: sortBy === 'NAME_ASC' ? '#ECFDF5' : 'white',
                    color: sortBy === 'NAME_ASC' ? '#047857' : '#475569',
                    cursor: 'pointer',
                  }}
                >
                  🔤 Tên A-Z
                </button>
              </div>

              {/* Refresh Button */}
              <button
                type="button"
                onClick={fetchData}
                disabled={loading}
                style={{
                  padding: '0.4rem 0.75rem',
                  borderRadius: '10px',
                  border: '1px solid #CBD5E1',
                  background: 'white',
                  color: '#475569',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  fontSize: '0.825rem',
                  fontWeight: 600,
                }}
                title="Tải lại từ Server"
              >
                <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
              </button>
            </div>
          </div>
        </div>

        {/* BOOK GRID CONTENT */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '5rem 2rem', color: '#64748B' }}>
            <RefreshCw size={36} className="animate-spin" style={{ margin: '0 auto 1rem auto', color: '#10B981' }} />
            <p style={{ fontSize: '1rem', fontWeight: 600 }}>Đang tải danh sách sách từ máy chủ...</p>
          </div>
        ) : processedBooks.length === 0 ? (
          <div
            style={{
              background: 'white',
              borderRadius: '20px',
              padding: '4rem 2rem',
              textAlign: 'center',
              border: '1px solid #E2E8F0',
              color: '#64748B',
            }}
          >
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: '#F1F5F9',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1rem auto',
                color: '#94A3B8',
              }}
            >
              <BookOpen size={30} />
            </div>
            <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
              Không tìm thấy cuốn sách nào
            </h3>
            <p style={{ fontSize: '0.9rem', maxWidth: '440px', margin: '0 auto 1.5rem auto' }}>
              Không có kết quả khớp với tiêu chí tìm kiếm hoặc bộ lọc hiện tại. Thử đặt lại bộ lọc.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setSelectedCategory('ALL');
                setSortBy('NEWEST');
              }}
              style={{
                padding: '0.6rem 1.25rem',
                background: '#10B981',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontWeight: 700,
                cursor: 'pointer',
              }}
            >
              Xóa bộ lọc & Thử lại
            </button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))',
              gap: '1.5rem',
            }}
          >
            {processedBooks.map((book) => {
              const isFree = !book.price || Number(book.price) === 0;

              return (
                <div
                  key={book.id}
                  style={{
                    background: 'white',
                    borderRadius: '20px',
                    border: '1px solid #E2E8F0',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                    transition: 'all 0.25s ease',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = '0 12px 28px rgba(0,0,0,0.08)';
                    e.currentTarget.style.borderColor = '#A7F3D0';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = '0 2px 4px rgba(0,0,0,0.02)';
                    e.currentTarget.style.borderColor = '#E2E8F0';
                  }}
                >
                  {/* Top Cover Display */}
                  <div
                    style={{
                      height: '210px',
                      background: 'linear-gradient(135deg, #F1F5F9 0%, #E2E8F0 100%)',
                      position: 'relative',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      overflow: 'hidden',
                    }}
                  >
                    {book.coverUrl ? (
                      <img
                        src={book.coverUrl}
                        alt={book.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          transition: 'transform 0.3s ease',
                        }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '0.5rem',
                          color: '#94A3B8',
                        }}
                      >
                        <BookOpen size={44} />
                        <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Athenaeum Book</span>
                      </div>
                    )}

                    {/* Category Tag Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        top: '12px',
                        left: '12px',
                        background: 'rgba(15, 23, 42, 0.75)',
                        backdropFilter: 'blur(6px)',
                        color: 'white',
                        padding: '0.25rem 0.65rem',
                        borderRadius: '8px',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                      }}
                    >
                      {book.categoryName || 'Sách'}
                    </span>

                    {/* Price Badge */}
                    <span
                      style={{
                        position: 'absolute',
                        bottom: '12px',
                        right: '12px',
                        background: isFree ? '#10B981' : '#0F172A',
                        color: 'white',
                        padding: '0.3rem 0.75rem',
                        borderRadius: '8px',
                        fontSize: '0.825rem',
                        fontWeight: 800,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
                      }}
                    >
                      {isFree ? 'Miễn phí' : `${Number(book.price).toLocaleString('vi-VN')} đ`}
                    </span>
                  </div>

                  {/* Book Card Body */}
                  <div style={{ padding: '1.25rem', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                    <div>
                      <h3
                        style={{
                          fontSize: '1.1rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          marginBottom: '0.35rem',
                          lineHeight: '1.35',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {book.title}
                      </h3>

                      <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '0.75rem', fontWeight: 500 }}>
                        Tác giả: <strong style={{ color: '#334155' }}>{book.author || 'Đang cập nhật'}</strong>
                      </div>

                      {book.description && (
                        <p
                          style={{
                            fontSize: '0.825rem',
                            color: '#64748B',
                            lineHeight: '1.5',
                            marginBottom: '1rem',
                            display: '-webkit-box',
                            WebkitLineClamp: 3,
                            WebkitBoxOrient: 'vertical',
                            overflow: 'hidden',
                          }}
                        >
                          {book.description}
                        </p>
                      )}
                    </div>

                    {/* Notice & Stock Badge */}
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                      {/* Stock Details Grid */}
                      <div
                        style={{
                          fontSize: '0.78rem',
                          background: '#F8FAFC',
                          padding: '0.5rem 0.65rem',
                          borderRadius: '8px',
                          border: '1px solid #E2E8F0',
                          marginBottom: '0.75rem',
                          display: 'flex',
                          flexDirection: 'column',
                          gap: '3px',
                        }}
                      >
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#64748B' }}>Kho khả dụng:</span>
                          <strong style={{ color: (book.availableStock !== undefined ? book.availableStock : 10) > 0 ? '#059669' : '#DC2626' }}>
                            {book.availableStock !== undefined ? book.availableStock : (book.totalStock || 10)}/{book.totalStock || 10} cuốn
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: '#0284C7' }}>
                          <span>Hạn mức mượn (50%):</span>
                          <strong>
                            {book.maxBorrowable !== undefined ? book.maxBorrowable : Math.floor((book.totalStock || 10) * 0.5)} cuốn
                          </strong>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', color: (book.remainingBorrowable !== undefined ? book.remainingBorrowable : Math.max(0, Math.floor((book.totalStock || 10) * 0.5) - (book.borrowedCount || 0))) > 0 ? '#047857' : '#B45309' }}>
                          <span>Còn cho mượn:</span>
                          <strong>
                            {book.remainingBorrowable !== undefined
                              ? book.remainingBorrowable
                              : Math.max(0, Math.floor((book.totalStock || 10) * 0.5) - (book.borrowedCount || 0))} cuốn
                          </strong>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem' }}>
                        <button
                          type="button"
                          onClick={() => setSelectedBook(book)}
                          style={{
                            padding: '0.6rem',
                            background: '#F1F5F9',
                            color: '#334155',
                            border: '1px solid #CBD5E1',
                            borderRadius: '10px',
                            fontWeight: 700,
                            fontSize: '0.825rem',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '0.3rem',
                          }}
                        >
                          <Eye size={15} />
                          <span>Chi tiết</span>
                        </button>

                        {(() => {
                          const activeBorrow = myBorrows.find((b) => b.book?.id === book.id) || (book.activeBorrowId ? { id: book.activeBorrowId, status: book.userBorrowStatus } : null);
                          const isBorrowed = activeBorrow && activeBorrow.status === 'BORROWED';
                          const isPending = activeBorrow && activeBorrow.status === 'PENDING';
                          const totalStock = book.totalStock || 10;
                          const maxBorrowable = book.maxBorrowable !== undefined ? book.maxBorrowable : Math.floor(totalStock * 0.5);
                          const borrowedCount = book.borrowedCount || 0;
                          const remainingBorrowable = book.remainingBorrowable !== undefined ? book.remainingBorrowable : Math.max(0, maxBorrowable - borrowedCount);
                          const availableStock = book.availableStock !== undefined ? book.availableStock : totalStock;

                          if (isBorrowed) {
                            return (
                              <button
                                type="button"
                                onClick={() => handleReturnBook(activeBorrow.id)}
                                disabled={loading}
                                style={{
                                  padding: '0.6rem',
                                  background: '#D97706',
                                  color: 'white',
                                  border: 'none',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  fontSize: '0.825rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(217, 119, 6, 0.25)',
                                }}
                              >
                                Trả Sách
                              </button>
                            );
                          }

                          if (isPending) {
                            return (
                              <button
                                type="button"
                                onClick={() => handleCancelBorrow(activeBorrow.id)}
                                disabled={loading}
                                title="Hủy yêu cầu mượn sách này"
                                style={{
                                  padding: '0.6rem',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FCA5A5',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  fontSize: '0.825rem',
                                  cursor: 'pointer',
                                  boxShadow: '0 2px 8px rgba(220, 38, 38, 0.15)',
                                }}
                              >
                                Hủy Yêu Cầu
                              </button>
                            );
                          }

                          if (maxBorrowable <= 0) {
                            return (
                              <button
                                type="button"
                                disabled
                                title={`Sách chỉ có ${totalStock} cuốn (50% làm tròn xuống là 0), không mở mượn ra ngoài`}
                                style={{
                                  padding: '0.6rem',
                                  background: '#F1F5F9',
                                  color: '#94A3B8',
                                  border: '1px solid #CBD5E1',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: 'not-allowed',
                                }}
                              >
                                Không Mượn
                              </button>
                            );
                          }

                          if (remainingBorrowable <= 0) {
                            return (
                              <button
                                type="button"
                                disabled
                                title={`Đã cho mượn tối đa 50% (${maxBorrowable}/${totalStock} cuốn)`}
                                style={{
                                  padding: '0.6rem',
                                  background: '#FEF2F2',
                                  color: '#DC2626',
                                  border: '1px solid #FECACA',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  fontSize: '0.75rem',
                                  cursor: 'not-allowed',
                                }}
                              >
                                Đạt Hạn Mức 50%
                              </button>
                            );
                          }

                          if (availableStock <= 0) {
                            return (
                              <button
                                type="button"
                                disabled
                                style={{
                                  padding: '0.6rem',
                                  background: '#FEF2F2',
                                  color: '#FCA5A5',
                                  border: '1px solid #FCA5A5',
                                  borderRadius: '10px',
                                  fontWeight: 700,
                                  fontSize: '0.825rem',
                                  cursor: 'not-allowed',
                                }}
                              >
                                Hết Sách
                              </button>
                            );
                          }

                          return (
                            <button
                              type="button"
                              onClick={() => handleOpenBorrowModal(book)}
                              disabled={loading}
                              style={{
                                padding: '0.6rem',
                                background: '#10B981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '10px',
                                fontWeight: 700,
                                fontSize: '0.825rem',
                                cursor: 'pointer',
                                boxShadow: '0 2px 8px rgba(16, 185, 129, 0.25)',
                              }}
                            >
                              Mượn Sách
                            </button>
                          );
                        })()}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PAGINATION NAVIGATION BAR */}
        {!loading && processedBooks.length > 0 && (
          <div
            style={{
              marginTop: '2.5rem',
              background: 'white',
              borderRadius: '20px',
              padding: '1.25rem 1.75rem',
              border: '1px solid #E2E8F0',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: '1rem',
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.03)',
            }}
          >
            {/* Information count */}
            <div style={{ fontSize: '0.9rem', color: '#64748B', fontWeight: 500 }}>
              Hiển thị <strong style={{ color: '#0F172A' }}>{totalElements > 0 ? page * pageSize + 1 : 0}</strong> -{' '}
              <strong style={{ color: '#0F172A' }}>{Math.min((page + 1) * pageSize, totalElements || books.length)}</strong>{' '}
              trong tổng số <strong style={{ color: '#10B981' }}>{totalElements || books.length}</strong> cuốn sách
              {totalPages > 0 && ` (Trang ${page + 1} / ${totalPages})`}
            </div>

            {/* Controls right */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Page Size Select */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: '#64748B' }}>
                <span>Hiển thị:</span>
                <select
                  value={pageSize}
                  onChange={(e) => handlePageSizeChange(e.target.value)}
                  style={{
                    padding: '0.35rem 0.65rem',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    background: '#F8FAFC',
                    fontWeight: 700,
                    fontSize: '0.85rem',
                    color: '#334155',
                    cursor: 'pointer',
                  }}
                >
                  <option value={2}>2 cuốn/trang</option>
                  <option value={4}>4 cuốn/trang</option>
                  <option value={8}>8 cuốn/trang</option>
                  <option value={12}>12 cuốn/trang</option>
                  <option value={24}>24 cuốn/trang</option>
                </select>
              </div>

              {/* Pagination Buttons */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                {/* First Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(0)}
                  disabled={page === 0}
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: page === 0 ? '#F1F5F9' : 'white',
                    color: page === 0 ? '#CBD5E1' : '#334155',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  title="Trang đầu"
                >
                  <ChevronsLeft size={16} />
                </button>

                {/* Previous Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page - 1)}
                  disabled={page === 0}
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: page === 0 ? '#F1F5F9' : 'white',
                    color: page === 0 ? '#CBD5E1' : '#334155',
                    cursor: page === 0 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  title="Trang trước"
                >
                  <ChevronLeft size={16} />
                </button>

                {/* Page Number Buttons */}
                {Array.from({ length: totalPages }, (_, idx) => idx)
                  .filter((pIdx) => Math.abs(pIdx - page) <= 2 || pIdx === 0 || pIdx === totalPages - 1)
                  .map((pIdx, idx, arr) => {
                    const prevIdx = arr[idx - 1];
                    const showEllipsis = prevIdx !== undefined && pIdx - prevIdx > 1;
                    return (
                      <React.Fragment key={pIdx}>
                        {showEllipsis && <span style={{ padding: '0 0.2rem', color: '#94A3B8' }}>...</span>}
                        <button
                          type="button"
                          onClick={() => handlePageChange(pIdx)}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '10px',
                            border: page === pIdx ? 'none' : '1px solid #E2E8F0',
                            background: page === pIdx ? '#10B981' : 'white',
                            color: page === pIdx ? 'white' : '#334155',
                            fontWeight: page === pIdx ? 800 : 600,
                            fontSize: '0.875rem',
                            cursor: 'pointer',
                            boxShadow: page === pIdx ? '0 4px 10px rgba(16, 185, 129, 0.3)' : 'none',
                            transition: 'all 0.2s ease',
                          }}
                        >
                          {pIdx + 1}
                        </button>
                      </React.Fragment>
                    );
                  })}

                {/* Next Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(page + 1)}
                  disabled={totalPages === 0 || page >= totalPages - 1}
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: totalPages === 0 || page >= totalPages - 1 ? '#F1F5F9' : 'white',
                    color: totalPages === 0 || page >= totalPages - 1 ? '#CBD5E1' : '#334155',
                    cursor: totalPages === 0 || page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  title="Trang tiếp"
                >
                  <ChevronRight size={16} />
                </button>

                {/* Last Page */}
                <button
                  type="button"
                  onClick={() => handlePageChange(totalPages - 1)}
                  disabled={totalPages === 0 || page >= totalPages - 1}
                  style={{
                    padding: '0.45rem 0.65rem',
                    borderRadius: '10px',
                    border: '1px solid #E2E8F0',
                    background: totalPages === 0 || page >= totalPages - 1 ? '#F1F5F9' : 'white',
                    color: totalPages === 0 || page >= totalPages - 1 ? '#CBD5E1' : '#334155',
                    cursor: totalPages === 0 || page >= totalPages - 1 ? '#CBD5E1' : '#334155',
                    display: 'flex',
                    alignItems: 'center',
                    transition: 'all 0.2s ease',
                  }}
                  title="Trang cuối"
                >
                  <ChevronsRight size={16} />
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* BOOK DETAIL MODAL */}
      {selectedBook && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '580px' }}>
            <div className="modal-header" style={{ background: '#ECFDF5' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#047857' }}>
                <BookOpen size={22} />
                <h3 className="modal-title" style={{ color: '#065F46' }}>
                  Thông Tin Cuốn Sách
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setSelectedBook(null)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <div style={{ display: 'flex', gap: '1.25rem', alignItems: 'flex-start' }}>
                {selectedBook.coverUrl ? (
                  <img
                    src={selectedBook.coverUrl}
                    alt={selectedBook.title}
                    style={{
                      width: '100px',
                      height: '135px',
                      objectFit: 'cover',
                      borderRadius: '10px',
                      border: '1px solid #E2E8F0',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '100px',
                      height: '135px',
                      borderRadius: '10px',
                      background: '#F1F5F9',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: '#94A3B8',
                      flexShrink: 0,
                    }}
                  >
                    <BookOpen size={36} />
                  </div>
                )}

                <div>
                  <h3 style={{ fontSize: '1.3rem', fontWeight: 800, color: '#0F172A', marginBottom: '0.4rem' }}>
                    {selectedBook.title}
                  </h3>
                  <div style={{ fontSize: '0.9rem', color: '#475569', marginBottom: '0.4rem' }}>
                    Tác giả: <strong>{selectedBook.author || 'Chưa rõ'}</strong>
                  </div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginBottom: '0.6rem' }}>
                    Thể loại: <span style={{ background: '#F1F5F9', padding: '0.2rem 0.5rem', borderRadius: '6px', fontWeight: 600, color: '#334155' }}>{selectedBook.categoryName || 'Sách'}</span>
                  </div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#059669' }}>
                    {!selectedBook.price || Number(selectedBook.price) === 0
                      ? 'Miễn phí'
                      : `${Number(selectedBook.price).toLocaleString('vi-VN')} VNĐ`}
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid #E2E8F0' }}>
                <h4 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  Mô tả nội dung:
                </h4>
                <p style={{ fontSize: '0.9rem', color: '#64748B', lineHeight: '1.6', whiteSpace: 'pre-line' }}>
                  {selectedBook.description || 'Chưa có thông tin mô tả chi tiết cho cuốn sách này.'}
                </p>
              </div>

              <div
                style={{
                  marginTop: '1rem',
                  padding: '0.85rem',
                  background: selectedBook.hasFullAccess ? '#ECFDF5' : '#FFFBEB',
                  border: selectedBook.hasFullAccess ? '1px solid #A7F3D0' : '1px solid #FDE68A',
                  borderRadius: '12px',
                  fontSize: '0.85rem',
                  color: selectedBook.hasFullAccess ? '#047857' : '#92400E',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                {selectedBook.hasFullAccess ? <CheckCircle2 size={18} /> : <Info size={18} />}
                <span>{selectedBook.notice || 'Đăng nhập để xem quyền tiếp cận toàn bộ tác phẩm.'}</span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setSelectedBook(null)}
              >
                Đóng
              </button>

              {(() => {
                const activeBorrow = myBorrows.find((b) => b.book?.id === selectedBook.id) || (selectedBook.activeBorrowId ? { id: selectedBook.activeBorrowId, status: selectedBook.userBorrowStatus } : null);
                const isBorrowed = activeBorrow && activeBorrow.status === 'BORROWED';
                const isPending = activeBorrow && activeBorrow.status === 'PENDING';
                const totalStock = selectedBook.totalStock || 10;
                const maxBorrowable = selectedBook.maxBorrowable !== undefined ? selectedBook.maxBorrowable : Math.floor(totalStock * 0.5);
                const borrowedCount = selectedBook.borrowedCount || 0;
                const remainingBorrowable = selectedBook.remainingBorrowable !== undefined ? selectedBook.remainingBorrowable : Math.max(0, maxBorrowable - borrowedCount);
                const availableStock = selectedBook.availableStock !== undefined ? selectedBook.availableStock : totalStock;

                if (isBorrowed) {
                  return (
                    <button
                      type="button"
                      className="modal-btn-save"
                      style={{ background: '#D97706', boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)' }}
                      onClick={() => handleReturnBook(activeBorrow.id)}
                      disabled={loading}
                    >
                      Trả Sách
                    </button>
                  );
                }

                if (isPending) {
                  return (
                    <button
                      type="button"
                      className="modal-btn-save"
                      style={{ background: '#DC2626', color: 'white', border: 'none', cursor: 'pointer', boxShadow: '0 4px 12px rgba(220, 38, 38, 0.25)' }}
                      onClick={() => handleCancelBorrow(activeBorrow.id)}
                      disabled={loading}
                    >
                      Hủy Yêu Cầu Mượn
                    </button>
                  );
                }

                if (maxBorrowable <= 0) {
                  return (
                    <button
                      type="button"
                      className="modal-btn-save"
                      disabled
                      style={{ background: '#F1F5F9', color: '#94A3B8', border: '1px solid #CBD5E1', cursor: 'not-allowed', boxShadow: 'none' }}
                    >
                      Không Cho Mượn
                    </button>
                  );
                }

                if (remainingBorrowable <= 0) {
                  return (
                    <button
                      type="button"
                      className="modal-btn-save"
                      disabled
                      style={{ background: '#FEF2F2', color: '#DC2626', border: '1px solid #FECACA', cursor: 'not-allowed', boxShadow: 'none' }}
                    >
                      Đạt Hạn Mức 50%
                    </button>
                  );
                }

                if (availableStock <= 0) {
                  return (
                    <button
                      type="button"
                      className="modal-btn-save"
                      disabled
                      style={{ background: '#FEF2F2', color: '#FCA5A5', border: '1px solid #FCA5A5', cursor: 'not-allowed', boxShadow: 'none' }}
                    >
                      Sách Đã Hết Kho
                    </button>
                  );
                }

                return (
                  <button
                    type="button"
                    className="modal-btn-save"
                    style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                    onClick={() => handleOpenBorrowModal(selectedBook)}
                    disabled={loading}
                  >
                    Mượn Cuốn Sách Này
                  </button>
                );
              })()}
            </div>
          </div>
        </div>
      )}

      {/* MODAL XÁC NHẬN MƯỢN SÁCH & CHỌN NGÀY HẸN TRẢ */}
      {borrowModalTarget && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '520px' }}>
            <div className="modal-header">
              <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#10B981' }}>
                <BookmarkCheck size={22} color="#10B981" />
                <span>Đăng Ký Mượn Sách</span>
              </h2>
              <button
                type="button"
                onClick={() => setBorrowModalTarget(null)}
                className="modal-close-btn"
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body">
              <AlertToast type="error" message={borrowModalError} />
              <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', background: '#F8FAFC', padding: '1rem', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
                {borrowModalTarget.coverUrl ? (
                  <img
                    src={borrowModalTarget.coverUrl}
                    alt={borrowModalTarget.title}
                    style={{ width: '48px', height: '64px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #CBD5E1' }}
                  />
                ) : (
                  <div style={{ width: '48px', height: '64px', borderRadius: '8px', background: '#EEF2FF', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#4F46E5' }}>
                    <BookOpen size={20} />
                  </div>
                )}
                <div>
                  <div style={{ fontWeight: 800, color: '#0F172A', fontSize: '1rem' }}>{borrowModalTarget.title}</div>
                  <div style={{ fontSize: '0.85rem', color: '#64748B', marginTop: '0.2rem' }}>
                    Tác giả: <strong>{borrowModalTarget.author || 'Chưa rõ'}</strong>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#059669', fontWeight: 700, marginTop: '0.2rem' }}>
                    Khả dụng: {borrowModalTarget.availableStock !== undefined ? borrowModalTarget.availableStock : 10} cuốn
                  </div>
                </div>
              </div>

              {/* 50% Rule Limit Details */}
              <div style={{ background: '#F8FAFC', padding: '0.75rem 1rem', borderRadius: '10px', border: '1px solid #E2E8F0', fontSize: '0.825rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                  <span style={{ color: '#64748B' }}>Tổng số sách kho:</span>
                  <strong style={{ color: '#0F172A' }}>{borrowModalTarget.totalStock || 10} cuốn</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#0284C7' }}>
                  <span>Hạn mức cho mượn tối đa (50% làm tròn xuống):</span>
                  <strong>{borrowModalTarget.maxBorrowable !== undefined ? borrowModalTarget.maxBorrowable : Math.floor((borrowModalTarget.totalStock || 10) * 0.5)} cuốn</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px', color: '#B45309' }}>
                  <span>Đang được mượn / chờ duyệt:</span>
                  <strong>{borrowModalTarget.borrowedCount || 0} cuốn</strong>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', color: '#059669' }}>
                  <span>Số lượng còn có thể cho mượn:</span>
                  <strong>
                    {borrowModalTarget.remainingBorrowable !== undefined
                      ? borrowModalTarget.remainingBorrowable
                      : Math.max(0, Math.floor((borrowModalTarget.totalStock || 10) * 0.5) - (borrowModalTarget.borrowedCount || 0))} cuốn
                  </strong>
                </div>
              </div>

              {/* Quantity input with stepper */}
              {(() => {
                const totalStock = borrowModalTarget.totalStock || 10;
                const maxBorrowable = borrowModalTarget.maxBorrowable !== undefined ? borrowModalTarget.maxBorrowable : Math.floor(totalStock * 0.5);
                const borrowedCount = borrowModalTarget.borrowedCount || 0;
                const remainingBorrowable = borrowModalTarget.remainingBorrowable !== undefined ? borrowModalTarget.remainingBorrowable : Math.max(0, maxBorrowable - borrowedCount);
                const availableStock = borrowModalTarget.availableStock !== undefined ? borrowModalTarget.availableStock : totalStock;
                const maxAllowed = Math.max(1, Math.min(remainingBorrowable, availableStock));

                return (
                  <div>
                    <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                      📚 Số Lượng Sách Muốn Mượn <span style={{ color: '#DC2626' }}>*</span>
                    </label>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => setBorrowQuantity((prev) => Math.max(1, prev - 1))}
                        disabled={borrowQuantity <= 1}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          background: borrowQuantity <= 1 ? '#F1F5F9' : '#FFFFFF',
                          color: borrowQuantity <= 1 ? '#94A3B8' : '#0F172A',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          cursor: borrowQuantity <= 1 ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        -
                      </button>
                      <input
                        type="number"
                        min={1}
                        max={maxAllowed}
                        value={borrowQuantity}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10);
                          if (isNaN(val)) {
                            setBorrowQuantity(1);
                          } else {
                            setBorrowQuantity(Math.max(1, Math.min(maxAllowed, val)));
                          }
                        }}
                        style={{
                          width: '90px',
                          height: '40px',
                          textAlign: 'center',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          fontSize: '1.05rem',
                          fontWeight: 800,
                          color: '#0F172A',
                          outline: 'none',
                          background: '#FFFFFF',
                        }}
                        required
                      />
                      <button
                        type="button"
                        onClick={() => setBorrowQuantity((prev) => Math.min(maxAllowed, prev + 1))}
                        disabled={borrowQuantity >= maxAllowed}
                        style={{
                          width: '40px',
                          height: '40px',
                          borderRadius: '10px',
                          border: '1px solid #CBD5E1',
                          background: borrowQuantity >= maxAllowed ? '#F1F5F9' : '#FFFFFF',
                          color: borrowQuantity >= maxAllowed ? '#94A3B8' : '#0F172A',
                          fontSize: '1.25rem',
                          fontWeight: 700,
                          cursor: borrowQuantity >= maxAllowed ? 'not-allowed' : 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          transition: 'all 0.15s ease',
                        }}
                      >
                        +
                      </button>
                      <span style={{ fontSize: '0.825rem', color: '#64748B', marginLeft: '0.25rem' }}>
                        (Tối đa: <strong style={{ color: '#059669' }}>{maxAllowed}</strong> cuốn)
                      </span>
                    </div>
                    <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '0.3rem' }}>
                      * Số lượng mượn tối đa dựa trên hạn mức 50% ({maxBorrowable} cuốn) và tồn kho thực tế ({availableStock} cuốn).
                    </div>
                  </div>
                );
              })()}

              {/* Due date input */}
              <div style={{ marginTop: '0.25rem' }}>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  📅 Ngày Hẹn Trả Sách <span style={{ color: '#DC2626' }}>*</span>
                </label>
                <input
                  type="date"
                  value={borrowDueDate}
                  min={new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                  onChange={(e) => setBorrowDueDate(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.9rem',
                    color: '#0F172A',
                    outline: 'none',
                    background: '#FFFFFF',
                  }}
                  required
                />
                <div style={{ fontSize: '0.775rem', color: '#64748B', marginTop: '0.3rem' }}>
                  * Vui lòng chọn ngày bạn dự kiến mang sách hoàn trả về thư viện (tối thiểu từ ngày mai).
                </div>
              </div>

              {/* Note input */}
              <div>
                <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: 700, color: '#334155', marginBottom: '0.4rem' }}>
                  📝 Ghi chú cho Thủ thư / Ban Quản Trị (Tùy chọn)
                </label>
                <textarea
                  placeholder="Ví dụ: Mượn phục vụ nghiên cứu đồ án, mượn đọc tại nhà..."
                  value={borrowNote}
                  onChange={(e) => setBorrowNote(e.target.value)}
                  rows={3}
                  style={{
                    width: '100%',
                    padding: '0.65rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid #CBD5E1',
                    fontSize: '0.875rem',
                    color: '#0F172A',
                    outline: 'none',
                    resize: 'vertical',
                  }}
                />
              </div>

              <div style={{ background: '#FFFBEB', padding: '0.85rem', borderRadius: '10px', border: '1px solid #FDE68A', fontSize: '0.825rem', color: '#92400E', display: 'flex', gap: '0.5rem', alignItems: 'flex-start' }}>
                <Clock size={18} style={{ flexShrink: 0, marginTop: '2px' }} />
                <span>
                  <strong>Quy trình mượn sách:</strong> Sau khi gửi yêu cầu, đơn mượn của bạn sẽ ở trạng thái <strong>CHỜ DUYỆT</strong>. Bạn sẽ nhận được sách sau khi Ban Quản Trị / Thủ Thư kiểm tra và phê duyệt.
                </span>
              </div>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setBorrowModalTarget(null)}
                disabled={submittingBorrow}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="modal-btn-save"
                style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)', display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
                onClick={handleConfirmBorrow}
                disabled={submittingBorrow}
              >
                {submittingBorrow ? <RefreshCw size={16} className="animate-spin" /> : <BookmarkCheck size={16} />}
                <span>Gửi Yêu Cầu Mượn Sách</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

