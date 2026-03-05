// backend/src/controllers/sessionSave.controller.js

const ATT_STATUS = ["ATTENDED", "ABSENT"];

// ✅ Export theo property (không replace module.exports)
exports.saveSessionUI = async (req, res) => {
  try {
    // ✅ lazy require để tránh circular dependency
    const Class = require("../models/class.model");
    const TeachingSession = require("../models/teachingSession.model");
    const Attendance = require("../models/attendance.model");
    const Evaluation = require("../models/evaluation.model");

    const tutorId = req.user._id;
    const { classId, sessionId } = req.params;
    const { items } = req.body;

    const classDoc = await Class.findOne({ _id: classId, tutor_user_id: tutorId });
    if (!classDoc) return res.status(403).json({ message: "Không có quyền" });

    const session = await TeachingSession.findOne({ _id: sessionId, class_id: classId });
    if (!session) return res.status(404).json({ message: "Không tìm thấy buổi học" });

    if (!Array.isArray(items)) return res.status(400).json({ message: "items phải là mảng" });

    const attOps = [];
    const evalOps = [];

    for (const it of items) {
      if (!it?.studentId) continue;

      // attendance
      if (it.status) {
        if (!ATT_STATUS.includes(it.status)) {
          return res.status(400).json({ message: "status chỉ ATTENDED/ABSENT" });
        }
        attOps.push({
          updateOne: {
            filter: { session_id: sessionId, student_user_id: it.studentId },
            update: { $set: { status: it.status, note: it.note || null, marked_at: new Date() } },
            upsert: true,
          },
        });
      }

      // evaluation
      if (it.rating) {
        const ythuc = Number(it.rating.ythuc || 0);
        const tienbo = Number(it.rating.tienbo || 0);
        const tuduy = Number(it.rating.tuduy || 0);

        evalOps.push({
          updateOne: {
            filter: { session_id: sessionId, student_user_id: it.studentId },
            update: { $set: { ythuc, tienbo, tuduy, updated_at: new Date() } },
            upsert: true,
          },
        });
      }
    }

    if (attOps.length) await Attendance.bulkWrite(attOps, { ordered: false });
    if (evalOps.length) await Evaluation.bulkWrite(evalOps, { ordered: false });

    res.json({ message: "Lưu thành công" });
  } catch (error) {
    res.status(500).json({ message: "Lỗi server", error: error.message });
  }
};