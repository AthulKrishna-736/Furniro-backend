import Razorpay from 'razorpay';
import dotenv from 'dotenv';

dotenv.config();

const razorpayInstance = new Razorpay({
    key_id: process.env.RAZORPAY_ID_KEY,
    key_secret: process.env.RAZORPAY_SECRET_KEY,
});

export const createOrder = async (req, res, next) => {
    const { amount, currency } = req.body;

    const options = {
        amount: amount * 100,
        currency: currency || 'INR',
        receipt: `receipt_${Date.now()}`,
    };

    const order = await razorpayInstance.orders.create(options);

    res.status(201).json({ order });
}

