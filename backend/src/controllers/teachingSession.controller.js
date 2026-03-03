const TeachingSession = require("../models/teachingSession.model");
const Class = require("../models/class.model");
const WeeklySchedule = require("../models/weeklySchedule.model");
const ClassEnrollment = require("../models/classEnrollment.model");
const Attendance = require("../models/attendance.model");
const Evaluation = require("../models/evaluation.model");

// Helper: Lấy học sinh active của lớp
async function getActiveStudentsOfClass(classId) {
  const enrollments = await ClassEnrollment.find({ class_id: classId, status: "ACTIVE" })
    .populate("student_user_id", "full_name student_profile.student_full_name email phone");
  return enrollments.map((e) => e.student_user_id).filter(Boolean);
}

const isYMD = (s) => typeof s === "string" && /^\d{4}-\d{2}-\d{2}$/.test(s);

const buildLocalDate = (ymd) => {
  const [y, m, d] = ymd.split("-").map(Number);
  return new Date(y, m - 1, d, 0, 0, 0, 0);
};

const buildDateTimeFromYMDAndHHMM = (ymd, hhmm) => {
  const [y, m, d] = ymd.split("-").map(Number);
  const [hh, mm] = String(hhmm || "00:00").split(":").map(Number);
  return new Date(y, m - 1, d, hh || 0, mm || 0, 0, 0);
};

// 1) Lấy chi tiết một buổi học
exports.getSessionDetail = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId } = req.params;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId })
      .populate("schedule_id");

    if (!session) return res.status(404).json({ message: "Không tìm thấy buổi học" });

    res.json({ message: "Lấy chi tiết buổi học thành công", data: session });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2) Lấy danh sách buổi học của lớp (filter theo thời gian, trạng thái)
exports.getSessionsByClass = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;
    const { status, startDate, endDate } = req.query;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    const filter = { class_id: classId };
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.start_at = {};
      if (startDate) filter.start_at.$gte = new Date(startDate);
      if (endDate) filter.start_at.$lte = new Date(endDate);
    }

    const sessions = await TeachingSession.find(filter)
      .sort({ start_at: 1 })
      .populate("schedule_id");

    res.json({
      message: "Lấy danh sách buổi học thành công",
      count: sessions.length,
      data: sessions,
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 3) Cập nhật trạng thái buổi học
exports.updateSessionStatus = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId } = req.params;
    const { status } = req.body;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    const session = await TeachingSession.findOneAndUpdate(
      { _id: sessionId, class_id: classId },
      { status },
      { new: true }
    );

    if (!session) return res.status(404).json({ message: "Không tìm thấy buổi học" });

    res.json({ message: "Cập nhật trạng thái thành công", data: session });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// ✅ 4) API phục vụ UI "Buổi dạy"
// POST /:classId/sessions/ui-detail  { date:"YYYY-MM-DD", scheduleId:"..." }
exports.getSessionUIDetailByDate = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;
    const { date, scheduleId } = req.body;

    if (!isYMD(date)) return res.status(400).json({ message: "date phải là YYYY-MM-DD" });
    if (!scheduleId) return res.status(400).json({ message: "Thiếu scheduleId" });

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId }).lean();
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    const schedule = await WeeklySchedule.findOne({ _id: scheduleId, class_id: classId }).lean();
    if (!schedule) return res.status(404).json({ message: "Không tìm thấy WeeklySchedule của lớp" });

    // tìm session trong ngày theo schedule
    const dayStart = buildLocalDate(date);
    const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000);

    let session = await TeachingSession.findOne({
      class_id: classId,
      schedule_id: scheduleId,
      start_at: { $gte: dayStart, $lt: dayEnd },
    }).lean();

    if (!session) {
      const start_at = buildDateTimeFromYMDAndHHMM(date, schedule.start_time);
      let end_at = buildDateTimeFromYMDAndHHMM(date, schedule.end_time);
      if (end_at <= start_at) end_at = new Date(end_at.getTime() + 24 * 60 * 60 * 1000);

      const created = await TeachingSession.create({
        class_id: classId,
        schedule_id: scheduleId,
        start_at,
        end_at,
        mode: schedule.mode || "OFFLINE",
        location: schedule.location,
        online_link: schedule.online_link,
        generated_from_schedule: true,
        status: "PLANNED",
      });

      session = created.toObject();
    }

    const students = await getActiveStudentsOfClass(classId);

    const [attList, evalList] = await Promise.all([
      Attendance.find({ session_id: session._id }).lean(),
      Evaluation.find({ session_id: session._id }).lean(),
    ]);

    const attendanceByStudent = {};
    for (const a of attList) {
      attendanceByStudent[String(a.student_user_id)] = { status: a.status, note: a.note || "" };
    }

    const evaluationByStudent = {};
    for (const e of evalList) {
      evaluationByStudent[String(e.student_user_id)] = {
        ythuc: e.ythuc || 0,
        tienbo: e.tienbo || 0,
        tuduy: e.tuduy || 0,
      };
    }

    res.json({
      message: "OK",
      data: {
        session,
        class: { _id: classDoc._id, name: classDoc.name, subject: classDoc.subject, curriculum: classDoc.curriculum },
        schedule,
        students,
        attendanceByStudent,
        evaluationByStudent,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};