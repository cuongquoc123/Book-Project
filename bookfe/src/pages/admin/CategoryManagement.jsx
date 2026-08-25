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
              Quản lý các thể loại / danh mục sách ({categories.length} thể loại). Thêm thể loại mới, cập nhật mô tả hoặc xóa.
            </p>
          </div>

          <div className="dash-action-group">
            <button
              type="button"
              className="btn-secondary-refresh"
              onClick={fetchData}
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

        {/* Filter & Search Bar */}
        <div className="dash-controls-card">
          <div className="dash-search-box">
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
