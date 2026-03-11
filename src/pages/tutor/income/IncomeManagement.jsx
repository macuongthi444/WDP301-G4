import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import TutorNavbar from '../../../components/tutor/TutorNavbar';
import Footer from '../../../components/shared/Footer';

// Vietnamese bank BINs for VietQR
const BANKS = [
  { bin: '970436', name: 'Vietcombank', shortName: 'VCB' },
  { bin: '970422', name: 'MB Bank', shortName: 'MB' },
  { bin: '970407', name: 'Techcombank', shortName: 'TCB' },
  { bin: '970418', name: 'BIDV', shortName: 'BIDV' },
  { bin: '970415', name: 'VietinBank', shortName: 'CTG' },
  { bin: '970423', name: 'TPBank', shortName: 'TPB' },
  { bin: '970416', name: 'ACB', shortName: 'ACB' },
  { bin: '970403', name: 'Sacombank', shortName: 'STB' },
  { bin: '970432', name: 'VPBank', shortName: 'VPB' },
  { bin: '970448', name: 'OCB', shortName: 'OCB' },
  { bin: '970405', name: 'Agribank', shortName: 'AGR' },
  { bin: '970437', name: 'HDBank', shortName: 'HDB' },
  { bin: '970426', name: 'MSB', shortName: 'MSB' },
  { bin: '970441', name: 'VIB', shortName: 'VIB' },
  { bin: '970443', name: 'SHB', shortName: 'SHB' },
  { bin: '970454', name: 'ViettelMoney', shortName: 'VTLMONEY' },
  { bin: '970457', name: 'Cake (VPBank)', shortName: 'CAKE' },
];

