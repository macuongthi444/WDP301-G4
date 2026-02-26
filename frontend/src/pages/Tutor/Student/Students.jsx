// src/pages/Tutor/TutorStudents.jsx
import React, { useState, useEffect } from 'react';
import { Plus, X, Loader2 } from 'lucide-react';
import api from '../../../services/api'; // Đường dẫn đến file api.js của bạn

const TutorStudents = () => {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State cho modal thêm học sinh
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newStudent, setNewStudent] = useState({
    student_full_name: '',
    email: '',
    phone: '',
    dob: '',
    gender: 'Nam',
    school: '',
    grade: '',
    class_name: '',
    // score: '',           // Nếu backend chưa có field average_score thì tạm bỏ
    // tutor_schedules: [], // Có thể thêm sau nếu cần form phức tạp hơn
  });

  // Fetch danh sách học sinh của tutor
  useEffect(() => {
    fetchStudents();
  }, []);

  const fetchStudents = async () => {
    console.log('Bắt đầu fetch students...');
  try {
    setLoading(true);
    setError(null);

    const res = await api.get('/students'); // hoặc endpoint thực tế

    // Quan trọng: luôn set mảng, dù API trả gì
    const data = res.data?.data || res.data || [];
    console.log('API response:', res.data);
    setStudents(Array.isArray(data) ? data : []);
  } catch (err) {
    setError(err.response?.data?.message || 'Không thể tải danh sách');
    setStudents([]); // ← reset về rỗng khi lỗi
    console.error('Fetch error:', err);
    console.log('Response lỗi:', err.response);
  } finally {
    setLoading(false);
  }
};

  const openModal = () => setIsModalOpen(true);

  const closeModal = () => {
    setIsModalOpen(false);
    setNewStudent({
      student_full_name: '',
      email: '',
      phone: '',
      dob: '',
      gender: 'Nam',
      school: '',
      grade: '',
      class_name: '',
    });
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewStudent((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddStudent = async (e) => {
    e.preventDefault();

    // Validate cơ bản (có thể mở rộng)
    if (!newStudent.student_full_name || !newStudent.email || !newStudent.school) {
      alert('Vui lòng điền đầy đủ: Họ tên, Email, Trường học!');
      return;
    }

    try {
      setLoading(true);

      // Gọi API tạo học sinh (tương ứng controller createStudentByTutor)
      const payload = {
        student_full_name: newStudent.student_full_name.trim(),
        email: newStudent.email.trim().toLowerCase(),
        phone: newStudent.phone?.trim(),
        school: newStudent.school.trim(),
        grade: newStudent.grade?.trim(),
        class_name: newStudent.class_name?.trim(),
        gender: newStudent.gender,
        dob: newStudent.dob || undefined,
        // tutor_schedules: [] // thêm sau nếu cần
      };

      const res = await api.post('/students', payload);

      // Nếu thành công → thêm vào danh sách (hoặc refetch)
      if (res.data.success) {
        // Backend trả về student mới → thêm vào state
        const newStudentData = {
          _id: res.data.data.studentId,
          full_name: res.data.data.student_full_name,
          email: res.data.data.email,
          dob: newStudent.dob,
          gender: newStudent.gender,
          school: newStudent.school,
          status: 'ACTIVE', // hoặc từ response
        };

        setStudents((prev) => [...prev, newStudentData]);
        alert('Thêm học sinh thành công! Mật khẩu đã được gửi qua email.');
        closeModal();
      }
    } catch (err) {
      console.error('Lỗi thêm học sinh:', err);
      const msg = err.response?.data?.message || 'Thêm học sinh thất bại';
      alert(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-purple-700 mb-8">Quản lý học sinh</h1>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
          {error}
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        {/* Bảng danh sách */}
        <div className="lg:w-3/5 bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-6 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-800">Danh sách học sinh</h2>
          </div>

          {loading ? (
            <div className="p-10 flex flex-col items-center justify-center text-gray-500">
              <Loader2 className="h-10 w-10 animate-spin mb-4" />
              <p>Đang tải danh sách...</p>
            </div>
          ) : error ? (
            <div className="p-10 text-center text-red-600">
              {error}
            </div>
          ) : students.length === 0 ? (
            <div className="p-10 text-center text-gray-500">
              Chưa có học sinh nào. Hãy thêm học sinh mới!
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50"> {/* ... */} </thead>
                <tbody className="divide-y divide-gray-200">
                  {students.map((student, index) => (
                    <tr key={student?._id || student?.id || index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student?.full_name || student?.student_full_name || student?.name || 'Chưa cập nhật'}
                      </td>
                      {/* Tương tự cho các field khác, dùng optional chaining ?. */}
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {student?.dob ? new Date(student.dob).toLocaleDateString('vi-VN') : 'Chưa cập nhật'}
                      </td>
                      {/* ... */}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Panel hành động */}
        <div className="lg:w-2/5">
          <div className="bg-white p-6 rounded-xl shadow-md sticky top-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">Hành động</h2>
            <button
              onClick={openModal}
              disabled={loading}
              className="w-full flex items-center justify-center gap-2 bg-purple-600 hover:bg-purple-700 text-white font-medium py-3 px-4 rounded-lg transition disabled:opacity-50"
            >
              <Plus size={20} />
              Thêm học sinh mới
            </button>

            <div className="mt-6 text-sm text-gray-500 space-y-1">
              <p>• Mật khẩu ngẫu nhiên sẽ được gửi qua email học sinh</p>
              <p>• Học sinh có thể đăng nhập ngay sau khi nhận mail</p>
              <p>• Có thể chỉnh sửa thông tin sau khi thêm</p>
            </div>
          </div>
        </div>
      </div>

      {/* Modal thêm học sinh */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg relative">
            <button
              onClick={closeModal}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900"
            >
              <X size={28} />
            </button>

            <div className="p-6">
              <h2 className="text-2xl font-bold text-purple-700 mb-6">Thêm học sinh mới</h2>

              <form onSubmit={handleAddStudent} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Họ và tên <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="student_full_name"
                    value={newStudent.student_full_name}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newStudent.email}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Ngày sinh</label>
                    <input
                      type="date"
                      name="dob"
                      value={newStudent.dob}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Giới tính</label>
                    <select
                      name="gender"
                      value={newStudent.gender}
                      onChange={handleInputChange}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    >
                      <option value="Nam">Nam</option>
                      <option value="Nữ">Nữ</option>
                      <option value="Khác">Khác</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Trường học <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    name="school"
                    value={newStudent.school}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    required
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Lớp / Khối</label>
                    <input
                      type="text"
                      name="grade"
                      value={newStudent.grade}
                      onChange={handleInputChange}
                      placeholder="VD: 10"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Tên lớp</label>
                    <input
                      type="text"
                      name="class_name"
                      value={newStudent.class_name}
                      onChange={handleInputChange}
                      placeholder="VD: 10A1"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-400"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-4 mt-8">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="px-6 py-2 border border-gray-400 text-gray-700 rounded-lg hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 flex items-center gap-2"
                  >
                    {loading && <Loader2 className="h-5 w-5 animate-spin" />}
                    Thêm học sinh
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TutorStudents;