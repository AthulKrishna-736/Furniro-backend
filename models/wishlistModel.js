import mongoose from "mongoose";

const wishlistSchema = new mongoose.Schema(
    {
      userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true,
      },
      products: [
        {
          productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product', 
            required: true,
          },
          productName: {
            type: String,
            required: true,
          },
          price: {
            type: Number,
            required: true,
          },
          addedAt: {
            type: Date,
            default: Date.now, 
          },
        },
      ],
    },{ timestamps: true  });

  const wishlistModel = mongoose.model('Wishlist', wishlistSchema);

  export default wishlistModel;