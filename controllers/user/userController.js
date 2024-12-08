import { setAuthCookies } from "../../middleware/tokenCreate.js";
import { generateAccessToken, generateRefreshToken } from "../../middleware/tokenCreate.js";
import userModel from "../../models/userModel.js";
import bcrypt from 'bcrypt';
import crypto from 'crypto'
import nodemailer from 'nodemailer'
import dotenv from 'dotenv'
import { OAuth2Client } from 'google-auth-library'

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//login user
export const userLogin = async(req, res)=>{

    const { email, password } = req.body;
    console.log(req.body)
    try {
        const user = await userModel.findOne({email})
        if(!user){
            return res.status(404).json({ message:'User not found. Please sign up to create an account.' })
        }

        const isValidPass = await bcrypt.compare(password,user.password);
        if(!isValidPass){
            return res.status(401).json({ message:'Invalid credentials' });
        }
    
        const accessToken = generateAccessToken(user);
        const refreshToken = generateRefreshToken(user);
        console.log('Token giving when login access == ',accessToken);
        console.log('Token giving when login refresh == ', refreshToken);

        //set cookies for uses login
        setAuthCookies(res, accessToken, refreshToken);
        console.log('cookies set successfully')

        return res.status(200).json({ message:`Login successful`, user:{ email:user.email, id:user._id }})

    } catch (error) {
        res.status(500).json({ message:'Error while logging in user. Please try again later'})
    }
}


//logout user
export const userLogout = async (req, res) => {
    try {
        res.clearCookie('accessToken',{
            httpOnly: true,
            secure: true,
            sameSite:'strict',
        })
    
        res.clearCookie('refreshToken',{
            httpOnly: true,
            secure: true,
            sameSite: 'strict'
        })

        return res.status(200).json({ message: 'Logout successful' });
    
    } catch (error) {
        console.log('error while clearing cookie', error)
        return res.status(500).json({ message: 'Logout failed' });    }
}


//signup user 
export const userSignup = async(req, res)=>{
  const { email, password, firstName, lastName } = req.body;
  try {
    const userExist = await userModel.findOne({email});
    if(userExist){
      return res.status(400).json( { message: 'Email already exists. Please use a different email.' } )
    }

    const hashPass = await bcrypt.hash(password,10)
        
    const newUser = new userModel({
      firstName,
      lastName,
      email,
      password:hashPass,
    })

    const savedUser = await newUser.save();

        return res.status(200).json({ message:'User created successfully.' , user:{ email: savedUser.email }})
    } catch (error) {
      res.status(500).json({ message:'User creation failed. Please try again later', error})
    }    
}


//google login 
export const googleLogin = async (req, res) => {
  try {
    const { credential } = req.body;

    const ticket = await client.verifyIdToken({
      idToken:credential,
      audience: process.env.GOOGLE_CLIENT_ID,
    })

    const { name , email, picture } = ticket.getPayload();

    let user = await userModel.findOne({ email });

    if(!user){
      user = await userModel.create({ name, email });
    }

    // Generate access and refresh tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Set tokens in cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Send a success response
    res.status(200).json({
      message: 'Login successful',
      userId: user._id,
      name: user.name,
    });

  } catch (error) {
    console.error('Error in Google Login:', error);
    res.status(500).json({ message: 'Google login failed' });
  }
}


//forgotpass
export const forgotPass = async (req, res) => {
  try {
    console.log('req forgot = ', req.body);

    const { email } = req.body;

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found. Please sign up.' });
    }

    return res.status(200).json({ success: true, message: 'User found. Proceeding to send OTP.' });

  } catch (error) {
    console.error('Error during forgot password:', error);
    return res.status(500).json({ success: false, message: 'An error occurred. Please try again later.' });
  }
};


//resetpass
export const resetPass = async (req, res) => {
  try {
    console.log('req body resetpass = ',req.body)
    const { email, password } = req.body;

    const hashPass = await bcrypt.hash(password, 10);

    const response = await userModel.findOneAndUpdate(
      { email }, 
      { password: hashPass }, 
      { new: true }
    );

    console.log('res reset pass = ', response)

    res.status(200).json({ message: 'Password updated successfully!' });

  } catch (error) {
    console.error('Error resetting password:', error);
    res.status(500).json({ message: 'An error occurred while resetting the password.' });
  }
}


//check user
export const checkUser = async (req, res) => {
  try {
    console.log('req body checkuser = ', req.body)

    const { email } = req.body;

    const user = await userModel.findOne({ email })

    if(user){
      console.log('user already exists')
      return res.status(404).json({ message:'User already exists. Please login' })
    }

    res.status(200).json({ message:'user not found. Proceed to signin' })

  } catch (error) {
    console.log('error happens while checking user', error);
    res.status(500).json({ message:'Internal server error' });
  }
}