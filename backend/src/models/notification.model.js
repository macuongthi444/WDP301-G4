const mongoose = require("mongoose");

const NotificationSchema = new mongoose.Schema(
  {
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type: { type: String, required: true },
    title: { type: String, required: true },
    content: { type: String },

    entity_type: { type: String }, // CLASS/SESSION/ASSIGNMENT/SUBMISSION...
    entity_id: { type: mongoose.Schema.Types.ObjectId },

    is_read: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "notifications" }
);

NotificationSchema.index({ user_id: 1, is_read: 1, created_at: -1 });

module.exports = mongoose.model("Notification", NotificationSchema);
