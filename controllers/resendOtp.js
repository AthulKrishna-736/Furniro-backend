import userModel from "../models/userModel.js";
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
import crypto from 'crypto';

dotenv.config();

export const resendOtp = async (req, res)=>{
    const { email } = req.body;
    const newOtp = crypto.randomInt(100000, 999999).toString();
    try {
        const user = await userModel.findOneAndUpdate({ email }, {$set: { otp: newOtp }  }, { new:true })
        console.log(user.otp)
        const otp = user.otp;

        //creating the method of email trasportation
        const transporter = nodemailer.createTransport({
            service:'gmail',
            auth:{
                user:process.env.EMAIL,
                pass:process.env.EMAIL_PASS,
            }
        });

        //configuring the email
        const mailOptions = {
            from: process.env.EMAIL,
            to: email,
            subject: 'Your Verification Code for Furniro',
            html: `
            <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 20px auto; padding: 20px; border: 1px solid #dcdcdc; border-radius: 8px; background-color: rgba(255, 255, 255, 0.8); background-image: url('https://t3.ftcdn.net/jpg/07/00/50/82/360_F_700508241_HpTCpfcnQ6EsEebsMEDovyPbV1LZtI45.jpg'); background-size: cover; background-position: center;">
                <h2 style="color: #333; text-align: center; margin-bottom: 20px; text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);">Verification Code</h2>
                <p style="font-size: 16px; color: #fff; text-align: center; text-shadow: 1px 1px 3px rgba(0, 0, 0, 0.2);">Use the code below to complete your signup:</p>
              <div style="margin: 20px auto; text-align: center; padding: 10px; border-radius: 6px; background-color: #4A90E2; color: #fff; font-size: 24px; font-weight: bold; letter-spacing: 4px;">
                ${otp}
              </div>
            </div>
            `
            }

            //sending the email
            await transporter.sendMail(mailOptions);
            res.status(200).json({ message:'OTP resent successfully' });
    } catch (error) {
        console.log(error)
        res.status(500).json({ message:'Internal server error' });
    }
}