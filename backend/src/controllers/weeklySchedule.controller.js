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
      location = "",
      online_link = "",
    } = req.body;

    // ── VALIDATION CHI TIẾT ────────────────────────────────────────────────

    // 1. grade
    const g = Number(grade);
    if (Number.isNaN(g) || g < 1 || g > 12) {
      return res.status(400).json({ message: "Grade phải là số từ 1 đến 12" });
    }

    // 2. day_of_week (phải là số 0-6)
    const dow = Number(day_of_week);
    if (Number.isNaN(dow) || dow < 0 || dow > 6) {
      return res.status(400).json({ message: "day_of_week phải là số từ 0 đến 6" });
    }

    // 3. start_time & end_time (định dạng HH:mm)
    if (!start_time || !end_time || !/^\d{2}:\d{2}$/.test(start_time) || !/^\d{2}:\d{2}$/.test(end_time)) {
      return res.status(400).json({ message: "start_time và end_time phải có định dạng HH:mm" });
    }

    const [startH, startM] = start_time.split(":").map(Number);
    const [endH, endM] = end_time.split(":").map(Number);

    if (
      Number.isNaN(startH) || Number.isNaN(startM) ||
      Number.isNaN(endH) || Number.isNaN(endM) ||
      startH < 0 || startH > 23 || startM < 0 || startM > 59 ||
      endH < 0 || endH > 23 || endM < 0 || endM > 59
    ) {
      return res.status(400).json({ message: "Giờ/phút không hợp lệ" });
    }

    if (startH * 60 + startM >= endH * 60 + endM) {
      return res.status(400).json({ message: "Giờ kết thúc phải lớn hơn giờ bắt đầu" });
    }

    // 4. start_date & end_date
    if (!start_date || !/^\d{4}-\d{2}-\d{2}$/.test(start_date)) {
      return res.status(400).json({ message: "start_date phải có định dạng YYYY-MM-DD" });
    }

    const startDateObj = new Date(start_date);
    if (isNaN(startDateObj.getTime())) {
      return res.status(400).json({ message: "start_date không hợp lệ" });
    }

    let endDateObj = null;
    if (repeat_type === "WEEKLY") {
      if (!end_date || !/^\d{4}-\d{2}-\d{2}$/.test(end_date)) {
        return res.status(400).json({ message: "end_date bắt buộc khi repeat_type = WEEKLY" });
      }
      endDateObj = new Date(end_date);
      if (isNaN(endDateObj.getTime()) || endDateObj < startDateObj) {
        return res.status(400).json({ message: "end_date phải lớn hơn hoặc bằng start_date" });
      }
    } else {
      // ONCE → end_date = start_date
      endDateObj = startDateObj;
    }

    // 5. Kiểm tra quyền lớp
    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(404).json({ message: "Không tìm thấy lớp hoặc bạn không có quyền" });
    }

    // ── TẠO SCHEDULE ────────────────────────────────────────────────────────
    const schedule = new WeeklySchedule({
      class_id: classId,
      grade: g,
      subject: String(subject).trim() || "Toán",
      repeat_type,
      start_date: startDateObj,
      end_date: endDateObj,
      note: String(note).trim(),
      day_of_week: dow,
      start_time,
      end_time,
      is_active: Boolean(is_active),
      mode,
      location: String(location).trim(),
      online_link: String(online_link).trim(),
    });
    await schedule.save();

    // ── SINH TEACHING SESSIONS (12 tuần tới) ────────────────────────────────
    const enrollments = await ClassEnrollment.find({ class_id: classId, status: "ACTIVE" }).lean();
    const activeStudents = enrollments.map(e => e.student_user_id).filter(Boolean);

    const weeksToGenerate = 12;
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() + (1 - startOfWeek.getDay() || -6));
    startOfWeek.setHours(0, 0, 0, 0);

    const offsetFromMonday = dow === 0 ? 6 : dow - 1;

    const createdSessions = [];

    for (let w = 0; w < weeksToGenerate; w++) {
      const sessionDate = new Date(startOfWeek);
      sessionDate.setDate(sessionDate.getDate() + w * 7 + offsetFromMonday);

      // Bỏ qua nếu ngày đã qua
      if (sessionDate < new Date()) continue;

      const startAt = new Date(sessionDate);
      startAt.setHours(startH, startM, 0, 0);

      const endAt = new Date(sessionDate);
      endAt.setHours(endH, endM, 0, 0);

      // Kiểm tra trùng
      const exists = await TeachingSession.findOne({
        class_id: classId,
        start_at: startAt,
      });

      if (exists) continue;

      const session = await TeachingSession.create({
        class_id: classId,
        schedule_id: schedule._id,
        start_at: startAt,
        end_at: endAt,
        mode,
        location: location || "",
        online_link: online_link || "",
        status: "PLANNED",
        generated_from_schedule: true,
      });

      if (activeStudents.length > 0) {
        await Attendance.insertMany(
          activeStudents.map(studentId => ({
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
      message: `Tạo lịch thành công. Sinh ${createdSessions.length} buổi học`,
      schedule,
      generatedSessionsCount: createdSessions.length,
      activeStudentsCount: activeStudents.length,
    });
  } catch (error) {
    console.error("LỖI TẠO LỊCH:", error);
    return res.status(500).json({
      message: "Lỗi server khi tạo lịch dạy",
      error: error.message,
      // stack: error.stack  // chỉ bật khi dev, production thì bỏ
    });
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
