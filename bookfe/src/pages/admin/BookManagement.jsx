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
} from 'lucide-react';
import {
  getCurrentUser,
  getAllCategories,
  getAllBooks,
  createBook,
  updateBook,
  deleteBook,
  uploadImage,
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

  const handleCoverFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setAlert({ type: 'error', message: 'Vui lòng chọn tệp hình ảnh (JPG, PNG, WEBP, GIF)!' });
      return;
    }

    setUploadingCover(true);
    const [err, data] = await uploadImage(file);
    setUploadingCover(false);

    if (err) {
      setAlert({ type: 'error', message: `Lỗi upload ảnh bìa: ${err}` });
    } else if (data?.fileUrl) {
      setBookFormData((prev) => ({ ...prev, coverUrl: data.fileUrl }));
      setAlert({ type: 'success', message: 'Tải ảnh bìa sách lên thành công!' });
    }
  };

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

  const handleSaveBook = async (e) => {
    e.preventDefault();
    if (!bookFormData.title.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập tên cuốn sách!' });
      return;
    }
    if (!bookFormData.categoryId) {
      setAlert({ type: 'error', message: 'Vui lòng chọn loại sách!' });
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
    } else {
      setAlert({
        type: 'success',
        message:
          bookModalMode === 'create'
            ? 'Thêm mới cuốn sách thành công!'
            : 'Cập nhật cuốn sách thành công!',
      });
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
              Quản lý toàn bộ danh sách cuốn sách ({books.length} cuốn). Thêm mới, chỉnh sửa thông tin hoặc xóa sách.
            </p>
          </div>

          <div className="dash-action-group">
            <button
              type="button"
              className="btn-secondary-refresh"
              onClick={fetchData}
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

        {/* Filter & Search Bar */}
        <div className="dash-controls-card">
          <div className="dash-search-box">
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

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600 }}>Lọc thể loại:</span>
            <select
              className="dash-filter-select"
              value={filterCategoryId}
              onChange={(e) => setFilterCategoryId(e.target.value)}
            >
              <option value="ALL">Tất cả thể loại ({books.length})</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
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
                          className={`owner-pill ${
                            book.createdByName === currentUser.username ? 'self' : 'other'
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
          )}
        </div>
      </main>

      {/* MODAL: Book Add / Edit */}
      {showBookModal && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: '620px' }}>
            <div className="modal-header">
              <h3 className="modal-title">
                {bookModalMode === 'create' ? 'Thêm Cuốn Sách Mới' : 'Cập Nhật Thông Tin Sách'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowBookModal(false)}
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
                              setBookFormData({ ...bookFormData, coverUrl: '' });
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
                  onClick={() => setShowBookModal(false)}
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
