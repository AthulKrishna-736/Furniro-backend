import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    userId:{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    items:[
        {
            productId:{
                type: mongoose.Schema.Types.ObjectId,
                ref:'Product',
                required: true
            },
            name:{
                type:String,
                required: true,
            },
            quantity:{
                type: Number,
                required: true,
                default: 1,
                max: 5,
            },
            price: {
                type: Number,
                required: true,
            },
        }
    ],
    totalPrice:{
        type: Number,
        required: true,
        default: 0
    }
}, { timestamps: true });

const cartModel = mongoose.model('Cart', cartSchema);

export default cartModel;