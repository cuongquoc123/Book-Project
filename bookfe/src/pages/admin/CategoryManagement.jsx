import React, { useState, useEffect, useMemo } from 'react';
import {
  FolderTree,
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
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  ArrowUpDown,
} from 'lucide-react';
import {
  getCurrentUser,
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory,
} from '../../services/api';
import { getUser } from '../../utils/auth';
import AdminHeader from './AdminHeader';
import AlertToast from '../../components/AlertToast';
import '../../styles/dashboard.css';

export default function CategoryManagement() {
  const [currentUser, setCurrentUser] = useState(() => getUser() || {});

  // Data states
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  // Pagination & Sorting states (BE API: page, size, sortBy, sortDir)
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(5);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);
  const [sortBy, setSortBy] = useState('id');
  const [sortDir, setSortDir] = useState('desc');

  // Search
  const [searchQuery, setSearchQuery] = useState('');

  // Feedback Alert
  const [alert, setAlert] = useState({ type: '', message: '' });

  // Modal States
  const [showCatModal, setShowCatModal] = useState(false);
  const [catModalMode, setCatModalMode] = useState('create'); // 'create' | 'edit'
  const [catFormData, setCatFormData] = useState({ id: null, name: '', description: '' });

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState({ id: null, name: '' });

  const [submitting, setSubmitting] = useState(false);

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

    const [catErr, catRes] = await getAllCategories({
      page: p,
      size: s,
      sortBy: sb,
      sortDir: sd,
    });

    if (catErr) {
      setAlert({ type: 'error', message: `Lỗi tải danh mục: ${catErr}` });
    } else if (catRes) {
      if (Array.isArray(catRes)) {
        setCategories(catRes);
        setTotalPages(1);
        setTotalElements(catRes.length);
        setPage(0);
      } else {
        setCategories(catRes.content || []);
        setTotalPages(catRes.totalPages || 0);
        setTotalElements(catRes.totalElements || 0);
        setPage(catRes.number !== undefined ? catRes.number : p);
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

  // Filtered Category List
  const filteredCategories = useMemo(() => {
    return categories.filter((cat) => {
      const matchSearch =
        cat.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        cat.createdByName?.toLowerCase().includes(searchQuery.toLowerCase());
      return matchSearch;
    });
  }, [categories, searchQuery]);

  const handleOpenCatModal = (mode, category = null) => {
    setCatModalMode(mode);
    if (mode === 'edit' && category) {
      setCatFormData({
        id: category.id,
        name: category.name || '',
        description: category.description || '',
      });
    } else {
      setCatFormData({ id: null, name: '', description: '' });
    }
    setShowCatModal(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catFormData.name.trim()) {
      setAlert({ type: 'error', message: 'Vui lòng nhập tên loại sách!' });
      return;
    }

    setSubmitting(true);
    let err, data;

    if (catModalMode === 'create') {
      [err, data] = await createCategory({
        name: catFormData.name.trim(),
        description: catFormData.description.trim(),
      });
    } else {
      [err, data] = await updateCategory(catFormData.id, {
        name: catFormData.name.trim(),
        description: catFormData.description.trim(),
      });
    }

    setSubmitting(false);

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({
        type: 'success',
        message:
          catModalMode === 'create'
            ? 'Thêm mới loại sách thành công!'
            : 'Cập nhật loại sách thành công!',
      });
      setShowCatModal(false);
      fetchData();
    }
  };

  const handleOpenDeleteModal = (category) => {
    setDeleteTarget({
      id: category.id,
      name: category.name,
    });
    setShowDeleteModal(true);
  };

  const handleConfirmDelete = async () => {
    if (!deleteTarget.id) return;
    setSubmitting(true);

    const [err] = await deleteCategory(deleteTarget.id);
    setSubmitting(false);

    if (err) {
      setAlert({ type: 'error', message: err });
    } else {
      setAlert({
        type: 'success',
        message: 'Xóa loại sách thành công!',
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

        {/* Page Header */}
        <div className="dash-page-header">
          <div>
            <h1 className="dash-page-title">
              <FolderTree size={30} color="#10B981" />
              <span>Quản Lý Loại Sách</span>
            </h1>
            <p className="dash-page-subtitle">
              Quản lý các thể loại / danh mục sách ({totalElements || categories.length} thể loại). Thêm thể loại mới, cập nhật mô tả hoặc xóa.
            </p>
          </div>

          <div className="dash-action-group">
            <button
              type="button"
              className="btn-secondary-refresh"
              onClick={() => fetchData(page, pageSize, sortBy, sortDir)}
              disabled={loading}
              title="Tải lại thể loại từ Backend"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              <span>Làm mới</span>
            </button>

            <button
              type="button"
              className="btn-primary-add"
              style={{ background: 'linear-gradient(135deg, #10B981 0%, #059669 100%)', boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)' }}
              onClick={() => handleOpenCatModal('create')}
            >
              <Plus size={18} />
              <span>Thêm Loại Sách Mới</span>
            </button>
          </div>
        </div>

        {/* Filter, Search & Pagination Controls Bar */}
        <div className="dash-controls-card" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <div className="dash-search-box" style={{ flex: '1 1 300px' }}>
            <Search size={18} color="#94A3B8" />
            <input
              type="text"
              placeholder="Tìm kiếm loại sách theo tên, mô tả, người tạo..."
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

          {/* Sort By Controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ fontSize: '0.85rem', color: '#64748B', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
              <ArrowUpDown size={14} color="#10B981" /> Sắp xếp:
            </span>
            <select
              className="dash-filter-select"
              value={sortBy}
              onChange={(e) => handleSortChange(e.target.value)}
            >
              <option value="id">Theo ID</option>
              <option value="name">Theo Tên Thể Loaị</option>
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
              <option value={5}>5 loại / trang</option>
              <option value={10}>10 loại / trang</option>
              <option value={20}>20 loại / trang</option>
              <option value={50}>50 loại / trang</option>
            </select>
          </div>
        </div>

        {/* DATA TABLE VIEW */}
        <div className="dash-table-wrapper">
          {loading ? (
            <div className="dash-empty-state">
              <RefreshCw size={32} className="animate-spin" style={{ margin: '0 auto 1rem auto' }} />
              <p>Đang tải danh sách loại sách từ Backend...</p>
            </div>
          ) : filteredCategories.length === 0 ? (
            <div className="dash-empty-state">
              <div className="dash-empty-icon">
                <FolderTree size={28} />
              </div>
              <h3>Không tìm thấy loại sách nào</h3>
              <p style={{ marginTop: '0.4rem', fontSize: '0.9rem' }}>
                Thử thay đổi từ khóa hoặc bấm nút "Thêm Loại Sách Mới".
              </p>
            </div>
          ) : (
            <>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Tên Loại Sách</th>
                    <th>Mô Tả</th>
                    <th>Người Tạo (Created By)</th>
                    <th>Quyền Hạn Thao Tác</th>
                    <th style={{ textAlign: 'right' }}>Thao Tác</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCategories.map((cat) => {
                    const manageable = canManage(cat);
                    return (
                      <tr key={cat.id}>
                        <td style={{ fontWeight: 700, color: '#64748B' }}>#{cat.id}</td>
                        <td style={{ fontWeight: 700, color: '#0F172A' }}>{cat.name}</td>
                        <td style={{ color: '#64748B', maxWidth: '360px' }}>
                          {cat.description || 'Chưa có mô tả'}
                        </td>
                        <td>
                          <span
                            className={`owner-pill ${
                              cat.createdByName === currentUser.username ? 'self' : 'other'
                            }`}
                          >
                            <User size={12} />
                            {cat.createdByName || 'Hệ thống'}
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
                            onClick={() => handleOpenCatModal('edit', cat)}
                            title={
                              manageable
                                ? 'Chỉnh sửa loại sách'
                                : 'Bạn không có quyền chỉnh sửa loại sách do người khác tạo'
                            }
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            type="button"
                            className="btn-action-icon delete"
                            disabled={!manageable}
                            onClick={() => handleOpenDeleteModal(cat)}
                            title={
                              manageable
                                ? 'Xóa loại sách'
                                : 'Bạn không có quyền xóa loại sách do người khác tạo'
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
                  <strong style={{ color: '#10B981' }}>{totalElements}</strong> loại sách
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
                              background: page === pIdx ? '#10B981' : 'white',
                              color: page === pIdx ? 'white' : '#334155',
                              fontWeight: page === pIdx ? 800 : 600,
                              fontSize: '0.85rem',
                              cursor: 'pointer',
                              boxShadow: page === pIdx ? '0 2px 6px rgba(16, 185, 129, 0.3)' : 'none',
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

      {/* MODAL: Category Add / Edit */}
      {showCatModal && (
        <div className="modal-overlay">
          <div className="modal-card">
            <div className="modal-header">
              <h3 className="modal-title">
                {catModalMode === 'create' ? 'Thêm Loại Sách Mới' : 'Cập Nhật Loại Sách'}
              </h3>
              <button
                type="button"
                className="modal-close-btn"
                onClick={() => setShowCatModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory}>
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
                    Tên loại sách <span style={{ color: '#EF4444' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ví dụ: Công nghệ thông tin, Kinh tế, Văn học..."
                    value={catFormData.name}
                    onChange={(e) => setCatFormData({ ...catFormData, name: e.target.value })}
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
                    Mô tả loại sách
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập chi tiết mô tả về các đầu sách thuộc thể loại này..."
                    value={catFormData.description}
                    onChange={(e) =>
                      setCatFormData({ ...catFormData, description: e.target.value })
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
                  onClick={() => setShowCatModal(false)}
                >
                  Hủy bỏ
                </button>
                <button type="submit" className="modal-btn-save" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : catModalMode === 'create' ? 'Tạo Loại Sách' : 'Cập Nhật'}
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
                  Xác Nhận Xóa Loại Sách
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
                Bạn có chắc chắn muốn xóa loại sách:
              </p>
              <h4 style={{ fontSize: '1.1rem', color: '#0F172A', marginTop: '0.5rem', fontWeight: 800 }}>
                "{deleteTarget.name}"
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
