// src/pages/Authentication/VerifyEmail.jsx
import { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { AuthContext } from '../../context/AuthContext';

const VerifyEmail = () => {
  const { pendingEmail, setPendingEmail } = useContext(AuthContext);
  const navigate = useNavigate();

  const [otp, setOtp] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Bảo vệ: nếu không có pendingEmail → quay về đăng ký
  useEffect(() => {
    if (!pendingEmail) {
      navigate('/auth/register', { replace: true });
    }
  }, [pendingEmail, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await api.post('/auth/verify-email', {
        email: pendingEmail,   // ← tự động dùng email từ context
        otp,
      });

      setMessage(res.data.message || 'Xác thực thành công!');
      setPendingEmail(null); // xóa sau khi verify OK

      // Chuyển về login sau 2 giây (hoặc dashboard nếu muốn)
      setTimeout(() => navigate('/auth/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực thất bại. OTP sai hoặc hết hạn.');
    }
  };

  if (!pendingEmail) return null; // tránh render nếu không có email

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-xl shadow-xl w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Xác thực email</h2>
        
        <p className="text-center mb-6 text-gray-600">
          Chúng tôi đã gửi mã OTP đến <strong>{pendingEmail}</strong>
        </p>

        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}

        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Nhập mã OTP"
            value={otp}
            onChange={(e) => setOtp(e.target.value)}
            className="w-full p-3 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
            maxLength={6}
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
          >
            Xác thực
          </button>
        </form>

        {/* Có thể thêm nút gửi lại OTP nếu backend hỗ trợ */}
      </div>
    </div>
  );
};

export default VerifyEmail;