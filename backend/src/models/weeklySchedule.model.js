const mongoose = require("mongoose");

const MODE = ["ONLINE", "OFFLINE"];

const WeeklyScheduleSchema = new mongoose.Schema(
  {
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    day_of_week: { type: Number, required: true, min: 0, max: 6 }, // 0-6
    start_time: { type: String, required: true }, // "HH:mm"
    end_time: { type: String, required: true },

    is_active: { type: Boolean, default: true },
    mode: { type: String, enum: MODE, default: "OFFLINE" },
    location: { type: String },
    online_link: { type: String },
  },
  { timestamps: false, collection: "weekly_schedules" }
);

WeeklyScheduleSchema.index({ class_id: 1 });

module.exports = mongoose.model("WeeklySchedule", WeeklyScheduleSchema);
