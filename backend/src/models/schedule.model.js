const mongoose = require("mongoose");

const ScheduleSchema = new mongoose.Schema(
  {
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true, index: true },
    day_of_week: { type: Number, required: true }, // 0..6
    start_time: { type: String, required: true },  // "18:00"
    end_time: { type: String, required: true },    // "19:30"
    mode: { type: String, enum: ["OFFLINE", "ONLINE"], default: "OFFLINE" },
    location: { type: String, default: "" },
    online_link: { type: String, default: "" },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Schedule", ScheduleSchema);