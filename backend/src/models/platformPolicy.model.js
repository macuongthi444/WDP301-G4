const mongoose = require("mongoose");

const FEE_PERIOD = ["MONTH", "WEEK"];

const PlatformPolicySchema = new mongoose.Schema(
  {
    max_students_per_tutor: { type: Number },
    free_students_limit: { type: Number, required: true },
    fee_from_student_no: { type: Number, required: true },
    fee_amount: { type: Number, required: true },
    fee_period: { type: String, enum: FEE_PERIOD, required: true },
    effective_from: { type: Date, required: true },
    is_active: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "platform_policies" }
);

PlatformPolicySchema.index({ is_active: 1, effective_from: -1 });

module.exports = mongoose.model("PlatformPolicy", PlatformPolicySchema);
