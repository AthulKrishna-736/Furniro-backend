import { setAuthCookies } from "../../middleware/tokenCreate.js";
import { generateAccessToken, generateRefreshToken } from "../../middleware/tokenCreate.js";
import userModel from "../../models/userModel.js";
import bcrypt from 'bcrypt';
import dotenv from 'dotenv'
import { OAuth2Client } from 'google-auth-library'
import crypto from 'crypto'
import walletModel from "../../models/walletModel.js";

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

  res.clearCookie('csrfToken', { httpOnly: false, sameSite: 'strict' });
  res.clearCookie('csrfTokenSigned', { httpOnly: true, sameSite: 'strict' });

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

  const generateReferralCode = () => {
    return crypto.randomBytes(6).toString("hex").toUpperCase();
  }

  const referralCode = generateReferralCode();

  const newUser = new userModel({
    firstName,
    lastName,
    email,
    password: hashPass,
    role: 'user',
    referralCode,
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

  const { given_name, family_name, email } = ticket.getPayload();

  let user = await userModel.findOne({ email });

  if (!user) {

    const generateReferralCode = () => {
      return crypto.randomBytes(6).toString("hex").toUpperCase();
    };

    const referralCode = generateReferralCode();

    user = await userModel.create({
      firstName: given_name,
      lastName: family_name,
      email: email,
      isGoogleUser: true,
      password: null,
      role: 'user',
      referralCode,
    });
  }

  if (user.isBlocked) {
    return next({ statusCode: 403, message: 'Access blocked by admin. Please contact support.' })
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

  const { email } = req.body;

  const user = await userModel.findOne({ email });
  if (!user) {
    return next({ statusCode: 404, message: 'User not found. Please sign up.' });
  }

  res.status(200).json({
    success: true,
    message: 'User found. Proceeding to Login.',
  });
};


//resetpass
export const resetPass = async (req, res, next) => {
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
  res.status(200).json({ message: 'Password updated successfully!' });
};


//check user
export const checkUser = async (req, res, next) => {
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
    // Optionally, you can handle tokenVersion here if needed.
    // user.tokenVersion = (user.tokenVersion || 0) + 1;
  }

  await user.save();

  return res.status(200).json({ message: 'User details updated successfully.', user });
};

//referral code thing give here 
export const applyReferralCode = async (req, res, next) => {
  const { email } = req.body;
  const { referralCode } = req.query;

  if (!referralCode || !referralCode.trim()) {
    return next({ statusCode: 400, message: 'Referral code is required.' });
  }

  const user = await userModel.findOne({ email });
  if (!user) {
    return next({ statusCode: 404, message: 'User not found.' });
  }

  if (user.referredBy) {
    return next({ statusCode: 400, message: 'You can only receive the referral reward once. You have already applied a referral code.' })
  }

  const referrer = await userModel.findOne({ referralCode });

  if (user._id.toString() === referrer._id.toString()) {
    return next({ statusCode: 400, message: 'You cant refer yourself!' });
  }

  if (!referrer) {
    return next({ statusCode: 400, message: 'Referral code is invalid.' });
  }

  user.referredBy = `${referrer.firstName} ${referrer.lastName}`;

  const referredUserWallet = await walletModel.findOne({ userId: referrer._id });
  if (referredUserWallet) {
    referredUserWallet.balance += 250;
    referredUserWallet.transactions.push({
      type: 'credit',
      amount: 250,
      description: `Referral reward from ${user.firstName} ${user.lastName}`,
      date: new Date(),
    });
    await referredUserWallet.save();
  } else {
    await walletModel.create({
      userId: referrer._id,
      balance: 250,
      transactions: [
        {
          type: 'credit',
          amount: 250,
          description: `Referral reward from ${user.firstName} ${user.lastName}`,
          date: new Date(),
        },
      ],
    });
  }

  const referralCodeUser = await walletModel.findOne({ userId: user._id });
  if (referralCodeUser) {
    referralCodeUser.balance += 100;
    referralCodeUser.transactions.push({
      type: 'credit',
      amount: 100,
      description: `Referral reward from ${referrer.firstName} ${referrer.lastName}`,
      date: new Date(),
    });
    await referralCodeUser.save();
  } else {
    await walletModel.create({
      userId: user._id,
      balance: 100,
      transactions: [
        {
          type: 'credit',
          amount: 100,
          description: `Referral reward from ${referrer.firstName} ${referrer.lastName}`,
          date: new Date(),
        },
      ],
    });
  }

  return res.status(200).json({
    message: `Referral code applied successfully! ${user.firstName} ${user.lastName} received a reward of 100, and ${referrer.firstName} ${referrer.lastName} received a reward of 250.`,
  });
};

