const mongoose = require("mongoose");

const ENROLL_STATUS = ["ACTIVE", "LEFT"];

const ClassEnrollmentSchema = new mongoose.Schema(
  {
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    student_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true }, // user có student_profile

    status: { type: String, enum: ENROLL_STATUS, default: "ACTIVE" },
    joined_at: { type: Date, default: Date.now },
    left_at: { type: Date },
  },
  { timestamps: false, collection: "class_enrollments" }
);

ClassEnrollmentSchema.index({ class_id: 1, student_user_id: 1 }, { unique: true });
ClassEnrollmentSchema.index({ student_user_id: 1 });

module.exports = mongoose.model("ClassEnrollment", ClassEnrollmentSchema);
