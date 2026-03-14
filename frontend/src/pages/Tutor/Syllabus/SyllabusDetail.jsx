import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { BookOpen, FileText, Edit, Trash2, Plus, Loader2, X } from "lucide-react";
import api from "../../../services/api";

const SyllabusDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [syllabus, setSyllabus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isManageClassModalOpen, setIsManageClassModalOpen] = useState(false);
  const [selectedClasses, setSelectedClasses] = useState([]); // tạm thời lưu lựa chọn khi chỉnh
  const [savingClasses, setSavingClasses] = useState(false);
  // Modal sửa
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    version: "",
    gradeLevel: "",
    subject: "",
    classLevel: [],
  });
  const [editing, setEditing] = useState(false);

  // Modal thêm tài liệu
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // View mode cho danh sách file
  const [viewMode, setViewMode] = useState("list");
  const [classes, setClasses] = useState([]); // danh sách tất cả lớp từ API
  useEffect(() => {
    fetchSyllabusDetail();
    fetchClasses(); // ← thêm hàm này
  }, [id]);
  const fetchClasses = async () => {
    try {
      const res = await api.get("/class");
      setClasses(res.data.data || []);
    } catch (err) {
      console.error("Không tải được danh sách lớp", err);
    }
  };
  const fetchSyllabusDetail = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get(`/syllabus/${id}`);
      setSyllabus(res.data.data);
      setEditForm({
        title: res.data.data.title || "",
        description: res.data.data.description || "",
        version: res.data.data.version || "1.0",
        gradeLevel: res.data.data.gradeLevel || "",
        subject: res.data.data.subject || "",
        classLevel: res.data.data.classLevel?.map(cls => cls._id) || [],
      });
    } catch (err) {
      setError("Không thể tải chi tiết giáo trình");
      setSyllabus(null);

    } finally {
      setLoading(false);
    }
  };

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

  const handleDelete = async () => {
    if (!window.confirm("Bạn chắc chắn muốn xóa giáo trình này?")) return;
    try {
      await api.delete(`/syllabus/${id}`);
      navigate("/tutor/syllabus");
    } catch (err) {
      alert(err.response?.data?.message || "Xóa thất bại");
    }
  };

  const openAddFileModal = () => {
    setSelectedFile(null);
    setFilePreview(null);
    setUploadError(null);
    setIsAddFileModalOpen(true);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      setUploadError("File quá lớn (tối đa 10MB)");
      return;
    }
    setSelectedFile(file);
    setFilePreview({
      name: file.name,
      size: (file.size / 1024 / 1024).toFixed(2) + " MB",
      type: file.type.split("/")[1]?.toUpperCase() || "FILE",
    });
    setUploadError(null);
  };

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
    formData.append("type", "FILE");
    formData.append("ownerType", "SYLLABUS");
    formData.append("ownerId", id);

    try {
      const uploadRes = await api.post("/file-resources/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newFileId = uploadRes.data.data._id;
      const currentIds = syllabus.file_resources?.map(f => f._id) || [];
      await api.put(`/syllabus/${id}`, {
        file_resources: [...currentIds, newFileId],
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

  const handleDeleteFile = async (fileId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này không?")) return;
    try {
      await api.delete(`/file-resources/${fileId}`);
      fetchSyllabusDetail();
    } catch (err) {
      alert(err.response?.data?.message || "Xóa file thất bại");
    }
  };
  const handleClassSelectChange = (e) => {
    const selected = Array.from(e.target.selectedOptions).map((option) => option.value);
    setEditForm((prev) => ({ ...prev, classLevel: selected }));
  };
  if (loading) return <div className="flex justify-center items-center h-96"><Loader2 className="h-12 w-12 animate-spin text-indigo-600" /></div>;
  if (error || !syllabus) return <div className="text-center py-12 text-red-600">{error || "Không tìm thấy giáo trình"}</div>;
  const openManageClassModal = () => {
    setSelectedClasses(syllabus.classLevel?.map(cls => cls._id) || []);
    setIsManageClassModalOpen(true);
  };

  const handleSaveClasses = async () => {
    setSavingClasses(true);
    try {
      await api.put(`/syllabus/${id}`, {
        classLevel: selectedClasses,
      });
      setIsManageClassModalOpen(false);
      fetchSyllabusDetail(); // reload
    } catch (err) {
      alert(err.response?.data?.message || "Cập nhật lớp thất bại");
    } finally {
      setSavingClasses(false);
    }
  };
  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-6 mb-10">
        <div className="flex items-start gap-4">
          <BookOpen className="h-10 w-10 text-indigo-600 mt-1" />
          <div>
            <h1 className="text-3xl font-bold text-slate-900">{syllabus.title}</h1>
            <div className="flex flex-wrap gap-3 mt-3">
              {syllabus.gradeLevel && (
                <span className="bg-indigo-100 text-indigo-800 px-4 py-1.5 rounded-full text-sm font-medium">
                  {syllabus.gradeLevel}
                </span>
              )}
              {syllabus.subject && (
                <span className="bg-emerald-100 text-emerald-800 px-4 py-1.5 rounded-full text-sm font-medium">
                  {syllabus.subject}
                </span>
              )}
              {syllabus.classLevel?.length > 0 ? (
                <span className="bg-amber-100 text-amber-800 px-4 py-1.5 rounded-full text-sm font-medium">
                  Lớp: {syllabus.classLevel.map(cls => cls.name || cls.code || "Lớp").join(", ")}
                </span>
              ) : (
                <span className="bg-gray-100 text-gray-700 px-4 py-1.5 rounded-full text-sm font-medium">
                  Chưa gán lớp
                </span>
              )}
            </div>
            <p className="mt-3 text-slate-600 text-sm">
              Phiên bản: {syllabus.version || "1.0"} •
              Khởi tạo: {new Date(syllabus.created_at).toLocaleString('vi-VN', {
                day: '2-digit', month: '2-digit', year: 'numeric',
                hour: '2-digit', minute: '2-digit'
              })}
            </p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={() => setIsEditModalOpen(true)}
            className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Edit size={18} /> Sửa thông tin
          </button>

          <button
            onClick={openManageClassModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 text-white rounded-lg hover:bg-amber-700"
          >
            <Plus size={18} /> Quản lý lớp áp dụng
          </button>

          <button
            onClick={openAddFileModal}
            className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700"
          >
            <Plus size={18} /> Thêm tài liệu
          </button>

          <button
            onClick={handleDelete}
            className="flex items-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            <Trash2 size={18} /> Xóa
          </button>
        </div>
      </div>

      {/* Mô tả */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-10 shadow-sm">
        <h2 className="text-xl font-semibold mb-3">Mô tả</h2>
        <p className="text-slate-700 whitespace-pre-line">
          {syllabus.description || "Chưa có mô tả chi tiết cho giáo trình này."}
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
      // Sửa tên trường để khớp DB
      const isImage = file.mime_type?.startsWith('image/'); // mime_type thay mimeType
      const thumbnail = isImage ? file.url_or_content : null; // url_or_content đúng rồi

      return viewMode === 'grid' ? (
        <div
          key={file._id}
          className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition group"
        >
          <div className="h-40 bg-slate-50 flex items-center justify-center relative overflow-hidden">
            {thumbnail ? (
              <img
                src={thumbnail}
                alt={file.file_name || 'File'} // file_name thay originalName/filename
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
              {file.file_name || 'Không có tên file'} 
            </p>
            <p className="text-xs text-slate-500 mt-1">
              {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.size / 1024 / 1024).toFixed(2)} MB
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
        <div
          key={file._id}
          className="px-6 py-4 flex items-center gap-4 hover:bg-slate-50 transition"
        >
          {thumbnail ? (
            <img
              src={thumbnail}
              alt={file.file_name || 'File'}
              className="w-14 h-14 object-cover rounded-md flex-shrink-0"
            />
          ) : (
            <div className="w-14 h-14 bg-slate-100 rounded-md flex items-center justify-center flex-shrink-0">
              <FileText className="h-7 w-7 text-slate-400" />
            </div>
          )}

          <div className="flex-1 min-w-0">
            <p className="font-medium text-slate-900 truncate">
              {file.file_name || 'Không có tên file'}
            </p>
            <p className="text-sm text-slate-500">
              {file.mime_type?.split('/')[1]?.toUpperCase() || 'FILE'} • {(file.size / 1024 / 1024).toFixed(2)} MB
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

      {/* Modal Sửa - ĐÃ THÊM CÁC TRƯỜNG MỚI */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl p-7 w-full max-w-xl max-h-[90vh] overflow-y-auto shadow-2xl">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Chỉnh sửa giáo trình</h2>
              <button onClick={() => setIsEditModalOpen(false)}>
                <X size={24} className="text-slate-500 hover:text-slate-800" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-2 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Khối học</label>
                  <select
                    value={editForm.gradeLevel}
                    onChange={(e) => setEditForm({ ...editForm, gradeLevel: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-2 outline-none"
                  >
                    <option value="">Chọn khối</option>
                    <option value="Lớp 6">Lớp 6</option>
                    <option value="Lớp 7">Lớp 7</option>
                    <option value="Lớp 8">Lớp 8</option>
                    <option value="Lớp 9">Lớp 9</option>
                    <option value="Lớp 10">Lớp 10</option>
                    <option value="Lớp 11">Lớp 11</option>
                    <option value="Lớp 12">Lớp 12</option>
                    <option value="Đại học">Đại học</option>
                    <option value="Khác">Khác</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Môn học</label>
                  <input
                    type="text"
                    value={editForm.subject}
                    onChange={(e) => setEditForm({ ...editForm, subject: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-2 outline-none"
                    placeholder="Toán, Văn, Lý, Hóa..."
                  />
                </div>
              </div>

              {/* Multi-select lớp học */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Lớp học áp dụng (giữ Ctrl/Cmd để chọn nhiều)
                </label>
                {classes.length === 0 ? (
                  <div className="text-sm text-slate-500 italic">Đang tải danh sách lớp...</div>
                ) : (
                  <>
                    <select
                      multiple
                      value={editForm.classLevel}
                      onChange={handleClassSelectChange}
                      className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-2 h-40 scrollbar-thin"
                    >
                      {classes.map(cls => (
                        <option key={cls._id} value={cls._id}>
                          {cls.name} {cls.code ? `(${cls.code})` : ""} {cls.gradeLevel ? `- ${cls.gradeLevel}` : ""}
                        </option>
                      ))}
                    </select>
                    <p className="mt-2 text-xs text-slate-500">
                      Đã chọn: {editForm.classLevel.length} lớp
                      {editForm.classLevel.length > 0 && (
                        <span className="ml-2 text-indigo-600 font-medium">
                          {editForm.classLevel.map(id => {
                            const c = classes.find(cl => cl._id === id);
                            return c ? c.name || c.code || id : id;
                          }).join(", ")}
                        </span>
                      )}
                    </p>
                  </>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Mô tả</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={4}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-2 outline-none"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Phiên bản</label>
                <input
                  type="text"
                  value={editForm.version}
                  onChange={(e) => setEditForm({ ...editForm, version: e.target.value })}
                  className="w-full border border-slate-300 rounded-lg px-4 py-2.5 focus:border-indigo-500 focus:ring-2 outline-none"
                  placeholder="1.0"
                />
              </div>

              <div className="flex justify-end gap-3 pt-6">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={editing}
                  className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 flex items-center gap-2"
                >
                  {editing && <Loader2 className="h-4 w-4 animate-spin" />}
                  {editing ? "Đang lưu..." : "Lưu thay đổi"}
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
                  accept=".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.jpg,.jpeg,.png,.gif,.txt,.zip"
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
      {isManageClassModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl p-7 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-slate-900">Quản lý lớp áp dụng</h2>
              <button onClick={() => setIsManageClassModalOpen(false)}>
                <X size={24} className="text-slate-500 hover:text-slate-800" />
              </button>
            </div>

            {classes.length === 0 ? (
              <div>Đang tải danh sách lớp...</div>
            ) : (
              <>
                <select
                  multiple
                  value={selectedClasses}
                  onChange={(e) => {
                    const vals = Array.from(e.target.selectedOptions).map(opt => opt.value);
                    setSelectedClasses(vals);
                  }}
                  className="block w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm h-64 scrollbar-thin focus:border-indigo-500 focus:ring-2"
                >
                  {classes.map(cls => (
                    <option key={cls._id} value={cls._id}>
                      {cls.name} {cls.code ? `(${cls.code})` : ""}
                      {cls.gradeLevel ? ` - ${cls.gradeLevel}` : ""}
                    </option>
                  ))}
                </select>

                <p className="mt-3 text-sm text-slate-600">
                  Đã chọn: <strong>{selectedClasses.length}</strong> lớp
                  {selectedClasses.length > 0 && (
                    <span className="ml-2 text-indigo-600">
                      {selectedClasses.map(id => {
                        const c = classes.find(cl => cl._id === id);
                        return c ? c.name || c.code || id : id;
                      }).join(", ")}
                    </span>
                  )}
                </p>

                <div className="flex justify-end gap-3 mt-8">
                  <button
                    onClick={() => setIsManageClassModalOpen(false)}
                    className="px-6 py-2.5 border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50"
                  >
                    Hủy
                  </button>
                  <button
                    onClick={handleSaveClasses}
                    disabled={savingClasses}
                    className="px-6 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {savingClasses && <Loader2 className="h-4 w-4 animate-spin" />}
                    {savingClasses ? "Đang lưu..." : "Lưu lớp áp dụng"}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default SyllabusDetail;