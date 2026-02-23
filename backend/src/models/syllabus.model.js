const mongoose = require("mongoose");

const SyllabusSchema = new mongoose.Schema(
  {
    tutor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    version: { type: String },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "syllabi" }
);

SyllabusSchema.index({ tutor_user_id: 1 });

module.exports = mongoose.model("Syllabus", SyllabusSchema);
