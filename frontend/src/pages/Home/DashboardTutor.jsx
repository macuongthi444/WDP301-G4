
import { useContext, useState } from 'react';
import { Link } from 'react-router-dom';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { PlusIcon, PencilIcon, TrashIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import { useClass } from '../../context/ClassContext';
import { AuthContext } from '../../context/AuthContext';


export default function Dashboard() {
  const { user } = useContext(AuthContext);
  const { myClasses, loadingClasses, fetchMyClasses } = useClass();

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [currentClassEdit, setCurrentClassEdit] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    level: '',
    default_mode: 'OFFLINE',
    default_location: '',
    default_online_link: '',
    start_date: '',
    end_date: '',
  });

  const handleOpenCreate = () => {
    setIsEditMode(false);
    setCurrentClassEdit(null);
    setFormData({
      name: '',
      level: '',
      default_mode: 'OFFLINE',
      default_location: '',
      default_online_link: '',
      start_date: '',
      end_date: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (cls) => {
    setIsEditMode(true);
    setCurrentClassEdit(cls);
    setFormData({
      name: cls.name || '',
      level: cls.level || '',
      default_mode: cls.default_mode || 'OFFLINE',
      default_location: cls.default_location || '',
      default_online_link: cls.default_online_link || '',
      start_date: cls.start_date ? cls.start_date.split('T')[0] : '',
      end_date: cls.end_date ? cls.end_date.split('T')[0] : '',
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Tên lớp là bắt buộc');
      return;
    }

    try {
      let res;
      if (isEditMode) {
        res = await api.put(`/class/${currentClassEdit._id}`, formData);
        toast.success('Cập nhật lớp thành công');
      } else {
        res = await api.post('/class', formData);
        toast.success('Tạo lớp thành công');
      }

      await fetchMyClasses();
      setIsModalOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi lưu lớp');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn chắc chắn muốn xóa lớp này? Học viên và dữ liệu liên quan sẽ bị xóa.')) return;

    try {
      await api.delete(`/class/${id}`);
      toast.success('Xóa lớp thành công');
      fetchMyClasses();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Lỗi khi xóa lớp');
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  if (loadingClasses) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-lg text-gray-600 animate-pulse">Đang tải lớp học...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header giống Google Classroom */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-10 gap-4">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900">Các lớp của bạn</h1>
        <button
          onClick={handleOpenCreate}
          className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-full font-medium shadow-md transition-all flex items-center gap-2 text-lg"
        >
          <PlusIcon className="w-6 h-6" />
          Tạo lớp
        </button>
      </div>

      {/* Không có lớp */}
      {myClasses.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-200">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Bạn chưa có lớp học nào</h2>
          <p className="text-gray-600 mb-8 max-w-md mx-auto">
            Tạo lớp học đầu tiên để bắt đầu quản lý học viên, bài giảng, lịch dạy và bài tập.
          </p>
          <button
            onClick={handleOpenCreate}
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-full font-medium shadow-lg transition-all text-lg flex items-center gap-3 mx-auto"
          >
            <PlusIcon className="w-7 h-7" />
            Tạo lớp mới
          </button>
        </div>
      ) : (
        /* Grid card lớp - giống GC */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {myClasses.map((cls) => (
            <div
              key={cls._id}
              className="group bg-white rounded-2xl shadow-md overflow-hidden hover:shadow-xl transition-all duration-300 border border-gray-200"
            >
              {/* Banner gradient giống GC */}
              <div className="h-48 bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-600 relative">
                <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-colors" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <h2 className="text-5xl font-bold text-white opacity-90 group-hover:opacity-100 transition-opacity">
                    {cls.name?.charAt(0)?.toUpperCase() || '?'}
                  </h2>
                </div>
              </div>

              {/* Nội dung card */}
              <div className="p-6">
                <div className="flex justify-between items-start mb-3">
                  <Link
                    to={`/classes/${cls._id}/stream`}
                    className="block flex-1"
                  >
                    <h3 className="text-xl font-semibold text-gray-900 group-hover:text-blue-700 transition-colors line-clamp-2">
                      {cls.name}
                    </h3>
                  </Link>

                  {/* Actions */}
                  <div className="flex gap-2 opacity-70 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleOpenEdit(cls)} title="Chỉnh sửa lớp">
                      <PencilIcon className="w-5 h-5 text-gray-600 hover:text-blue-600 transition-colors" />
                    </button>
                    <button onClick={() => handleDelete(cls._id)} title="Xóa lớp">
                      <TrashIcon className="w-5 h-5 text-gray-600 hover:text-red-600 transition-colors" />
                    </button>
                  </div>
                </div>

                {/* Info ngắn gọn */}
                <div className="text-sm text-gray-600 space-y-1.5">
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Trình độ:</span> {cls.level || 'Chưa thiết lập'}
                  </p>
                  <p className="flex items-center gap-2">
                    <span className="font-medium">Hình thức:</span> {cls.default_mode || 'Offline'}
                  </p>
                  {cls.start_date && (
                    <p className="flex items-center gap-2">
                      <span className="font-medium">Thời gian:</span>{' '}
                      {new Date(cls.start_date).toLocaleDateString('vi-VN')} →{' '}
                      {cls.end_date ? new Date(cls.end_date).toLocaleDateString('vi-VN') : 'Đang diễn ra'}
                    </p>
                  )}
                  <p className="text-gray-500 font-medium mt-3">
                    Học viên: ? (sẽ cập nhật sau khi tích hợp enrollment count)
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal tạo/sửa lớp - thiết kế giống GC hơn */}
      <Transition appear show={isModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-50" onClose={() => setIsModalOpen(false)}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/40" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Transition.Child
                as={Fragment}
                enter="ease-out duration-300"
                enterFrom="opacity-0 scale-95"
                enterTo="opacity-100 scale-100"
                leave="ease-in duration-200"
                leaveFrom="opacity-100 scale-100"
                leaveTo="opacity-0 scale-95"
              >
                <Dialog.Panel className="w-full max-w-xl transform overflow-hidden rounded-2xl bg-white p-8 shadow-2xl transition-all">
                  <Dialog.Title className="text-2xl font-bold text-gray-900 mb-6">
                    {isEditMode ? 'Chỉnh sửa lớp học' : 'Tạo lớp học mới'}
                  </Dialog.Title>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Tên lớp <span className="text-red-500">*</span>
                      </label>
                      <input
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        placeholder="Ví dụ: Toán 10 - Nhóm A"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Trình độ</label>
                        <input
                          name="level"
                          value={formData.level}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Cơ bản / Nâng cao / IELTS 7.0..."
                        />
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Hình thức mặc định</label>
                        <select
                          name="default_mode"
                          value={formData.default_mode}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        >
                          <option value="OFFLINE">Học trực tiếp (Offline)</option>
                          <option value="ONLINE">Học trực tuyến (Online)</option>
                          <option value="HYBRID">Kết hợp</option>
                        </select>
                      </div>
                    </div>

                    {formData.default_mode !== 'OFFLINE' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Link online (Zoom / Meet...)</label>
                        <input
                          name="default_online_link"
                          value={formData.default_online_link}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="https://meet.google.com/xxx-yyy-zzz"
                        />
                      </div>
                    )}

                    {formData.default_mode !== 'ONLINE' && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Địa điểm học</label>
                        <input
                          name="default_location"
                          value={formData.default_location}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                          placeholder="Số nhà, đường, quận/huyện..."
                        />
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày bắt đầu</label>
                        <input
                          type="date"
                          name="start_date"
                          value={formData.start_date}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Ngày kết thúc</label>
                        <input
                          type="date"
                          name="end_date"
                          value={formData.end_date}
                          onChange={handleChange}
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
                        />
                      </div>
                    </div>

                    <div className="mt-10 flex justify-end gap-4">
                      <button
                        type="button"
                        onClick={() => setIsModalOpen(false)}
                        className="px-6 py-3 text-gray-700 hover:bg-gray-100 rounded-xl transition font-medium"
                      >
                        Hủy
                      </button>
                      <button
                        type="submit"
                        className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium shadow-md transition"
                      >
                        {isEditMode ? 'Cập nhật lớp' : 'Tạo lớp'}
                      </button>
                    </div>
                  </form>
                </Dialog.Panel>
              </Transition.Child>
            </div>
          </div>
        </Dialog>
      </Transition>
    </div>
  );
}