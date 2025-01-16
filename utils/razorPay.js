import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';

dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export const createOrder = async (req, res, next) => {
    const { amount, currency, userId } = req.body;

    const options = {
        amount: amount * 100,
        currency: currency || 'INR',
        receipt: `receipt_${Date.now()}`,
    };

    const user = await userModel.findById(userId);
    if(!user){
        return next({ statusCode: 400, message: 'User not found'});
    }
    console.log('user details: ', user);

    const order = await razorpayInstance.orders.create(options);
    console.log('razor pay order creaeted here: ', order)

    res.status(201).json({ order, user });
}

