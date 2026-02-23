const mongoose = require("mongoose");

const MODE = ["ONLINE", "OFFLINE"];

const ClassSchema = new mongoose.Schema(
  {
    tutor_user_id: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    name: { type: String, required: true, trim: true },
    level: { type: String },

    default_mode: { type: String, enum: MODE, default: "OFFLINE" },
    default_location: { type: String },
    default_online_link: { type: String },

    status: { type: String, default: "ACTIVE" },
    start_date: { type: Date },
    end_date: { type: Date },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "classes" }
);

ClassSchema.index({ tutor_user_id: 1 });

module.exports = mongoose.model("Class", ClassSchema);
