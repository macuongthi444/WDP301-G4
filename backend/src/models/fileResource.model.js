const mongoose = require("mongoose");

const FILE_TYPE = ["FILE", "LINK", "IMAGE", "TEXT"];
const OWNER_TYPE = ["SYLLABUS", "ASSIGNMENT", "SUBMISSION"];

const FileResourceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: FILE_TYPE, required: true },
    url_or_content: { type: String, required: true },
    file_name: { type: String },

    ownerType: { type: String, enum: OWNER_TYPE, required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, required: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "file_resources" }
);

FileResourceSchema.index({ ownerType: 1, ownerId: 1 });

module.exports = mongoose.model("FileResource", FileResourceSchema);
