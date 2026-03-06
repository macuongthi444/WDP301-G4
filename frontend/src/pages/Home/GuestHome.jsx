import { useLayoutEffect } from "react";
import { Link } from "react-router-dom";

// ✅ đổi đúng file bạn đang có trong src/assets
import woman from "../../assets/women.png";

const XIcon = () => (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-red-50">
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 6 6 18M6 6l12 12" />
    </svg>
  </span>
);

const CheckIcon = () => (
  <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-indigo-50">
    <svg viewBox="0 0 24 24" className="h-4 w-4 text-indigo-600" fill="none" stroke="currentColor" strokeWidth="2">
      <path strokeLinecap="round" strokeLinejoin="round" d="M20 6 9 17l-5-5" />
    </svg>
  </span>
);

function OverviewCard() {
  return (
    <div className="w-[360px] rounded-2xl bg-white p-6 shadow-[0_18px_40px_rgba(0,0,0,0.12)]">
      <h4 className="text-sm font-semibold text-slate-800">Tổng Quan Hệ Thống</h4>

      <div className="mt-5 space-y-5 text-[12px] text-slate-600">
        <div className="flex items-center justify-between">
          <span>Tổng lớp học</span>
          <span className="font-semibold text-slate-900">12</span>
        </div>

        <div className="flex items-center justify-between">
          <span>Tiến độ trung bình</span>
          <span className="font-semibold text-indigo-600">85%</span>
        </div>

        <div>
          <div className="h-2 w-full rounded-full bg-slate-200">
            <div className="h-2 w-[85%] rounded-full bg-indigo-600" />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <span>Lịch hôm nay</span>
          <span className="font-semibold text-slate-900">3 buổi</span>
        </div>
      </div>
    </div>
  );
}

