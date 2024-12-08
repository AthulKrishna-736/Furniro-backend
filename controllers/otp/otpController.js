import userModel from "../../models/userModel.js";
import crypto from 'crypto';
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config();

//otpStore
const otpStore = new Map(); // temoporary otp store with email,otp


//create otp 
export const createOtp = async (req, res) => {
    try {
        console.log('req of c otp = ',req.body)
        const { email, isSignup } = req.body;

        if(!isSignup){
          const user = await userModel.findOne({ email })
  
          if(!user){
              console.log('user not found in c otp')
              return res.status(404).json({ message:'User not found. Please try again' });
          }
        }


        const otp = crypto.randomInt(100000, 999999)
        const otpExpireAt = new Date();
        otpExpireAt.setMinutes(otpExpireAt.getMinutes() + 2);

        otpStore.set(email, {otp, otpExpireAt});

        console.log('otp created = ', otp)
        console.log('otpstore = ', otpStore)

        setTimeout(()=> otpStore.delete(email), 2*60*1000) // 2min expiration time

        const transporter = nodemailer.createTransport({
            service:'gmail',
            auth:{
              user: process.env.EMAIL,
              pass: process.env.EMAIL_PASS,
            }
          })

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
            console.log('email is sending...')
            const emailSent = await transporter.sendMail(mailOptions);
            console.log('email has sent')
        res.status(200).json({ message:'OTP sent successfully', otpExpireAt: otpExpireAt });
        
    } catch (error) {
        console.log('error while otp create = ', error)

        if (error.response) {
            console.error('SMTP Error Response:', error.response);
        }

        return res.status(500).json({ message: 'Internal server error. Please try again later.' });    }
}


//verify otp
export const otpVerify = async(req, res)=> {
    try {
        console.log('req body of verifyotp = ', req.body);
        const { email, otp } = req.body;

        if (!email || !otp) {
            console.log('no email or otp present in req.body')
            return res.status(400).json({ success: false, message: 'Email and OTP are required' });
          }

          //getting otp from stored data..
        const storedData = otpStore.get(email)
        console.log('stored data in verifyotp = ', storedData);

        if (!storedData) {
            console.log('stored data is undefinded or otp expired')
            return res.status(400).json({ success: false, message: 'OTP has expired or is invalid' });
          }

        const { otp: storedOtp, otpExpireAt } = storedData;

        if (new Date() > otpExpireAt) {
            otpStore.delete(email); 
            return res.status(400).json({ success: false, message: 'OTP has expired. Please request a new one.' });
          }

        if (storedOtp !== parseInt(otp, 10)) {
            console.log('incorrect otp enterd...')
        return res.status(400).json({ success: false, message: 'Incorrect OTP. Please try again.' });
        }          

        console.log('otp successfully verified!!!')

          otpStore.delete(email); 
          return res.status(200).json({ success: true, message: 'OTP verified successfully' });
      

    } catch (error) {
        console.error('Error in otpVerify:', error);
        return res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}
