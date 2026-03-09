// src/models/weeklySchedule.model.js
const mongoose = require("mongoose");

const MODE = ["ONLINE", "OFFLINE"];
const REPEAT_TYPE = ["WEEKLY", "ONCE"];

const WeeklyScheduleSchema = new mongoose.Schema(
  {
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },

    grade: { type: Number, min: 1, max: 12, default: 1 },
    subject: { type: String, trim: true, default: "Toán" },

    // ✅ thêm nếu bạn muốn lưu dạng lặp + khoảng thời gian + ghi chú
    repeat_type: { type: String, enum: REPEAT_TYPE, default: "WEEKLY" },
    start_date: { type: Date, default: null },
    end_date: { type: Date, default: null },
    note: { type: String, trim: true, default: "" },

    day_of_week: { type: Number, required: true, min: 0, max: 6 },
    start_time: { type: String, required: true },
    end_time: { type: String, required: true },

    is_active: { type: Boolean, default: true },
    mode: { type: String, enum: MODE, default: "OFFLINE" },
    location: { type: String },
    online_link: { type: String },
  },
  { timestamps: false, collection: "weekly_schedules" }
);

WeeklyScheduleSchema.index({ class_id: 1, day_of_week: 1 });

module.exports = mongoose.model("WeeklySchedule", WeeklyScheduleSchema);