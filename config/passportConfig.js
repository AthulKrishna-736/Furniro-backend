import { OAuth2Client } from 'google-auth-library';
import dotenv from 'dotenv';
import userModel from '../models/userModel.js'; // Your User model
import { generateAccessToken, generateRefreshToken, setAuthCookies } from '../utils/authUtils.js';

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
    // Exchange authorization code for tokens
    const { tokens } = await oAuth2Client.getToken(code);
    oAuth2Client.setCredentials(tokens);

    // Get user information from Google
    const userInfoClient = google.oauth2('v2').userinfo;
    const userInfo = await userInfoClient.get({ auth: oAuth2Client });
    const { email, name, picture } = userInfo.data;

    // Check if the user exists in the database
    let user = await userModel.findOne({ email });
    if (!user) {
      // If not, create a new user
      user = await userModel.create({ email, name, picture });
    }

    // Step 3: Generate JWT tokens using your utility functions
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Step 4: Set tokens in cookies
    setAuthCookies(res, accessToken, refreshToken);

    // Step 5: Send response with user details
    res.status(200).json({ 
      message: 'Google login successful', 
      user: { id: user._id, email: user.email, name: user.name, picture }, 
    });
  } catch (error) {
    console.error('Error during Google callback:', error);
    res.status(500).json({ message: 'Google login failed', error });
  }
};
