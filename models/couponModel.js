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
    count:{
      type: Number,
      required: true,
    },
    usedCount: { 
      type: Number,
      default: 0, 
    },
    user:{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }
  },
  { timestamps: true }
);

const couponModel = mongoose.model("Coupons", couponSchema);

export default couponModel;
