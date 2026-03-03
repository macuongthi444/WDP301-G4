// src/pages/Tutor/TeachingSessionUIDetail.jsx
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import {
  ArrowLeft,
  Calendar as CalendarIcon,
  Clock,
  Link as LinkIcon,
  Loader2,
  MapPin,
  Star,
} from "lucide-react";
import api from "../../../services/api";

/**
 * ✅ Backend đã làm:
 * POST  /:classId/sessions/ui-detail              body: { date:"YYYY-MM-DD", scheduleId }
 * POST  /:classId/sessions/:sessionId/save-ui     body: { items:[...] }
 *
 * ⚠️ Nếu backend của bạn mount teachingSession.routes.js dưới prefix (ví dụ /teaching-sessions),
 * hãy sửa API_PREFIX bên dưới.
 */
const API_PREFIX = "/teaching-sessions"; // <-- nếu router bạn mount thẳng /api thì đổi thành "" (rỗng)

const isYMD = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

const parseYMDLocal = (ymd) => {
  if (!isYMD(ymd)) return null;
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1, 0, 0, 0, 0);
};

const formatDDMMYYYY = (d) => {
  if (!d) return "";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

const pickStudentName = (st) =>
  st?.fullName ||
  st?.full_name ||
  st?.name ||
  st?.student_user_id?.fullName ||
  st?.student_user_id?.full_name ||
  "Học sinh";

const StarRating = ({ value = 0, onChange }) => {
  return (
    <div className="flex items-center gap-2">
      {Array.from({ length: 5 }).map((_, i) => {
        const idx = i + 1;
        const active = idx <= value;
        return (
          <button
            key={idx}
            type="button"
            onClick={() => onChange(idx)}
            className="p-1"
            aria-label={`rate-${idx}`}
          >
            <Star
              className={`h-7 w-7 ${active ? "text-amber-400" : "text-slate-300"}`}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
};

// gọi API có fallback phòng khi bạn mount prefix khác
async function postWithFallback(path, body) {
  try {
    return await api.post(`${API_PREFIX}${path}`, body);
  } catch (e) {
    // thử không prefix nếu 404
    if (e?.response?.status === 404 && API_PREFIX) {
      return await api.post(`${path}`, body);
    }
    throw e;
  }
}

export default function TeachingSessionUIDetail() {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [sp] = useSearchParams();

  const date = sp.get("date"); // YYYY-MM-DD
  const scheduleId = sp.get("scheduleId");

  const dateObj = useMemo(() => parseYMDLocal(date) || new Date(), [date]);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  const [detail, setDetail] = useState(null);

  // local editable state
  const [attendance, setAttendance] = useState({}); // { sid: { status, note } }
  const [ratings, setRatings] = useState({}); // { sid: { ythuc, tienbo, tuduy } }

  const students = detail?.students || [];
  const sessionId = detail?.session?._id;

  useEffect(() => {
    fetchDetail();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, date, scheduleId]);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      if (!classId) throw new Error("Thiếu classId");
      if (!isYMD(date)) throw new Error("Thiếu hoặc sai date (YYYY-MM-DD)");
      if (!scheduleId) throw new Error("Thiếu scheduleId");

      const res = await postWithFallback(`/${classId}/sessions/ui-detail`, {
        date,
        scheduleId,
      });

      const data = res?.data?.data;
      setDetail(data);

      // init local state from backend
      const att = {};
      const eva = {};
      for (const st of data.students || []) {
        const sid = String(st._id);
        att[sid] = data.attendanceByStudent?.[sid] || { status: "ATTENDED", note: "" };
        eva[sid] = data.evaluationByStudent?.[sid] || { ythuc: 0, tienbo: 0, tuduy: 0 };
      }
      setAttendance(att);
      setRatings(eva);
    } catch (e) {
      setError(e?.response?.data?.message || e?.message || "Không thể tải buổi dạy");
    } finally {
      setLoading(false);
    }
  };

  const setStatus = (sid, status) => {
    setAttendance((p) => ({ ...p, [sid]: { ...(p[sid] || {}), status } }));
  };

  const setNote = (sid, note) => {
    setAttendance((p) => ({ ...p, [sid]: { ...(p[sid] || {}), note } }));
  };

  const setRating = (sid, patch) => {
    setRatings((p) => ({ ...p, [sid]: { ...(p[sid] || {}), ...patch } }));
  };

  const handleSave = async () => {
    if (!sessionId) return alert("Thiếu sessionId (hãy reload trang)");
    try {
      setSaving(true);

      const items = students.map((st) => {
        const sid = String(st._id);
        return {
          studentId: sid,
          status: attendance[sid]?.status || "ATTENDED",
          note: attendance[sid]?.note || "",
          rating: {
            ythuc: Number(ratings[sid]?.ythuc || 0),
            tienbo: Number(ratings[sid]?.tienbo || 0),
            tuduy: Number(ratings[sid]?.tuduy || 0),
          },
        };
      });

      await postWithFallback(`/${classId}/sessions/${sessionId}/save-ui`, { items });

      alert("Đã lưu!");
      await fetchDetail();
    } catch (e) {
      alert(e?.response?.data?.message || "Lưu thất bại");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="h-12 w-12 animate-spin text-slate-700" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <button
          onClick={() => navigate(-1)}
          className="mb-6 inline-flex items-center gap-2 text-slate-700 hover:text-slate-900"
        >
          <ArrowLeft size={18} /> Quay lại
        </button>

        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      </div>
    );
  }

  const cls = detail?.class;
  const sched = detail?.schedule;
  const mode = String(sched?.mode || detail?.session?.mode || "").toUpperCase();

  const startTime = sched?.start_time || "--:--";
  const endTime = sched?.end_time || "--:--";

  const location = sched?.location || detail?.session?.location;
  const onlineLink = sched?.online_link || detail?.session?.online_link;

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="mb-6 inline-flex items-center gap-2 text-slate-700 hover:text-slate-900"
      >
        <ArrowLeft size={18} /> Quay lại lịch dạy
      </button>

      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <CalendarIcon className="mt-1 h-7 w-7 text-slate-900" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Buổi dạy <span className="font-semibold">Ngày {formatDDMMYYYY(dateObj)}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý buổi dạy của bạn và điểm danh</p>
          </div>
        </div>

        <button
          type="button"
          className="rounded-2xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95"
          onClick={() => alert("Chức năng giao bài tập: bạn có thể nối thêm sau")}
        >
          Giao bài tập
        </button>
      </div>

      {/* Top info (giống hình) */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="grid gap-8 md:grid-cols-2">
          {/* Left */}
          <div className="space-y-7">
            <div>
              <div className="text-sm text-slate-500">Lớp</div>
              <div className="font-semibold text-slate-900">{cls?.name || "—"}</div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Ngày</div>
              <div className="font-semibold text-slate-900">{formatDDMMYYYY(dateObj)}</div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Cách thức</div>
              <div className="font-semibold text-slate-900">
                {mode === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}
              </div>
              {mode === "ONLINE" && onlineLink ? (
                <a
                  href={onlineLink}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-2 text-sm font-semibold text-blue-600 hover:underline"
                >
                  <LinkIcon size={16} />
                  Tham gia buổi học
                </a>
              ) : null}
            </div>
          </div>

          {/* Right */}
          <div className="space-y-7">
            <div>
              <div className="text-sm text-slate-500">Thời gian</div>
              <div className="flex items-center gap-2 font-semibold text-slate-900">
                <Clock size={16} />
                {startTime} - {endTime}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Giáo trình</div>
              <div className="font-semibold text-slate-900">
                {cls?.curriculum?.name || cls?.curriculum || "—"}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Môn học</div>
              <div className="font-semibold text-slate-900">
                {cls?.subject?.name || cls?.subject || "—"}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">{mode === "ONLINE" ? "Link online" : "Địa điểm"}</div>
              <div className="flex items-start gap-2 font-semibold text-slate-900">
                {mode === "ONLINE" ? <LinkIcon size={16} /> : <MapPin size={16} />}
                <span className="break-all">
                  {mode === "ONLINE" ? onlineLink || "Chưa cập nhật" : location || "Chưa cập nhật"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Students list */}
      <div className="mt-8 space-y-6">
        {students.length === 0 ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center text-slate-600 shadow-md">
            Lớp chưa có học sinh ACTIVE
          </div>
        ) : (
          students.map((st) => {
            const sid = String(st._id);
            const att = attendance[sid] || { status: "ATTENDED", note: "" };
            const rate = ratings[sid] || { ythuc: 0, tienbo: 0, tuduy: 0 };
            const isAttended = att.status === "ATTENDED";

            return (
              <div key={sid} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
                <div className="text-2xl font-extrabold text-slate-900">{pickStudentName(st)}</div>

                <div className="mt-5 grid gap-6 md:grid-cols-2">
                  {/* Attendance + note + homework */}
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">Điểm danh</div>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setStatus(sid, "ABSENT")}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                          !isAttended
                            ? "border-slate-900 bg-slate-900 text-white"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Vắng
                      </button>

                      <button
                        type="button"
                        onClick={() => setStatus(sid, "ATTENDED")}
                        className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                          isAttended
                            ? "border-emerald-300 bg-emerald-200/70 text-slate-900"
                            : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                        }`}
                      >
                        Có mặt
                      </button>
                    </div>

                    <textarea
                      className="mt-4 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                      rows={5}
                      placeholder="Ghi chú"
                      value={att.note || ""}
                      onChange={(e) => setNote(sid, e.target.value)}
                    />

                    {/* Homework section (placeholder giống hình) */}
                    <div className="mt-4">
                      <div className="text-base font-extrabold text-blue-600">Bài tập</div>
                      <div className="mt-1 text-sm text-slate-900">Đã giao: 0</div>
                      <div className="text-sm text-slate-900">Học sinh nộp: 0</div>
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <div className="text-lg font-extrabold text-slate-900">Đánh giá</div>

                    <div className="mt-5 space-y-5">
                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-slate-900">Ý thức</div>
                        <StarRating
                          value={Number(rate.ythuc || 0)}
                          onChange={(v) => setRating(sid, { ythuc: v })}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-slate-900">Tiến bộ</div>
                        <StarRating
                          value={Number(rate.tienbo || 0)}
                          onChange={(v) => setRating(sid, { tienbo: v })}
                        />
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <div className="text-sm font-semibold text-slate-900">Tư duy</div>
                        <StarRating
                          value={Number(rate.tuduy || 0)}
                          onChange={(v) => setRating(sid, { tuduy: v })}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Save */}
      <div className="mt-10 flex justify-end">
        <button
          onClick={handleSave}
          disabled={saving || !sessionId}
          className="rounded-2xl bg-blue-600 px-10 py-4 text-base font-semibold text-white shadow-sm hover:brightness-95 disabled:opacity-60"
        >
          {saving ? "Đang lưu..." : "Lưu"}
        </button>
      </div>
    </div>
  );
}