function IncomeManagement() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [paymentsData, setPaymentsData] = useState({});
  const [paymentInfo, setPaymentInfo] = useState({ bankBin: '', accountNumber: '', accountHolder: '' });
  const [editingPaymentInfo, setEditingPaymentInfo] = useState(false);
  const [tempPaymentInfo, setTempPaymentInfo] = useState({ bankBin: '', accountNumber: '', accountHolder: '' });
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null); // { entry } to show QR for
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
      if (currentUser) {
        setUser(currentUser);

        onValue(ref(db, `schedules/${currentUser.uid}`), (snap) => {
          const data = snap.val();
          setSchedules(data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : []);
        });

        onValue(ref(db, `attendance/${currentUser.uid}`), (snap) => {
          setAttendanceData(snap.val() || {});
        });

        onValue(ref(db, `payments/${currentUser.uid}`), (snap) => {
          setPaymentsData(snap.val() || {});
          setLoading(false);
        });

        onValue(ref(db, `paymentInfo/${currentUser.uid}`), (snap) => {
          const data = snap.val();
          if (data) {
            setPaymentInfo(data);
            setTempPaymentInfo(data);
          }
        });
      } else {
        navigate('/login');
      }
    });
    return () => unsubscribeAuth();
  }, [navigate]);

  // Build income entries from attendance data
  const incomeEntries = useMemo(() => {
    const entries = [];
    schedules.forEach(schedule => {
      const scheduleAtt = attendanceData[schedule.id];
      if (!scheduleAtt) return;

      Object.entries(scheduleAtt).forEach(([date, data]) => {
        if (!date.startsWith(filterMonth)) return;
        let hasPresent = false;
        if (data.students) {
          hasPresent = Object.values(data.students).some(s => s.status === 'present');
        } else if (data.status === 'present') {
          hasPresent = true;
        }
        if (hasPresent) {
          const paymentKey = `${schedule.id}_${date}`;
          const isPaid = paymentsData[paymentKey]?.status === 'paid';
          entries.push({
            scheduleId: schedule.id,
            className: schedule.className,
            subject: schedule.subject || '',
            date,
            price: schedule.price || 0,
            displayDate: date.split('-').reverse().join('/'),
            isPaid,
            paymentKey,
            paidAt: paymentsData[paymentKey]?.paidAt || null
          });
        }
      });
    });
    entries.sort((a, b) => b.date.localeCompare(a.date));
    return entries;
  }, [schedules, attendanceData, paymentsData, filterMonth]);

  const totalPaid = useMemo(() => incomeEntries.filter(e => e.isPaid).reduce((sum, e) => sum + e.price, 0), [incomeEntries]);
  const totalPending = useMemo(() => incomeEntries.filter(e => !e.isPaid).reduce((sum, e) => sum + e.price, 0), [incomeEntries]);
  const formatVND = (num) => num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');

  const monthOptions = useMemo(() => {
    const months = [];
    const now = new Date();
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      months.push({
        value: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
        label: `Tháng ${d.getMonth() + 1}/${d.getFullYear()}`
      });
    }
    return months;
  }, []);

  // Toggle payment manually
  const togglePayment = async (entry) => {
    if (!user) return;
    const paymentRef = ref(db, `payments/${user.uid}/${entry.paymentKey}`);
    if (entry.isPaid) {
      await set(paymentRef, null);
    } else {
      await set(paymentRef, { status: 'paid', paidAt: new Date().toISOString() });
    }
  };

  const savePaymentInfo = async () => {
    if (!user) return;
    await set(ref(db, `paymentInfo/${user.uid}`), tempPaymentInfo);
    setPaymentInfo(tempPaymentInfo);
    setEditingPaymentInfo(false);
  };

  // Generate transfer content (unique per session)
  const getTransferContent = (entry) => {
    const shortId = entry.scheduleId.slice(-6).toUpperCase();
    const dateShort = entry.date.replace(/-/g, '');
    return `TN ${shortId} ${dateShort}`;
  };

  // Generate VietQR URL
  const getVietQRUrl = (entry) => {
    if (!paymentInfo.bankBin || !paymentInfo.accountNumber) return null;
    const content = getTransferContent(entry);
    const accountName = encodeURIComponent(paymentInfo.accountHolder || '');
    return `https://img.vietqr.io/image/${paymentInfo.bankBin}-${paymentInfo.accountNumber}-compact2.png?amount=${entry.price}&addInfo=${encodeURIComponent(content)}&accountName=${accountName}`;
  };

  const getBankName = (bin) => BANKS.find(b => b.bin === bin)?.name || bin;

  const subjectColors = {
    'Toán': 'bg-blue-500', 'Lý': 'bg-violet-500', 'Hoá': 'bg-orange-500',
    'Tiếng Anh': 'bg-pink-500', 'Văn': 'bg-emerald-500',
  };

  if (loading) return (
    <>
      <TutorNavbar activePage="income" />
      <div className="pt-[68px] min-h-screen flex items-center justify-center bg-slate-50">
        <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
    </>
  );

  return (
    <>
      <TutorNavbar activePage="income" />

      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-2xl md:text-[28px] font-bold text-slate-900">💰 Quản lý thu nhập</h1>
              <p className="text-[14px] text-slate-400 mt-1">Tạo mã QR thanh toán & theo dõi thu nhập tự động</p>
            </div>
            <div className="relative w-full md:w-auto">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-[14px] font-semibold text-slate-700 appearance-none cursor-pointer focus:border-blue-400 outline-none shadow-sm"
              >
                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          {/* Payment Info Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-[15px] font-bold text-slate-800 flex items-center gap-2">
                <i className="fa-solid fa-credit-card text-blue-500"></i> Tài khoản ngân hàng
              </h2>
              {!editingPaymentInfo ? (
                <button
                  onClick={() => { setTempPaymentInfo({ ...paymentInfo }); setEditingPaymentInfo(true); }}
                  className="text-[12px] text-blue-500 font-semibold hover:underline"
                >
                  <i className="fa-solid fa-pen mr-1"></i> Chỉnh sửa
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={() => setEditingPaymentInfo(false)} className="text-[12px] text-slate-400 font-medium hover:text-slate-600">Huỷ</button>
                  <button onClick={savePaymentInfo} className="text-[12px] text-white bg-blue-500 font-semibold px-3 py-1 rounded-lg hover:bg-blue-600">Lưu</button>
                </div>
              )}
            </div>

            {editingPaymentInfo ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Ngân hàng</label>
                  <select
                    value={tempPaymentInfo.bankBin}
                    onChange={(e) => setTempPaymentInfo({ ...tempPaymentInfo, bankBin: e.target.value })}
                    className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-[13px] text-slate-800 focus:border-blue-400 outline-none appearance-none cursor-pointer"
                  >
                    <option value="">Chọn ngân hàng...</option>
                    {BANKS.map(b => <option key={b.bin} value={b.bin}>{b.name} ({b.shortName})</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Số tài khoản</label>
                  <input
                    type="text"
                    value={tempPaymentInfo.accountNumber}
                    onChange={(e) => setTempPaymentInfo({ ...tempPaymentInfo, accountNumber: e.target.value })}
                    placeholder="VD: 0123456789"
                    className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-[13px] text-slate-800 focus:border-blue-400 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1">Chủ tài khoản</label>
                  <input
                    type="text"
                    value={tempPaymentInfo.accountHolder}
                    onChange={(e) => setTempPaymentInfo({ ...tempPaymentInfo, accountHolder: e.target.value.toUpperCase() })}
                    placeholder="VD: NGUYEN VAN A"
                    className="w-full border border-slate-300 rounded-xl py-2.5 px-3 text-[13px] text-slate-800 focus:border-blue-400 outline-none uppercase"
                  />
                </div>
              </div>
            ) : (
              paymentInfo.bankBin ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Ngân hàng</p>
                    <p className="text-[14px] font-bold text-slate-800">{getBankName(paymentInfo.bankBin)}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Số tài khoản</p>
                    <p className="text-[14px] font-bold text-blue-600 tracking-wider">{paymentInfo.accountNumber}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Chủ tài khoản</p>
                    <p className="text-[14px] font-bold text-slate-800 uppercase">{paymentInfo.accountHolder}</p>
                  </div>
                </div>
              ) : (
                <p className="text-[13px] text-slate-400 italic">Chưa liên kết ngân hàng. Bấm "Chỉnh sửa" để thêm tài khoản.</p>
              )
            )}
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 mb-8">
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
              <p className="text-emerald-100 text-[11px] md:text-[12px] font-bold uppercase tracking-wider mb-1">Đã thu</p>
              <p className="text-2xl md:text-[28px] font-bold">{formatVND(totalPaid)} <span className="text-[12px] md:text-[14px] font-normal opacity-80">VNĐ</span></p>
              <p className="text-emerald-200 text-[10px] md:text-[11px] mt-1">{incomeEntries.filter(e => e.isPaid).length} buổi đã thanh toán</p>
            </div>
            <div className="bg-gradient-to-br from-amber-400 to-amber-500 rounded-2xl p-6 text-white shadow-lg shadow-amber-500/20">
              <p className="text-amber-100 text-[11px] md:text-[12px] font-bold uppercase tracking-wider mb-1">Chờ thanh toán</p>
              <p className="text-2xl md:text-[28px] font-bold">{formatVND(totalPending)} <span className="text-[12px] md:text-[14px] font-normal opacity-80">VNĐ</span></p>
              <p className="text-amber-200 text-[10px] md:text-[11px] mt-1">{incomeEntries.filter(e => !e.isPaid).length} buổi chưa thanh toán</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-slate-400 text-[11px] md:text-[12px] font-bold uppercase tracking-wider mb-1">Tổng cộng</p>
              <p className="text-2xl md:text-[28px] font-bold text-slate-800">{formatVND(totalPaid + totalPending)} <span className="text-[12px] md:text-[14px] font-normal text-slate-400">VNĐ</span></p>
              <p className="text-slate-300 text-[10px] md:text-[11px] mt-1">{incomeEntries.length} buổi trong tháng</p>
            </div>
          </div>

          {/* Income List */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-7 py-5 border-b border-slate-100 flex items-center justify-between">
              <h2 className="text-[15px] font-bold text-slate-800">Chi tiết thu nhập</h2>
              <span className="text-[12px] font-medium text-slate-400">{incomeEntries.length} bản ghi</span>
            </div>

            {incomeEntries.length === 0 ? (
              <div className="py-16 text-center">
                <p className="text-[48px] mb-3">📊</p>
                <p className="text-slate-400 text-[14px] font-medium">Chưa có thu nhập trong tháng này</p>
                <p className="text-slate-300 text-[12px] mt-1">Điểm danh các buổi dạy để ghi nhận thu nhập</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {incomeEntries.map((entry) => (
                  <div key={entry.paymentKey} className="px-4 sm:px-7 py-4 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group gap-4">
                    <div className="flex items-center gap-4 cursor-pointer flex-1" onClick={() => navigate(`/session-detail/${entry.scheduleId}/${entry.date}`)}>
                      <div className={`w-10 h-10 rounded-xl ${subjectColors[entry.subject] || 'bg-slate-500'} flex items-center justify-center text-white font-bold text-[13px] shadow-sm shrink-0`}>
                        {entry.subject?.charAt(0) || '?'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[14px] font-bold text-slate-800 group-hover:text-blue-600 transition-colors truncate">{entry.className}</p>
                        <p className="text-[12px] text-slate-400 font-medium">{entry.displayDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3">
                      <div className="text-left sm:text-right">
                        <p className={`text-[15px] font-bold ${entry.isPaid ? 'text-emerald-600' : 'text-amber-500'}`}>
                          {entry.isPaid ? '+' : ''}{formatVND(entry.price)} <span className="text-[11px] font-normal text-slate-400">VNĐ</span>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        {/* QR Button */}
                        {!entry.isPaid && paymentInfo.bankBin && (
                          <button
                            onClick={() => setQrModal(entry)}
                            className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 text-[11px] font-bold border border-blue-200 hover:bg-blue-100 transition-all"
                            title="Tạo mã QR thanh toán"
                          >
                            <i className="fa-solid fa-qrcode mr-1"></i> QR
                          </button>
                        )}

                        <button
                          onClick={() => togglePayment(entry)}
                          className={`px-4 py-1.5 rounded-full text-[11px] font-bold border transition-all whitespace-nowrap ${
                            entry.isPaid
                              ? 'bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-amber-50 text-amber-600 border-amber-200 hover:bg-amber-100'
                          }`}
                        >
                          {entry.isPaid ? '✅ Đã thu' : '⏳ Chờ thu'}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </main>

      <Footer />

      {/* QR Code Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setQrModal(null)}></div>
          <div className="relative bg-white rounded-3xl shadow-2xl w-full max-w-[380px] z-10 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 px-6 py-5 text-white text-center">
              <p className="text-blue-100 text-[11px] font-bold uppercase tracking-wider mb-1">Mã thanh toán VietQR</p>
              <p className="text-[20px] font-bold">{qrModal.className}</p>
              <p className="text-blue-100 text-[13px]">{qrModal.displayDate}</p>
            </div>

            {/* QR Image */}
            <div className="p-6 text-center">
              <div className="bg-white rounded-2xl p-4 inline-block shadow-sm border border-slate-100">
                <img
                  src={getVietQRUrl(qrModal)}
                  alt="VietQR Code"
                  className="w-[260px] h-auto"
                  onError={(e) => { e.target.src = ''; e.target.alt = 'Không tạo được mã QR'; }}
                />
              </div>

              {/* Transfer Info */}
              <div className="mt-5 text-left space-y-2 bg-slate-50 rounded-2xl p-4 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Ngân hàng</span>
                  <span className="text-[13px] text-slate-800 font-bold">{getBankName(paymentInfo.bankBin)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Số TK</span>
                  <span className="text-[13px] text-blue-600 font-bold tracking-wider">{paymentInfo.accountNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[11px] text-slate-400 font-bold uppercase">Chủ TK</span>
                  <span className="text-[13px] text-slate-800 font-bold uppercase">{paymentInfo.accountHolder}</span>
                </div>
                <div className="border-t border-slate-200 pt-2 mt-2">
                  <div className="flex justify-between">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Số tiền</span>
                    <span className="text-[15px] text-emerald-600 font-black">{formatVND(qrModal.price)} VNĐ</span>
                  </div>
                  <div className="flex justify-between mt-1">
                    <span className="text-[11px] text-slate-400 font-bold uppercase">Nội dung CK</span>
                    <span className="text-[12px] text-slate-700 font-bold bg-blue-50 px-2 py-0.5 rounded">{getTransferContent(qrModal)}</span>
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-slate-400 mt-3 italic">
                Phụ huynh quét mã QR bằng app ngân hàng để thanh toán
              </p>
            </div>

            {/* Footer */}
            <div className="px-6 pb-6 flex gap-3">
              <button
                onClick={() => setQrModal(null)}
                className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-600 font-bold text-[13px] hover:bg-slate-200 transition-all"
              >
                Đóng
              </button>
              <button
                onClick={() => { togglePayment(qrModal); setQrModal(null); }}
                className="flex-1 py-3 rounded-2xl bg-emerald-500 text-white font-bold text-[13px] hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
              >
                ✅ Xác nhận đã thu
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default IncomeManagement;
