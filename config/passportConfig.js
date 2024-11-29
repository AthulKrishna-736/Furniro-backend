import { OAuth2Client } from 'google-auth-library';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js'; 
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '../middleware/tokenCreate.js';

dotenv.config();

const oAuth2Client = new OAuth2Client(
  process.env.GOOGLE_CLIENT_ID,
  process.env.GOOGLE_CLIENT_SECRET,
  'http://localhost:3000/api/user/oauth' // Callback URL
);

// Step 1: Generate Google login URL
export const googleLogin = async (req, res) => {
  try {
    const authorizeUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: ['https://www.googleapis.com/auth/userinfo.profile', 'openid', 'email'],
      prompt: 'consent',
    });

    res.status(200).json({ message: 'Google login initiated', url: authorizeUrl });
  } catch (error) {
    console.error('Error generating Google login URL:', error);
    res.status(500).json({ message: 'Failed to initiate Google login', error });
  }
};


// Step 2: Handle Google callback
export const googleCallback = async (req, res) => {
  const { code } = req.query;

  try {
    // Step 1: Exchange code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Step 2: Fetch user info
    const userInfoClient = google.oauth2('v2').userinfo;
    const userInfo = await userInfoClient.get({ auth: oAuth2Client });
    const { email, name } = userInfo.data;
    console.log('googleuser data = ', userInfo.data)
    // Step 3: Find or create the user
    let user = await userModel.findOne({ email:email });
    if (!user) {
      console.log('Creating new user...');
      
      // Split name into first and last name
      const [firstName, lastName] = name.split(' ');

      // Create new user without the OTP and picture
      user = await userModel.create({
        firstName: firstName || '', 
        lastName: lastName || '',
        email,
        password: null, 
      });

      console.log('New user created:', user);
    } else {
      console.log('User already exists. No need to create.');
    }

    // Step 4: Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Step 5: Set auth cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Step 6: Redirect to the frontend with user details
    const redirectUrl = `http://localhost:5173/google-success?userId=${user._id}&email=${encodeURIComponent(
      user.email
    )}&name=${encodeURIComponent(user.firstName)}&message=${encodeURIComponent(
      'Google login successful'
    )}`;
    res.redirect(redirectUrl);
  } catch (error) {
    console.error('Error during Google callback:', error);

    // Redirect to the frontend with an error message
    const errorRedirectUrl = `http://localhost:5173/login?error=${encodeURIComponent(
      'Google login failed'
    )}`;
    res.redirect(errorRedirectUrl);
  }
};