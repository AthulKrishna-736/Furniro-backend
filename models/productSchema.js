import mongoose from "mongoose";

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        trim: true,
        required: true,
    },
    description: {
        type: String,
        trim: true,
        required: true,
    },
    category: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    images: {
        type: [String],
        required: true,
    },
    stockQuantity: {
        type: Number,
        required: true,
    },

    salesPrice: {
        type: Number,
        required: true,
    },
    discountPrice: {
        type: Number,
    },
    isBlocked: {
        type: Boolean,
        default: false,
    },
}, { timestamps: true });

const productModel = mongoose.model('Product', productSchema)
export default productModel;
