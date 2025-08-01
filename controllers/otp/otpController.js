import userModel from "../../models/userModel.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config();

//otpStore
const otpStore = new Map();

//create otp 
export const createOtp = async (req, res, next) => {
  const { email, isSignup } = req.body;

  if (!email) {
    return next({ statusCode: 404, message: 'email is not found' });
  }

  if (!isSignup) {
    const user = await userModel.findOne({ email });

    if (!user) {
      return next({ statusCode: 404, message: 'User not found. Please try again' });
    }
  }

  const otp = crypto.randomInt(100000, 999999);
  const otpExpireAt = new Date();
  otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 2);
  otpStore.set(email, { otp, otpExpireAt });


  setTimeout(() => otpStore.delete(email), 2 * 60 * 1000);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

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
    `,
  };

  transporter.sendMail(mailOptions, (error,

  ) => {
    if (error) {
      return next({ statusCode: 500, message: 'Internal server error. Please try again later.' });
    }

    return res.status(200).json({
      message: 'OTP sent successfully',
      otpExpireAt,
    });
  });
};

//verify otp
export const otpVerify = async (req, res, next) => {
  const { email, otp } = req.body;


  if (!email || !otp) {
    return next({ statusCode: 400, message: 'Email and OTP are required' });
  }

  // Getting OTP from stored data
  const storedData = otpStore.get(email);

  if (!storedData) {
    return next({ statusCode: 400, message: 'OTP has expired or is invalid' });
  }

  const { otp: storedOtp, otpExpireAt } = storedData;

  if (new Date() > otpExpireAt) {
    otpStore.delete(email);
    return next({ statusCode: 400, message: 'OTP has expired. Please request a new one.' });
  }

  if (storedOtp !== parseInt(otp, 10)) {
    return next({ statusCode: 400, message: 'Incorrect OTP. Please try again.' });
  }


  otpStore.delete(email);
  return res.status(200).json({ success: true, message: 'OTP verified successfully' });
};

//resent otp 
export const resendOtp = async (req, res, next) => {
  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    return next({ statusCode: 404, message: 'User not found. Please try again' });
  }

  const otp = crypto.randomInt(100000, 999999);
  const otpExpireAt = new Date();
  otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 2);
  otpStore.set(email, { otp, otpExpireAt });

  setTimeout(() => otpStore.delete(email), 2 * 60 * 1000);

  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL,
      pass: process.env.EMAIL_PASS,
    },
  });

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
    `,
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      return next({ statusCode: 500, message: 'Internal server error. Please try again later.' });
    }

    return res.status(200).json({
      message: 'OTP resent successfully',
      otpExpireAt,
    });
  });
};
