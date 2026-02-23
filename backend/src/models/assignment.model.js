const mongoose = require("mongoose");

const ASSIGNMENT_STATUS = ["DRAFT", "PUBLISHED", "CLOSED"];

const AssignmentSchema = new mongoose.Schema(
  {
    class_id: { type: mongoose.Schema.Types.ObjectId, ref: "Class", required: true },
    session_id: { type: mongoose.Schema.Types.ObjectId, ref: "TeachingSession" }, // optional
    syllabus_id: { type: mongoose.Schema.Types.ObjectId, ref: "Syllabus" },        // optional

    title: { type: String, required: true, trim: true },
    description: { type: String },

    generated_by_ai: { type: Boolean, default: false },
    ai_prompt: { type: String },

    due_at: { type: Date },
    status: { type: String, enum: ASSIGNMENT_STATUS, default: "DRAFT" },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "assignments" }
);

AssignmentSchema.index({ class_id: 1 });
AssignmentSchema.index({ session_id: 1 });
AssignmentSchema.index({ syllabus_id: 1 });

module.exports = mongoose.model("Assignment", AssignmentSchema);
