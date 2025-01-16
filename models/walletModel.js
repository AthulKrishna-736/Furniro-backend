import mongoose from "mongoose";

const walletSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    balance: {
        type: Number,
        required: true,
        default: 0,
        min: [0, 'Balance cannot be negative'],
    },
    transactions: [{
        type: {
            type: String,
            enum: ['credit', 'debit'],
            required: true,
        },
        amount: {
            type: Number,
            required: true,
        },
        description: {
            type: String,
            reqruired: true,
        },
        relatedOrderId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Order',
        },
        date: {
            type: Date,
            required: true,
            default: Date.now,
        }
    }]
}, { timestamps: true });

const walletModel = mongoose.model('Wallet', walletSchema);

export default walletModel;