// src/pages/Tutor/TeachingSessionDetail.jsx
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Loader2, Calendar, Clock, MapPin, Link as LinkIcon, CheckCircle, XCircle } from 'lucide-react';
import api from '../../../services/api';

const TeachingSessionDetail = () => {
  const { sessionId } = useParams(); // Lấy từ URL: /teaching-session/:sessionId
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [attendances, setAttendances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Giả sử bạn có classId từ context hoặc prop, hoặc lấy từ session.class_id
  const [classId, setClassId] = useState(''); // Sẽ lấy từ session

  useEffect(() => {
    fetchSessionDetail();
  }, [sessionId]);

  const fetchSessionDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      // API lấy chi tiết buổi học
      const res = await api.get(`/teaching-sessions/${classId}/sessions/${sessionId}`); // Điều chỉnh endpoint nếu khác
      setSession(res.data.data);
      setClassId(res.data.data.class_id); // Lưu classId để dùng sau

      // Lấy điểm danh của buổi
      const attRes = await api.get(`/attendance/${res.data.data.class_id}/sessions/${sessionId}/attendance`);
      setAttendances(attRes.data.data || []);

    } catch (err) {
      setError(err.response?.data?.message || 'Không thể tải thông tin buổi học');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    try {
      await api.patch(`/teaching-sessions/${classId}/sessions/${sessionId}/status`, { status: newStatus });
      alert(`Cập nhật trạng thái thành ${newStatus} thành công!`);
      fetchSessionDetail(); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Cập nhật thất bại');
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-screen">
      <Loader2 className="h-12 w-12 animate-spin text-purple-600" />
    </div>
  );

  if (error) return (
    <div className="p-6 text-red-600 text-center">{error}</div>
  );

  if (!session) return <div className="p-6 text-center">Không tìm thấy buổi học</div>;

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 mb-6"
      >
        <ArrowLeft size={20} /> Quay lại lịch dạy
      </button>

      <div className="bg-white rounded-xl shadow-lg p-8">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h1 className="text-3xl font-bold text-purple-800">
              Buổi học {session.start_at ? new Date(session.start_at).toLocaleDateString('vi-VN') : ''}
            </h1>
            <p className="text-lg text-gray-600 mt-1">
              <Clock size={18} className="inline mr-2" />
              {new Date(session.start_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} - 
              {new Date(session.end_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>

          <div className="flex gap-3">
            <span className={`px-4 py-2 rounded-full text-sm font-medium ${
              session.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
              session.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
              'bg-yellow-100 text-yellow-800'
            }`}>
              {session.status}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-50 p-5 rounded-lg">
            <p className="font-medium flex items-center gap-2 mb-2">
              <Calendar size={18} /> Lớp học
            </p>
            <p className="text-gray-700">{session.className || 'Đang tải...'}</p> {/* Nếu có populate class name */}
          </div>

          <div className="bg-gray-50 p-5 rounded-lg">
            <p className="font-medium flex items-center gap-2 mb-2">
              {session.mode === 'OFFLINE' ? <MapPin size={18} /> : <LinkIcon size={18} />}
              {session.mode === 'OFFLINE' ? 'Địa điểm' : 'Link online'}
            </p>
            <p className="text-gray-700">
              {session.mode === 'OFFLINE' ? session.location || 'Chưa cập nhật' : session.online_link || 'Chưa cập nhật'}
            </p>
          </div>
        </div>

        {/* Điểm danh */}
        <div className="mt-8">
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <CheckCircle size={24} className="text-purple-600" /> Điểm danh
          </h2>

          {attendances.length === 0 ? (
            <p className="text-gray-500">Chưa có điểm danh nào cho buổi này</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full bg-white border border-gray-200">
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Học sinh</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Trạng thái</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Ghi chú</th>
                    <th className="px-6 py-3 text-left text-sm font-medium text-gray-700">Thời gian điểm danh</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {attendances.map(att => (
                    <tr key={att._id}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {att.student_user_id?.fullName || 'Không xác định'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs ${
                          att.status === 'ATTENDED' ? 'bg-green-100 text-green-800' :
                          att.status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {att.status === 'NOT_MARKED' ? 'Chưa điểm danh' : att.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">{att.note || '-'}</td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {att.marked_at ? new Date(att.marked_at).toLocaleString('vi-VN') : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Nút cập nhật trạng thái */}
        <div className="mt-10 flex justify-end gap-4">
          {session.status !== 'COMPLETED' && (
            <button
              onClick={() => handleUpdateStatus('COMPLETED')}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
            >
              Hoàn thành buổi học
            </button>
          )}
          {session.status !== 'CANCELLED' && (
            <button
              onClick={() => handleUpdateStatus('CANCELLED')}
              className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
            >
              Hủy buổi học
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default TeachingSessionDetail;