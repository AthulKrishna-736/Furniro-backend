import { now } from "mongoose";
import userModel from "../models/userModel.js";

export const otpCheck = async(req, res)=>{
    const { otpString } = req.body
    console.log(req.body)
    try {
        const checkOtp = await userModel.findOne({ otp: otpString })
        console.log('check ',checkOtp)

        if(checkOtp){
            return res.status(200).json({ message:'OTP verified successfully.' })
        }else{
            return res.status(404).json({ message:'Invalid OTP. Please try again.' })
        }
    } catch (error) {
        console.log(error)
        res.status(500).json({ message:'Internal server error. Please try again later.' })
    }
}



