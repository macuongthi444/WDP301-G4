import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
function Footer() {
  return (
    <footer className="bg-slate-900 text-white pt-16 md:pt-20 pb-8">
      <div className="max-w-7xl mx-auto px-6 md:px-8 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-[2fr_1fr_1fr_1.5fr] gap-8 md:gap-12 mb-12">
        <div>
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Sổ tay Gia sư"
              className="h-12 w-12 object-contain brightness-0 invert"
            />
            <div className="text-2xl font-extrabold text-white tracking-tight">Sổ tay <span className="text-blue-500">Gia sư</span></div>
          </div>
          <p className="text-slate-400 text-sm mt-4">Kết nối gia sư, học sinh và phụ huynh hiệu quả.</p>
          <div className="flex gap-4 mt-4">
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center transition-colors hover:bg-blue-500"><i className="fa-brands fa-facebook"></i></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center transition-colors hover:bg-blue-500"><i className="fa-brands fa-twitter"></i></a>
            <a href="#" className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center transition-colors hover:bg-blue-500"><i className="fa-brands fa-instagram"></i></a>
          </div>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-6">Về chúng tôi</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="text-slate-400 hover:text-green-500 transition-colors">Trang chủ</a></li>
            <li><a href="#" className="text-slate-400 hover:text-green-500 transition-colors">Tính năng</a></li>
            <li><a href="#" className="text-slate-400 hover:text-green-500 transition-colors">Bảng giá</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-6">Hỗ trợ</h4>
          <ul className="space-y-3 text-sm">
            <li><a href="#" className="text-slate-400 hover:text-green-500 transition-colors">Trung tâm trợ giúp</a></li>
            <li><a href="#" className="text-slate-400 hover:text-green-500 transition-colors">Điều khoản sử dụng</a></li>
            <li><a href="#" className="text-slate-400 hover:text-green-500 transition-colors">Chính sách bảo mật</a></li>
          </ul>
        </div>
        <div>
          <h4 className="text-lg font-semibold mb-6">Liên hệ</h4>
          <ul className="space-y-3 text-sm text-slate-400">
            <li><i className="fa-solid fa-envelope w-5 text-center mr-2"></i> egjohnc02@gmail.com</li>
            <li><i className="fa-solid fa-phone w-5 text-center mr-2"></i> 0775352002</li>
            <li><i className="fa-solid fa-location-dot w-5 text-center mr-2"></i> Thành phố Hà Nội, VN</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 pt-8 text-center text-slate-400 text-sm">
        <p>&copy; 2026 Sổ tay Gia sư. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;
