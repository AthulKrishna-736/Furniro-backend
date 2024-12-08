import express from 'express'
import { checkUser, forgotPass, googleLogin, resetPass, userLogin, userLogout, userSignup } from '../controllers/user/userController.js';
import { createOtp, otpVerify } from '../controllers/otp/otpController.js';
import { resendOtp } from '../controllers/otp/resendOtp.js';
import { otpCheck } from '../controllers/otp/otpCheck.js';
import { tokenVerify } from '../middleware/tokenVerify.js';
import { refreshTokenCheck } from '../middleware/refreshToken.js';
import { getUserProducts, productDetails } from '../controllers/admin/product/productController.js';

const userRoute = express.Router();

//user routes
userRoute.post('/login', userLogin);
userRoute.post('/logout', userLogout);
userRoute.post('/signup', userSignup);
userRoute.post('/checkUser', checkUser);


//otp requests
userRoute.post('/createOtp', createOtp);
userRoute.post('/otpVerify', otpVerify);
userRoute.post('/resendOtp', resendOtp);
userRoute.post('/otpCheck', otpCheck);

//forgot pass
userRoute.post('/forgotPass', forgotPass);
userRoute.patch('/resetPass', resetPass);

userRoute.post('/verifyToken', tokenVerify);
userRoute.post('/refreshToken', refreshTokenCheck);

userRoute.post('/google-login', googleLogin);

//product requests
userRoute.get('/featuredProducts', getUserProducts);
userRoute.get('/trendingProducts', getUserProducts);
userRoute.get('/products', getUserProducts);
userRoute.get('/productDetails/:productId', productDetails);



userRoute.get('/test', (req, res)=>{
    res.status(200).json({ message:'Authenticated request successfull', user: req.user })
})

export default userRoute;