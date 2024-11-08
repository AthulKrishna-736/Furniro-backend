import express from 'express'
import { userSignup } from '../controllers/userSignup.js'
import { userLogin } from '../controllers/userLogin.js';
import { otpVerify } from '../controllers/otpVerify.js';
import { resendOtp } from '../controllers/resendOtp.js';
import { otpCheck } from '../controllers/otpCheck.js';

const userRoute = express.Router();

//user routes
userRoute.post('/login',userLogin);
userRoute.post('/signup',userSignup);
userRoute.post('/otpVerify',otpVerify);
userRoute.post('/resendOtp',resendOtp);
userRoute.post('/otpCheck',otpCheck);

export default userRoute;