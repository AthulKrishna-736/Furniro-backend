import userModel from '../models/userModel.js'
import bcrypt from 'bcrypt'
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'

dotenv.config();

export const userSignup = async(req, res)=>{
  const { email, password, firstName, lastName } = req.body;
  try {
    const userExist = await userModel.findOne({email});
    if(userExist){
      return res.status(400).json( { message: 'Email already exists. Please use a different email.' } )
    }

    const hashPass = await bcrypt.hash(password,10)

    const otp = crypto.randomInt(100000, 999999).toString();
    
        //sent otp via email using nodemailer
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
        const emailSent = await transporter.sendMail(mailOptions);
        if(!emailSent){
          return res.status(500).json({ message:'Failed to signup user. Please try again later.' })
        }
        console.log('otp sent successfully: ',otp)
        
    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password:hashPass,
      otp,
    })

    await newUser.save();

        return res.status(200).json({ message:'User created successfully.' })
    } catch (error) {
      res.status(500).json({ message:'User creation failed. Please try again later', error})
    }    
}

