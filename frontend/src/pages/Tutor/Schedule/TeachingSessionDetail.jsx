import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { Calendar as CalendarIcon, Loader2, Star } from "lucide-react";
import api from "../../../services/api";

// parse YYYY-MM-DD theo local (tránh lệch ngày do timezone)
const parseYMDLocal = (value) => {
  if (!value) return null;
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
    const [y, m, d] = value.split("-").map(Number);
    return new Date(y, m - 1, d);
  }
  const t = new Date(value);
  if (Number.isNaN(t.getTime())) return null;
  return new Date(t.getFullYear(), t.getMonth(), t.getDate());
};

const formatDDMMYYYY = (d) => {
  if (!d) return "--/--/----";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}/${mm}/${yyyy}`;
};

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
              className={`h-6 w-6 ${active ? "text-amber-400" : "text-slate-300"}`}
              fill={active ? "currentColor" : "none"}
            />
          </button>
        );
      })}
    </div>
  );
};

const TeachingSessionDetail = () => {
  const navigate = useNavigate();
  const { classId } = useParams();
  const [searchParams] = useSearchParams();
  const dateStr = searchParams.get("date"); // YYYY-MM-DD
  const scheduleId = searchParams.get("scheduleId"); // _id của schedule

  const sessionDate = useMemo(() => parseYMDLocal(dateStr) || new Date(), [dateStr]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [cls, setCls] = useState(null);
  const [schedule, setSchedule] = useState(null);

  // attendance + note + rating theo từng học sinh (state UI)
  const [attendance, setAttendance] = useState({}); // {studentId: true/false}
  const [notes, setNotes] = useState({}); // {studentId: string}
  const [ratings, setRatings] = useState({}); // {studentId: {ythuc, tienbo, tuduy}}

  const students = useMemo(() => {
    const arr = cls?.enrolled_students || [];
    return arr
      .map((x) => {
        const u = x?.student_user_id || x;
        return {
          _id: u?._id || x?._id,
          full_name: u?.full_name || x?.full_name || "Học sinh",
        };
      })
      .filter((s) => s._id);
  }, [cls]);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [classId, dateStr, scheduleId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);

      // 1) Lấy lớp: fallback vì có nơi không có GET /class/:id
      let classObj = null;
      try {
        const r = await api.get(`/class/${classId}`);
        classObj = r?.data?.data || r?.data;
      } catch {
        const r = await api.get(`/class`);
        classObj = (r?.data?.data || []).find((c) => c._id === classId) || null;
      }
      setCls(classObj);

      // 2) Lấy schedule của lớp rồi chọn theo scheduleId
      const schedRes = await api.get(`/class/${classId}/schedules`);
      const list = schedRes?.data?.data || [];
      const picked = scheduleId ? list.find((s) => s._id === scheduleId) : list[0] || null;
      setSchedule(picked);

      // 3) (TUỲ BACKEND) nếu có API lấy dữ liệu điểm danh/đánh giá theo buổi:
      // const detail = await api.get(`/class/${classId}/sessions/detail`, { params: { date: dateStr, scheduleId } });
      // setAttendance(detail.data.attendance); setNotes(detail.data.notes); setRatings(detail.data.ratings);

      // init state rỗng cho học sinh (nếu chưa có)
      const initAtt = {};
      const initNote = {};
      const initRating = {};
      (classObj?.enrolled_students || []).forEach((x) => {
        const u = x?.student_user_id || x;
        const sid = u?._id || x?._id;
        if (!sid) return;
        initAtt[sid] = true;
        initNote[sid] = "";
        initRating[sid] = { ythuc: 0, tienbo: 0, tuduy: 0 };
      });
      setAttendance((prev) => ({ ...initAtt, ...prev }));
      setNotes((prev) => ({ ...initNote, ...prev }));
      setRatings((prev) => ({ ...initRating, ...prev }));
    } catch (e) {
      setError("Không thể tải buổi dạy");
    } finally {
      setLoading(false);
    }
  };

  const subjectName = cls?.subject?.name || cls?.subject_name || cls?.subject || "—";
  const curriculumName = cls?.curriculum?.name || cls?.curriculum_name || cls?.curriculum || "—";

  const mode = String(schedule?.mode || "").toUpperCase();
  const startTime = schedule?.start_time || "--:--";
  const endTime = schedule?.end_time || "--:--";

  const joinLink =
    mode === "ONLINE" ? (schedule?.online_link || cls?.online_link || "") : "";

  const handleSave = async () => {
    try {
      // TODO: đổi endpoint theo backend của bạn
      // payload gợi ý: lưu theo classId + date + scheduleId
      const payload = {
        class_id: classId,
        date: dateStr, // YYYY-MM-DD
        schedule_id: scheduleId,
        attendance,
        notes,
        ratings,
      };

      // ví dụ:
      // await api.post(`/class/${classId}/sessions/save`, payload);

      console.log("SAVE payload:", payload);
      alert("Đã lưu (demo). Hãy gắn đúng endpoint backend.");
    } catch (e) {
      alert(e?.response?.data?.message || "Lưu thất bại");
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
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 py-10">
      {/* Header */}
      <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <CalendarIcon className="mt-1 h-7 w-7 text-slate-900" />
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900">
              Buổi dạy <span className="font-semibold">Ngày {formatDDMMYYYY(sessionDate)}</span>
            </h1>
            <p className="mt-1 text-sm text-slate-500">Quản lý buổi dạy của bạn và điểm danh</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() =>
              navigate(`/tutor/assignments?classId=${classId}&date=${dateStr || ""}`)
            }
            className="rounded-2xl bg-gradient-to-r from-emerald-300 to-indigo-400 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:brightness-95"
          >
            Giao bài tập
          </button>
        </div>
      </div>

      {/* Info card */}
      <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <div>
              <div className="text-sm text-slate-500">Lớp</div>
              <div className="font-semibold text-slate-900">{cls?.name || "—"}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Ngày</div>
              <div className="font-semibold text-slate-900">{formatDDMMYYYY(sessionDate)}</div>
            </div>
            <div>
              <div className="text-sm text-slate-500">Cách thức</div>
              <div className="font-semibold text-slate-900">
                {mode === "ONLINE" ? "Trực tuyến" : "Trực tiếp"}
              </div>
            </div>

            {mode === "ONLINE" && joinLink ? (
              <a
                href={joinLink}
                target="_blank"
                rel="noreferrer"
                className="inline-block text-sm font-semibold text-blue-600 hover:underline"
              >
                Tham gia buổi học
              </a>
            ) : null}
          </div>

          <div className="space-y-6">
            <div>
              <div className="text-sm text-slate-500">Môn học</div>
              <div className="font-semibold text-slate-900">{subjectName}</div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Thời gian</div>
              <div className="font-semibold text-slate-900">
                {startTime} - {endTime}
              </div>
            </div>

            <div>
              <div className="text-sm text-slate-500">Giáo trình</div>
              <div className="font-semibold text-slate-900">{curriculumName}</div>
            </div>

            {mode === "OFFLINE" ? (
              <div>
                <div className="text-sm text-slate-500">Địa điểm</div>
                <div className="font-semibold text-slate-900">{schedule?.location || "—"}</div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Students */}
      <div className="mt-8 space-y-6">
        {students.map((st) => {
          const att = attendance[st._id] ?? true;
          const note = notes[st._id] ?? "";
          const r = ratings[st._id] || { ythuc: 0, tienbo: 0, tuduy: 0 };

          return (
            <div key={st._id} className="rounded-2xl border border-slate-200 bg-white p-6 shadow-md">
              <div className="text-2xl font-extrabold text-slate-900">{st.full_name}</div>

              <div className="mt-4 grid gap-6 md:grid-cols-2">
                {/* Left */}
                <div>
                  <div className="text-lg font-extrabold text-slate-900">Điểm danh</div>

                  <div className="mt-3 flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setAttendance((p) => ({ ...p, [st._id]: false }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                        att === false
                          ? "border-slate-900 bg-slate-900 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Vắng
                    </button>

                    <button
                      type="button"
                      onClick={() => setAttendance((p) => ({ ...p, [st._id]: true }))}
                      className={`rounded-lg border px-3 py-1.5 text-sm font-semibold ${
                        att === true
                          ? "border-emerald-300 bg-emerald-200/70 text-slate-900"
                          : "border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                      }`}
                    >
                      Có mặt
                    </button>
                  </div>

                  <textarea
                    className="mt-4 w-full rounded-xl border border-slate-200 p-4 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
                    rows={4}
                    placeholder="Ghi chú"
                    value={note}
                    onChange={(e) => setNotes((p) => ({ ...p, [st._id]: e.target.value }))}
                  />

                  <div className="mt-4">
                    <div className="text-base font-extrabold text-blue-600">Bài tập</div>
                    <div className="mt-1 text-sm text-slate-900">Đã giao: 2</div>
                    <div className="text-sm text-slate-900">Học sinh nộp: 2</div>
                  </div>
                </div>

                {/* Right */}
                <div>
                  <div className="text-lg font-extrabold text-slate-900">Đánh giá</div>

                  <div className="mt-4 space-y-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-slate-900">Ý thức</div>
                      <StarRating
                        value={r.ythuc}
                        onChange={(v) =>
                          setRatings((p) => ({ ...p, [st._id]: { ...r, ythuc: v } }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-slate-900">Tiến bộ</div>
                      <StarRating
                        value={r.tienbo}
                        onChange={(v) =>
                          setRatings((p) => ({ ...p, [st._id]: { ...r, tienbo: v } }))
                        }
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4">
                      <div className="text-sm font-semibold text-slate-900">Tư duy</div>
                      <StarRating
                        value={r.tuduy}
                        onChange={(v) =>
                          setRatings((p) => ({ ...p, [st._id]: { ...r, tuduy: v } }))
                        }
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Save */}
      <div className="mt-10 flex justify-end">
        <button
          onClick={handleSave}
          className="rounded-2xl bg-blue-600 px-10 py-4 text-base font-semibold text-white shadow-sm hover:brightness-95"
        >
          Lưu
        </button>
      </div>
    </div>
  );
};

export default TeachingSessionDetail;