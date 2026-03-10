// src/pages/tutor/TutorAssignments.jsx
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import {
  BookOpen, Plus, Edit, Trash2, Clock, CheckCircle, AlertCircle,
  X, Loader2, FileText, Upload
} from 'lucide-react';

const TutorAssignments = () => {
  const navigate = useNavigate();
  const [assignments, setAssignments] = useState([]);
  const [syllabi, setSyllabi] = useState([]);
  const [classes, setClasses] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [stats, setStats] = useState({
    total: 0, published: 0, draft: 0, closed: 0,
    totalSubmissions: 0, overdue: 0, graded: 0,
  });

  // Modal tạo mới
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState(null);

  const [createForm, setCreateForm] = useState({
    title: '',
    description: '',
    due_at: '',
    class_id: '',
    session_id: '',
    syllabus_id: '',
    generated_by_ai: false,
    ai_prompt: '',
  });

  // Modal thêm tài liệu (giống SyllabusDetail)
  const [isAddFileModalOpen, setIsAddFileModalOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [currentAssignmentId, setCurrentAssignmentId] = useState(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      const [assRes, sylRes, sesRes, classRes] = await Promise.all([
        api.get('/assignments'),
        api.get('/syllabus'),
        api.get('/teaching-sessions'),
        api.get('/class'),
      ]);

      const assData = assRes.data || [];
      let totalSubs = 0, overdueCount = 0, gradedCount = 0;

      assData.forEach(ass => {
        if (ass.submission_stats) {
          totalSubs += ass.submission_stats.total || 0;
          gradedCount += ass.submission_stats.graded || 0;
          if (ass.due_at && new Date(ass.due_at) < new Date() && ass.status !== 'CLOSED') {
            overdueCount += (ass.submission_stats.submitted || 0) + (ass.submission_stats.draft || 0);
          }
        }
      });

      setAssignments(assData);
      setStats({
        total: assData.length,
        published: assData.filter(a => a.status === 'PUBLISHED').length,
        draft: assData.filter(a => a.status === 'DRAFT').length,
        closed: assData.filter(a => a.status === 'CLOSED').length,
        totalSubmissions: totalSubs,
        overdue: overdueCount,
        graded: gradedCount,
      });

      setSyllabi(sylRes.data.data || []);
      setSessions(sesRes.data?.data || sesRes.data || []);
      setClasses(classRes.data.data || classRes.data || []);
    } catch (err) {
      console.error(err);
      setFetchError("Không thể tải dữ liệu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateError(null);

    if (!createForm.title.trim()) {
      setCreateError("Tiêu đề là bắt buộc");
      return;
    }
    if (!createForm.class_id) {
      setCreateError("Vui lòng chọn lớp học");
      return;
    }

    setCreating(true);

    try {
      const payload = {
        title: createForm.title.trim(),
        description: createForm.description.trim() || undefined,
        due_at: createForm.due_at || undefined,
        class_id: createForm.class_id,
        session_id: createForm.session_id || undefined,
        syllabus_id: createForm.syllabus_id || undefined,
        generated_by_ai: createForm.generated_by_ai,
        ai_prompt: createForm.generated_by_ai ? (createForm.ai_prompt?.trim() || undefined) : undefined,
      };

      const res = await api.post('/assignments', payload);

      setAssignments([res.data.assignment, ...assignments]);
      setIsCreateModalOpen(false);
      alert('Tạo bài tập thành công!');
      setCreateForm({
        title: '', description: '', due_at: '', class_id: '',
        session_id: '', syllabus_id: '', generated_by_ai: false, ai_prompt: '',
      });
    } catch (err) {
      setCreateError(
        err.response?.data?.message || "Tạo bài tập thất bại. Vui lòng thử lại."
      );
    } finally {
      setCreating(false);
    }
  };

  const openAddFileModal = (assignmentId) => {
    setCurrentAssignmentId(assignmentId);
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
    if (!selectedFile || !currentAssignmentId) {
      setUploadError("Vui lòng chọn file và bài tập hợp lệ");
      return;
    }

    setUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("type", "FILE");
    formData.append("ownerType", "ASSIGNMENT");
    formData.append("ownerId", currentAssignmentId);

    try {
      const uploadRes = await api.post("/file-resources/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newFileId = uploadRes.data.data._id;
      const assignment = assignments.find(a => a._id === currentAssignmentId);
      const currentIds = assignment.file_resources?.map(f => f._id) || [];

      await api.put(`/assignments/${currentAssignmentId}`, {
        file_resources: [...currentIds, newFileId],
      });

      setIsAddFileModalOpen(false);
      setSelectedFile(null);
      fetchData(); // reload để cập nhật danh sách file
      alert("Thêm tài liệu thành công!");
    } catch (err) {
      setUploadError(err.response?.data?.message || "Upload thất bại");
    } finally {
      setUploading(false);
    }
  };

  const handleDeleteFile = async (assignmentId, fileId) => {
    if (!window.confirm("Bạn có chắc muốn xóa tài liệu này không?")) return;
    try {
      await api.delete(`/file-resources/${fileId}`);
      const assignment = assignments.find(a => a._id === assignmentId);
      const updatedFiles = assignment.file_resources
        .filter(f => f._id !== fileId)
        .map(f => f._id);

      await api.put(`/assignments/${assignmentId}`, { file_resources: updatedFiles });
      fetchData();
      alert("Xóa file thành công");
    } catch (err) {
      alert(err.response?.data?.message || "Xóa file thất bại");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa bài tập này?')) return;
    try {
      await api.delete(`/assignments/${id}`);
      setAssignments(assignments.filter(a => a._id !== id));
      alert('Xóa thành công');
    } catch (err) {
      alert('Xóa thất bại');
    }
  };

  const handlePublish = async (id) => {
    try {
      await api.put(`/assignments/${id}/publish`);
      setAssignments(assignments.map(a =>
        a._id === id ? { ...a, status: 'PUBLISHED' } : a
      ));
      alert('Đã giao bài thành công');
    } catch (err) {
      alert('Giao bài thất bại');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 py-10">
      {/* Header đồng bộ TutorSyllabus */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between mb-8">
        <div className="flex items-start gap-3">
          <BookOpen className="mt-1 h-8 w-8 text-slate-900" />
          <h1 className="text-3xl font-extrabold text-slate-900">Quản lý Bài tập</h1>
        </div>

        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-purple-500 to-indigo-600 px-6 py-3 font-semibold text-white shadow hover:brightness-95 transition"
        >
          <Plus size={18} /> Tạo bài tập
        </button>
      </div>

      {fetchError && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700">
          {fetchError}
        </div>
      )}

      {/* Danh sách bài tập */}
      {assignments.length === 0 ? (
        <div className="text-center py-16 bg-slate-50 rounded-2xl border border-dashed">
          <BookOpen className="mx-auto h-16 w-16 text-slate-400 mb-4" />
          <p className="text-slate-600 text-lg">Chưa có bài tập nào</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {assignments.map(ass => (
            <AssignmentCard
              key={ass._id}
              assignment={ass}
              onDelete={() => handleDelete(ass._id)}
              onPublish={() => handlePublish(ass._id)}
              onAddFile={() => openAddFileModal(ass._id)}
              onDeleteFile={(fileId) => handleDeleteFile(ass._id, fileId)}
            />
          ))}
        </div>
      )}

      {/* Modal Tạo mới */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-7 shadow-2xl max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => !creating && setIsCreateModalOpen(false)}
              disabled={creating}
              className="absolute right-5 top-5 rounded-full p-2 text-slate-500 hover:bg-slate-100 disabled:opacity-50"
            >
              <X size={24} />
            </button>

            <h2 className="text-2xl font-bold text-slate-900">Tạo bài tập mới</h2>
            <p className="mt-1 text-sm text-slate-500 mb-6">Điền thông tin để tạo bài tập</p>

            <form onSubmit={handleCreateSubmit} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Tiêu đề <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={createForm.title}
                  onChange={e => setCreateForm({ ...createForm, title: e.target.value })}
                  disabled={creating}
                  required
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  placeholder="Ví dụ: Bài tập Toán lớp 10 - Tuần 5"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">Mô tả</label>
                <textarea
                  value={createForm.description}
                  onChange={e => setCreateForm({ ...createForm, description: e.target.value })}
                  disabled={creating}
                  rows={3}
                  className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  placeholder="Mô tả yêu cầu, hướng dẫn làm bài..."
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Hạn nộp</label>
                  <input
                    type="datetime-local"
                    value={createForm.due_at}
                    onChange={e => setCreateForm({ ...createForm, due_at: e.target.value })}
                    disabled={creating}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">
                    Lớp học <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={createForm.class_id}
                    onChange={e => setCreateForm({ ...createForm, class_id: e.target.value })}
                    disabled={creating}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                    required
                  >
                    <option value="">Chọn lớp</option>
                    {classes.map(cl => (
                      <option key={cl._id} value={cl._id}>
                        {cl.name || cl.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Buổi học (tùy chọn)</label>
                  <select
                    value={createForm.session_id}
                    onChange={e => setCreateForm({ ...createForm, session_id: e.target.value })}
                    disabled={creating}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  >
                    <option value="">Không liên kết</option>
                    {sessions.map(ses => (
                      <option key={ses._id} value={ses._id}>
                        {ses.title || ses.location || `Buổi ${ses.session_number || ''}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">Giáo trình liên quan</label>
                  <select
                    value={createForm.syllabus_id}
                    onChange={e => setCreateForm({ ...createForm, syllabus_id: e.target.value })}
                    disabled={creating}
                    className="mt-1 w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                  >
                    <option value="">Không liên kết</option>
                    {syllabi.map(syl => (
                      <option key={syl._id} value={syl._id}>
                        {syl.title} {syl.version ? `(v${syl.version})` : ''}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="ai-generate"
                  checked={createForm.generated_by_ai}
                  onChange={e => setCreateForm({ ...createForm, generated_by_ai: e.target.checked })}
                  className="h-5 w-5 text-indigo-600 rounded border-slate-300"
                  disabled={creating}
                />
                <label htmlFor="ai-generate" className="text-sm font-medium text-slate-700">
                  Tạo nội dung bằng AI
                </label>
              </div>

              {createForm.generated_by_ai && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Prompt cho AI</label>
                  <textarea
                    value={createForm.ai_prompt}
                    onChange={e => setCreateForm({ ...createForm, ai_prompt: e.target.value })}
                    disabled={creating}
                    rows={3}
                    className="w-full rounded-lg border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-indigo-500 focus:ring-2 disabled:bg-slate-50"
                    placeholder="Ví dụ: Tạo 5 bài tập về phương trình bậc hai lớp 10, có đáp án chi tiết"
                  />
                </div>
              )}

              {createError && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-700 border border-red-200">
                  {createError}
                </div>
              )}

              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => !creating && setIsCreateModalOpen(false)}
                  disabled={creating}
                  className="rounded-lg border border-slate-300 px-6 py-2.5 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Hủy
                </button>

                <button
                  type="submit"
                  disabled={creating}
                  className="flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-2.5 font-medium text-white hover:bg-indigo-700 disabled:bg-indigo-400"
                >
                  {creating && <Loader2 className="h-4 w-4 animate-spin" />}
                  {creating ? "Đang tạo..." : "Tạo bài tập"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Thêm Tài Liệu - giống hệt SyllabusDetail */}
      {isAddFileModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg p-6 relative">
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
                        {filePreview.size} • {filePreview.type}
                      </p>
                    )}
                  </div>
                </label>
              </div>

              {uploadError && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                  {uploadError}
                </div>
              )}

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

// AssignmentCard với phần file giống SyllabusDetail
const AssignmentCard = ({ assignment, onDelete, onPublish, onAddFile, onDeleteFile }) => {
  const isOverdue = assignment.due_at && new Date(assignment.due_at) < new Date() && assignment.status !== 'CLOSED';

  return (
    <div className="bg-white rounded-xl shadow-md border border-gray-200 overflow-hidden hover:shadow-lg transition">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-lg font-semibold text-gray-800 line-clamp-2">{assignment.title}</h3>
          <Badge status={assignment.status} />
        </div>

        <p className="text-sm text-gray-600 mb-4 line-clamp-3">{assignment.description || 'Không có mô tả'}</p>

        <div className="space-y-2 text-sm text-gray-700">
          <div className="flex items-center gap-2">
            <Clock size={16} />
            <span>Hạn nộp: {assignment.due_at ? new Date(assignment.due_at).toLocaleDateString('vi-VN') : 'Không hạn'}</span>
          </div>
          {assignment.submission_stats && (
            <>
              <div className="flex items-center gap-2">
                <BookOpen size={16} />
                <span>Tổng nộp: {assignment.submission_stats.total}</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle size={16} className="text-green-600" />
                <span>Đã chấm: {assignment.submission_stats.graded}</span>
              </div>
            </>
          )}
        </div>

        {/* Danh sách tài liệu */}
        {assignment.file_resources?.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-slate-700 mb-2 flex items-center gap-2">
              <FileText size={16} /> Tài liệu đính kèm ({assignment.file_resources.length})
            </h4>
            <div className="space-y-2">
              {assignment.file_resources.map(file => (
                <div key={file._id} className="flex items-center justify-between bg-slate-50 px-3 py-2 rounded-lg">
                  <div className="flex items-center gap-2 truncate">
                    <FileText size={16} className="text-indigo-600 flex-shrink-0" />
                    <span className="text-sm truncate">{file.file_name || file.filename}</span>
                  </div>
                  <button
                    onClick={() => onDeleteFile(file._id)}
                    className="text-red-500 hover:text-red-700 flex-shrink-0"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="px-6 py-4 bg-gray-50 border-t flex flex-wrap justify-end gap-3">
        <button
          onClick={() => onAddFile(assignment._id)}
          className="text-emerald-600 hover:text-emerald-800 flex items-center gap-1 text-sm"
        >
          <Plus size={16} /> Thêm tài liệu
        </button>
        <Link
          to={`/tutor/assignments/${assignment._id}`}
          className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-sm"
        >
          <Edit size={16} /> Sửa
        </Link>
        {assignment.status === 'DRAFT' && (
          <button
            onClick={onPublish}
            className="text-green-600 hover:text-green-800 flex items-center gap-1 text-sm"
          >
            <CheckCircle size={16} /> Giao bài
          </button>
        )}
        <button
          onClick={onDelete}
          className="text-red-600 hover:text-red-800 flex items-center gap-1 text-sm"
        >
          <Trash2 size={16} /> Xóa
        </button>
      </div>
    </div>
  );
};

const Badge = ({ status }) => {
  const colors = {
    DRAFT: 'bg-yellow-100 text-yellow-800',
    PUBLISHED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  return (
    <span className={`px-3 py-1 rounded-full text-xs font-medium ${colors[status] || 'bg-gray-100'}`}>
      {status === 'DRAFT' ? 'Nháp' : status === 'PUBLISHED' ? 'Đã giao' : 'Đóng'}
    </span>
  );
};

export default TutorAssignments;