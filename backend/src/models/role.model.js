const mongoose = require("mongoose");

const RoleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true }, 
    description: { type: String },
    permissions: { type: [String], required: true, default: [] },
  },
  { timestamps: { createdAt: "created_at", updatedAt: "updated_at" }, collection: "roles" }
);

module.exports = mongoose.model("Role", RoleSchema);
 