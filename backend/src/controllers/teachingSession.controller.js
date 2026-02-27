// src/controllers/teachingSession.controller.js
const TeachingSession = require('../models/teachingSession.model');
const Class = require('../models/class.model');
const WeeklySchedule = require('../models/weeklySchedule.model');

const { startOfWeek, addDays, parse, format, isValid } = require('date-fns'); // cần cài date-fns nếu chưa có

// 1. Tạo buổi học thủ công (không từ lịch tuần)
exports.createManualSession = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;
    const {
      start_at,      // ISO string hoặc "YYYY-MM-DDTHH:mm"
      end_at,
      mode = "OFFLINE",
      location,
      online_link,
      status = "PLANNED"
    } = req.body;

    if (!start_at || !end_at) {
      return res.status(400).json({ message: "Thiếu thời gian bắt đầu hoặc kết thúc" });
    }

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(404).json({ message: "Không tìm thấy lớp hoặc không có quyền" });
    }

    const session = new TeachingSession({
      class_id: classId,
      start_at: new Date(start_at),
      end_at: new Date(end_at),
      mode,
      location,
      online_link,
      status,
      generated_from_schedule: false
    });

    await session.save();

    res.status(201).json({
      message: "Tạo buổi học thủ công thành công",
      data: session
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 2. Sinh tự động các buổi học từ WeeklySchedule (thường gọi khi bắt đầu kỳ học hoặc mỗi tuần)
exports.generateSessionsFromSchedule = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;
    const { weeks = 4 } = req.body; // mặc định sinh 4 tuần tới

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(404).json({ message: "Không tìm thấy lớp hoặc không có quyền" });
    }

    const schedules = await WeeklySchedule.find({ class_id: classId, is_active: true });

    if (schedules.length === 0) {
      return res.status(400).json({ message: "Lớp này chưa có lịch tuần hoạt động" });
    }

    const today = new Date();
    const startOfCurrentWeek = startOfWeek(today, { weekStartsOn: 1 }); // thứ 2 là đầu tuần

    const createdSessions = [];

    for (let week = 0; week < weeks; week++) {
      const weekStart = addDays(startOfCurrentWeek, week * 7);

      for (const sched of schedules) {
        const dayOffset = sched.day_of_week; // 0=CN, 1=T2,...
        const sessionDate = addDays(weekStart, dayOffset);

        const [startH, startM] = sched.start_time.split(':').map(Number);
        const [endH, endM] = sched.end_time.split(':').map(Number);

        const startDateTime = new Date(sessionDate);
        startDateTime.setHours(startH, startM, 0, 0);

        const endDateTime = new Date(sessionDate);
        endDateTime.setHours(endH, endM, 0, 0);

        // Kiểm tra trùng lặp
        const exists = await TeachingSession.findOne({
          class_id: classId,
          start_at: startDateTime,
          end_at: endDateTime
        });

        if (exists) continue;

        const session = new TeachingSession({
          class_id: classId,
          schedule_id: sched._id,
          start_at: startDateTime,
          end_at: endDateTime,
          mode: sched.mode,
          location: sched.location,
          online_link: sched.online_link,
          status: "PLANNED",
          generated_from_schedule: true
        });

        await session.save();
        createdSessions.push(session);
      }
    }

    res.status(201).json({
      message: `Đã sinh ${createdSessions.length} buổi học`,
      data: createdSessions
    });

  } catch (error) {
    res.status(500).json({ message: "Lỗi khi sinh buổi học", error: error.message });
  }
};

// 3. Lấy danh sách buổi học của lớp (có thể filter theo trạng thái, khoảng thời gian)
exports.getSessionsByClass = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId } = req.params;
    const { status, startDate, endDate } = req.query;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    const filter = { class_id: classId };
    if (status) filter.status = status;
    if (startDate) filter.start_at = { $gte: new Date(startDate) };
    if (endDate) filter.start_at = { ...filter.start_at, $lte: new Date(endDate) };

    const sessions = await TeachingSession.find(filter)
      .sort({ start_at: 1 })
      .populate('schedule_id', 'day_of_week start_time end_time');

    res.json({
      message: "Lấy danh sách buổi học thành công",
      data: sessions
    });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};

// 4. Cập nhật trạng thái buổi học (hoàn thành, hủy, dời lịch...)
exports.updateSessionStatus = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const { classId, sessionId } = req.params;
    const { status } = req.body;

    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId });
    if (!session) return res.status(404).json({ message: "Không tìm thấy buổi học" });

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    session.status = status;
    await session.save();

    res.json({ message: "Cập nhật trạng thái thành công", data: session });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};
