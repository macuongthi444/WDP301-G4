// src/controllers/teachingSchedule.controller.js
const WeeklySchedule = require('../models/weeklySchedule.model');
const Class = require('../models/class.model');
const ClassEnrollment = require('../models/classEnrollment.model');
// 1. Tạo lịch dạy mới (Create Teaching Schedule)
exports.createSchedule = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;
    const { day_of_week, start_time, end_time, is_active = true, mode = "OFFLINE", location, online_link } = req.body;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(404).json({ message: "Không tìm thấy lớp hoặc không có quyền" });

    const schedule = new WeeklySchedule({
      class_id: classId,
      day_of_week,
      start_time,
      end_time,
      is_active,
      mode,
      location,
      online_link
    });

    await schedule.save();

    // Sinh TeachingSession + Attendance cho 12 tuần tới (có thể config số tuần)
    const weeksToGenerate = 12;
    const today = new Date();
    const startOfWeek = new Date(today.setDate(today.getDate() - today.getDay() + 1)); // thứ 2 tuần này

    const createdSessions = [];
    // Thêm vào đầu file weeklySchedule.controller.js (sau các require)
    async function getActiveStudentsOfClass(classId) {
      const enrollments = await ClassEnrollment.find({
        class_id: classId,
        status: "ACTIVE"
      });
      return enrollments.map(enroll => enroll.student_user_id);
    }
    for (let w = 0; w < weeksToGenerate; w++) {
      const weekStart = new Date(startOfWeek);
      weekStart.setDate(weekStart.getDate() + w * 7);

      const sessionDate = new Date(weekStart);
      sessionDate.setDate(sessionDate.getDate() + day_of_week);

      const [sh, sm] = start_time.split(':').map(Number);
      const [eh, em] = end_time.split(':').map(Number);

      const startAt = new Date(sessionDate);
      startAt.setHours(sh, sm, 0, 0);

      const endAt = new Date(sessionDate);
      endAt.setHours(eh, em, 0, 0);

      // Kiểm tra trùng
      const exists = await TeachingSession.findOne({ class_id: classId, start_at: startAt });
      if (exists) continue;

      const session = new TeachingSession({
        class_id: classId,
        schedule_id: schedule._id,
        start_at: startAt,
        end_at: endAt,
        mode,
        location,
        online_link,
        status: "PLANNED",
        generated_from_schedule: true
      });

      await session.save();

      // Sinh Attendance mặc định cho học sinh active
      const activeStudents = await getActiveStudentsOfClass(classId);
      const attendancePromises = activeStudents.map(studentId => {
        return new Attendance({
          session_id: session._id,
          student_user_id: studentId,
          status: "NOT_MARKED",
          note: null,
          marked_at: null
        }).save();
      });

      await Promise.all(attendancePromises);

      createdSessions.push(session);
    }

    res.status(201).json({
      message: `Tạo lịch tuần thành công. Đã sinh ${createdSessions.length} buổi học và ${activeStudents.length * createdSessions.length} điểm danh mặc định`,
      schedule,
      generatedSessionsCount: createdSessions.length
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
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
    const classId = req.params.classId;
    const scheduleId = req.params.scheduleId;

    const updates = req.body;

    const schedule = await WeeklySchedule.findOneAndUpdate(
      { _id: scheduleId, class_id: classId },
      updates,
      { new: true, runValidators: true }
    );

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch dạy' });
    }

    // Kiểm tra quyền tutor
    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(403).json({ message: 'Bạn không có quyền cập nhật lịch này' });
    }

    res.status(200).json({
      message: 'Cập nhật lịch dạy thành công',
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

// 4. Xóa lịch dạy
exports.deleteSchedule = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.classId;
    const scheduleId = req.params.scheduleId;

    const schedule = await WeeklySchedule.findOneAndDelete({
      _id: scheduleId,
      class_id: classId,
    });

    if (!schedule) {
      return res.status(404).json({ message: 'Không tìm thấy lịch dạy' });
    }

    // Kiểm tra quyền tutor
    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(403).json({ message: 'Bạn không có quyền xóa lịch này' });
    }

    res.status(200).json({
      message: 'Xóa lịch dạy thành công',
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server', error: error.message });
  }
};

