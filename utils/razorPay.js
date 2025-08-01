import Razorpay from 'razorpay';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js';

dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export const createOrder = async (req, res, next) => {
    try {
        const { amount, currency, userId } = req.body;

        console.log('data razorpay: ', req.body)

        const options = {
            amount: amount * 100,
            currency: currency || 'INR',
            receipt: `receipt_${Date.now()}`,
        };

        if (!amount || !currency || !userId) {
            return res.status(400).json({ statusCode: 400, message: 'Missing fields required' })
        }

        const user = await userModel.findById(userId);
        if (!user) {
            return next({ statusCode: 400, message: 'User not found' });
        }

        const order = await razorpayInstance.orders.create(options);

        res.status(201).json({ order, user });
    } catch (error) {
        console.log('error on razorpay order creating: ', error);
        next({ statusCode: 500, message: 'Error creating razorpay order', error: error.message })
    }
}

