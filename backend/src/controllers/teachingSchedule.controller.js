// src/controllers/teachingSchedule.controller.js
const WeeklySchedule = require('../models/weeklySchedule.model');
const Class = require('../models/class.model');

// 1. Tạo lịch dạy mới (Create Teaching Schedule)
exports.createSchedule = async (req, res) => {
  try {
    const tutorId = req.user._id;
    const classId = req.params.classId;

    const {
      day_of_week,
      start_time,
      end_time,
      is_active,
      mode,
      location,
      online_link,
    } = req.body;

    if (!day_of_week || !start_time || !end_time) {
      return res.status(400).json({ message: 'Thiếu ngày, giờ bắt đầu hoặc giờ kết thúc' });
    }

    // Kiểm tra lớp có tồn tại và thuộc tutor
    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) {
      return res.status(404).json({ message: 'Không tìm thấy lớp học hoặc bạn không có quyền' });
    }

    const schedule = new WeeklySchedule({
      class_id: classId,
      day_of_week,
      start_time,
      end_time,
      is_active: is_active !== undefined ? is_active : true,
      mode: mode || 'OFFLINE',
      location,
      online_link,
    });

    await schedule.save();

    res.status(201).json({
      message: 'Tạo lịch dạy thành công',
      data: schedule,
    });
  } catch (error) {
    res.status(500).json({ message: 'Lỗi server khi tạo lịch dạy', error: error.message });
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