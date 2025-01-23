import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    orderedItems: [
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: 'Product',
          required: true,
        },
        price: {
          type: Number,
          required: true,
        },
        quantity: {
          type: Number,
          required: true,
          min: 1,
        },
        status: {
          type: String,
          enum: ['Pending', 'Processing', 'Delivered', 'Cancelled', 'Returned'],
          default: 'Pending',
        },
        returnRequest: {
          status: {
            type: String,
            enum: ['Pending', 'Accepted', 'Rejected'],
          },
          reason: {
            type: String,
          },
          requestedAt: {
            type: Date,
          },
          updatedAt: {
            type: Date,
          },
        },
      },
    ],
    selectedAddress: {
      type: String,
      required: true,
    },
    totalPrice: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled', 'Returned'],
      default: 'Pending',
    },
    payment: {
      type: String,
      enum: ['COD', 'Razorpay', 'Wallet'],
      required: true,
    },
    paymentStatus: {
      type: String,
      enum: ['Pending', 'Completed', 'Failed', 'Refunded'],
      default: 'Pending',
    },
    couponApplied: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Coupons',
    },
  },
  { timestamps: true }
);

const orderModel = mongoose.model('Order', orderSchema);

export default orderModel;