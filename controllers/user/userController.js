import { setAuthCookies } from "../../middleware/tokenCreate.js";
import { generateAccessToken, generateRefreshToken } from "../../middleware/tokenCreate.js";
import userModel from "../../models/userModel.js";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv'
import { OAuth2Client } from 'google-auth-library'

dotenv.config();

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

//login user
export const userLogin = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    return next({ statusCode: 404, message: 'User not found. Please sign up to create an account.' });
  }

  if (user.role !== 'user') {
    return next({ statusCode: 403, message: 'Access denied. Only users with the "user" role can log in here.' })
  }

  const isValidPass = await bcrypt.compare(password, user.password);
  if (!isValidPass) {
    return next({ statusCode: 401, message: 'Invalid credentials' });
  }

  if (user.isBlocked) {
    return next({ statusCode: 403, message: 'Your account is blocked.' });
  }

  user.tokenVersion += 1;
  await user.save();

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Set cookies for user login
  setAuthCookies(res, accessToken, refreshToken);
  console.log('Cookies set successfully');

  res.status(200).json({
    message: 'Login successful',
    user: { email: user.email, id: user._id },
  });
};

 
//logout user
export const userLogout = async (req, res, next) => {
  res.clearCookie('accessToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  res.clearCookie('refreshToken', {
    httpOnly: true,
    secure: true,
    sameSite: 'strict',
  });

  res.status(200).json({ message: 'Logout successful' });
};


//signup user 
export const userSignup = async (req, res, next) => {
  const { email, password, firstName, lastName } = req.body;

  const userExist = await userModel.findOne({ email });
  if (userExist) {
    return next({ statusCode: 400, message: "Email already exists. Please use a different email." });
  }

  const hashPass = await bcrypt.hash(password, 10);

  const newUser = new userModel({
    firstName,
    lastName,
    email,
    password: hashPass,
    role: 'user',
  });

  const savedUser = await newUser.save();

  res.status(200).json({ message: "User created successfully.", user: { email: savedUser.email, role: savedUser.role } });
};


//google login 
export const googleLogin = async (req, res, next) => {
  const { credential } = req.body;

  const ticket = await client.verifyIdToken({
    idToken: credential,
    audience: process.env.GOOGLE_CLIENT_ID,
  });

  console.log('google ticket : ', ticket)
  const { given_name, family_name, email } = ticket.getPayload();

  let user = await userModel.findOne({ email });
  console.log('Google Login - User:', user);

  if (!user) {
    user = await userModel.create({
      firstName: given_name,
      lastName: family_name,
      email: email,
      isGoogleUser: true,
      password: null,
      role: 'user',
    });
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  setAuthCookies(res, accessToken, refreshToken);

  res.status(200).json({
    message: 'Google Login successful',
    userId: user._id,
    name: user.name,
    userEmail: user.email
  });
};


//forgotpass
export const forgotPass = async (req, res, next) => {
  console.log('req forgot = ', req.body);

  const { email } = req.body;

  const user = await userModel.findOne({ email });

  if (!user) {
    return next({ statusCode: 404, message: 'User not found. Please sign up.' });
  }

  res.status(200).json({
    success: true,
    message: 'User found. Proceeding to send OTP.',
  });
};


//resetpass
export const resetPass = async (req, res, next) => {
  console.log('req body resetpass = ', req.body);
  const { email, password } = req.body;

  const hashPass = await bcrypt.hash(password, 10);

  const response = await userModel.findOneAndUpdate(
    { email },
    { password: hashPass },
    { new: true }
  );

  if (!response) {
    return next({ statusCode: 404, message: 'User not found. Unable to reset password.' });
  }
  console.log('res reset pass = ', response);
  res.status(200).json({ message: 'Password updated successfully!' });
};


//check user
export const checkUser = async (req, res, next) => {
  console.log('req body checkuser = ', req.body);
  const { email } = req.body;

  const user = await userModel.findOne({ email });

  if (user) {
    return res.json({ statusCode: 404, message: 'User already exists. Please login.' });
  }
  res.status(200).json({ message: 'User not found. Proceed to signup.' });
};


//get individual user
export const getIndividualUser = async (req, res, next) => {
  const { email } = req.body;
  console.log('email getindi: ', req.body);

  const user = await userModel.findOne({ email });
  if (!user) {
    return next({ statusCode: 404, message: 'User not found.' });
  }

  res.status(200).json({ message: 'User fetched successfully.', user });
};


//update individual user
export const updateIndividualUser = async (req, res, next) => {
  const { email, password } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    return next({ statusCode: 404, message: 'User not found.' });
  }

  if (password && password !== user.password) {
    const hashedPassword = await bcrypt.hash(password, 10);

    user.password = hashedPassword;
    user.tokenVersion = (user.tokenVersion || 0) + 1; 
    await user.save();

    return res.status(200).json({ message: 'Password updated successfully.', user });
  }
  res.status(200).json({ message: 'No changes to password.' });
};

