// src/pages/Tutor/TutorClasses.jsx
import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2, Users, Calendar, MapPin, Link as LinkIcon, Trash2 } from 'lucide-react';
import api from '../../../services/api'; // axios instance của bạn
// src/pages/Tutor/TutorClasses.jsx



const TutorClasses = () => {
  const [classes, setClasses] = useState([]);
  const [allStudents, setAllStudents] = useState([]); // Danh sách tất cả học sinh để chọn thêm
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Modal thêm lớp
  const [isAddClassModalOpen, setIsAddClassModalOpen] = useState(false);
  const [newClass, setNewClass] = useState({
    name: '',
    level: '',
    default_mode: 'OFFLINE',
    default_location: '',
    default_online_link: '',
    start_date: '',
    end_date: '',
  });

  // Modal chi tiết lớp
  const [selectedClass, setSelectedClass] = useState(null);
  const [classDetail, setClassDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Modal chọn học sinh để thêm vào lớp
  const [isAddStudentModalOpen, setIsAddStudentModalOpen] = useState(false);
  const [searchStudent, setSearchStudent] = useState('');

  useEffect(() => {
    fetchClasses();
    fetchAllStudents(); // Lấy danh sách học sinh để thêm vào lớp
  }, []);

  const fetchClasses = async () => {
    try {
      setLoading(true);
      const res = await api.get('/class');
      setClasses(res.data.data || []);
    } catch (err) {
      setError('Không thể tải danh sách lớp học');
    } finally {
      setLoading(false);
    }
  };

  const fetchAllStudents = async () => {
    try {
      const res = await api.get('/students');
      setAllStudents(res.data.data || []);
    } catch (err) {
      console.error('Lỗi tải học sinh:', err);
    }
  };

  const fetchClassDetail = async (classId) => {
    setDetailLoading(true);
    try {
      const res = await api.get(`/class/${classId}`);
      setClassDetail(res.data.data);
    } catch (err) {
      setError('Không thể tải chi tiết lớp');
    } finally {
      setDetailLoading(false);
    }
  };

  const handleAddClass = async (e) => {
    e.preventDefault();
    if (!newClass.name) return alert('Tên lớp là bắt buộc');

    try {
      const res = await api.post('/class', newClass);
      setClasses([...classes, res.data.data]);
      alert('Tạo lớp thành công!');
      setIsAddClassModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Tạo lớp thất bại');
    }
  };

  const handleAddStudentToClass = async (studentId) => {
    if (!selectedClass) return;

    try {
      await api.post(`/class/${selectedClass._id}/assign-student`, {
        student_user_id: studentId,
      });
      alert('Thêm học sinh vào lớp thành công!');
      fetchClassDetail(selectedClass._id); // Refresh chi tiết lớp
      setIsAddStudentModalOpen(false);
    } catch (err) {
      alert(err.response?.data?.message || 'Thêm học sinh thất bại');
    }
  };

  const handleRemoveStudentFromClass = async (studentId) => {
    if (!selectedClass || !window.confirm('Xác nhận xóa học sinh khỏi lớp?')) return;

    try {
      await api.post(`/class/${selectedClass._id}/remove-student`, {
        student_user_id: studentId,
      });
      alert('Xóa học sinh khỏi lớp thành công!');
      fetchClassDetail(selectedClass._id); // Refresh
    } catch (err) {
      alert(err.response?.data?.message || 'Xóa học sinh thất bại');
    }
  };

  const filteredStudents = allStudents.filter((s) =>
    (s.full_name || s.student_full_name || '').toLowerCase().includes(searchStudent.toLowerCase())
  );
const closeDetailModal = () => {
  setSelectedClass(null);
  setClassDetail(null);
  setIsAddStudentModalOpen(false); // nếu có modal con
};
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-8">Quản lý lớp học</h1>

      {error && <div className="p-4 bg-red-100 text-red-700 rounded mb-6">{error}</div>}

      {/* Nút thêm lớp */}
      <div className="mb-6">
        <button
          onClick={() => setIsAddClassModalOpen(true)}
          className="flex items-center gap-2 bg-purple-600 text-white px-5 py-3 rounded-lg hover:bg-purple-700"
        >
          <Plus size={20} /> Tạo lớp mới
        </button>
      </div>

      {/* Danh sách lớp */}
      {loading ? (
        <div className="text-center py-10">
          <Loader2 className="animate-spin mx-auto h-10 w-10 text-purple-600" />
        </div>
      ) : classes.length === 0 ? (
        <p className="text-center text-gray-500 py-10">Chưa có lớp học nào</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {classes.map((cls) => (
            <div key={cls._id} className="bg-white rounded-xl shadow-md p-6 hover:shadow-lg transition">
              <h3 className="text-xl font-semibold text-gray-800 mb-2">{cls.name}</h3>
              <p className="text-sm text-gray-600 mb-1">Cấp độ: {cls.level || 'Chưa xác định'}</p>
              <p className="text-sm text-gray-600 mb-4">Hình thức: {cls.default_mode}</p>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-500 flex items-center gap-1">
                  <Users size={16} /> {cls.enrolled_students?.length || 0} học sinh
                </span>
                <button
                  onClick={() => {
                    setSelectedClass(cls);
                    fetchClassDetail(cls._id);
                  }}
                  className="text-purple-600 hover:text-purple-800 font-medium"
                >
                  Chi tiết →
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Thêm lớp mới */}
      {isAddClassModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-purple-700">Tạo lớp học mới</h2>
              <button onClick={() => setIsAddClassModalOpen(false)}>
                <X size={24} />
              </button>
            </div>
            <form onSubmit={handleAddClass} className="space-y-4">
              <input
                type="text"
                name="name"
                placeholder="Tên lớp *"
                value={newClass.name}
                onChange={(e) => setNewClass({ ...newClass, name: e.target.value })}
                className="w-full p-3 border rounded-lg"
                required
              />
              {/* Các field khác tương tự như trước */}
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setIsAddClassModalOpen(false)} className="px-4 py-2 border rounded-lg">
                  Hủy
                </button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white rounded-lg">
                  Tạo lớp
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Chi tiết lớp */}
      {selectedClass && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4 sticky top-0 bg-white z-10">
              <h2 className="text-2xl font-bold text-purple-700">Lớp: {selectedClass.name}</h2>
              <button onClick={closeDetailModal}>
                <X size={24} />
              </button>
            </div>

            {detailLoading ? (
              <Loader2 className="animate-spin mx-auto h-10 w-10" />
            ) : classDetail ? (
              <>
                {/* Thông tin lớp */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div>
                    <p className="text-sm text-gray-500">Hình thức</p>
                    <p className="font-medium">{classDetail.class.default_mode}</p>
                  </div>
                  {/* Các thông tin khác */}
                </div>

                {/* Danh sách học sinh */}
                <div className="mb-6">
                  <div className="flex justify-between items-center mb-3">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Users size={20} /> Học sinh trong lớp ({classDetail.enrolled_students?.length || 0})
                    </h3>
                    <button
                      onClick={() => setIsAddStudentModalOpen(true)}
                      className="flex items-center gap-1 bg-green-600 text-white px-3 py-1 rounded-lg hover:bg-green-700 text-sm"
                    >
                      <Plus size={16} /> Thêm học sinh
                    </button>
                  </div>

                  {classDetail.enrolled_students?.length > 0 ? (
                    <ul className="space-y-2">
                      {classDetail.enrolled_students.map((enroll) => (
                        <li
                          key={enroll._id}
                          className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"
                        >
                          <div>
                            <p className="font-medium">{enroll.student_user_id?.full_name}</p>
                            <p className="text-sm text-gray-500">{enroll.student_user_id?.email}</p>
                          </div>
                          <button
                            onClick={() => handleRemoveStudentFromClass(enroll.student_user_id._id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 size={18} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="text-center text-gray-500 py-4">Lớp chưa có học sinh nào</p>
                  )}
                </div>
              </>
            ) : (
              <p className="text-red-600 text-center">Không tải được chi tiết lớp</p>
            )}
          </div>
        </div>
      )}

      {/* Modal Chọn học sinh để thêm */}
      {isAddStudentModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Thêm học sinh vào lớp {selectedClass?.name}</h2>
              <button onClick={() => setIsAddStudentModalOpen(false)}>
                <X size={24} />
              </button>
            </div>

            <input
              type="text"
              placeholder="Tìm theo tên học sinh..."
              value={searchStudent}
              onChange={(e) => setSearchStudent(e.target.value)}
              className="w-full p-3 border rounded-lg mb-4"
            />

            <div className="max-h-80 overflow-y-auto">
              {filteredStudents.length === 0 ? (
                <p className="text-center text-gray-500 py-4">Không tìm thấy học sinh</p>
              ) : (
                filteredStudents.map((student) => (
                  <div
                    key={student._id}
                    className="flex justify-between items-center p-3 hover:bg-gray-100 rounded-lg cursor-pointer"
                    onClick={() => handleAddStudentToClass(student._id)}
                  >
                    <div>
                      <p className="font-medium">{student.full_name || student.student_full_name}</p>
                      <p className="text-sm text-gray-500">{student.email}</p>
                    </div>
                    <button className="text-green-600">Thêm</button>
                  </div>
                ))
              )}
            </div>

            <div className="mt-4 flex justify-end">
              <button
                onClick={() => setIsAddStudentModalOpen(false)}
                className="px-4 py-2 border rounded-lg"
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorClasses;