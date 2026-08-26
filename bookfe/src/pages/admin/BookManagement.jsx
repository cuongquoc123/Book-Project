import React, { useState, useEffect, useMemo } from 'react';
import {
  BookOpen,
  Plus,
  RefreshCw,
  Search,
  Edit2,
  Trash2,
  Lock,
  User,
  X,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from 'lucide-react';
import {
  getCurrentUser,
  getAllCategories,
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
  uploadImage,
  deleteUploadedImage,
} from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminHeader from './AdminHeader';
import AlertToast from '../../components/AlertToast';
import '../../styles/dashboard.css';

export default function BookManagement() {
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});

  // Data states
  const [categories, setCategories] = useState([]);
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Sorting states (BE API: page, size, sortBy, sortDir)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  // Filter & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategoryId, setFilterCategoryId] = useState('ALL');

  // Feedback Alert
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal States
  const [showBookModal, setShowBookModal] = useState(false);
  const [bookModalMode, setBookModalMode] = useState('create'); // 'create' | 'edit'
  const [bookFormData, setBookFormData] = useState({
    id: null,
    title: '',
    author: '',
    description: '',
    coverUrl: '',
    price: '',
    categoryId: '',
  });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, title: '' });

  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [uploadedCoverUrl, setUploadedCoverUrl] = useState('');

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'error', message: 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP, GIF)!' });
      return;
    }

    // If an image was previously uploaded during this session, clean it up on server
    if (uploadedCoverUrl) {
      await deleteUploadedImage(uploadedCoverUrl);
    }

    setUploadingCover(true);
    const [err, data] = await uploadImage(file);
    setUploadingCover(false);

    if (err) {
      setAlert({ type: 'error', message: `Lỗi upload ảnh bìa: ${err}` });
    } else if (data?.fileUrl) {
      setBookFormData((prev) => ({ ...prev, coverUrl: data.fileUrl }));
      setUploadedCoverUrl(data.fileUrl);
      setAlert({ type: 'success', message: 'Tải ảnh bìa sách lên thành công!' });
    }
  };

  const fetchData = async (p = page, s = pageSize, sb = sortBy, sd = sortDir) => {
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

    const [catErr, catRes] = await getAllCategories({ page: 0, size: 100 });
    if (catErr) {
      setAlert({ type: 'error', message: `Lỗi tải danh mục: ${catErr}` });
    } else if (catRes) {
      const catList = Array.isArray(catRes) ? catRes : (catRes.content || []);
      setCategories(catList);
    }

    const [bookErr, bookRes] = await getAllBooks({
      page: p,
      size: s,
      sortBy: sb,
      sortDir: sd,
    });

    if (bookErr) {
      setAlert({ type: 'error', message: `Lỗi tải sách: ${bookErr}` });
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
        setPage(bookRes.number !== undefined ? bookRes.number : p);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchData(0, pageSize, sortBy, sortDir);
  }, []);

  const handlePageChange = (newPage) => {
    if (newPage < 0 || (totalPages > 0 && newPage >= totalPages)) return;
    setPage(newPage);
    fetchData(newPage, pageSize, sortBy, sortDir);
  };

  const handlePageSizeChange = (newSize) => {
    const sizeNum = Number(newSize);
    setPageSize(sizeNum);
    setPage(0);
    fetchData(0, sizeNum, sortBy, sortDir);
  };

  const handleSortChange = (newSortBy) => {
    let newSortDir = sortDir;
    if (sortBy === newSortBy) {
      newSortDir = sortDir === 'asc' ? 'desc' : 'asc';
    } else {
      newSortDir = 'desc';
    }
    setSortBy(newSortBy);
    setSortDir(newSortDir);
    setPage(0);
    fetchData(0, pageSize, newSortBy, newSortDir);
  };

  const isSuperAdmin = currentUser.role === 'SUPER_ADMIN';

  // Helper: Check ownership & management permissions according to BE rules
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

  // Filtered Book List
  const filteredBooks = useMemo(() => {
    return books.filter((book) => {
      const matchSearch =
        book.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.author?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        book.createdByName?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchCat =
        filterCategoryId === 'ALL' || String(book.categoryId) === String(filterCategoryId);

      return matchSearch && matchCat;
    });
  }, [books, searchQuery, filterCategoryId]);

  const handleOpenBookModal = (mode, book = null) => {
    setUploadedCoverUrl('');
    setBookModalMode(mode);
    if (mode === 'edit' && book) {
      setBookFormData({
        id: book.id,
        title: book.title || '',
        author: book.author || '',
        description: book.description || '',
        coverUrl: book.coverUrl || '',
        price: book.price !== null && book.price !== undefined ? book.price : '',
        categoryId: book.categoryId || (categories[0]?.id ? String(categories[0].id) : ''),
      });
    } else {
      setBookFormData({
        id: null,
        title: '',
        author: '',
        description: '',
        coverUrl: '',
        price: '',
        categoryId: categories[0]?.id ? String(categories[0].id) : '',
      });
    }
    setShowBookModal(true);
  };

  const handleRemoveCover = async () => {
    if (bookFormData.coverUrl) {
      await deleteUploadedImage(bookFormData.coverUrl);
    }
    setBookFormData((prev) => ({ ...prev, coverUrl: '' }));
    setUploadedCoverUrl('');
  };

  const handleCloseBookModal = async () => {
    // Target image to delete if user uploaded an image during creation then cancelled/closed modal
    const imageToDelete = uploadedCoverUrl || (bookModalMode === 'create' ? bookFormData.coverUrl : '');

    if (bookModalMode === 'create' && imageToDelete && imageToDelete.includes('/uploads/')) {
      const [err] = await deleteUploadedImage(imageToDelete);
      if (!err) {
        setAlert({ type: 'success', message: 'Đã hủy tạo sách và tự động xóa tệp hình ảnh tạm khỏi máy chủ!' });
      }
    }

    setUploadedCoverUrl('');
    setBookFormData({
      id: null,
      title: '',
      author: '',
      description: '',
      coverUrl: '',
      price: '',
      categoryId: '',
    });
    setShowBookModal(false);
  };

  const handleSaveBook = async (e) => {
    e.preventDefault();
    if (!bookFormData.title.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập tên cuốn sách!' });
      // If validation fails when creating a book, clean up uploaded image from server
      if (bookModalMode === 'create' && uploadedCoverUrl) {
        await deleteUploadedImage(uploadedCoverUrl);
        setUploadedCoverUrl('');
        setBookFormData((prev) => ({ ...prev, coverUrl: '' }));
      }
      return;
    }
    if (!bookFormData.categoryId) {
      setAlert({ type: 'error', message: 'Vui lòng chọn loại sách!' });
      if (bookModalMode === 'create' && uploadedCoverUrl) {
        await deleteUploadedImage(uploadedCoverUrl);
        setUploadedCoverUrl('');
        setBookFormData((prev) => ({ ...prev, coverUrl: '' }));
      }
      return;
    }

    setSubmitting(true);
    const payload = {
      title: bookFormData.title.trim(),
      author: bookFormData.author.trim(),
      description: bookFormData.description.trim(),
      coverUrl: bookFormData.coverUrl.trim(),
      price: bookFormData.price !== '' ? Number(bookFormData.price) : 0,
      categoryId: Number(bookFormData.categoryId),
    };

    let err, data;
    if (bookModalMode === 'create') {
      [err, data] = await createBook(payload);
    } else {
      [err, data] = await updateBook(bookFormData.id, payload);
    }

    setSubmitting(false);

    if (err) {
      setAlert({ type: 'error', message: err });
      // IF BOOK CREATION FAILS AND AN IMAGE WAS UPLOADED, DELETE IT FROM SERVER!
      if (bookModalMode === 'create' && uploadedCoverUrl) {
        await deleteUploadedImage(uploadedCoverUrl);
        setUploadedCoverUrl('');
        setBookFormData((prev) => ({ ...prev, coverUrl: '' }));
      }
    } else {
      setAlert({
        type: 'success',
        message:
          bookModalMode === 'create'
            ? 'Thêm mới cuốn sách thành công!'
            : 'Cập nhật cuốn sách thành công!',
      });
      setUploadedCoverUrl('');
      setShowBookModal(false);
      fetchData();
    }
  };

  const handleOpenDeleteModal = (book) => {
    setDeleteTarget({
      id: book.id,
      title: book.title,
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget.id) return;
    setSubmitting(true);

    const [err] = await deleteBook(deleteTarget.id);
    setSubmitting(false);

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({
        type: 'success',
        message: 'Xóa sách thành công!',
      });
      setShowDeleteModal(false);
      fetchData();
    }
  };

  return (
    <div className="dash-container">
      <AdminHeader currentUser={currentUser} />

      <main className="dash-main">
        <AlertToast type={alert.type} message={alert.message} />

        {/* Page Title & Main Actions */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">
              <BookOpen size={30} color="#4F46E5" />
              <span>Quản Lý Danh Mục Sách</span>
            </h1>
            <p className="dash-page-subtitle">
              Quản lý toàn bộ danh sách cuốn sách ({totalElements || books.length} cuốn). Thêm mới, chỉnh sửa thông tin hoặc xóa sách.
            </p>
          </div>

          <div className="dash-action-group">
            <button
              type="button"
              className="btn-secondary-refresh"
              onClick={() => fetchData(page, pageSize, sortBy, sortDir)}
              disabled={loading}
              title="Tải lại danh sách sách từ Backend"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              className="btn-primary-add"
              onClick={() => handleOpenBookModal('create')}
            >
              <Plus size={18} />
              <span>Thêm Sách Mới</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Pagination Controls Bar */}
        <div className="dash-controls-card" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="dash-search-box" style={{ flex: '1 1 300px' }}>
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Tìm kiếm sách theo tiêu đề, tác giả, người tạo..."
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

          {/* Category Filter */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Lọc thể loại:</span>
            <select
              className="dash-filter-select"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="ALL">Tất cả thể loại ({categories.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Sort By Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={14} color="#4F46E5" /> Sắp xếp:
            </span>
            <select
              className="dash-filter-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="id">Theo ID</option>
              <option value="title">Theo Tên Sách</option>
              <option value="price">Theo Giá Bán</option>
              <option value="author">Theo Tác Giả</option>
            </select>

            <button
              type="button"
              onClick={() => {
                const nextDir = sortDir === 'asc' ? 'desc' : 'asc';
                setSortDir(nextDir);
                fetchData(0, pageSize, sortBy, nextDir);
              }}
              style={{
                padding: '0.45rem 0.75rem',
                borderRadius: '8px',
                border: '1px solid #CBD5E1',
                background: '#F8FAFC',
                color: '#334155',
                fontSize: '0.8rem',
                fontWeight: 700,
                cursor: 'pointer',
              }}
              title="Đổi chiều sắp xếp (Tăng dần / Giảm dần)"
            >
              {sortDir === 'asc' ? '⬆️ Tăng' : '⬇️ Giảm'}
            </button>
          </div>

          {/* Page Size Selector */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Hiển thị:</span>
            <select
              className="dash-filter-select"
              value={pageSize}
              onChange={(e) => handlePageSizeChange(e.target.value)}
            >
              <option value={5}>5 cuốn / trang</option>
              <option value={10}>10 cuốn / trang</option>
              <option value={20}>20 cuốn / trang</option>
              <option value={50}>50 cuốn / trang</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE VIEW */}
        <div className="dash-table-wrapper">
          {loading ? (
            <div className="dash-empty-state">
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
              <p>Đang tải danh sách sách từ Backend...</p>
            </div>
          ) : filteredBooks.length === 0 ? (
            <div className="dash-empty-state">
              <div className="dash-empty-icon">
                <BookOpen size={28} />
              </div>
              <h3>Không tìm thấy cuốn sách nào</h3>
              <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                Thử thay đổi từ khóa tìm kiếm hoặc bấm nút "Thêm Sách Mới".
              </p>
            </div>
          ) : (
            <>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Bìa Sách</th>
                    <th>Tên Sách</th>
                    <th>Tác Giả</th>
                    <th>Thể Loại</th>
                    <th>Giá Bán</th>
                    <th>Người Tạo (Created By)</th>
                    <th>Quyền Hạn Thao Tác</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBooks.map((book) => {
                    const manageable = canManage(book);
                    return (
                      <tr key={book.id}>
                        <td style={{ fontWeight: 700, color: '#64748B' }}>#{book.id}</td>
                        <td>
                          {book.coverUrl ? (
                            <img
                              src={book.coverUrl}
                              alt={book.title}
                              style={{
                                width: '42px',
                                height: '56px',
                                objectFit: 'cover',
                                borderRadius: '6px',
                                border: '1px solid #E2E8F0',
                                boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
                              }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.style.display = 'none';
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: '42px',
                                height: '56px',
                                borderRadius: '6px',
                                background: '#F1F5F9',
                                border: '1px dashed #CBD5E1',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#94A3B8',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                              }}
                            >
                              No Cover
                            </div>
                          )}
                        </td>
                        <td>
                          <div style={{ fontWeight: 700, color: '#0F172A' }}>{book.title}</div>
                          {book.description && (
                            <div
                              style={{
                                fontSize: '0.8rem',
                                color: '#64748B',
                                maxWidth: '300px',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                              }}
                            >
                              {book.description}
                            </div>
                          )}
                        </td>
                        <td>{book.author || 'Chưa rõ'}</td>
                        <td>
                          <span
                            style={{
                              background: '#F1F5F9',
                              color: '#334155',
                              padding: '0.2rem 0.6rem',
                              borderRadius: '6px',
                              fontSize: '0.8rem',
                              fontWeight: 600,
                            }}
                          >
                            {book.categoryName || 'Không phân loại'}
                          </span>
                        </td>
                        <td>
                          <span className="price-pill">
                            {book.price !== null && book.price !== undefined
                              ? `${Number(book.price).toLocaleString('vi-VN')} đ`
                              : 'Miễn phí'}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`owner-pill ${book.createdByName === currentUser.username ? 'self' : 'other'
                              }`}
                          >
                            <User size={12} />
                            {book.createdByName || 'Hệ thống'}
                          </span>
                        </td>
                        <td>
                          {manageable ? (
                            <span
                              style={{
                                color: '#059669',
                                fontSize: '0.8rem',
                                fontWeight: 700,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                            >
                              <CheckCircle2 size={14} /> Có quyền Sửa/Xóa
                            </span>
                          ) : (
                            <span
                              style={{
                                color: '#94A3B8',
                                fontSize: '0.8rem',
                                fontWeight: 600,
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: '4px',
                              }}
                              title="Chỉ người tạo hoặc Super Admin mới có quyền chỉnh sửa/xóa"
                            >
                              <Lock size={14} /> Chỉ xem (Khóa)
                            </span>
                          )}
                        </td>
                        <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                          <button
                            type="button"
                            className="btn-action-icon edit"
                            disabled={!manageable}
                            onClick={() => handleOpenBookModal('edit', book)}
                            title={
                              manageable
                                ? 'Chỉnh sửa cuốn sách'
                                : 'Bạn không có quyền chỉnh sửa sách do người khác tạo'
                            }
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            disabled={!manageable}
                            onClick={() => handleOpenDeleteModal(book)}
                            title={
                              manageable
                                ? 'Xóa cuốn sách'
                                : 'Bạn không có quyền xóa sách do người khác tạo'
                            }
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* PAGINATION FOOTER BAR */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  padding: '1rem 1.25rem',
                  borderTop: '1px solid #E2E8F0',
                  background: '#F8FAFC',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div style={{ fontSize: '0.875rem', color: '#64748B', fontWeight: 500 }}>
                  Hiển thị <strong style={{ color: '#0F172A' }}>{totalElements > 0 ? page * pageSize + 1 : 0}</strong> -{' '}
                  <strong style={{ color: '#0F172A' }}>{Math.min((page + 1) * pageSize, totalElements)}</strong> trên tổng số{' '}
                  <strong style={{ color: '#4F46E5' }}>{totalElements}</strong> cuốn sách
                  {totalPages > 0 && ` (Trang ${page + 1} / ${totalPages})`}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                  <button
                    type="button"
                    onClick={() => handlePageChange(0)}
                    disabled={page === 0}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: page === 0 ? '#F1F5F9' : 'white',
                      color: page === 0 ? '#94A3B8' : '#334155',
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Trang đầu"
                  >
                    <ChevronsLeft size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(page - 1)}
                    disabled={page === 0}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: page === 0 ? '#F1F5F9' : 'white',
                      color: page === 0 ? '#94A3B8' : '#334155',
                      cursor: page === 0 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Trang trước"
                  >
                    <ChevronLeft size={16} />
                  </button>

                  {/* Render page numbers */}
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
                              padding: '0.4rem 0.75rem',
                              borderRadius: '8px',
                              border: page === pIdx ? 'none' : '1px solid #CBD5E1',
                              background: page === pIdx ? '#4F46E5' : 'white',
                              color: page === pIdx ? 'white' : '#334155',
                              fontWeight: page === pIdx ? 800 : 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              boxShadow: page === pIdx ? '0 2px 6px rgba(79, 70, 229, 0.3)' : 'none',
                            }}
                          >
                            {pIdx + 1}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  <button
                    type="button"
                    onClick={() => handlePageChange(page + 1)}
                    disabled={totalPages === 0 || page >= totalPages - 1}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: totalPages === 0 || page >= totalPages - 1 ? '#F1F5F9' : 'white',
                      color: totalPages === 0 || page >= totalPages - 1 ? '#94A3B8' : '#334155',
                      cursor: totalPages === 0 || page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Trang tiếp"
                  >
                    <ChevronRight size={16} />
                  </button>

                  <button
                    type="button"
                    onClick={() => handlePageChange(totalPages - 1)}
                    disabled={totalPages === 0 || page >= totalPages - 1}
                    style={{
                      padding: '0.4rem 0.6rem',
                      borderRadius: '8px',
                      border: '1px solid #CBD5E1',
                      background: totalPages === 0 || page >= totalPages - 1 ? '#F1F5F9' : 'white',
                      color: totalPages === 0 || page >= totalPages - 1 ? '#94A3B8' : '#334155',
                      cursor: totalPages === 0 || page >= totalPages - 1 ? 'not-allowed' : 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                    }}
                    title="Trang cuối"
                  >
                    <ChevronsRight size={16} />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </main>

      {/* MODAL: Book Add / Edit */}
      {showBookModal && (
        <div className="modal-overlay" onClick={handleCloseBookModal}>
          <div className="modal-card" style={{ maxWidth: '620px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">
                {bookModalMode === 'create' ? 'Thêm Cuốn Sách Mới' : 'Cập Nhật Thông Tin Sách'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={handleCloseBookModal}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBook}>
              <div className="modal-body">
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginBottom: '0.4rem',
                      color: '#334155',
                    }}
                  >
                    Tên cuốn sách <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Nhập tên cuốn sách..."
                    value={bookFormData.title}
                    onChange={(e) => setBookFormData({ ...bookFormData, title: e.target.value })}
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

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        marginBottom: '0.4rem',
                        color: '#334155',
                      }}
                    >
                      Tác giả
                    </label>
                    <input
                      type="text"
                      placeholder="Nhập tên tác giả..."
                      value={bookFormData.author}
                      onChange={(e) =>
                        setBookFormData({ ...bookFormData, author: e.target.value })
                      }
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
                    <label
                      style={{
                        display: 'block',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        marginBottom: '0.4rem',
                        color: '#334155',
                      }}
                    >
                      Giá bán (VND)
                    </label>
                    <input
                      type="number"
                      min="0"
                      step="1000"
                      placeholder="0"
                      value={bookFormData.price}
                      onChange={(e) =>
                        setBookFormData({ ...bookFormData, price: e.target.value })
                      }
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
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginBottom: '0.4rem',
                      color: '#334155',
                    }}
                  >
                    Ảnh Bìa Sách (Tải Tệp Hình Ảnh)
                  </label>

                  <div
                    style={{
                      border: '2px dashed #CBD5E1',
                      borderRadius: '12px',
                      padding: '1.25rem 1rem',
                      textAlign: 'center',
                      background: '#F8FAFC',
                      cursor: 'pointer',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleCoverFileChange}
                      style={{
                        position: 'absolute',
                        inset: 0,
                        opacity: 0,
                        cursor: 'pointer',
                        width: '100%',
                        height: '100%',
                        zIndex: 2,
                      }}
                    />

                    {uploadingCover ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', color: '#4F46E5' }}>
                        <RefreshCw size={22} className="animate-spin" />
                        <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>Đang tải tệp ảnh lên server...</span>
                      </div>
                    ) : bookFormData.coverUrl ? (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '1.25rem', zIndex: 3, position: 'relative' }}>
                        <img
                          src={bookFormData.coverUrl}
                          alt="Cover preview"
                          style={{
                            width: '54px',
                            height: '72px',
                            objectFit: 'cover',
                            borderRadius: '8px',
                            border: '1px solid #CBD5E1',
                            boxShadow: '0 4px 8px rgba(0,0,0,0.1)',
                          }}
                        />
                        <div style={{ textAlign: 'left' }}>
                          <div style={{ fontSize: '0.875rem', fontWeight: 700, color: '#059669', display: 'flex', alignItems: 'center', gap: '4px' }}>
                            <CheckCircle2 size={16} /> Ảnh bìa đã được tải lên
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRemoveCover();
                            }}
                            style={{
                              marginTop: '0.3rem',
                              fontSize: '0.775rem',
                              color: '#DC2626',
                              background: '#FEF2F2',
                              border: '1px solid #FCA5A5',
                              borderRadius: '6px',
                              cursor: 'pointer',
                              padding: '0.2rem 0.5rem',
                              fontWeight: 600,
                            }}
                          >
                            Xóa ảnh bìa
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div style={{ color: '#64748B' }}>
                        <UploadCloud size={32} style={{ margin: '0 auto 0.4rem auto', color: '#4F46E5' }} />
                        <div style={{ fontSize: '0.9rem', fontWeight: 700, color: '#0F172A' }}>
                          Bấm vào đây để chọn tệp hình ảnh bìa sách
                        </div>
                        <div style={{ fontSize: '0.775rem', color: '#94A3B8', marginTop: '0.2rem' }}>
                          Hỗ trợ định dạng JPG, PNG, WEBP, GIF (Tự động lưu vào server Backend)
                        </div>
                      </div>
                    )}
                  </div>

                  <input
                    type="text"
                    placeholder="Hoặc nhập dán đường dẫn URL ảnh trực tiếp (nếu có)..."
                    value={bookFormData.coverUrl}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, coverUrl: e.target.value })
                    }
                    style={{
                      width: '100%',
                      marginTop: '0.5rem',
                      padding: '0.45rem 0.75rem',
                      border: '1px solid #E2E8F0',
                      borderRadius: '8px',
                      outline: 'none',
                      fontSize: '0.8rem',
                      color: '#475569',
                    }}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginBottom: '0.4rem',
                      color: '#334155',
                    }}
                  >
                    Loại sách <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <select
                    required
                    value={bookFormData.categoryId}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, categoryId: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.9rem',
                      background: 'white',
                    }}
                  >
                    <option value="" disabled>
                      -- Chọn Loại Sách --
                    </option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      marginBottom: '0.4rem',
                      color: '#334155',
                    }}
                  >
                    Mô tả sách
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Mô tả nội dung, tóm tắt sách..."
                    value={bookFormData.description}
                    onChange={(e) =>
                      setBookFormData({ ...bookFormData, description: e.target.value })
                    }
                    style={{
                      width: '100%',
                      padding: '0.65rem 0.85rem',
                      border: '1px solid #CBD5E1',
                      borderRadius: '10px',
                      outline: 'none',
                      fontSize: '0.9rem',
                      resize: 'vertical',
                    }}
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="modal-btn-cancel"
                  onClick={handleCloseBookModal}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="modal-btn-save" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : bookModalMode === 'create' ? 'Tạo Cuốn Sách' : 'Cập Nhật Sách'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Delete Confirm */}
      {showDeleteModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '460px' }}>
            <div className="modal-header" style={{ background: '#FEF2F2' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', color: '#DC2626' }}>
                <AlertCircle size={22} />
                <h3 className="modal-title" style={{ color: '#991B1B' }}>
                  Xác Nhận Xóa Sách
                </h3>
              </div>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowDeleteModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="modal-body" style={{ textAlign: 'center', padding: '2rem 1.5rem' }}>
              <p style={{ fontSize: '0.95rem', color: '#334155', lineHeight: '1.6' }}>
                Bạn có chắc chắn muốn xóa cuốn sách:
              </p>
              <h4 style={{ fontSize: '1.1rem', color: '#0F172A', marginTop: '0.5rem', fontWeight: 800 }}>
                "{deleteTarget.title}"
              </h4>
              <p style={{ fontSize: '0.825rem', color: '#EF4444', marginTop: '0.75rem' }}>
                ⚠️ Thao tác này không thể hoàn tác sau khi thực hiện.
              </p>
            </div>

            <div className="modal-footer">
              <button
                type="button"
                className="modal-btn-cancel"
                onClick={() => setShowDeleteModal(false)}
              >
                Hủy bỏ
              </button>
              <button
                type="button"
                className="modal-btn-danger"
                onClick={handleConfirmDelete}
                disabled={submitting}
              >
                {submitting ? 'Đang xóa...' : 'Đồng Ý Xóa'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
