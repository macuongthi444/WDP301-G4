import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useNavigate } from 'react-router-dom';

function RoleSelection() {
  const navigate = useNavigate();

  const handleSelect = (role) => {
    localStorage.setItem('activeRole', role);
    navigate('/student-home');
  };

  return (
    <div className="bg-slate-50 min-h-screen flex flex-col items-center justify-center p-6 bg-[radial-gradient(circle_at_top_right,_var(--tw-gradient-stops))] from-blue-50 via-white to-emerald-50">
      <div className="w-full max-w-2xl text-center space-y-12">
        <div className="space-y-4">
          <h1 className="text-[32px] md:text-[40px] font-black text-slate-900 tracking-tight leading-tight">
            Chào mừng bạn đến với <span className="text-blue-500">Sổ tay Gia sư</span>
          </h1>
          <p className="text-slate-500 font-bold text-lg">Hôm nay bạn sử dụng ứng dụng với vai trò gì?</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Student Role */}
          <button 
            onClick={() => handleSelect('student')}
            className="group relative bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-xl shadow-slate-200/50 hover:border-blue-400 hover:scale-105 active:scale-95 transition-all duration-300 text-center"
          >
            <div className="w-24 h-24 bg-blue-50 text-blue-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-blue-500 group-hover:text-white transition-all shadow-lg shadow-blue-500/10">
              <i className="fa-solid fa-user-graduate text-[40px]"></i>
            </div>
            <h2 className="text-[20px] font-black text-slate-800 mb-2">Tôi là Học sinh</h2>
            <p className="text-slate-400 text-sm font-medium">Báo cáo học tập, xem bài tập và giáo trình.</p>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-8 h-8 rounded-full bg-blue-50 text-blue-500 flex items-center justify-center">
                  <i className="fa-solid fa-arrow-right"></i>
               </div>
            </div>
          </button>

          {/* Parent Role */}
          <button 
            onClick={() => handleSelect('parent')}
            className="group relative bg-white border-2 border-slate-100 rounded-[40px] p-10 shadow-xl shadow-slate-200/50 hover:border-emerald-400 hover:scale-105 active:scale-95 transition-all duration-300 text-center"
          >
            <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mx-auto mb-8 group-hover:bg-emerald-500 group-hover:text-white transition-all shadow-lg shadow-emerald-500/10">
              <i className="fa-solid fa-user-group text-[40px]"></i>
            </div>
            <h2 className="text-[20px] font-black text-slate-800 mb-2">Tôi là Phụ huynh</h2>
            <p className="text-slate-400 text-sm font-medium">Theo dõi tiến độ, nhận thông báo điểm danh.</p>
            <div className="absolute top-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
               <div className="w-8 h-8 rounded-full bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <i className="fa-solid fa-arrow-right"></i>
               </div>
            </div>
          </button>
        </div>

        <p className="text-slate-400 text-sm font-medium">
          Bạn có thể thay đổi vai trò bất cứ lúc nào trong cài đặt tài khoản.
        </p>
      </div>
    </div>
  );
}

export default RoleSelection;
