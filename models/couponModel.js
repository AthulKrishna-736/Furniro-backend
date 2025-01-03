import mongoose from 'mongoose';

const couponSchema = mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      unique: true,
    },
    discountType: {
      type: String,
      enum: ["PERCENTAGE", "FLAT"], 
      required: true,
    },
    discountValue: {
      type: Number,
      required: true,
    },
    minPrice: {
      type: Number,
      required: true,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    usedCount: { 
      type: Number,
      default: 0, 
    },
  },
  { timestamps: true }
);

const couponModel = mongoose.model("Coupons", couponSchema);

export default couponModel;
