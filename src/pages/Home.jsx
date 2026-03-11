import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';

function Home() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [stats, setStats] = useState({
    totalClasses: 12,
    avgProgress: 60,
    todaySchedule: 3,
    isReal: false
  });

  useEffect(() => {
    // Mock user and stats simulation
    const mockUser = { uid: 'mock-user-123', displayName: 'Gia sư mẫu' };
    const activeRole = localStorage.getItem('activeRole') || 'tutor';
    
    setUser(mockUser);
    setRole(activeRole);
    
    const timer = setTimeout(() => {
      setStats({
        totalClasses: 15,
        avgProgress: 75,
        todaySchedule: 4,
        isReal: true
      });
    }, 500);
    
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Navbar />

      {/* Hero Section */}
      <section className="relative min-h-[80vh] bg-gradient-to-br from-[#4ef090] to-blue-500 pt-32 pb-16 overflow-hidden flex items-center">
        <div className="max-w-7xl mx-auto px-6 md:px-8 w-full flex flex-col md:flex-row items-center justify-between relative z-10">
          
          {/* Content (Top on Mobile, right on desktop) */}
          <div className="w-full md:max-w-[50%] text-white pb-8 md:pb-16 text-center md:text-left order-2 md:order-1 relative z-20">
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-extrabold leading-tight mb-6">Kết Nối Gia Sư, Học Sinh<br className="hidden md:block"/> Và Phụ Huynh<br className="hidden md:block"/> Trên Một Nền Tảng<br className="hidden md:block"/> Thông Minh</h1>
            <p className="text-base sm:text-lg mb-8 opacity-90 max-w-[90%] mx-auto md:mx-0">Quản lý lịch học, theo dõi tiến độ và giao tiếp sẽ dễ dàng trong thời đại công nghệ với giao diện thân thiện.</p>
            <a href="#start" className="bg-white text-blue-500 font-semibold py-3 px-8 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all inline-block">Bắt đầu ngay</a>
          </div>

          {/* Visuals (Decorative cards) */}
          <div className="w-full md:max-w-[45%] relative mb-12 md:mb-0 order-1 md:order-2 flex justify-center z-20">
            <div className="bg-white rounded-2xl p-6 shadow-xl w-72 sm:w-80 text-slate-800 animate-[float_6s_ease-in-out_infinite] md:absolute md:-top-[150px] md:right-0">
              <div className="border-b border-slate-200 pb-2 mb-6">
                <h3 className="text-base font-semibold text-slate-900">Tổng Quan Hệ Thống</h3>
              </div>
              <div>
                <div className="flex justify-between items-center mb-2 text-sm text-slate-500 group cursor-pointer">
                  <span>{role === 'tutor' ? 'Tổng lớp học' : 'Số môn học'}</span>
                  <span className="font-semibold text-slate-900">{stats.totalClasses}</span>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm text-slate-500">
                  <span>Tiến độ trung bình</span>
                  <span className="font-semibold text-blue-500">{stats.avgProgress}%</span>
                </div>
                <div className="w-full h-2 bg-slate-200 rounded-full my-2 overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all duration-500" style={{ width: `${stats.avgProgress}%` }}></div>
                </div>
                <div className="flex justify-between items-center mb-2 text-sm text-slate-500 mt-4 group cursor-pointer">
                  <span>Lịch hôm nay</span>
                  <span className="font-semibold text-slate-900">
                    {role === 'tutor' ? `${stats.todaySchedule} lớp` : (stats.todaySchedule > 0 ? 'Có lịch' : 'Nghỉ')}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Hero Image */}
        <img src="/assent/women with tab 1.png" alt="Tutor" className="absolute bottom-0 left-[5%] h-[40%] md:h-[85%] object-contain z-0 pointer-events-none blur-[4px] opacity-80 -scale-x-100" />
      </section>

      {/* Banner Features Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-8">Gia sư hiện đại cần nhiều hơn một cuốn sổ tay</h2>
          <div className="flex justify-center gap-8 flex-wrap">
            <div className="bg-slate-50 py-4 px-6 rounded-lg font-medium flex items-center gap-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <i className="fa-solid fa-bolt text-pink-500"></i> Kết nối học viên dễ dàng
            </div>
            <div className="bg-slate-50 py-4 px-6 rounded-lg font-medium flex items-center gap-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <i className="fa-solid fa-calendar-check text-pink-500"></i> Lên lịch giảng dạy hiệu quả
            </div>
            <div className="bg-slate-50 py-4 px-6 rounded-lg font-medium flex items-center gap-3 shadow-sm hover:-translate-y-0.5 hover:shadow-md transition-all">
              <i className="fa-solid fa-users text-pink-500"></i> Quản lý học phí và thu nhập
            </div>
          </div>
        </div>
      </section>

      {/* Highlighted Features */}
      <section className="py-16 md:py-20 bg-slate-50" id="features">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-slate-900 text-center mb-12">Tính năng nổi bật</h2>

          {/* Feature 1 */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 md:mb-24 gap-8 md:gap-16">
            <div className="flex-1 order-2 md:order-1">
              <h3 className="text-xl md:text-2xl text-slate-900 mb-4 flex items-center gap-3"><i className="fa-solid fa-bolt text-blue-500"></i> Điểm danh & Tự động thông báo</h3>
              <p className="text-base md:text-lg text-slate-500 mb-6">Gửi thông báo, ghi chú cho cuộc họp nhanh chóng. Hệ thống sẽ tự động gửi thông báo cho phụ huynh sau mỗi buổi học về tình hình của học sinh.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 font-medium"><i className="fa-solid fa-check text-green-500"></i> Thao tác tính toán nhanh</li>
                <li className="flex items-center gap-3 font-medium"><i className="fa-solid fa-check text-green-500"></i> Tích hợp tính năng đánh giá</li>
                <li className="flex items-center gap-3 font-medium"><i className="fa-solid fa-check text-green-500"></i> Gửi email, thông báo ứng dụng</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center order-1 md:order-2">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-[400px] relative">
                <div className="flex items-start gap-4 bg-slate-50 p-4 rounded-lg border-l-4 border-yellow-400">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white bg-yellow-400 shrink-0"><i className="fa-solid fa-bell"></i></div>
                  <div className="flex flex-col text-sm">
                    <strong className="text-slate-900 mb-1">Thông báo điểm số</strong>
                    <span>Bạn có kết quả bài kiểm tra môn Toán...</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="flex flex-col md:flex-row items-center justify-between mb-16 md:mb-24 gap-8 md:gap-16">
            <div className="flex-1 order-2">
              <h3 className="text-xl md:text-2xl text-slate-900 mb-4 flex items-center gap-3"><i className="fa-solid fa-robot text-purple-600"></i> AI Tạo Bài Tập Tự Động</h3>
              <p className="text-base md:text-lg text-slate-500 mb-6">Tiết kiệm thời gian soạn bài. AI sẽ tự tạo bài tập dựa trên đề cương/sách giáo khoa mà bạn đã tải lên.</p>
              <ul className="space-y-3">
                <li className="flex items-center gap-3 font-medium"><i className="fa-solid fa-check text-green-500"></i> Tải bài tập tự động, chính xác</li>
                <li className="flex items-center gap-3 font-medium"><i className="fa-solid fa-check text-green-500"></i> Đa dạng hình thức: trắc nghiệm, tự luận</li>
                <li className="flex items-center gap-3 font-medium"><i className="fa-solid fa-check text-green-500"></i> Tiết kiệm thời gian, công sức</li>
              </ul>
            </div>
            <div className="flex-1 flex justify-center order-1">
              <div className="bg-white p-6 md:p-8 rounded-2xl shadow-lg w-full max-w-[400px] relative border border-slate-200">
                <div className="h-3 bg-slate-200 rounded mb-4 w-[80%]"></div>
                <div className="h-3 bg-slate-200 rounded mb-4 w-[60%]"></div>
                <div className="h-3 bg-slate-200 rounded mb-4 w-[90%]"></div>
                <div className="inline-flex items-center gap-2 bg-pink-50 text-pink-500 py-2 px-4 rounded-full text-sm font-semibold mt-4">
                  <i className="fa-solid fa-wand-magic-sparkles"></i> Tạo bài tập mới
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-8 text-center">
          <h2 className="text-3xl font-bold text-slate-900 mb-4">Cách Sổ tay Gia sư hoạt động</h2>
          <p className="text-lg text-slate-500 mb-16">Dễ dàng quản lý với 3 bước đơn giản</p>

          <div className="flex justify-center flex-col md:flex-row items-center md:items-start gap-8 relative">
            <div className="flex-1 flex flex-col items-center px-4 relative z-10 w-full">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">1</div>
              <h4 className="text-xl text-slate-900 mb-3 font-semibold">Tạo sự kiện lớp học</h4>
              <p className="text-slate-500 text-sm">Tạo lớp và chia lịch học cực kỳ dễ dàng.</p>
            </div>
            <div className="hidden md:block w-24 h-0.5 bg-slate-200 mt-6 relative z-0 shrink-0"></div>
            <div className="flex-1 flex flex-col items-center px-4 relative z-10 w-full">
              <div className="w-12 h-12 rounded-full bg-pink-500 text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">
                <i className="fa-solid fa-plus"></i>
              </div>
              <h4 className="text-xl text-slate-900 mb-3 font-semibold">Điểm danh & ghi chú</h4>
              <p className="text-slate-500 text-sm">Điểm danh học sinh, ghi chú bài học và đánh giá buổi học.</p>
            </div>
            <div className="hidden md:block w-24 h-0.5 bg-slate-200 mt-6 relative z-0 shrink-0"></div>
            <div className="flex-1 flex flex-col items-center px-4 relative z-10 w-full">
              <div className="w-12 h-12 rounded-full bg-blue-500 text-white flex items-center justify-center text-xl font-bold mb-6 shadow-md">3</div>
              <h4 className="text-xl text-slate-900 mb-3 font-semibold">Phụ huynh nhận thông báo</h4>
              <p className="text-slate-500 text-sm">Hệ thống tự động gửi thông báo sau mỗi buổi học.</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-green-500 py-16 md:py-20 text-white">
        <div className="max-w-7xl mx-auto px-6 md:px-8 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">Nâng cấp cách bạn dạy học ngay hôm nay</h2>
          <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto mb-8">Sổ Tay Gia Sư giúp bạn quản lý chuyên nghiệp hơn, kết nối cùng phụ huynh và học sinh toàn diện hơn.</p>
          <a href="#register" className="bg-white text-blue-500 font-semibold py-3 px-8 rounded-full shadow-md hover:shadow-lg hover:-translate-y-0.5 transition-all text-lg inline-block">Tạo tài khoản miễn phí</a>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Home;
