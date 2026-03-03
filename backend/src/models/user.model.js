const mongoose = require("mongoose");

const StudentProfileSchema = new mongoose.Schema(
  {
    student_full_name: { 
      type: String, 
      required: true, 
      trim: true 
    },

    // Thông tin cơ bản học đường
    school:      { type: String, trim: true },
    grade:       { type: String, trim: true },     // "8", "10", "11"...
    class_name:  { type: String, trim: true },     // "8A1", "10 Toán"...

   
    tutor_schedules: [{
      weekday:    { type: Number, required: true, min: 0, max: 6 }, // 0=CN, 1=T2...
      startTime:  { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
      endTime:    { type: String, required: true, match: /^([01]\d|2[0-3]):[0-5]\d$/ },
      subject:    { type: String, trim: true, default: "" }, // Toán, Lý, Anh...
      isActive:   { type: Boolean, default: true }
    }],

    // Trạng thái học tập cơ bản
    has_completed_assignment: { type: Boolean, default: false },

    // (Tùy chọn nhưng hữu ích để biết học sinh còn đang học gia sư không)
    status: {
      type: String,
      enum: ["ACTIVE", "PAUSED", "ENDED"],
      default: "ACTIVE"
    },
  },
  { _id: false }
);

// Phần UserSchema giữ nguyên, chỉ thay student_profile
const UserSchema = new mongoose.Schema(
  {
    email:         { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name:     { type: String, required: true, trim: true },
    phone:         { type: String },

    status: { type: String, enum: ["PENDING", "ACTIVE", "INACTIVE", "BANNED"], default: "PENDING" },
    roles:  [{ type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }],

    student_profile: { type: StudentProfileSchema, default: null },

    isEmailVerified: { type: Boolean, default: false },
  },
  { 
    timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, 
    collection: "users" 
  }
);

module.exports = mongoose.model("User", UserSchema);