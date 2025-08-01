import mongoose from "mongoose";

const categoryOfferSchema = new mongoose.Schema({
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true,
  },
  discountValue: {
    type: Number,
    required: true,
    min: 1,
  },
  startDate: {
    type: Date,
    required: true,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
}, { timestamps: true });

const catOfferModel = mongoose.model('CategoryOffer', categoryOfferSchema);

export default catOfferModel;
