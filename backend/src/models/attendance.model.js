const mongoose = require("mongoose");

const ATT_STATUS = ["ATTENDED", "ABSENT", "NOT_MARKED"];  

const AttendanceSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "TeachingSession", required: true },
    student_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    status: { type: String, enum: ATT_STATUS, required: true },
    marked_at: { type: Date, default: Date.now },
    note: { type: String },
  },
  { timestamps: false, collection: "attendances" }
);

AttendanceSchema.index({ session_id: 1, student_user_id: 1 }, { unique: true });
AttendanceSchema.index({ student_user_id: 1 });

module.exports = mongoose.model("Attendance", AttendanceSchema);
