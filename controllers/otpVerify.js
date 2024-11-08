import userModel from "../models/userModel.js";

export const otpVerify = async(req, res)=> {
    const { email } = req.body;
    const otpExpireAt = new Date()
    otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 2); 
    try {
        const response = await userModel.findOneAndUpdate({ email: email }, { otpExpireAt: otpExpireAt }, { new: true })
        res.status(200).json({ message:'OTP has sent successfully', otpExpireAt: response.otpExpireAt })
    } catch (error) {
        console.log(error.message)
        res.status(500).json({ message:'Internal server error' });
    }
}