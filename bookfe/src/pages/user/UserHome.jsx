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
} from 'lucide-react';
import { logoutUser, getCurrentUser, getAllBooks, getAllCategories } from '../../services/api';
import { clearAuth, getRefreshToken, getUser } from '../../utils/auth';
import AlertToast from '../../components/AlertToast';
import '../../styles/auth.css';

export default function UserHome() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});

  // API Data
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Client-side Static Search, Category Filter & Sorting State
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [sortBy, setSortBy] = useState('NEWEST'); // 'NEWEST' | 'PRICE_ASC' | 'PRICE_DESC' | 'NAME_ASC' | 'NAME_DESC'

  // Selected Book for Detail Modal
  const [selectedBook, setSelectedBook] = useState(null);

  const fetchData = async () => {
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
    const [catErr, catRes] = await getAllCategories();
    if (!catErr && Array.isArray(catRes)) {
      setCategories(catRes);
    }

    // Fetch Books
    const [bookErr, bookRes] = await getAllBooks();
    if (bookErr) {
      setAlert({ type: 'error', message: `Không thể tải danh sách sách từ server: ${bookErr}` });
    } else if (Array.isArray(bookRes)) {
      setBooks(bookRes);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

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

                    {/* Notice & Access Badge */}
                    <div style={{ borderTop: '1px solid #F1F5F9', paddingTop: '0.85rem', marginTop: '0.5rem' }}>
                      <div
                        style={{
                          fontSize: '0.775rem',
                          padding: '0.4rem 0.65rem',
                          borderRadius: '8px',
                          marginBottom: '0.85rem',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '0.4rem',
                          background: book.hasFullAccess ? '#ECFDF5' : '#F8FAFC',
                          color: book.hasFullAccess ? '#047857' : '#64748B',
                          border: book.hasFullAccess ? '1px solid #A7F3D0' : '1px solid #E2E8F0',
                        }}
                      >
                        {book.hasFullAccess ? <CheckCircle2 size={14} /> : <Info size={14} />}
                        <span style={{ fontWeight: 600 }}>{book.notice || 'Đăng nhập để đọc cuốn sách này'}</span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedBook(book)}
                        style={{
                          width: '100%',
                          padding: '0.65rem',
                          background: '#10B981',
                          color: 'white',
                          border: 'none',
                          borderRadius: '10px',
                          fontWeight: 700,
                          fontSize: '0.875rem',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.4rem',
                          boxShadow: '0 4px 12px rgba(16, 185, 129, 0.2)',
                          transition: 'all 0.2s ease',
                        }}
                      >
                        <Eye size={16} />
                        <span>Xem Chi Tiết & Đọc Sách</span>
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
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
              <button
                type="button"
                className="modal-btn-save"
                style={{ background: '#10B981', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
                onClick={() => {
                  alert(`Đang mở giao diện đọc trực tuyến cuốn sách: "${selectedBook.title}"`);
                  setSelectedBook(null);
                }}
              >
                Bắt Đầu Đọc Sách
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
