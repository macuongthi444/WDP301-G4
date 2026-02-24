// src/models/weeklySchedule.model.js
const mongoose = require("mongoose");

const MODE = ["ONLINE", "OFFLINE"];

const WeeklyScheduleSchema = new mongoose.Schema(
  {
    class_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Class",
      required: true,
      index: true,
    },
    day_of_week: { type: Number, required: true, min: 0, max: 6 }, // 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    start_time: { type: String, required: true }, // "HH:mm" ví dụ "08:00"
    end_time: { type: String, required: true },   // "HH:mm" ví dụ "10:00"

    is_active: { type: Boolean, default: true },
    mode: { type: String, enum: MODE, default: "OFFLINE" },
    location: { type: String },
    online_link: { type: String },
  },
  { timestamps: false, collection: "weekly_schedules" }
);

WeeklyScheduleSchema.index({ class_id: 1, day_of_week: 1 }); // Index để query nhanh theo lớp + ngày

module.exports = mongoose.model("WeeklySchedule", WeeklyScheduleSchema);