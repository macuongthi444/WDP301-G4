import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorNavbar from '../../components/tutor/TutorNavbar';
import Footer from '../../components/shared/Footer';

function TutorDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({
    classesToday: 0,
    totalClasses: 0,
    totalStudents: 0,
    monthlyProgress: 0,
    loading: true
  });

  // Mock data simulation
  useEffect(() => {
    const timer = setTimeout(() => {
      setStats({
        classesToday: 3,
        totalClasses: 8,
        totalStudents: 25,
        monthlyProgress: 65,
        loading: false
      });
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  const displayName = 'Gia sư';

  return (
    <>
      <TutorNavbar activePage="dashboard" />

      {/* Hero / Greeting Section */}
      <section className="relative pt-24 pb-12 md:pb-16 overflow-hidden bg-gradient-to-r from-[#4ef090] to-blue-500">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between relative z-10">
          <div className="text-white max-w-md text-center md:text-left mb-8 md:mb-0">
            <h1 className="text-2xl sm:text-[26px] font-extrabold leading-tight mb-4">
              Chào {displayName} 👋,<br />Hôm nay bạn dạy <span className="text-yellow-200">{stats.classesToday} lớp</span>
            </h1>
            <button
              onClick={() => navigate('/teaching-schedule')}
              className="bg-gradient-to-r from-emerald-400 to-blue-500 text-white font-bold px-8 py-3 rounded-2xl shadow-lg shadow-blue-500/20 hover:scale-105 transition-all text-[14px]"
            >
              Xem chi tiết
            </button>
          </div>
          <div className="bg-white rounded-[32px] p-6 md:p-8 shadow-xl w-full max-w-sm md:w-80">
            <h3 className="text-slate-400 text-[12px] font-bold uppercase tracking-wider mb-4">Tổng Quan</h3>
            <div className="space-y-6">
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Lớp học</span>
                <span className="text-2xl font-black text-slate-800">{stats.totalClasses}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-600 font-medium">Học sinh</span>
                <span className="text-2xl font-black text-slate-800">{stats.totalStudents}</span>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-[13px] font-bold text-slate-500">Tiến độ tháng này</span>
                  <span className="text-[13px] font-bold text-blue-500">{stats.monthlyProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${stats.monthlyProgress}%` }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <img src="/assent/women with tab 1.png" alt="Tutor" className="absolute bottom-0 left-[3%] h-[50%] md:h-[90%] object-contain z-0 pointer-events-none opacity-30 blur-[2px]" />
      </section>

      {/* Quick Actions Banner */}
      <section className="py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <p className="text-lg font-semibold text-slate-700 mb-6">Gia sư hiện đại cần nhiều hơn một cuốn sổ tay</p>
          <div className="flex justify-center gap-4 flex-wrap">
            <div className="bg-slate-50 py-3 px-5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
              <i className="fa-solid fa-bolt text-pink-500"></i> Dữ liệu số, truy cập mọi nơi, mọi lúc
            </div>
            <div className="bg-slate-50 py-3 px-5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
              <i className="fa-solid fa-bell text-pink-500"></i> Phụ huynh thông tin trực tiếp về buổi học
            </div>
            <div className="bg-slate-50 py-3 px-5 rounded-xl font-medium text-sm flex items-center gap-2 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all cursor-pointer">
              <i className="fa-solid fa-wand-magic-sparkles text-pink-500"></i> Kết hợp giữa AI soạn bài tập cho bạn
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-slate-50" id="features">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-2xl font-bold text-slate-900 text-center mb-12">Tính năng nổi bật</h2>
          <div className="flex flex-col md:flex-row items-center justify-between mb-20 gap-12">
            <div className="flex-1">
              <h3 className="text-xl text-slate-900 mb-3 flex items-center gap-2 font-bold">
                <i className="fa-solid fa-bolt text-blue-500"></i> Điểm danh &amp; Tự động thông báo
              </h3>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">Mỗi buổi học, gia sư chỉ cần bấm "Điểm danh".<br />Hệ thống sẽ tự động gửi thông báo cho phụ huynh.</p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Thao tác tính toán nhanh</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Tích hợp tính năng đánh giá</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Gửi email, thông báo trực tiếp</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-[380px]">
                <div className="flex items-start gap-3 bg-yellow-50 p-4 rounded-xl border-l-4 border-yellow-400">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white bg-yellow-400 shrink-0 text-sm"><i className="fa-solid fa-bell"></i></div>
                  <div className="text-sm">
                    <strong className="text-slate-900 block mb-0.5">Thông báo điểm số</strong>
                    <span className="text-slate-500">Bạn có kết quả bài kiểm tra môn Toán hôm nay.</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col md:flex-row-reverse items-center justify-between mb-12 gap-12">
            <div className="flex-1">
              <h3 className="text-xl text-slate-900 mb-3 flex items-center gap-2 font-bold">
                <i className="fa-solid fa-robot text-purple-600"></i> AI Tạo Bài Tập Tự Động
              </h3>
              <p className="text-sm text-slate-500 mb-5 leading-relaxed">Chỉ cần nhập câu lệnh,<br />AI sẽ tạo bài tập phù hợp với trình độ học sinh.</p>
              <ul className="space-y-2.5">
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Tải bài tập tự động, chính xác</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Đa dạng hình thức trắc nghiệm</li>
                <li className="flex items-center gap-2 text-sm font-medium"><i className="fa-solid fa-check text-green-500 text-xs"></i> Tương tác theo hướng dẫn học sinh</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center">
              <div className="bg-white p-6 rounded-2xl shadow-md w-full max-w-[380px] border border-slate-100">
                <div className="h-2.5 bg-slate-100 rounded mb-3 w-[80%]"></div>
                <div className="h-2.5 bg-slate-100 rounded mb-3 w-[60%]"></div>
                <div className="h-2.5 bg-slate-100 rounded mb-3 w-[90%]"></div>
                <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-500 py-2 px-4 rounded-full text-xs font-semibold mt-3">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Tạo bài tập mới
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-6 text-center">
          <h2 className="text-2xl font-bold text-slate-900 mb-3">Cách Sổ tay Gia sư hoạt động</h2>
          <p className="text-sm text-slate-500 mb-12">Minh bạch buổi học chỉ với 3 bước đơn giản</p>
          <div className="flex flex-col md:flex-row items-start justify-center gap-6 relative">
            <div className="flex-1 flex flex-col items-center px-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-pink-500 text-white flex items-center justify-center text-lg font-bold mb-5 shadow-md">1</div>
              <h4 className="text-base text-slate-900 mb-2 font-semibold">Gia sư tạo buổi học</h4>
              <p className="text-slate-500 text-xs">Tạo lớp và nhận buổi học dễ dàng ra.</p>
            </div>
            <div className="hidden md:block w-20 h-0.5 bg-slate-200 mt-5 shrink-0"></div>
            <div className="flex-1 flex flex-col items-center px-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-blue-500 text-white flex items-center justify-center text-lg font-bold mb-5 shadow-md">2</div>
              <h4 className="text-base text-slate-900 mb-2 font-semibold">Điểm danh &amp; ghi chú</h4>
              <p className="text-slate-500 text-xs">Điểm danh học sinh, ghi nhận điểm tích<br />và hiệu bài tập bằng AI.</p>
            </div>
            <div className="hidden md:block w-20 h-0.5 bg-slate-200 mt-5 shrink-0"></div>
            <div className="flex-1 flex flex-col items-center px-4 relative z-10">
              <div className="w-11 h-11 rounded-full bg-green-500 text-white flex items-center justify-center text-lg font-bold mb-5 shadow-md">3</div>
              <h4 className="text-base text-slate-900 mb-2 font-semibold">Phụ huynh nhận thông báo</h4>
              <p className="text-slate-500 text-xs">Hệ thống tự động gửi thông báo vào<br />nhận xem đã biết.</p>
            </div>
          </div>
        </div>
      </section>


      <Footer />
    </>
  );
}

export default TutorDashboard;
