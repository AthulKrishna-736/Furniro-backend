import express from 'express'
import { userSignup } from '../controllers/user/userSignup.js'
import { userLogin } from '../controllers/user/userLogin.js';
import { otpVerify } from '../controllers/otp/otpVerify.js';
import { resendOtp } from '../controllers/otp/resendOtp.js';
import { otpCheck } from '../controllers/otp/otpCheck.js';
import { tokenVerify } from '../middleware/tokenVerify.js'
import { refreshTokenCheck } from '../middleware/refreshToken.js';
import { userLogout } from '../controllers/user/userLogout.js';
import { getUserProducts, productDetails } from '../controllers/admin/product/productController.js';
import { googleCallback, googleLogin } from '../config/passportConfig.js';

const userRoute = express.Router();

//user routes
userRoute.post('/login', userLogin);
userRoute.post('/logout', userLogout)
userRoute.post('/signup', userSignup);
userRoute.post('/otpVerify', otpVerify);
userRoute.post('/resendOtp', resendOtp);
userRoute.post('/otpCheck', otpCheck);
userRoute.post('/verifyToken', tokenVerify);
userRoute.post('/refreshToken', refreshTokenCheck)
userRoute.get('/oauth',googleCallback);
userRoute.get('/google-login', googleLogin)

userRoute.get('/featuredProducts', getUserProducts);
userRoute.get('/trendingProducts', getUserProducts);
userRoute.get('/products', getUserProducts);
userRoute.get('/productDetails/:productId', productDetails);



userRoute.get('/test', (req, res)=>{
    res.status(200).json({ message:'Authenticated request successfull', user: req.user })
})

export default userRoute;