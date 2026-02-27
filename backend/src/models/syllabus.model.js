// src/models/syllabus.model.js
const mongoose = require("mongoose");

const SyllabusSchema = new mongoose.Schema(
  {
    tutor_user_id: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: { type: String, required: true, trim: true },
    description: { type: String },
    version: { type: String, default: "1.0" },

    // Liên kết với FileResource (các file/link/text của syllabus)
    file_resources: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "FileResource",
      },
    ],
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "syllabi" }
);

module.exports = mongoose.model("Syllabus", SyllabusSchema);