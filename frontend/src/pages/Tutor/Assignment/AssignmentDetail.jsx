// src/pages/tutor/TutorAssignmentDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../../services/api';
import { BookOpen, Edit, Lock, Clock, CheckCircle, AlertCircle, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

const TutorAssignmentDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [formData, setFormData] = useState({ title: '', description: '', due_at: '' });

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await api.get(`/assignments/${id}`);
        setAssignment(res.data.assignment);
        setFormData({
          title: res.data.assignment.title,
          description: res.data.assignment.description || '',
          due_at: res.data.assignment.due_at ? new Date(res.data.assignment.due_at).toISOString().slice(0, 16) : '',
        });
      } catch (err) {
        toast.error('Không tải được chi tiết bài tập');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  const handleCloseAssignment = async () => {
    if (!window.confirm('Bạn chắc chắn muốn đóng bài tập này? Học sinh sẽ không nộp được nữa.')) return;

    try {
      await api.put(`/assignments/${id}`, { status: 'CLOSED' });
      setAssignment({ ...assignment, status: 'CLOSED' });
      toast.success('Đã đóng bài tập');
    } catch (err) {
      toast.error('Đóng bài thất bại');
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    try {
      const res = await api.put(`/assignments/${id}`, formData);
      setAssignment(res.data.assignment);
      setIsEditModalOpen(false);
      toast.success('Cập nhật thành công');
    } catch (err) {
      toast.error('Cập nhật thất bại');
    }
  };

  if (loading) return <div className="text-center py-10">Đang tải...</div>;
  if (!assignment) return <div className="text-center py-10 text-red-600">Không tìm thấy bài tập</div>;

  const isOverdue = assignment.due_at && new Date(assignment.due_at) < new Date() && assignment.status !== 'CLOSED';
  const stats = assignment.submission_stats || { total: 0, draft: 0, submitted: 0, graded: 0 };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate(-1)} className="text-gray-600 hover:text-purple-600">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
            <BookOpen className="text-purple-600" size={32} />
            {assignment.title}
          </h1>
        </div>

        <div className="flex gap-4">
          {assignment.status !== 'CLOSED' && (
            <>
              <button
                onClick={() => setIsEditModalOpen(true)}
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-blue-700"
              >
                <Edit size={18} /> Chỉnh sửa
              </button>
              {assignment.status !== 'CLOSED' && (
                <button
                  onClick={handleCloseAssignment}
                  className="bg-red-600 text-white px-5 py-2.5 rounded-lg flex items-center gap-2 hover:bg-red-700"
                >
                  <Lock size={18} /> Đóng bài
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Status & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard title="Trạng thái" value={assignment.status === 'DRAFT' ? 'Nháp' : assignment.status === 'PUBLISHED' ? 'Đã giao' : 'Đóng'} color="bg-purple-100 text-purple-800" />
        <StatCard title="Hạn nộp" value={assignment.due_at ? new Date(assignment.due_at).toLocaleString('vi-VN') : 'Không hạn'} color={isOverdue ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'} />
        <StatCard title="Tổng bài nộp" value={stats.total} color="bg-indigo-100 text-indigo-800" />
        <StatCard title="Đã chấm" value={stats.graded} color="bg-green-100 text-green-800" />
      </div>

      {/* Thông tin chi tiết */}
      <div className="bg-white rounded-xl shadow-md p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4">Mô tả bài tập</h2>
        <p className="text-gray-700 whitespace-pre-line">{assignment.description || 'Không có mô tả'}</p>

        {assignment.generated_by_ai && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg">
            <p className="text-sm text-blue-700">Bài tập được tạo bởi AI với prompt: {assignment.ai_prompt}</p>
          </div>
        )}
      </div>

      {/* Thống kê chi tiết submission */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Thống kê bài nộp</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-3xl font-bold text-gray-800">{stats.total}</p>
            <p className="text-sm text-gray-600">Tổng bài nộp</p>
          </div>
          <div className="text-center p-4 bg-yellow-50 rounded-lg">
            <p className="text-3xl font-bold text-yellow-800">{stats.draft + stats.submitted}</p>
            <p className="text-sm text-gray-600">Chưa chấm</p>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <p className="text-3xl font-bold text-green-800">{stats.graded}</p>
            <p className="text-sm text-gray-600">Đã chấm</p>
          </div>
        </div>
      </div>

      {/* Modal Edit Assignment */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/25 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-lg w-full mx-4">
            <h2 className="text-2xl font-bold mb-6">Chỉnh sửa bài tập</h2>
            <form onSubmit={handleUpdate}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Tiêu đề</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Mô tả</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={5}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500"
                />
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium mb-1">Hạn nộp</label>
                <input
                  type="datetime-local"
                  value={formData.due_at}
                  onChange={(e) => setFormData({ ...formData, due_at: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg"
                />
              </div>
              <div className="flex justify-end gap-4">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-6 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
                >
                  Lưu thay đổi
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, color }) => (
  <div className={`p-6 rounded-xl shadow-sm ${color}`}>
    <p className="text-sm font-medium">{title}</p>
    <p className="text-2xl font-bold mt-1">{value}</p>
  </div>
);

export default TutorAssignmentDetail;