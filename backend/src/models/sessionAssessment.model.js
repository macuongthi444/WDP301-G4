const mongoose = require("mongoose");

const SessionAssessmentSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "TeachingSession", required: true },
    student_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    score: { type: Number },
    evaluation_text: { type: String },
    progress_remark: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "session_assessments" }
);

SessionAssessmentSchema.index({ session_id: 1, student_user_id: 1 }, { unique: true });

module.exports = mongoose.model("SessionAssessment", SessionAssessmentSchema);
