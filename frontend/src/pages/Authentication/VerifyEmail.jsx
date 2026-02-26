// src/pages/VerifyEmail.jsx
import { useState } from 'react';
import api from '../../services/api';

const VerifyEmail = () => {
  const [formData, setFormData] = useState({ email: '', otp: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    try {
      const res = await api.post('/auth/verify-email', formData);
      setMessage(res.data.message);
    } catch (err) {
      setError(err.response?.data?.message || 'Xác thực thất bại');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md">
        <h2 className="text-2xl font-bold text-center mb-6">Xác thực email</h2>
        {message && <p className="text-green-600 text-center mb-4">{message}</p>}
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
        <form onSubmit={handleSubmit}>
          <input
            name="email"
            type="email"
            placeholder="Email của bạn"
            value={formData.email}
            onChange={handleChange}
            className="w-full p-3 mb-4 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <input
            name="otp"
            placeholder="Nhập mã OTP"
            value={formData.otp}
            onChange={handleChange}
            className="w-full p-3 mb-6 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
          <button
            type="submit"
            className="w-full bg-blue-600 text-white p-3 rounded hover:bg-blue-700 transition"
          >
            Xác thực
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;