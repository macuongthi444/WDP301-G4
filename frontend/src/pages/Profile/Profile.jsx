import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import { toastSuccess, toastError } from '../../utils/toast';
import {
  User,
  Mail,
  Phone,
  Lock,
  ArrowLeft,
  Eye,
  EyeOff,
  Edit2,
  Save,
  X,
} from 'lucide-react';

const ProfilePage = () => {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Profile data
  const [profileData, setProfileData] = useState({
    full_name: user?.full_name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    roles: user?.roles || [],
    status: user?.status || '',
  });

  // Edit phone state
  const [editedPhone, setEditedPhone] = useState(profileData.phone);
  const [phoneError, setPhoneError] = useState('');
  const [phoneLoading, setPhoneLoading] = useState(false);

  // Change password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);

  // Avatar generation
  const stringToColor = (str) => {
    if (!str) return '#6b7280';
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      hash = str.charCodeAt(i) + ((hash << 5) - hash);
    }
    let color = '#';
    for (let i = 0; i < 3; i++) {
      const value = (hash >> (i * 8)) & 0xff;
      color += ('00' + value.toString(16)).slice(-2);
    }
    return color;
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const trimmed = name.trim();
    if (!trimmed) return '?';
    const words = trimmed.split(/\s+/).filter(Boolean);
    if (words.length >= 2) {
      return ((words[0][0] || '') + (words[words.length - 1][0] || '')).toUpperCase();
    }
    return trimmed.slice(0, 2).toUpperCase();
  };

  // Handle edit phone submit
  const handleEditPhoneSubmit = async (e) => {
    e.preventDefault();
    setPhoneError('');
    const phoneTrimmed = editedPhone.trim();

    // Validate phone
    if (phoneTrimmed && !/^(84|0[3-9])[0-9]{8,9}$/.test(phoneTrimmed)) {
      setPhoneError('Số điện thoại không hợp lệ. Vui lòng kiểm tra lại.');
      return;
    }

    setPhoneLoading(true);

    try {
      const response = await api.put('/user/profile', {
        phone: phoneTrimmed || null,
      });

      setProfileData({
        ...profileData,
        phone: response.data.user.phone || '',
      });
      setEditedPhone(response.data.user.phone || '');
      setIsEditingPhone(false);
      toastSuccess('Cập nhật số điện thoại thành công!');
    } catch (err) {
      const msg = err?.response?.data?.message || 'Cập nhật thất bại';
      setPhoneError(msg);
      toastError(msg);
    } finally {
      setPhoneLoading(false);
    }
  };

  // Handle change password
  const validatePasswordForm = () => {
    const errors = {};

    if (!passwordForm.currentPassword.trim()) {
      errors.currentPassword = 'Mật khẩu hiện tại không được để trống';
    }
    if (!passwordForm.newPassword) {
      errors.newPassword = 'Mật khẩu mới không được để trống';
    } else if (passwordForm.newPassword.length < 8) {
      errors.newPassword = 'Mật khẩu phải có ít nhất 8 ký tự';
    }
    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Xác nhận mật khẩu không được để trống';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Mật khẩu xác nhận không khớp';
    }
    if (
      passwordForm.currentPassword === passwordForm.newPassword &&
      passwordForm.currentPassword.trim()
    ) {
      errors.newPassword = 'Mật khẩu mới không được giống mật khẩu cũ';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess(false);
    setPasswordErrors({});

    if (!validatePasswordForm()) return;

    setPasswordLoading(true);

    try {
      await api.post('/auth/change-password', {
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword,
      });

      setPasswordSuccess(true);
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toastSuccess('Đổi mật khẩu thành công! Vui lòng đăng nhập lại.');

      // Auto logout sau 2s
      setTimeout(() => {
        logout();
        navigate('/login');
      }, 2000);
    } catch (err) {
      const msg = err?.response?.data?.message || 'Đổi mật khẩu thất bại';
      setPasswordErrors({ general: msg });
      toastError(msg);
    } finally {
      setPasswordLoading(false);
    }
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordForm((prev) => ({ ...prev, [name]: value }));
    // Clear error for this field
    if (passwordErrors[name]) {
      setPasswordErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Gradient background */}
      <div className="absolute inset-x-0 top-0 -z-10 h-[260px] bg-gradient-to-b from-emerald-300 via-sky-400 to-indigo-600" />

      <div className="mx-auto min-h-screen max-w-4xl px-6 py-6">
        {/* Back button */}
        <div className="mb-6">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900 transition"
          >
            <ArrowLeft className="h-4 w-4" />
            Quay lại
          </button>
        </div>

        {/* Main card */}
        <div className="overflow-hidden rounded-3xl bg-white shadow-xl ring-1 ring-black/5">
          {/* Header with avatar */}
          <div className="relative bg-gradient-to-r from-emerald-300 via-sky-400 to-indigo-600 px-6 py-10">
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-6">
              {/* Avatar */}
              <div
                className="h-24 w-24 rounded-full shadow-lg flex items-center justify-center flex-shrink-0 border-4 border-white"
                style={{ backgroundColor: stringToColor(profileData.full_name) }}
              >
                <span className="text-3xl font-bold text-white">
                  {getInitials(profileData.full_name)}
                </span>
              </div>

              {/* Name */}
              <div className="text-center sm:text-left flex-1">
                <h1 className="text-3xl font-extrabold text-white">
                  {profileData.full_name}
                </h1>
                <div className="flex gap-2 mt-2 flex-wrap justify-center sm:justify-start">
                  {profileData.roles && profileData.roles.length > 0 && (
                    profileData.roles.map((role) => (
                      <span
                        key={role}
                        className="inline-block bg-white/20 backdrop-blur-sm text-white px-3 py-1 rounded-full text-xs font-semibold"
                      >
                        {role}
                      </span>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 sm:p-8 space-y-8">
            {/* Basic Info Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Thông tin cá nhân</h2>

              <div className="space-y-4">
                {/* Email */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Email
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <input
                      type="email"
                      value={profileData.email}
                      disabled
                      className="w-full bg-transparent text-slate-700 outline-none"
                    />
                  </div>
                </div>

                {/* Full Name */}
                <div>
                  <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Họ và tên
                  </label>
                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 shadow-sm">
                    <User className="h-5 w-5 text-slate-400" />
                    <input
                      type="text"
                      value={profileData.full_name}
                      disabled
                      className="w-full bg-transparent text-slate-700 outline-none"
                    />
                  </div>
                </div>

                {/* Phone - Edit Mode */}
                {!isEditingPhone && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Số điện thoại
                    </label>
                    <div className="flex items-center gap-3">
                      <div className="flex-1 flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-3 shadow-sm">
                        <Phone className="h-5 w-5 text-slate-400" />
                        <input
                          type="tel"
                          value={profileData.phone || '(Chưa cập nhật)'}
                          disabled
                          className="w-full bg-transparent text-slate-700 outline-none"
                        />
                      </div>
                      <button
                        onClick={() => setIsEditingPhone(true)}
                        className="rounded-lg bg-blue-50 p-2.5 text-blue-600 hover:bg-blue-100 transition"
                        title="Chỉnh sửa số điện thoại"
                      >
                        <Edit2 className="h-5 w-5" />
                      </button>
                    </div>
                  </div>
                )}

                {/* Phone - Edit Form */}
                {isEditingPhone && (
                  <div>
                    <label className="mb-1.5 block text-sm font-semibold text-slate-700">
                      Số điện thoại
                    </label>
                    <form onSubmit={handleEditPhoneSubmit} className="space-y-3">
                      <div className="flex items-center gap-2 rounded-xl border px-3 py-3 shadow-sm focus-within:ring-2 transition"
                        style={{
                          borderColor: phoneError ? '#fecaca' : '#e2e8f0',
                          backgroundColor: phoneError ? '#fef2f2' : '#ffffff',
                        }}
                      >
                        <Phone className="h-5 w-5 text-slate-400" />
                        <input
                          type="tel"
                          placeholder="Nhập số điện thoại (VN)"
                          value={editedPhone}
                          onChange={(e) => {
                            setEditedPhone(e.target.value);
                            setPhoneError('');
                          }}
                          className="w-full bg-transparent outline-none text-slate-700"
                        />
                      </div>
                      {phoneError && (
                        <p className="text-sm text-red-600">{phoneError}</p>
                      )}
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={phoneLoading}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg bg-blue-600 text-white font-semibold py-2.5 hover:bg-blue-700 disabled:bg-slate-300 transition"
                        >
                          <Save className="h-4 w-4" />
                          {phoneLoading ? 'Đang lưu...' : 'Lưu'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingPhone(false);
                            setEditedPhone(profileData.phone);
                            setPhoneError('');
                          }}
                          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-300 bg-white text-slate-700 font-semibold py-2.5 hover:bg-slate-50 transition"
                        >
                          <X className="h-4 w-4" />
                          Hủy
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>

            {/* Divider */}
            <div className="border-t border-slate-200" />

            {/* Change Password Section */}
            <div>
              <h2 className="text-xl font-bold text-slate-900 mb-4">Bảo mật</h2>

              {passwordSuccess && (
                <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
                  ✓ Đổi mật khẩu thành công! Bạn sẽ được chuyển hướng để đăng nhập lại.
                </div>
              )}

              {passwordErrors.general && (
                <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {passwordErrors.general}
                </div>
              )}

              <form onSubmit={handleChangePasswordSubmit} className="space-y-4">
                {/* Current Password */}
                <div>
                  <label htmlFor="currentPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mật khẩu hiện tại <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-3 shadow-sm focus-within:ring-2 transition ${
                    passwordErrors.currentPassword
                      ? 'border-red-200 bg-red-50 focus-within:ring-red-500'
                      : 'border-slate-200 bg-white focus-within:ring-indigo-500'
                  }`}>
                    <Lock className="h-5 w-5 text-slate-400" />
                    <input
                      id="currentPassword"
                      type={showCurrentPassword ? 'text' : 'password'}
                      name="currentPassword"
                      value={passwordForm.currentPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu hiện tại"
                      className="flex-1 bg-transparent outline-none text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showCurrentPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.currentPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword}</p>
                  )}
                </div>

                {/* New Password */}
                <div>
                  <label htmlFor="newPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Mật khẩu mới <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-3 shadow-sm focus-within:ring-2 transition ${
                    passwordErrors.newPassword
                      ? 'border-red-200 bg-red-50 focus-within:ring-red-500'
                      : 'border-slate-200 bg-white focus-within:ring-indigo-500'
                  }`}>
                    <Lock className="h-5 w-5 text-slate-400" />
                    <input
                      id="newPassword"
                      type={showNewPassword ? 'text' : 'password'}
                      name="newPassword"
                      value={passwordForm.newPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập mật khẩu mới (tối thiểu 8 ký tự)"
                      className="flex-1 bg-transparent outline-none text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showNewPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.newPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword}</p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label htmlFor="confirmPassword" className="mb-1.5 block text-sm font-semibold text-slate-700">
                    Xác nhận mật khẩu <span className="text-red-500">*</span>
                  </label>
                  <div className={`flex items-center gap-2 rounded-xl border px-3 py-3 shadow-sm focus-within:ring-2 transition ${
                    passwordErrors.confirmPassword
                      ? 'border-red-200 bg-red-50 focus-within:ring-red-500'
                      : 'border-slate-200 bg-white focus-within:ring-indigo-500'
                  }`}>
                    <Lock className="h-5 w-5 text-slate-400" />
                    <input
                      id="confirmPassword"
                      type={showConfirmPassword ? 'text' : 'password'}
                      name="confirmPassword"
                      value={passwordForm.confirmPassword}
                      onChange={handlePasswordChange}
                      placeholder="Nhập lại mật khẩu mới"
                      className="flex-1 bg-transparent outline-none text-slate-700"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="text-slate-400 hover:text-slate-600"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="h-5 w-5" />
                      ) : (
                        <Eye className="h-5 w-5" />
                      )}
                    </button>
                  </div>
                  {passwordErrors.confirmPassword && (
                    <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword}</p>
                  )}
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={passwordLoading || passwordSuccess}
                  className="w-full rounded-lg bg-indigo-600 text-white font-semibold py-3 hover:bg-indigo-700 disabled:bg-slate-300 transition mt-6"
                >
                  {passwordLoading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
