import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api';
import { toastSuccess, toastError } from '../../utils/toast';
import { Mail, Key, Lock, ArrowLeft, Eye, EyeOff } from 'lucide-react';

const ResetPasswordPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const prefilledEmail = location.state?.email || '';
  const [formData, setFormData] = useState({
    email: prefilledEmail,
    otp: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = () => {
    const newErrors = {};
    const emailTrimmed = formData.email.trim();
    if (!emailTrimmed) newErrors.email = 'Email không được để trống';
    else if (!/^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$/.test(emailTrimmed)) {
      newErrors.email = 'Email không hợp lệ';
    }
    if (!formData.otp.trim()) newErrors.otp = 'Mã OTP không được để trống';
    if (!formData.newPassword) newErrors.newPassword = 'Mật khẩu mới không được để trống';
    else if (formData.newPassword.length < 6) {
      newErrors.newPassword = 'Mật khẩu phải có ít nhất 6 ký tự';
    }
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    if (!validate()) return;
    setLoading(true);
    try {
      await api.post('/auth/reset-password', {
        email: formData.email.trim(),
        otp: formData.otp.trim(),
        newPassword: formData.newPassword,
      });
      toastSuccess('Đặt lại mật khẩu thành công. Vui lòng đăng nhập lại.');
      navigate('/login');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại.';
      setErrorMessage(msg);
      toastError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    // giao diện: gồm input email, OTP, mật khẩu mới, xác nhận mật khẩu,
    // button toggles hiển thị mật khẩu và link quay lại đăng nhập,
    // đồng thời hiển thị lỗi/ngắt quãng nếu có
    <div>Reset</div>
  );
};

export default ResetPasswordPage;