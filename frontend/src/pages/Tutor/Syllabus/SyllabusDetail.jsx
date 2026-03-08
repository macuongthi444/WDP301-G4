import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, FileText, Edit, Trash2, Plus, Loader2, X } from "lucide-react";
import api from "../../../services/api";

const SyllabusDetail = () => {
  const { id } = useParams(); // syllabus _id từ URL: /tutor/syllabus/:id
  const navigate = useNavigate();

  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal sửa syllabus
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({ title: "", description: "", version: "" });
  const [editing, setEditing] = useState(false);

  // Modal thêm tài liệu
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null); // để hiển thị tên + size
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  // State cho chế độ hiển thị danh sách tài liệu
  const [viewMode, setViewMode] = useState('list'); // 'list' | 'grid'
  useEffect(() => {
    fetchSyllabusDetail();
  }, [id]);

  const fetchSyllabusDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/syllabus/${id}`);
      setSyllabus(res.data.data);
      // Khởi tạo form edit
      setEditForm({
        title: res.data.data.title || "",
        description: res.data.data.description || "",
        version: res.data.data.version || "1.0",
      });
    } catch (err) {
      setError("Không thể tải chi tiết giáo trình");
      setSyllabus(null);
    } finally {
      setLoading(false);
    }
  };

  // Xử lý sửa syllabus
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.title.trim()) return;

    setEditing(true);
    try {
      await api.put(`/syllabus/${id}`, editForm);
      setIsEditModalOpen(false);
      fetchSyllabusDetail();
    } catch (err) {
      alert(err.response?.data?.message || "Cập nhật thất bại");
    } finally {
      setEditing(false);
    }
  };

  // Xử lý xóa syllabus
  const handleDelete = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa giáo trình này?")) return;
    try {
      await api.delete(`/syllabus/${id}`);
      navigate("/tutor/syllabus");
    } catch (err) {
      alert(err.response?.data?.message || "Xóa thất bại");
    }
  };

  // Xử lý upload file mới
  const handleAddFile = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Vui lòng chọn file");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("ownerType", "SYLLABUS");
    formData.append("ownerId", id);

    try {
      const res = await api.post("/file-resources/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // Sau khi upload thành công, thêm file vào syllabus
      await api.put(`/syllabus/${id}`, {
        file_resources: [...(syllabus.file_resources || []), res.data.data._id],
      });

      setIsAddFileModalOpen(false);
      setSelectedFile(null);
      fetchSyllabusDetail();
    } catch (err) {
      setUploadError(err.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <Loader2 className="h-12 w-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !syllabus) {
    return (
      <div className="text-center py-12 text-red-600">
        {error || "Không tìm thấy giáo trình"}
      </div>
    );
  }
  const openAddFileModal = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setIsAddFileModalOpen(true);
  };
  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Kiểm tra kích thước frontend (tùy chọn, backend đã có 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File quá lớn (tối đa 10MB)");
      return;
    }

    setSelectedFile(file);
    setFilePreview({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      type: file.type,
    });
    setUploadError(null);
  };

  // Xử lý submit upload
  const handleAddFileSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError("Vui lòng chọn một file");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", "FILE");           // hoặc "IMAGE" nếu là ảnh
    formData.append("ownerType", "SYLLABUS");
    formData.append("ownerId", id);

    try {
      // Bước 1: Upload file → nhận về FileResource document
      const uploadRes = await api.post("/file-resources/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      const newFileId = uploadRes.data.data._id;

      // Bước 2: Cập nhật syllabus → push ID file mới vào mảng file_resources
      const currentFiles = syllabus.file_resources?.map(f => f._id) || [];
      await api.put(`/syllabus/${id}`, {
        file_resources: [...currentFiles, newFileId],
      });

      // Thành công
      setIsAddFileModalOpen(false);
      fetchSyllabusDetail(); // refresh chi tiết → thấy file mới
    } catch (err) {
      const message = err.response?.data?.message || "Không thể tải file lên. Vui lòng thử lại.";
      setUploadError(message);
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };
  const handleDeleteFile = async (fileId) => {
  if (!window.confirm("Bạn có chắc muốn xóa tài liệu này không?")) return;

  try {
    await api.delete(`/file-resources/${fileId}`);
    fetchSyllabusDetail();        // refresh lại danh sách
  } catch (err) {
    alert(err.response?.data?.message || "Xóa file thất bại");
  }
};
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
        <div className="flex items-center gap-4">
          <BookOpen className="h-10 w-10 text-indigo-600" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{syllabus.title}</h1>
            <p className="text-slate-600 mt-1">
              Phiên bản: {syllabus.version || "1.0"}
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit size={18} /> Sửa
          </button>
          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 size={18} /> Xóa
          </button>
          <button
            onClick={openAddFileModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition"
          >
            <Plus size={18} /> Thêm tài liệu
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Mô tả</h2>
        <p className="text-slate-700 whitespace-pre-line">
          {syllabus.description || "Chưa có mô tả"}
        </p>
      </div>

      {/* Danh sách tài liệu */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden mt-8">
        <div className="bg-slate-50 px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold flex items-center gap-2">
            <FileText size={22} /> Tài liệu đính kèm ({syllabus.file_resources?.length || 0})
          </h2>

          {/* Nút chuyển đổi view */}
          <div className="flex gap-2 bg-white rounded-lg p-1 border">
            <button
              onClick={() => setViewMode('list')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'list'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Danh sách
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 text-sm font-medium rounded-md transition ${viewMode === 'grid'
                  ? 'bg-indigo-600 text-white shadow-sm'
                  : 'text-slate-600 hover:bg-slate-100'
                }`}
            >
              Lưới
            </button>
          </div>
        </div>

        {syllabus.file_resources?.length > 0 ? (
          <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 p-6' : 'divide-y divide-slate-100'}>
            {syllabus.file_resources.map((file) => {
              const isImage = file.mimeType?.startsWith('image/');
              const thumbnail = isImage ? file.url_or_content : null;

              return viewMode === 'grid' ? (
                // Grid view - card
                <div
                  key={file._id}
                  className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
                >
                  <div className="h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden">
                    {thumbnail ? (
                      <img
                        src={thumbnail}
                        alt={file.originalName || file.filename}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <FileText className="h-16 w-16 text-slate-300" />
                    )}
                    <button
                      onClick={() => handleDeleteFile(file._id)}
                      className="absolute top-3 right-3 bg-white/90 hover:bg-red-500 hover:text-white text-red-500 p-2 rounded-full shadow opacity-0 group-hover:opacity-100 transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                  <div className="p-4">
                    <p className="font-medium text-slate-900 line-clamp-2">
                      {file.originalName || file.filename}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      {file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                    <a
                      href={file.url_or_content}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-block text-sm text-indigo-600 hover:underline"
                    >
                      Tải về / Xem
                    </a>
                  </div>
                </div>
              ) : (
                // List view
                <div
                  key={file._id}
                  className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition"
                >
                  {thumbnail ? (
                    <img
                      src={thumbnail}
                      alt=""
                      className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                    />
                  ) : (
                    <div className="w-14 h-14 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0">
                      <FileText className="h-7 w-7 text-slate-400" />
                    </div>
                  )}

                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">
                      {file.originalName || file.filename}
                    </p>
                    <p className="text-sm text-slate-500">
                      {file.mimeType?.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>

                  <a
                    href={file.url_or_content}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-indigo-600 hover:text-indigo-800 text-sm font-medium whitespace-nowrap"
                  >
                    Xem / Tải
                  </a>
                  <button
                    onClick={() => handleDeleteFile(file._id)}
                    className="text-red-500 hover:text-red-700 opacity-70 hover:opacity-100 transition p-2"
                  >
                    <Trash2 size={20} />
                  </button>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center text-slate-500">
            Chưa có tài liệu nào được đính kèm
          </div>
        )}
      </div>

      {/* ─── Modal Sửa ─── */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-5">
              <h2 className="text-2xl font-bold">Chỉnh sửa giáo trình</h2>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X size={24} className="text-slate-500" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full border rounded-lg px-4 py-2.5"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Phiên bản</label>
                <input
                  type="text"
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                  className="w-full border rounded-lg px-4 py-2.5"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 border rounded-lg"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg flex items-center gap-2 disabled:opacity-50"
                >
                  {editing && <Loader2 className="animate-spin h-4 w-4" />}
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── Modal Thêm Tài Liệu ─── */}
      {isAddFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
            {/* Nút đóng */}
            <button
              onClick={() => !uploading && setIsAddFileModalOpen(false)}
              disabled={uploading}
              className="absolute top-4 right-4 text-slate-500 hover:text-slate-800 disabled:opacity-50"
            >
              <X size={28} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900 mb-1">Thêm tài liệu mới</h2>
            <p className="text-slate-500 mb-6">Hỗ trợ: PDF, Word, Excel, ảnh, txt (tối đa 10MB)</p>

            <form onSubmit={handleAddFileSubmit} className="space-y-6">
              {/* Khu vực chọn file */}
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-8 text-center hover:border-indigo-400 transition">
                <input
                  type="file"
                  id="file-upload"
                  className="hidden"
                  onChange={handleFileChange}
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt"
                  disabled={uploading}
                />
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer flex flex-col items-center gap-3"
                >
                  <div className="w-16 h-16 rounded-full bg-indigo-100 flex items-center justify-center">
                    <FileText className="h-8 w-8 text-indigo-600" />
                  </div>
                  <div>
                    <p className="font-medium text-indigo-600 hover:underline">
                      Nhấn để chọn file hoặc kéo thả vào đây
                    </p>
                    <p className="text-sm text-slate-500 mt-1">
                      {filePreview ? filePreview.name : "Chưa chọn file"}
                    </p>
                    {filePreview && (
                      <p className="text-xs text-slate-400">
                        {filePreview.size} • {filePreview.type.split("/")[1]?.toUpperCase() || "FILE"}
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {/* Thông báo lỗi */}
              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}

              {/* Nút hành động */}
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => !uploading && setIsAddFileModalOpen(false)}
                  disabled={uploading}
                  className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={uploading || !selectedFile}
                  className="px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 disabled:bg-emerald-400 disabled:cursor-not-allowed flex items-center gap-2 min-w-[140px] justify-center"
                >
                  {uploading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin" />
                      Đang tải lên...
                    </>
                  ) : (
                    "Thêm tài liệu"
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusDetail;