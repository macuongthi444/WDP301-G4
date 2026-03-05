import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { Mail, ArrowLeft } from 'lucide-react';

const ForgotPasswordPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    const trimmedEmail = email.trim();
    if (!trimmedEmail) {
      setError('Email không được để trống');
      return;
    }
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email: trimmedEmail });
      toastSuccess('Mã OTP đã được gửi đến email của bạn');
      navigate('/reset-password', { state: { email: trimmedEmail } });
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setError(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // giao diện: nền gradient, form nhập email, nút “Gửi mã OTP”,
    // link trở về đăng nhập và thông báo lỗi
    <div>Forgot</div>
  );
};

export default ForgotPasswordPage;