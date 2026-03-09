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

    // Các trường mới
    gradeLevel: {
      type: String,
      trim: true,
      // enum: [
      //   "Lớp 1", "Lớp 2", "Lớp 3", "Lớp 4", "Lớp 5",
      //   "Khối 6", "Khối 7", "Khối 8", "Khối 9",
      //   "Khối 10", "Khối 11", "Khối 12",
      //   "Đại học", "Khác"
      // ], // có thể bỏ enum nếu muốn linh hoạt hơn
    },
    subject: {
      type: String,
      trim: true,
      // enum: ["Toán", "Vật lý", "Hóa học", "Sinh học", "Ngữ văn", "Lịch sử", "Địa lý", "Tiếng Anh", "Tin học", "GDCD", "Công nghệ", "Thể dục", "Khác"],
    },
    classLevel: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Class", 
      },
    ],

    // Liên kết với FileResource
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