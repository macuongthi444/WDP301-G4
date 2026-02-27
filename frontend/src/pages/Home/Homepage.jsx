import React from "react";
import { useNavigate } from "react-router-dom";
import { X, Check, Bell } from "lucide-react";

// Ảnh minh hoạ (bạn có thể thay bằng ảnh thật của dự án)
const heroPersonImg =
  "https://images.unsplash.com/photo-1580894742597-87bc8789db3d?auto=format&fit=crop&q=80&w=900";

const HomePage = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-white">
      {/* HERO (trừ header) */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-emerald-300 via-sky-400 to-indigo-600" />
        <div className="relative mx-auto max-w-7xl px-6">
          <div className="grid min-h-[560px] grid-cols-12 items-center gap-8 py-12">
            {/* Left: person */}
            <div className="relative col-span-12 md:col-span-4">
              <div className="relative mx-auto w-full max-w-[360px] md:mx-0">
                <img
                  src={heroPersonImg}
                  alt="Tutor"
                  className="h-[420px] w-full rounded-2xl object-cover shadow-xl md:h-[460px]"
                />
                {/* small label on image */}
                <div className="absolute left-6 top-28 rounded-full bg-white/20 px-4 py-2 text-sm text-white backdrop-blur">
                  Quản lý lớp học, theo dõi tiến độ
                </div>
              </div>
            </div>

            {/* Center: text */}
            <div className="col-span-12 text-center md:col-span-5 md:text-left">
              <h1 className="text-4xl font-extrabold leading-tight text-white md:text-5xl">
                <span className="block">Kết Nối Gia Sư, Học Sinh</span>
                <span className="block">Và Phụ Huynh</span>
                <span className="block">Trên Một Nền Tảng</span>
                <span className="block">Thông Minh</span>
              </h1>

              <p className="mt-5 max-w-xl text-sm leading-6 text-white/80 md:text-base">
                Quản lý lớp học, theo dõi tiến độ và trao đổi thông tin dễ dàng trong
                một hệ thống giáo dục hiện đại và minh bạch.
              </p>

              <button
                onClick={() => navigate("/register")}
                className="mt-6 inline-flex items-center justify-center rounded-lg bg-white px-6 py-3 text-sm font-semibold text-indigo-700 shadow-sm hover:bg-white/90"
              >
                Bắt Đầu Ngay
              </button>
            </div>

            {/* Right: stats card */}
            <div className="col-span-12 md:col-span-3">
              <div className="mx-auto w-full max-w-[360px] rounded-2xl bg-white p-6 shadow-xl">
                <h3 className="text-sm font-semibold text-slate-800">Tổng Quan Hệ Thống</h3>

                <div className="mt-4 space-y-4 text-sm">
                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tổng lớp học</span>
                    <span className="font-semibold text-slate-800">12</span>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Tiến độ trung bình</span>
                    <span className="font-semibold text-indigo-600">85%</span>
                  </div>

                  <div>
                    <div className="h-2 w-full rounded-full bg-slate-100">
                      <div className="h-2 w-[85%] rounded-full bg-indigo-600" />
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-slate-600">
                    <span>Lịch hôm nay</span>
                    <span className="font-semibold text-slate-800">3 buổi</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PROBLEM */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
            Gia sư hiện đại cần nhiều hơn một cuốn sổ tay
          </h2>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {[
              "Ghi chú rời rạc, khó theo dõi tiến độ",
              "Phụ huynh không biết con đã học hay chưa",
              "Mất thời gian soạn bài tập mỗi tuần",
            ].map((t) => (
              <div
                key={t}
                className="flex items-center justify-center gap-3 rounded-xl bg-white px-6 py-5 shadow-sm ring-1 ring-slate-100"
              >
                <X className="h-5 w-5 text-red-500" />
                <p className="text-sm text-slate-600">{t}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-3xl font-bold text-slate-900 md:text-4xl">
            Tính năng nổi bật
          </h2>

          {/* Feature 1 */}
          <div className="mt-14 grid items-center gap-10 md:grid-cols-2">
            <div>
              <h3 className="flex items-center gap-2 text-lg font-bold text-blue-600">
                <span>📌</span> Điểm danh &amp; Tự động thông báo
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Mỗi buổi học, gia sư chỉ cần bấm &quot;Điểm danh&quot;. <br />
                Hệ thống sẽ tự động gửi thông báo cho phụ huynh xác nhận học sinh đã tham
                gia buổi học.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {[
                  "Xác nhận học sinh đã học",
                  "Minh bạch với phụ huynh",
                  "Tăng độ chuyên nghiệp",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-700" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-2xl bg-white p-10 shadow-sm ring-1 ring-slate-100">
              <div className="mx-auto max-w-sm rounded-xl bg-slate-50 px-5 py-4">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-white p-2 shadow-sm ring-1 ring-slate-100">
                    <Bell className="h-5 w-5 text-slate-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Thông báo đã gửi</p>
                    <p className="mt-1 text-sm text-slate-600">
                      Con bạn đã tham gia buổi học hôm nay.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Feature 2 */}
          <div className="mt-16 grid items-center gap-10 md:grid-cols-2">
            <div className="order-2 md:order-1">
              <div className="h-[220px] w-full rounded-2xl bg-white shadow-sm ring-1 ring-slate-100" />
            </div>

            <div className="order-1 md:order-2">
              <h3 className="flex items-center gap-2 text-lg font-bold text-purple-600">
                <span>🤖</span> AI Tạo Bài Tập Tự Động
              </h3>

              <p className="mt-3 text-sm leading-6 text-slate-600">
                Chỉ cần nhập câu lệnh, <br />
                AI sẽ tạo bài tập dựa vào tài liệu đã tải lên phù hợp với trình độ học sinh.
              </p>

              <ul className="mt-4 space-y-2 text-sm text-slate-700">
                {[
                  "Tiết kiệm thời gian soạn bài tập",
                  "Cá nhân hóa theo từng học sinh",
                  "Nâng cao hiệu quả học tập",
                ].map((x) => (
                  <li key={x} className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-slate-700" />
                    <span>{x}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-6">
          <h2 className="text-center text-2xl font-bold text-slate-900 md:text-3xl">
            Cách Sổ tay Gia sư hoạt động
          </h2>
          <p className="mt-2 text-center text-sm text-slate-500">
            Minh bạch buổi học chỉ với 3 bước đơn giản
          </p>

          <div className="relative mx-auto mt-10 max-w-5xl">
            {/* line */}
            <div className="absolute left-0 right-0 top-[18px] h-[2px] bg-slate-200" />

            <div className="relative flex items-start justify-between gap-6">
              {[
                {
                  n: 1,
                  title: "Gia sư tạo buổi học",
                  desc: "Tạo hoặc xác nhận buổi học đã diễn ra.",
                },
                {
                  n: 2,
                  title: "Điểm danh & ghi chú",
                  desc: "Điểm danh học sinh, ghi nhận tình hình và tạo bài tập bằng AI.",
                },
                {
                  n: 3,
                  title: "Phụ huynh nhận thông báo",
                  desc: "Hệ thống tự động gửi thông báo xác nhận con đã học.",
                },
              ].map((s) => (
                <div key={s.n} className="flex w-full flex-col items-center text-center">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500 text-sm font-bold text-white">
                    {s.n}
                  </div>
                  <h3 className="mt-6 text-sm font-bold text-slate-900 md:text-base">
                    {s.title}
                  </h3>
                  <p className="mt-2 max-w-xs text-sm text-slate-600">{s.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA GREEN */}
      <section className="bg-emerald-500 py-20">
        <div className="mx-auto max-w-7xl px-6 text-center">
          <h2 className="text-3xl font-extrabold text-white md:text-4xl">
            Nâng cấp cách bạn dạy học ngay hôm nay
          </h2>
          <p className="mx-auto mt-4 max-w-3xl text-sm text-white/90 md:text-base">
            Sổ Tay Gia Sư giúp bạn dạy chuyên nghiệp hơn, phụ huynh tin tưởng hơn và học
            sinh tiến bộ hơn.
          </p>

          <button
            onClick={() => navigate("/register")}
            className="mt-8 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-emerald-700 shadow-sm hover:bg-white/90"
          >
            Tạo tài khoản miễn phí
          </button>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-slate-900 py-14 text-slate-300">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid gap-10 md:grid-cols-4">
            <div>
              <h4 className="text-sm font-semibold text-white">Logo</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>Giải pháp minh</li>
                <li>bạch buổi học</li>
                <li>dành cho gia</li>
                <li>sư &amp; phụ</li>
                <li>huynh hiện</li>
                <li>đại.</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Sản phẩm</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>Tính năng</li>
                <li>Cách sổ tay hoạt động</li>
                <li>AI tạo bài tập</li>
                <li>Điểm danh thông minh</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">Hỗ trợ</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
                <li>Trung tâm trợ giúp</li>
                <li>Câu hỏi thường gặp</li>
                <li>Chính sách bảo mật</li>
                <li>Điều khoản sử dụng</li>
              </ul>
            </div>

            <div>
              <h4 className="text-sm font-semibold text-white">LIÊN HỆ</h4>
              <ul className="mt-4 space-y-2 text-sm text-slate-400">
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
};

export default HomePage;