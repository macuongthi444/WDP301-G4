import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState } from 'react';
import Navbar from '../components/shared/Navbar';
import Footer from '../components/shared/Footer';

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const { name, email, subject, message } = formData;

    // Constructing the mailto link
    // We encode the URI components to handle special characters correctly
    const mailtoLink = `mailto:egjohnc02@gmail.com?subject=${encodeURIComponent(subject || 'Liên hệ từ Sổ tay Gia sư')}&body=${encodeURIComponent(
      `Họ và tên: ${name}\nEmail: ${email}\n\nNội dung:\n${message}`
    )}`;

    window.location.href = mailtoLink;

    // Optional: Reset form or show success message
    alert('Đang mở ứng dụng email của bạn để gửi tin nhắn...');
  };

  return (
    <>
      <Navbar />

      {/* Contact Hero Section */}
      <section className="pt-32 pb-16 bg-gradient-to-br from-[#4ef090] to-blue-500 text-white overflow-hidden relative">
        <div className="max-w-7xl mx-auto px-6 md:px-8 relative z-10 text-center md:text-left flex flex-col md:flex-row items-center justify-between">
          <div className="md:max-w-xl">
            <h1 className="text-4xl md:text-5xl font-black mb-6 leading-tight">Liên hệ với  tôi</h1>
            <p className="text-lg opacity-90 mb-8">Tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn. Hãy kết nối để cùng nhau xây dựng cộng đồng giáo dục thông minh hơn.</p>
          </div>
          <div className="hidden md:block">
            <div className="w-64 h-64 bg-white/10 backdrop-blur-3xl rounded-full flex items-center justify-center animate-pulse">
              <i className="fa-solid fa-headset text-7xl text-white/50"></i>
            </div>
          </div>
        </div>
      </section>

      {/* Main Contact Content */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6 md:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

            {/* Contact Details Card */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100">
              <h2 className="text-2xl font-bold text-slate-900 mb-8">Thông tin chi tiết</h2>

              <div className="space-y-8">
                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-500 flex items-center justify-center text-2xl transition-colors group-hover:bg-blue-500 group-hover:text-white shrink-0">
                    <i className="fa-solid fa-phone"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Số điện thoại</p>
                    <p className="text-xl font-bold text-slate-800">0775352002</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-green-50 text-green-500 flex items-center justify-center text-2xl transition-colors group-hover:bg-green-500 group-hover:text-white shrink-0">
                    <i className="fa-solid fa-envelope"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Email</p>
                    <p className="text-xl font-bold text-slate-800">egjohnc02@gmail.com</p>
                  </div>
                </div>

                <div className="flex items-start gap-6 group">
                  <div className="w-14 h-14 rounded-2xl bg-purple-50 text-purple-500 flex items-center justify-center text-2xl transition-colors group-hover:bg-purple-500 group-hover:text-white shrink-0">
                    <i className="fa-solid fa-location-dot"></i>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-1">Địa chỉ</p>
                    <p className="text-xl font-bold text-slate-800">Thành phố Hà Nội, Việt Nam</p>
                  </div>
                </div>
              </div>

              <div className="mt-12 pt-8 border-t border-slate-100 text-center md:text-left">
                <p className="text-slate-500 mb-4">Theo dõi chúng tôi trên mạng xã hội:</p>
                <div className="flex gap-4 justify-center md:justify-start">
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-500 hover:text-white transition-all"><i className="fa-brands fa-facebook"></i></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-blue-400 hover:text-white transition-all"><i className="fa-brands fa-twitter"></i></a>
                  <a href="#" className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 hover:bg-pink-500 hover:text-white transition-all"><i className="fa-brands fa-instagram"></i></a>
                </div>
              </div>
            </div>

            {/* Quick Contact Form */}
            <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl border border-slate-100 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-[#4ef090]/10 rounded-bl-[100px] z-0"></div>
              <div className="relative z-10">
                <h2 className="text-2xl font-bold text-slate-900 mb-2">Gửi lời nhắn</h2>
                <p className="text-slate-500 mb-8">Chúng tôi sẽ phản hồi bạn trong thời gian sớm nhất.</p>

                <form className="space-y-4" onSubmit={handleSubmit}>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <input
                      type="text"
                      name="name"
                      placeholder="Họ và tên"
                      value={formData.name}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-transparent rounded-xl py-4 px-6 focus:bg-white focus:border-blue-500/30 outline-none transition-all"
                      required
                    />
                    <input
                      type="email"
                      name="email"
                      placeholder="Email"
                      value={formData.email}
                      onChange={handleChange}
                      className="w-full bg-slate-50 border border-transparent rounded-xl py-4 px-6 focus:bg-white focus:border-blue-500/30 outline-none transition-all"
                      required
                    />
                  </div>
                  <input
                    type="text"
                    name="subject"
                    placeholder="Chủ đề"
                    value={formData.subject}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-transparent rounded-xl py-4 px-6 focus:bg-white focus:border-blue-500/30 outline-none transition-all"
                    required
                  />
                  <textarea
                    name="message"
                    rows="4"
                    placeholder="Nội dung lời nhắn"
                    value={formData.message}
                    onChange={handleChange}
                    className="w-full bg-slate-50 border border-transparent rounded-xl py-4 px-6 focus:bg-white focus:border-blue-500/30 outline-none transition-all resize-none"
                    required
                  ></textarea>
                  <button type="submit" className="w-full bg-gradient-to-r from-[#4ef090] to-[#3b82f6] text-white font-bold py-4 rounded-xl shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all">Gửi tin nhắn</button>
                </form>
                <p className="text-[10px] text-slate-400 mt-4 italic">* Tin nhắn sẽ được gửi thông qua ứng dụng Email của bạn.</p>
              </div>
            </div>

          </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Contact;
