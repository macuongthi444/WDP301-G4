const mongoose = require("mongoose");

const MODE = ["ONLINE", "OFFLINE"];
const SESSION_STATUS = ["PLANNED", "COMPLETED", "CANCELLED", "RESCHEDULED"];

const TeachingSessionSchema = new mongoose.Schema(
  {
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    schedule_id: { type: mongoose.Schema.Types.ObjectId, ref: "WeeklySchedule" }, // optional

    start_at: { type: Date, required: true },
    end_at: { type: Date, required: true },

    mode: { type: String, enum: MODE, default: "OFFLINE" },
    location: { type: String },
    online_link: { type: String },

    status: { type: String, enum: SESSION_STATUS, default: "PLANNED" },
    generated_from_schedule: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "teaching_sessions" }
);

TeachingSessionSchema.index({ class_id: 1, start_at: 1 });
TeachingSessionSchema.index({ schedule_id: 1 });

module.exports = mongoose.model("TeachingSession", TeachingSessionSchema);
