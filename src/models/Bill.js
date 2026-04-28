import mongoose from "mongoose";

const BillSchema = new mongoose.Schema(
  {
    tenantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tenant",
      required: true,
    },

    month: {
      type: String,
      required: true,
    },

    // Electricity
    prevUnit: Number,
    currUnit: Number,
    usedUnit: Number,
    unitPrice: {
      type: Number,
      default: 10,
    },
    electricityCost: Number,

    // Water
    water: {
      type: Number,
      default: 0,
    },

    // Rent (copied from tenant at that time)
    rent: Number,

    // Carry forward
    previousDue: {
      type: Number,
      default: 0,
    },

    // Total calculation
    total: Number,

    // Payment - split into cash and online
    cashAmount: {
      type: Number,
      default: 0,
    },
    onlineAmount: {
      type: Number,
      default: 0,
    },
    paidAmount: {
      type: Number,
      default: 0,
    },
    remaining: Number,

    paymentMethod: {
      type: String,
      enum: ["cash", "online", "both"],
    },

    // Notes
    remarks: String,
  },
  { timestamps: true }
);

export default mongoose.models.Bill ||
  mongoose.model("Bill", BillSchema);