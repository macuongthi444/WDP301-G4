const mongoose = require("mongoose");

const SUBMISSION_STATUS = ["DRAFT", "SUBMITTED", "GRADED"];

const HomeworkSubmissionSchema = new mongoose.Schema(
  {
    assignment_id: { type: mongoose.Schema.Types.ObjectId, ref: "Assignment", required: true },
    student_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },

    content_text: { type: String },
    status: { type: String, enum: SUBMISSION_STATUS, default: "DRAFT" },
    submitted_at: { type: Date },

    score: { type: Number },
    feedback: { type: String },
    graded_at: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "homework_submissions" }
);

HomeworkSubmissionSchema.index({ assignment_id: 1, student_user_id: 1 }, { unique: true });
HomeworkSubmissionSchema.index({ student_user_id: 1 });

module.exports = mongoose.model("HomeworkSubmission", HomeworkSubmissionSchema);
