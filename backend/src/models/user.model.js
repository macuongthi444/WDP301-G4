const mongoose = require("mongoose");

const USER_STATUS = ["PENDING", "ACTIVE", "INACTIVE", "BANNED"];

const StudentProfileSchema = new mongoose.Schema(
  {
    student_full_name: { type: String, required: true, trim: true },
    dob: { type: Date },
    gender: { type: String },
    school: { type: String },
    grade: { type: String },
    status: { type: String, default: "ACTIVE" },
  },
  { _id: false }
);

const UserSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    password_hash: { type: String, required: true },
    full_name: { type: String, required: true, trim: true },
    phone: { type: String },
    status: { type: String, enum: USER_STATUS, default: "PENDING" },

    // thay bảng UserRoles: lưu trực tiếp array role ids
    roles: [{ type: mongoose.Schema.Types.ObjectId, ref: "Role", required: true }],

    // account FAMILY có thể có student profile
    student_profile: { type: StudentProfileSchema, default: null },

    // Thêm vào UserSchema
    emailVerificationOTP: { type: String, select: false },          
    emailVerificationOTPExpires: { type: Date, select: false },

    resetPasswordOTP: { type: String, select: false },
    resetPasswordOTPExpires: { type: Date, select: false },

    isEmailVerified: { type: Boolean, default: false },             
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "users" }
);

module.exports = mongoose.model("User", UserSchema);
