import mongoose from "mongoose";

const TenantSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },
    room: {
      type: String,
      required: true,
    },
    rent: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Tenant ||
  mongoose.model("Tenant", TenantSchema);