export default function GuestHome() {
  // ✅ đảm bảo luôn hiển thị phần đầu trước (không bị đứng giữa)
  useLayoutEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="w-full bg-white text-slate-900">
      {/* HEADER */}
      <header className="sticky top-0 z-50 w-full bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
          <div className="text-xl font-extrabold">Logo</div>

          <nav className="flex items-center gap-6 text-sm text-slate-600">
            <a href="#about" className="hover:text-slate-900">Về chúng tôi</a>
            <a href="#contact" className="hover:text-slate-900">Liên hệ</a>
          </nav>

          <Link
            to="/auth/register"
            className="rounded-full bg-emerald-400 px-5 py-2 text-sm font-semibold text-white hover:bg-emerald-500"
          >
            Đăng nhập/Đăng ký
          </Link>
        </div>
      </header>

      {/* HERO */}
      <section className="w-full">
        <div className="w-full bg-gradient-to-b from-[#7DECB7] via-[#62D9C7] to-[#3F60E9]">
          <div className="relative mx-auto max-w-6xl px-6 py-14">
            {/* ảnh cô gái bên trái */}
            <img
              src={woman}
              alt="Tutor"
              className="absolute bottom-0 left-6 hidden h-[340px] w-auto select-none md:block"
              draggable="false"
            />

            <div className="grid items-center gap-10 md:grid-cols-[1fr_380px]">
              {/* text */}
              <div className="md:pl-[260px]">
                <h1 className="text-center text-[40px] font-extrabold leading-tight text-white md:text-left">
                  Kết Nối Gia Sư, Học Sinh
                  <br />
                  Và Phụ Huynh
                  <br />
                  Trên Một Nền Tảng
                  <br />
                  Thông Minh
                </h1>

                <p className="mt-4 max-w-xl text-center text-sm leading-6 text-white/90 md:text-left">
                  Quản lý lớp học, theo dõi tiến độ và trao đổi thông tin dễ dàng trong một hệ thống giáo dục
                  hiện đại và minh bạch.
                </p>

                <div className="mt-6 flex justify-center md:justify-start">
                  <Link
                    to="/auth/register"
                    className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow hover:bg-white/95"
                  >
                    Bắt Đầu Ngay
                  </Link>
                </div>
              </div>

              {/* card */}
              <div className="flex justify-center md:justify-end">
                <OverviewCard />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="w-full bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-extrabold text-slate-900">
            Gia sư hiện đại cần nhiều hơn một cuốn sổ tay
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              "Ghi chép rời rạc, khó theo dõi tiến độ",
              "Phụ huynh không biết con đã học hay chưa",
              "Mất thời gian soạn bài tập mỗi tuần",
            ].map((t) => (
              <div key={t} className="rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-200">
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <XIcon />
                  <span>{t}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section id="about" className="w-full bg-white pb-20 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-3xl font-extrabold text-slate-900">
            Tính năng nổi bật
          </h2>

          <div className="mt-16 space-y-14">
            {/* feature 1 */}
            <div className="grid items-start gap-10 md:grid-cols-2">
              <div>
                <div className="flex items-center gap-2">
                  <span>📌</span>
                  <h3 className="text-lg font-extrabold text-indigo-700">
                    Điểm danh & Tự động thông báo
                  </h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Mỗi buổi học, gia sư chỉ cần bấm “Điểm danh”. Hệ thống sẽ tự động gửi thông báo cho phụ huynh
                  xác nhận học sinh đã tham gia buổi học.
                </p>

                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><CheckIcon /> Xác nhận học sinh đã học</li>
                  <li className="flex items-center gap-2"><CheckIcon /> Minh bạch với phụ huynh</li>
                  <li className="flex items-center gap-2"><CheckIcon /> Tăng độ chuyên nghiệp</li>
                </ul>
              </div>

              <div className="flex justify-end">
                <div className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                  <div className="rounded-xl bg-slate-100 p-5 text-sm text-slate-700">
                    🔔 Thông báo đã gửi
                    <div className="mt-1 text-slate-600">Con bạn đã tham gia buổi học hôm nay.</div>
                  </div>
                </div>
              </div>
            </div>

            {/* feature 2 */}
            <div className="grid items-start gap-10 md:grid-cols-2">
              <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
                <div className="h-[180px] w-full rounded-xl bg-slate-100" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span>🤖</span>
                  <h3 className="text-lg font-extrabold text-indigo-700">AI Tạo Bài Tập Tự Động</h3>
                </div>

                <p className="mt-3 text-sm leading-6 text-slate-600">
                  Chỉ cần nhập câu lệnh, AI sẽ tạo bài tập dựa vào tài liệu đã tải lên phù hợp với trình độ học sinh.
                </p>

                <ul className="mt-5 space-y-3 text-sm text-slate-700">
                  <li className="flex items-center gap-2"><CheckIcon /> Tiết kiệm thời gian soạn bài tập</li>
                  <li className="flex items-center gap-2"><CheckIcon /> Cá nhân hóa theo từng học sinh</li>
                  <li className="flex items-center gap-2"><CheckIcon /> Nâng cao hiệu quả học tập</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="w-full bg-white pb-20">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="text-center text-2xl font-extrabold text-slate-900">
            Cách Sổ tay Gia sư hoạt động
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Minh bạch buổi học chỉ với 3 bước đơn giản
          </p>

          <div className="relative mx-auto mt-12 max-w-5xl">
            <div className="absolute left-0 right-0 top-4 h-[2px] bg-slate-200" />

            <div className="grid grid-cols-3 gap-8">
              {[
                { n: "1", title: "Gia sư tạo buổi học", desc: "Tạo hoặc xác nhận buổi học đã diễn ra." },
                { n: "2", title: "Điểm danh & ghi chú", desc: "Điểm danh học sinh, ghi nhận tình hình và tạo bài tập bằng AI." },
                { n: "3", title: "Phụ huynh nhận thông báo", desc: "Hệ thống tự động gửi thông báo xác nhận con đã học." },
              ].map((s) => (
                <div key={s.n} className="text-center">
                  <div className="mx-auto flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-sm font-extrabold text-white">
                    {s.n}
                  </div>
                  <h3 className="mt-5 text-sm font-extrabold text-slate-900">{s.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="w-full bg-emerald-600 py-16">
        <div className="mx-auto max-w-6xl px-6 text-center text-white">
          <h2 className="text-3xl font-extrabold">Nâng cấp cách bạn dạy học ngay hôm nay</h2>
          <p className="mx-auto mt-3 max-w-3xl text-sm text-white/90">
            Sổ Tay Gia Sư giúp bạn dạy chuyên nghiệp hơn, phụ huynh tin tưởng hơn và học sinh tiến bộ hơn.
          </p>

          <div className="mt-7">
            <Link
              to="/auth/register"
              className="inline-flex rounded-xl bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow hover:bg-white/95"
            >
              Tạo tài khoản miễn phí
            </Link>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer id="contact" className="w-full bg-[#0B1A2C] py-14 text-slate-300 scroll-mt-20">
        <div className="mx-auto max-w-6xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <div className="text-base font-extrabold text-white">Logo</div>
              <p className="mt-3 text-sm leading-6 text-slate-400">
                Giải pháp minh bạch buổi học dành cho gia sư và phụ huynh hiện đại.
              </p>
            </div>

            <div>
              <div className="text-sm font-extrabold text-white">Sản phẩm</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Tính năng</li>
                <li>Cách hoạt động</li>
                <li>AI tạo bài tập</li>
                <li>Điểm danh thông minh</li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-extrabold text-white">Hỗ trợ</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Trung tâm trợ giúp</li>
                <li>Câu hỏi thường gặp</li>
                <li>Chính sách bảo mật</li>
                <li>Điều khoản sử dụng</li>
              </ul>
            </div>

            <div>
              <div className="text-sm font-extrabold text-white">LIÊN HỆ</div>
              <ul className="mt-3 space-y-2 text-sm text-slate-400">
                <li>Email: support@sotaygiasu.vn</li>
                <li>Hotline: 0123456789</li>
                <li>Facebook: support@sotaygiasu.vn</li>
                <li>Zalo: 0123456789</li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-white/10 pt-6 text-center text-xs text-slate-500">
            © 2026 Sổ Tay Gia Sư. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}