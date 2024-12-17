import express from 'express'
import { checkUser, forgotPass, getIndividualUser, googleLogin, resetPass, updateIndividualUser, userLogin, userLogout, userSignup } from '../controllers/user/userController.js';
import { createOtp, otpVerify, resendOtp } from '../controllers/otp/otpController.js';
import { otpCheck } from '../controllers/otp/otpCheck.js';
import { tokenVerify } from '../middleware/tokenVerify.js';
import { refreshTokenCheck } from '../middleware/refreshToken.js';
import { getUserProducts, productDetails } from '../controllers/admin/product/productController.js';
import checkUserBlock from '../middleware/checkUserBlock.js';
import { addAddress, deleteAddress, getAddress, updateAddress } from '../controllers/user/addressController.js';
import { addToCart, deleteItems, getCart, updateQuantity } from '../controllers/user/cartController.js';
import { cancelOrder, getUserOrder, returnOrder, userOrders } from '../controllers/user/orderController.js'
import { asyncHandler } from '../middleware/asyncHandler.js';

const userRoute = express.Router();

//user routes
userRoute.post('/login', checkUserBlock, asyncHandler(userLogin));
userRoute.post('/logout', asyncHandler(userLogout));
userRoute.post('/signup', asyncHandler(userSignup));
userRoute.post('/checkUser', asyncHandler(checkUser));


//otp requests
userRoute.post('/createOtp', asyncHandler(createOtp));
userRoute.post('/otpVerify', asyncHandler(otpVerify));
userRoute.post('/resendOtp', asyncHandler(resendOtp));
userRoute.post('/otpCheck', otpCheck);

//forgot pass
userRoute.post('/forgotPass', asyncHandler(forgotPass));
userRoute.patch('/resetPass', asyncHandler(resetPass));

userRoute.post('/verifyToken', checkUserBlock, tokenVerify);
userRoute.post('/refreshToken', checkUserBlock, refreshTokenCheck);

userRoute.post('/google-login', asyncHandler(googleLogin));

//product requests
userRoute.get('/featuredProducts', getUserProducts);
userRoute.get('/trendingProducts', getUserProducts);
userRoute.get('/products', getUserProducts);
userRoute.get('/productDetails/:productId', productDetails);

//accounts
userRoute.post('/getUserDetail', checkUserBlock, asyncHandler(getIndividualUser));
userRoute.patch('/updateUserDetails', checkUserBlock, asyncHandler(updateIndividualUser));
userRoute.post('/addAddress/:userId', checkUserBlock, asyncHandler(addAddress));
userRoute.get('/getAddress/:userId', checkUserBlock, asyncHandler(getAddress));
userRoute.delete('/deleteAddress/:Id', checkUserBlock, asyncHandler(deleteAddress));
userRoute.patch('/updateAddress/:id', checkUserBlock, asyncHandler(updateAddress));

//cart
userRoute.post('/cart', checkUserBlock, asyncHandler(addToCart));
userRoute.get('/getCart/:userId', checkUserBlock, asyncHandler(getCart));
userRoute.delete('/deleteItem/:id', checkUserBlock, asyncHandler(deleteItems));
userRoute.patch('/updateQuantity/:userId', checkUserBlock, asyncHandler(updateQuantity));

//orders
userRoute.post('/placeOrder', checkUserBlock, asyncHandler(userOrders));
userRoute.get('/getOrder/:userId', checkUserBlock, asyncHandler(getUserOrder));
userRoute.patch('/cancelOrder', checkUserBlock, asyncHandler(cancelOrder));
userRoute.patch('/returnOrder', checkUserBlock, asyncHandler(returnOrder));

export default userRoute;