// src/controllers/weeklySchedule.controller.js
const WeeklySchedule = require('../models/weeklySchedule.model');
const Class = require('../models/class.model');
const ClassEnrollment = require('../models/classEnrollment.model');
const TeachingSession = require("../models/teachingSession.model");
const Attendance = require("../models/attendance.model");
// 1. Tạo lịch dạy mới (Create Weekly Schedule)
exports.createSchedule = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;

    const {
      grade = 1,
      subject = "Toán",
      repeat_type = "WEEKLY",
      start_date,
      end_date,
      note = "",

      day_of_week,
      start_time,
      end_time,
      is_active = true,
      mode = "OFFLINE",
      location,
      online_link,
    } = req.body;

    // validate grade
    const g = Number(grade);
    if (Number.isNaN(g) || g < 1 || g > 12) {
      return res.status(400).json({ message: "grade phải từ 1 đến 12" });
    }

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(404).json({ message: "Không tìm thấy lớp hoặc không có quyền" });

    // ✅ Lưu grade + subject vào schedule
    const schedule = new WeeklySchedule({
      class_id: classId,
      grade: g,
      subject: String(subject || "").trim() || "Toán",
      repeat_type,
      start_date: start_date ? new Date(start_date) : null,
      end_date: end_date ? new Date(end_date) : null,
      note: String(note || "").trim(),
      day_of_week,
      start_time,
      end_time,
      is_active,
      mode,
      location,
      online_link,
    });

    await schedule.save();

    // ---- helper: lấy học sinh active (lấy 1 lần)
    const enrollments = await ClassEnrollment.find({ class_id: classId, status: "ACTIVE" }).lean();
    const activeStudents = enrollments.map(e => e.student_user_id).filter(Boolean);

    // ---- Sinh TeachingSession + Attendance cho 12 tuần tới
    const weeksToGenerate = 12;

    // startOfWeek = Thứ 2 tuần hiện tại (00:00)
    const startOfWeek = new Date();
    const jsDay = startOfWeek.getDay(); // 0..6 (CN=0)
    const diffToMonday = jsDay === 0 ? -6 : 1 - jsDay;
    startOfWeek.setDate(startOfWeek.getDate() + diffToMonday);
    startOfWeek.setHours(0, 0, 0, 0);

    const createdSessions = [];

    // ⚠️ Vì startOfWeek là Thứ 2, nên offset phải là (day_of_week - 1), CN=6
    const offsetFromMonday = Number(day_of_week) === 0 ? 6 : Number(day_of_week) - 1;

    for (let w = 0; w < weeksToGenerate; w++) {
      const sessionDate = new Date(startOfWeek);
      sessionDate.setDate(sessionDate.getDate() + w * 7 + offsetFromMonday);

      const [sh, sm] = String(start_time).split(":").map(Number);
      const [eh, em] = String(end_time).split(":").map(Number);

      const startAt = new Date(sessionDate);
      startAt.setHours(sh, sm, 0, 0);

      const endAt = new Date(sessionDate);
      endAt.setHours(eh, em, 0, 0);

      const exists = await TeachingSession.findOne({ class_id: classId, start_at: startAt });
      if (exists) continue;

      const session = await TeachingSession.create({
        class_id: classId,
        schedule_id: schedule._id,
        start_at: startAt,
        end_at: endAt,
        mode,
        location,
        online_link,
        status: "PLANNED",
        generated_from_schedule: true,
      });

      // Attendance mặc định
      if (activeStudents.length) {
        await Attendance.insertMany(
          activeStudents.map((studentId) => ({
            session_id: session._id,
            student_user_id: studentId,
            status: "NOT_MARKED",
            note: null,
            marked_at: null,
          })),
          { ordered: false }
        );
      }

      createdSessions.push(session);
    }

    return res.status(201).json({
      message: `Tạo lịch tuần thành công. Đã sinh ${createdSessions.length} buổi học`,
      schedule,
      generatedSessionsCount: createdSessions.length,
      activeStudentsCount: activeStudents.length,
    });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// 2. Lấy danh sách lịch dạy của một lớp
exports.getSchedulesByClass = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.classId;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc bạn không có quyền' });
    }

    const schedules = await WeeklySchedule.find({ class_id: classId })
      .sort({ day_of_week: 1, start_time: 1 });

    res.status(200).json({
      message: 'Lấy danh sách lịch dạy thành công',
      data: schedules,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 3. Cập nhật lịch dạy
exports.updateSchedule = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, scheduleId } = req.params;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Bạn không có quyền cập nhật lịch này" });

    const updates = req.body;

    const schedule = await WeeklySchedule.findOneAndUpdate(
      { _id: scheduleId, class_id: classId },
      updates,
      { new: true, runValidators: true }
    );

    if (!schedule) return res.status(404).json({ message: "Không tìm thấy lịch dạy" });

    return res.status(200).json({ message: "Cập nhật lịch dạy thành công", data: schedule });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
// 4. Xóa lịch dạy
exports.deleteSchedule = async (req, res) => {
   try {
    const tutorId = req.user._id;
    const { classId, scheduleId } = req.params;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Bạn không có quyền xóa lịch này" });

    const schedule = await WeeklySchedule.findOneAndDelete({ _id: scheduleId, class_id: classId });
    if (!schedule) return res.status(404).json({ message: "Không tìm thấy lịch dạy" });

    return res.status(200).json({ message: "Xóa lịch dạy thành công", data: schedule });
  } catch (error) {
    return res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
