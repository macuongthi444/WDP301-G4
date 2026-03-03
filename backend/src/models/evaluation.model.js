const mongoose = require("mongoose");

const EvaluationSchema = new mongoose.Schema(
  {
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "TeachingSession", required: true, index: true },
    student_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },

    ythuc: { type: Number, min: 0, max: 5, default: 0 },
    tienbo: { type: Number, min: 0, max: 5, default: 0 },
    tuduy: { type: Number, min: 0, max: 5, default: 0 },

    updated_at: { type: Date, default: Date.now },
  },
  { timestamps: true, collection: "evaluations" }
);

EvaluationSchema.index({ session_id: 1, student_user_id: 1 }, { unique: true });

module.exports = mongoose.model("Evaluation", EvaluationSchema);