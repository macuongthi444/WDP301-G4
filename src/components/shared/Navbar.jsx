import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState } from 'react';
import { Link } from 'react-router-dom';

function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  return (
    <header className="fixed top-0 left-0 w-full py-4 z-50 bg-white/90 backdrop-blur-md shadow-sm border-b border-white/20 transition-all">
      <div className="max-w-7xl mx-auto px-8 flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2 group">
          <img 
            src="/logo.svg" 
            alt="Sổ tay Gia sư" 
            className="h-10 w-10 md:h-12 md:w-12 object-contain transition-transform group-hover:scale-105" 
          />
          <span className="text-xl md:text-2xl font-extrabold text-slate-800 tracking-tight">
            Sổ tay <span className="text-blue-500">Gia sư</span>
          </span>
        </Link>
        
        {/* Mobile Menu Button */}
        <button 
          className="md:hidden text-2xl text-slate-800"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          <i className={`fa-solid ${isMenuOpen ? 'fa-xmark' : 'fa-bars'}`}></i>
        </button>

        {/* Desktop Navigation */}
        <nav className="hidden md:flex items-center gap-8">
          <a href="#about" className="font-medium text-slate-800 hover:text-blue-500 transition-colors">Về chúng tôi</a>
          <Link to="/contact" className="font-medium text-slate-800 hover:text-blue-500 transition-colors">Liên hệ</Link>
          <Link to="/login" className="bg-green-500 text-white font-semibold py-2.5 px-6 rounded-full hover:bg-green-600 hover:shadow-lg hover:shadow-green-500/30 transition-all">
            Đăng nhập/Đăng ký
          </Link>
        </nav>
      </div>

      {/* Mobile Navigation */}
      {isMenuOpen && (
        <div className="md:hidden bg-white border-b border-slate-100 p-4 absolute top-full left-0 w-full shadow-lg animate-in slide-in-from-top duration-300">
          <nav className="flex flex-col gap-4">
            <a href="#about" onClick={() => setIsMenuOpen(false)} className="font-medium text-slate-800 hover:text-blue-500 transition-colors py-2">Về chúng tôi</a>
            <Link to="/contact" onClick={() => setIsMenuOpen(false)} className="font-medium text-slate-800 hover:text-blue-500 transition-colors py-2">Liên hệ</Link>
            <Link to="/login" onClick={() => setIsMenuOpen(false)} className="bg-green-500 text-white font-semibold py-3 px-6 rounded-xl hover:bg-green-600 text-center transition-all">
              Đăng nhập/Đăng ký
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}

export default Navbar;
