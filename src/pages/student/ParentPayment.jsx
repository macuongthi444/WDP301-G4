import { auth, db, onAuthStateChanged, onValue, ref, get, set, update, push, remove, usePushNotifications, useTutorScheduleReminders, useScheduleReminders, signOut, signInWithEmailAndPassword, createUserWithEmailAndPassword, signInWithPopup, updateProfile, GoogleAuthProvider, onIdTokenChanged, sendPasswordResetEmail } from '@/utils/firebaseMock';
import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import StudentNavbar from '../../components/student/StudentNavbar';
import Footer from '../../components/shared/Footer';

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

function ParentPayment() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [tutorPaymentInfo, setTutorPaymentInfo] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [attendanceData, setAttendanceData] = useState({});
  const [paymentsData, setPaymentsData] = useState({});
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);
  const [filterMonth, setFilterMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const activeRole = localStorage.getItem('activeRole');
        if (activeRole !== 'parent') {
          navigate('/student-home');
          return;
        }
        fetchData(user.uid);
      } else {
        navigate('/login');
      }
    });
    return unsubscribe;
  }, [navigate]);

  const fetchData = async (uid) => {
    try {
      // 1. Get user record to find tutorId and studentId
      const userSnap = await get(ref(db, `users/${uid}`));
      if (!userSnap.exists()) return;
      const { tutorId, studentId } = userSnap.val();
      if (!tutorId || !studentId) return;

      // 2. Get student profile for name
      const studentSnap = await get(ref(db, `students/${tutorId}/${studentId}`));
      const profile = studentSnap.val();
      setStudentProfile({ ...profile, tutorId, studentId });

      // 3. Get Tutor's Payment Info
      onValue(ref(db, `paymentInfo/${tutorId}`), (snap) => {
        setTutorPaymentInfo(snap.val());
      });

      // 4. Get Schedules, Attendance, and Payments from Tutor's branch
      onValue(ref(db, `schedules/${tutorId}`), (snap) => {
        const data = snap.val();
        setSchedules(data ? Object.entries(data).map(([id, val]) => ({ id, ...val })) : []);
      });

      onValue(ref(db, `attendance/${tutorId}`), (snap) => {
        setAttendanceData(snap.val() || {});
      });

      onValue(ref(db, `payments/${tutorId}`), (snap) => {
        setPaymentsData(snap.val() || {});
        setLoading(false);
      });

    } catch (error) {
      console.error("Lỗi lấy dữ liệu thanh toán:", error);
      setLoading(false);
    }
  };

  const paymentEntries = useMemo(() => {
    if (!studentProfile) return [];
    const entries = [];
    const studentName = studentProfile.name;

    schedules.forEach(schedule => {
      const scheduleAtt = attendanceData[schedule.id];
      if (!scheduleAtt) return;

      Object.entries(scheduleAtt).forEach(([date, data]) => {
        if (!date.startsWith(filterMonth)) return;
        
        // Check if THIS student was present
        let isPresent = false;
        if (data.students && data.students[studentName]) {
          isPresent = data.students[studentName].status === 'present';
        } else if (data.status === 'present' && !data.students) {
          // Backward compatibility for single-student classes
          isPresent = true;
        }

        if (isPresent) {
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
  }, [studentProfile, schedules, attendanceData, paymentsData, filterMonth]);

  const totalPaid = useMemo(() => paymentEntries.filter(e => e.isPaid).reduce((sum, e) => sum + e.price, 0), [paymentEntries]);
  const totalPending = useMemo(() => paymentEntries.filter(e => !e.isPaid).reduce((sum, e) => sum + e.price, 0), [paymentEntries]);
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

  const getVietQRUrl = (entry) => {
    if (!tutorPaymentInfo?.bankBin || !tutorPaymentInfo?.accountNumber) return null;
    const shortId = entry.scheduleId.slice(-6).toUpperCase();
    const dateShort = entry.date.replace(/-/g, '');
    const content = `TN ${shortId} ${dateShort}`;
    const accountName = encodeURIComponent(tutorPaymentInfo.accountHolder || '');
    return `https://img.vietqr.io/image/${tutorPaymentInfo.bankBin}-${tutorPaymentInfo.accountNumber}-compact2.png?amount=${entry.price}&addInfo=${encodeURIComponent(content)}&accountName=${accountName}`;
  }, getTransferContent = (entry) => {
    const shortId = entry.scheduleId.slice(-6).toUpperCase();
    const dateShort = entry.date.replace(/-/g, '');
    return `TN ${shortId} ${dateShort}`;
  };

  const getBankName = (bin) => BANKS.find(b => b.bin === bin)?.name || bin;

  const [checkingPayment, setCheckingPayment] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [creatingVNPayUrl, setCreatingVNPayUrl] = useState(false);

  // Countdown logic for success screen
  useEffect(() => {
    let timer;
    if (paymentSuccess && countdown > 0) {
      timer = setInterval(() => {
        setCountdown(prev => prev - 1);
      }, 1000);
    } else if (paymentSuccess && countdown === 0) {
      setQrModal(null);
      setPaymentSuccess(false);
      setCountdown(3);
    }
    return () => clearInterval(timer);
  }, [paymentSuccess, countdown]);

  const handleVNPayPayment = async () => {
    if (!qrModal || !studentProfile) return;
    setCreatingVNPayUrl(true);
    try {
      const response = await fetch('https://asia-southeast1-tutor-note-6e8b1.cloudfunctions.net/createVNPayUrl', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: qrModal.price,
          paymentKey: qrModal.paymentKey,
          tutorId: studentProfile.tutorId,
          studentName: studentProfile.name,
          displayDate: qrModal.displayDate,
          returnUrl: window.location.href // Return to current page
        })
      });

      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert("Không thể tạo liên kết thanh toán VNPay. Vui lòng thử lại sau.");
      }
    } catch (error) {
      console.error("VNPay error:", error);
      alert("Lỗi kết nối tới cổng thanh toán VNPay.");
    } finally {
      setCreatingVNPayUrl(false);
    }
  };

  const handleConfirmPayment = async () => {
    if (!qrModal || !studentProfile) return;
    
    setCheckingPayment(true);
    
    // Simulate checking with Bank API
    setTimeout(async () => {
      try {
        const { tutorId } = studentProfile;
        const paymentRef = ref(db, `payments/${tutorId}/${qrModal.paymentKey}`);
        
        await set(paymentRef, {
          status: 'paid',
          paidAt: new Date().toISOString(),
          paidBy: 'parent',
          studentName: studentProfile.name
        });

        // Notify Tutor (Soft fail)
        try {
          await fetch('https://asia-southeast1-tutor-note-6e8b1.cloudfunctions.net/sendNotification', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId: tutorId,
              title: `💰 Học phí mới!`,
              body: `Phụ huynh ${studentProfile.name} đã thanh toán buổi học ngày ${qrModal.displayDate}.`,
              targetRole: 'tutor'
            })
          });
        } catch (e) {
          console.log("Không thể gửi thông báo đẩy (có thể do server local chưa chạy)", e);
        }

        setCheckingPayment(false);
        setPaymentSuccess(true);
        
        // Auto-close after 3 seconds
        setTimeout(() => {
          setPaymentSuccess(false);
          setQrModal(null);
        }, 4000);

      } catch (error) {
        console.error("Lỗi xác nhận thanh toán:", error);
        setCheckingPayment(false);
        alert("Có lỗi xảy ra, vui lòng thử lại sau.");
      }
    }, 2000);
  };

  const handleBulkPayment = () => {
    const unpaid = paymentEntries.filter(e => !e.isPaid);
    if (unpaid.length === 0) return;

    if (unpaid.length === 1) {
      setQrModal(unpaid[0]);
      return;
    }

    const total = unpaid.reduce((sum, e) => sum + e.price, 0);
    const bulkId = Date.now().toString().slice(-6); // Use last 6 digits for brevity
    
    setQrModal({
      isBulk: true,
      bulkId,
      price: total,
      sessionKeys: unpaid.map(e => e.paymentKey),
      className: `Tất toán ${unpaid.length} buổi học`,
      displayDate: `Tháng ${filterMonth.split('-')[1]}/${filterMonth.split('-')[0]}`,
      paymentKey: `BULK_${bulkId}`
    });
  };

  // Setup listening for automatic payment
  useEffect(() => {
    if (qrModal && studentProfile) {
      // 1. Đăng ký mã thanh toán vào DB để Webhook có thể tra cứu
      const { tutorId } = studentProfile;
      const content = qrModal.isBulk ? `TN BULK${qrModal.bulkId}` : getTransferContent(qrModal).toUpperCase();

      set(ref(db, `pending_payments/${content}`), {
        tutorId,
        paymentKey: qrModal.paymentKey,
        isBulk: qrModal.isBulk || false,
        sessionKeys: qrModal.sessionKeys || null,
        amount: qrModal.price,
        studentName: studentProfile.name,
        displayDate: qrModal.displayDate,
        createdAt: new Date().toISOString()
      });

      // 2. Lắng nghe trạng thái (Dùng polling nhẹ hoặc lắng nghe cụ thể)
      // Nếu là bulk, ta chỉ cần lắng nghe cái key đại diện
      const checkPath = qrModal.isBulk ? `payments/${tutorId}/BULK_${qrModal.bulkId}` : `payments/${tutorId}/${qrModal.paymentKey}`;
      const paymentRef = ref(db, checkPath);
      
      const unsubscribe = onValue(paymentRef, (snapshot) => {
        const val = snapshot.val();
        if (val && val.status === 'paid' && !paymentSuccess) {
           setPaymentSuccess(true);
           setCheckingPayment(false);
        }
      });

      return () => unsubscribe();
    }
  }, [qrModal, studentProfile, paymentSuccess]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50">
      <div className="w-10 h-10 border-4 border-blue-100 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );

  return (
    <>
      <StudentNavbar activePage="payment" />

      <main className="pt-[68px] min-h-screen bg-slate-50/50">
        <div className="max-w-7xl mx-auto px-6 py-10">

          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-6">
            <div>
              <h1 className="text-[28px] font-bold text-slate-900">💳 Thanh toán học phí</h1>
              <p className="text-[14px] text-slate-400 mt-1">Theo dõi các buổi học đã tham gia và thanh toán cho gia sư</p>
            </div>
            <div className="relative w-full sm:w-auto">
              <select
                value={filterMonth}
                onChange={(e) => setFilterMonth(e.target.value)}
                className="w-full sm:w-auto bg-white border border-slate-200 rounded-2xl py-3 pl-4 pr-10 text-[14px] font-semibold text-slate-700 appearance-none cursor-pointer focus:border-blue-400 outline-none shadow-sm"
              >
                {monthOptions.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
              </select>
              <i className="fa-solid fa-chevron-down absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 text-xs pointer-events-none"></i>
            </div>
          </div>

          {/* Bulk Payment Button */}
          {totalPending > 0 && paymentEntries.filter(e => !e.isPaid).length > 1 && (
            <div className="mb-6 animate-in slide-in-from-top duration-500">
                <button 
                 onClick={handleBulkPayment}
                 className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 px-4 sm:px-6 rounded-2xl shadow-lg shadow-blue-200 flex items-center justify-center gap-2 sm:gap-3 transition-all transform hover:scale-[1.01] active:scale-[0.99] text-[13px] sm:text-[16px]"
                >
                   <i className="fa-solid fa-credit-card"></i>
                   <span className="truncate">Thanh toán tất toán cho {paymentEntries.filter(e => !e.isPaid).length} buổi học còn lại ({formatVND(totalPending)}đ)</span>
                   <i className="fa-solid fa-arrow-right text-[10px] sm:text-sm opacity-60"></i>
                </button>
            </div>
          )}

          {!tutorPaymentInfo?.bankBin && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 mb-8 flex gap-4 text-amber-700">
               <i className="fa-solid fa-circle-exclamation text-xl mt-0.5"></i>
               <div>
                  <p className="font-bold text-[14px]">Gia sư chưa cập nhật tài khoản ngân hàng</p>
                  <p className="text-[13px] opacity-90 mt-1">Vui lòng nhắc gia sư cập nhật thông tin để bạn có thể thanh toán trực tuyến qua mã QR.</p>
               </div>
            </div>
          )}

          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
            <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg shadow-blue-500/20">
              <p className="text-blue-100 text-[12px] font-bold uppercase tracking-wider mb-1">Cần thanh toán</p>
              <p className="text-[28px] font-bold">{formatVND(totalPending)} <span className="text-[14px] font-normal opacity-80">VNĐ</span></p>
              <p className="text-blue-100 text-[11px] mt-1">{paymentEntries.filter(e => !e.isPaid).length} buổi học chưa đóng</p>
            </div>
            <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-6 text-white shadow-lg shadow-emerald-500/20">
              <p className="text-emerald-100 text-[12px] font-bold uppercase tracking-wider mb-1">Đã hoàn thành</p>
              <p className="text-[28px] font-bold">{formatVND(totalPaid)} <span className="text-[14px] font-normal opacity-80">VNĐ</span></p>
              <p className="text-emerald-100 text-[11px] mt-1">{paymentEntries.filter(e => e.isPaid).length} buổi đã ghi nhận</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm sm:col-span-2 lg:col-span-1">
              <p className="text-slate-400 text-[12px] font-bold uppercase tracking-wider mb-1">Tổng cộng tháng</p>
              <p className="text-[28px] font-bold text-slate-800">{formatVND(totalPaid + totalPending)} <span className="text-[14px] font-normal text-slate-400">VNĐ</span></p>
              <p className="text-slate-300 text-[11px] mt-1">{paymentEntries.length} buổi đã học</p>
            </div>
          </div>

          {/* List Area */}
          <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-5 sm:px-7 py-5 border-b border-slate-100 bg-slate-50/50">
              <h2 className="text-[15px] font-bold text-slate-800">Lịch sử học phí {monthOptions.find(o => o.value === filterMonth)?.label}</h2>
            </div>
            
            {paymentEntries.length === 0 ? (
              <div className="py-20 text-center px-6">
                <p className="text-[48px] mb-4">🗓️</p>
                <p className="text-slate-500 font-bold">Chưa có dữ liệu học phí cho tháng này.</p>
                <p className="text-slate-400 text-[13px] mt-1">Dữ liệu chỉ hiển thị khi gia sư thực hiện điểm danh con đi học.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {paymentEntries.map((entry) => (
                  <div key={entry.paymentKey} className="px-5 sm:px-7 py-5 flex flex-col sm:flex-row sm:items-center justify-between hover:bg-slate-50 transition-colors group gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl shrink-0 flex items-center justify-center text-white font-black text-lg ${entry.isPaid ? 'bg-emerald-500' : 'bg-blue-500'}`}>
                        {entry.subject?.charAt(0) || 'L'}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[15px] font-bold text-slate-800 truncate">{entry.className}</p>
                        <p className="text-[12px] text-slate-400 font-medium">{entry.displayDate}</p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-6 sm:gap-4 w-full sm:w-auto mt-2 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                        <div className="text-left sm:text-right">
                          <p className={`text-[16px] font-black ${entry.isPaid ? 'text-emerald-600' : 'text-slate-800'}`}>
                            {formatVND(entry.price)} <span className="text-[12px] font-normal text-slate-400">VNĐ</span>
                          </p>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                             entry.isPaid ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-600'
                          }`}>
                             {entry.isPaid ? '✅ Đã đóng' : '⏳ Chờ thanh toán'}
                          </span>
                        </div>

                        {!entry.isPaid && tutorPaymentInfo?.bankBin && (
                          <button 
                            onClick={() => setQrModal(entry)}
                            className="bg-blue-500 text-white font-bold p-3 sm:p-3.5 rounded-xl hover:bg-blue-600 transition-all shadow-md shadow-blue-500/10 active:scale-95"
                            title="Quét mã QR để đóng học phí"
                          >
                            <i className="fa-solid fa-qrcode"></i>
                          </button>
                        )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      <Footer />

      {/* QR Modal */}
      {qrModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-md" onClick={() => setQrModal(null)}></div>
          <div className="relative bg-white rounded-[40px] shadow-2xl w-full max-w-[420px] z-10 overflow-hidden animate-in fade-in zoom-in duration-300">
            {paymentSuccess ? (
              <div className="p-10 text-center animate-in fade-in zoom-in duration-500">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <i className="fa-solid fa-check text-5xl"></i>
                </div>
                <h3 className="text-[24px] font-black text-slate-900 mb-2">Thanh toán thành công!</h3>
                <p className="text-slate-500 text-[15px]">Học phí đã được ghi nhận. Cảm ơn bạn.</p>
                
                <div className="mt-8 flex flex-col gap-3">
                  <div className="text-[12px] text-slate-400 font-medium">
                    Tự động đóng sau <span className="font-bold text-blue-500">{countdown}s</span>...
                  </div>
                  <button 
                    onClick={() => { setQrModal(null); setPaymentSuccess(false); }}
                    className="bg-slate-100 text-slate-600 font-bold py-3 px-6 rounded-2xl hover:bg-slate-200 transition-colors"
                  >
                    Đóng ngay
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* Top Info */}
                <div className="p-8 text-center pb-0">
                  <h3 className="text-[20px] font-black text-slate-900">{qrModal.isBulk ? 'Tất toán học phí' : 'Thanh toán học phí'}</h3>
                  <p className="text-slate-500 text-[14px] mt-1">{qrModal.className} - {qrModal.displayDate}</p>
                </div>

                {/* QR View */}
                <div className="p-8 text-center bg-white">
                  <div className="bg-slate-50 rounded-[32px] p-6 inline-block border border-slate-100 shadow-inner">
                      <img 
                        src={qrModal.isBulk 
                          ? `https://img.vietqr.io/image/${tutorPaymentInfo.bankBin}-${tutorPaymentInfo.accountNumber}-compact2.png?amount=${qrModal.price}&addInfo=${encodeURIComponent(`TN BULK${qrModal.bulkId}`)}&accountName=${encodeURIComponent(tutorPaymentInfo.accountHolder || '')}`
                          : getVietQRUrl(qrModal)
                        } 
                        alt="VietQR" 
                        className="w-[240px] h-auto rounded-lg"
                      />
                  </div>
                  
                  <div className="mt-8 space-y-3">
                      <div className="flex justify-between items-center bg-slate-50 p-4 rounded-2xl border border-slate-100">
                        <span className="text-[12px] text-slate-400 font-bold uppercase tracking-wider">Số tiền</span>
                        <span className="text-[20px] font-black text-emerald-600">{formatVND(qrModal.price)} đ</span>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-3 text-left">
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Ngân hàng</span>
                            <span className="text-[13px] font-bold text-slate-800 line-clamp-1">{getBankName(tutorPaymentInfo.bankBin)}</span>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                            <span className="text-[10px] text-slate-400 font-black uppercase tracking-widest block mb-1">Nội dung CK</span>
                            <span className="text-[13px] font-bold text-blue-600">{qrModal.isBulk ? `TN BULK${qrModal.bulkId}` : getTransferContent(qrModal)}</span>
                        </div>
                      </div>
                      
                      <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100 text-left flex gap-3">
                        <i className="fa-solid fa-wand-magic-sparkles text-emerald-500 mt-0.5"></i>
                        <p className="text-[12px] text-emerald-600 font-medium leading-relaxed">
                            <b>Hệ thống đang tự động theo dõi:</b> Sau khi chuyển khoản, màn hình sẽ tự động hiển thị kết quả thành công.
                        </p>
                      </div>
                  </div>
                </div>

                {/* Action */}
                <div className="p-8 pt-0">
                    <button 
                      disabled={checkingPayment || creatingVNPayUrl}
                      onClick={handleVNPayPayment}
                      className="w-full bg-emerald-600 text-white font-black py-4 rounded-[20px] hover:bg-emerald-700 transition-all shadow-xl shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2 mb-3"
                    >
                      {creatingVNPayUrl ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Đang kết nối VNPay...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-credit-card"></i>
                          Thanh toán qua VNPay
                        </>
                      )}
                    </button>

                    <div className="flex items-center gap-3 my-4">
                      <div className="h-[1px] bg-slate-100 flex-1"></div>
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Hoặc chuyển khoản</span>
                      <div className="h-[1px] bg-slate-100 flex-1"></div>
                    </div>

                    <button 
                      disabled={checkingPayment || creatingVNPayUrl}
                      onClick={handleConfirmPayment}
                      className="w-full bg-blue-600 text-white font-black py-4 rounded-[20px] hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                      {checkingPayment ? (
                        <>
                          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                          Đang kiểm tra...
                        </>
                      ) : 'Tôi đã chuyển khoản xong'}
                    </button>
                  <button 
                    onClick={() => setQrModal(null)}
                    className="w-full mt-3 text-slate-400 font-bold text-sm py-2 hover:text-slate-600 transition-colors"
                  >
                    Đóng
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export default ParentPayment;
