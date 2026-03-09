import React, { useEffect, useRef, useState } from 'react';
import { Search, Users, ChevronDown, Loader2 } from 'lucide-react';
import api from '../../services/api';

const STATUS_OPTIONS = [
  { value: '', label: 'Tất cả trạng thái' },
  { value: 'PENDING', label: 'Chờ duyệt' },
  { value: 'ACTIVE', label: 'Hoạt động' },
  { value: 'INACTIVE', label: 'Không hoạt động' },
];

const ROLE_LABELS = {
  ADMIN: 'Admin',
  TUTOR: 'Gia sư',
  STUDENT: 'Học sinh',
  PARENT: 'Phụ huynh',
};

const STATUS_LABELS = {
  PENDING: 'Chờ duyệt',
  ACTIVE: 'Hoạt động',
  INACTIVE: 'Không hoạt động',
};

const getRoleLabel = (roleName = '') => {
  const normalized = String(roleName).toUpperCase().replace(/^ROLE_/, '');
  return ROLE_LABELS[normalized] || roleName;
};

const getStatusMeta = (status = '') => {
  const normalized = String(status).toUpperCase();

  switch (normalized) {
    case 'ACTIVE':
      return {
        label: STATUS_LABELS.ACTIVE,
        className: 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200',
      };
    case 'INACTIVE':
      return {
        label: STATUS_LABELS.INACTIVE,
        className: 'bg-slate-200 text-slate-700 hover:bg-slate-300',
      };
    case 'PENDING':
    default:
      return {
        label: STATUS_LABELS.PENDING,
        className: 'bg-amber-100 text-amber-700 hover:bg-amber-200',
      };
  }
};

const AccountList = () => {
  const [accounts, setAccounts] = useState([]);
  const [roles, setRoles] = useState([]);

  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updatingId, setUpdatingId] = useState('');
  const [openStatusMenuId, setOpenStatusMenuId] = useState('');

  const statusMenuRef = useRef(null);

  useEffect(() => {
    fetchRoles();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchAccounts();
    }, 250);

    return () => clearTimeout(timer);
  }, [search, roleFilter, statusFilter]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (statusMenuRef.current && !statusMenuRef.current.contains(event.target)) {
        setOpenStatusMenuId('');
      }
    };

    if (openStatusMenuId) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openStatusMenuId]);

  const fetchRoles = async () => {
    try {
      const res = await api.get('/roles');
      const roleData = Array.isArray(res.data?.data) ? res.data.data : [];
      setRoles(roleData);
    } catch (err) {
      console.error('Lỗi lấy role:', err);
    }
  };

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (search.trim()) params.search = search.trim();
      if (roleFilter) params.role = roleFilter;
      if (statusFilter) params.status = statusFilter;

      const res = await api.get('/user/users', { params });
      setAccounts(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      console.error('Lỗi lấy danh sách tài khoản:', err);
      setError(err?.response?.data?.message || 'Không thể tải danh sách tài khoản');
      setAccounts([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChangeStatus = async (userId, newStatus) => {
    try {
      setUpdatingId(userId);

      await api.put(`/user/users/${userId}/status`, {
        status: newStatus,
      });

      setAccounts((prev) =>
        prev.map((item) =>
          item._id === userId ? { ...item, status: newStatus } : item
        )
      );

      setOpenStatusMenuId('');
    } catch (err) {
      console.error('Lỗi cập nhật trạng thái:', err);
      alert(err?.response?.data?.message || 'Cập nhật trạng thái thất bại');
    } finally {
      setUpdatingId('');
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      <div className="flex items-start gap-3">
        <Users className="mt-1 h-7 w-7 text-slate-900" />
        <h1 className="text-3xl font-extrabold text-slate-900">
          Danh sách tài khoản
        </h1>
      </div>

      {error && (
        <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      <div className="mt-8 flex flex-col gap-3 md:flex-row md:items-center">
        <div className="relative w-full md:max-w-[360px]">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-11 pr-4 text-sm text-slate-700 outline-none transition focus:border-slate-500"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="h-11 min-w-[160px] rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-500"
        >
          <option value="">Tất cả vai trò</option>
          {roles.map((role) => (
            <option key={role._id} value={role.name}>
              {getRoleLabel(role.name)}
            </option>
          ))}
        </select>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="h-11 min-w-[180px] rounded-xl border border-slate-300 bg-white px-4 text-sm text-slate-700 outline-none transition focus:border-slate-500"
        >
          {STATUS_OPTIONS.map((item) => (
            <option key={item.value || 'ALL'} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-5 overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full">
            <thead className="bg-slate-100">
              <tr>
                <th className="px-6 py-5 text-left text-[15px] font-extrabold text-slate-800">
                  Tên
                </th>
                <th className="px-6 py-5 text-left text-[15px] font-extrabold text-slate-800">
                  Email
                </th>
                <th className="px-6 py-5 text-left text-[15px] font-extrabold text-slate-800">
                  Vai trò
                </th>
                <th className="px-6 py-5 text-left text-[15px] font-extrabold text-slate-800">
                  Trạng thái
                </th>
              </tr>
            </thead>

            <tbody className="bg-white">
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-12 text-center">
                    <div className="inline-flex items-center gap-2 text-sm text-slate-500">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Đang tải dữ liệu...
                    </div>
                  </td>
                </tr>
              ) : accounts.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-6 py-12 text-center text-sm text-slate-500"
                  >
                    Không có tài khoản nào phù hợp
                  </td>
                </tr>
              ) : (
                accounts.map((account) => {
                  const currentStatus = getStatusMeta(account.status);

                  return (
                    <tr key={account._id} className="border-t border-slate-100">
                      <td className="px-6 py-4 text-sm font-medium text-slate-900">
                        {account.full_name || 'Chưa cập nhật'}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        {account.email}
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="flex flex-wrap gap-2">
                          {account.roles?.length ? (
                            account.roles.map((role) => (
                              <span key={role._id} className="text-sm text-slate-700">
                                {getRoleLabel(role.name)}
                              </span>
                            ))
                          ) : (
                            <span className="text-slate-400">-</span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-sm text-slate-700">
                        <div className="relative inline-block" ref={openStatusMenuId === account._id ? statusMenuRef : null}>
                          <button
                            type="button"
                            disabled={updatingId === account._id}
                            onClick={() =>
                              setOpenStatusMenuId((prev) =>
                                prev === account._id ? '' : account._id
                              )
                            }
                            className={`inline-flex min-w-[140px] items-center justify-between gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${currentStatus.className} ${
                              updatingId === account._id
                                ? 'cursor-not-allowed opacity-70'
                                : ''
                            }`}
                          >
                            <span>
                              {updatingId === account._id
                                ? 'Đang cập nhật...'
                                : currentStatus.label}
                            </span>
                            <ChevronDown className="h-4 w-4" />
                          </button>

                          {openStatusMenuId === account._id && (
                            <div className="absolute left-0 z-20 mt-2 w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-lg">
                              {['PENDING', 'ACTIVE', 'INACTIVE'].map((status) => {
                                const statusMeta = getStatusMeta(status);

                                return (
                                  <button
                                    key={status}
                                    type="button"
                                    onClick={() => handleChangeStatus(account._id, status)}
                                    className="flex w-full items-center justify-between px-4 py-3 text-left text-sm text-slate-700 hover:bg-slate-50"
                                  >
                                    <span>{statusMeta.label}</span>
                                    {account.status === status && (
                                      <span className="text-xs text-slate-400">Hiện tại</span>
                                    )}
                                  </button>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AccountList;