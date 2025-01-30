import express from 'express'
import { applyReferralCode, checkUser, forgotPass, getIndividualUser, googleLogin, resetPass, updateIndividualUser, userLogin, userLogout, userSignup } from '../controllers/user/userController.js';
import { createOtp, otpVerify, resendOtp } from '../controllers/otp/otpController.js';
import { otpCheck } from '../controllers/otp/otpCheck.js';
import { tokenVerify } from '../middleware/tokenVerify.js';
import { refreshTokenCheck } from '../middleware/refreshToken.js';
import { getUserProducts, productDetails } from '../controllers/admin/product/productController.js';
import checkUserBlock from '../middleware/checkUserBlock.js';
import { addAddress, deleteAddress, getAddress, updateAddress } from '../controllers/user/addressController.js';
import { addToCart, deleteItems, getCart, updateQuantity } from '../controllers/user/cartController.js';
import {  getUserOrder, updateStatusRazorpay, userOrders } from '../controllers/user/orderController.js'
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createOrder } from '../utils/razorPay.js';
import { addWishlist, deleteWishlist, getWishlist } from '../controllers/user/wishlistController.js';
import { getUserWallet, updateWallet } from '../controllers/user/walletController.js';
import { getUserCoupons } from '../controllers/user/couponController.js';
import { verifyCsrfToken } from '../middleware/csrfVerify.js';
import { cancelOrder, cancelProduct, returnOrder, returnProduct } from '../controllers/user/orderUpdations.js';

const userRoute = express.Router();

//user routes
userRoute.post('/login', asyncHandler(userLogin));
userRoute.post('/logout', asyncHandler(userLogout));
userRoute.post('/signup', asyncHandler(userSignup));
userRoute.post('/checkUser', asyncHandler(checkUser));
userRoute.post('/google-login', asyncHandler(googleLogin));

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


//product requests
userRoute.get('/featuredProducts', getUserProducts);
userRoute.get('/trendingProducts', getUserProducts);
userRoute.get('/products', getUserProducts);
userRoute.get('/productDetails/:productId', productDetails);

//accounts
userRoute.post('/getUserDetail',   checkUserBlock, tokenVerify, asyncHandler(getIndividualUser));
userRoute.patch('/updateUserDetails',   checkUserBlock, tokenVerify, asyncHandler(updateIndividualUser));
userRoute.patch('/referral',   checkUserBlock, tokenVerify, asyncHandler(applyReferralCode))
userRoute.post('/addAddress/:userId',   checkUserBlock, tokenVerify, asyncHandler(addAddress));
userRoute.get('/getAddress/:userId', checkUserBlock,   asyncHandler(getAddress));
userRoute.delete('/deleteAddress/:Id',   checkUserBlock, tokenVerify, asyncHandler(deleteAddress));
userRoute.patch('/updateAddress/:id',   checkUserBlock, tokenVerify, asyncHandler(updateAddress));

//cart
userRoute.post('/cart',   checkUserBlock, tokenVerify, asyncHandler(addToCart));
userRoute.get('/getCart/:userId', checkUserBlock, tokenVerify, asyncHandler(getCart));
userRoute.delete('/deleteItem/:id',   checkUserBlock, tokenVerify, asyncHandler(deleteItems));
userRoute.patch('/updateQuantity/:userId',   checkUserBlock, tokenVerify, asyncHandler(updateQuantity));

//orders
userRoute.post('/placeOrder',   checkUserBlock, tokenVerify, asyncHandler(userOrders));
userRoute.get('/getOrder/:userId',   checkUserBlock, tokenVerify, asyncHandler(getUserOrder));
userRoute.patch('/cancelOrder',   checkUserBlock, tokenVerify, asyncHandler(cancelOrder));
userRoute.patch('/returnOrder',   checkUserBlock, tokenVerify, asyncHandler(returnOrder));
userRoute.post('/createOrder',   checkUserBlock, tokenVerify, asyncHandler(createOrder));
userRoute.patch('/cancelProduct',   checkUserBlock, tokenVerify, asyncHandler(cancelProduct));
userRoute.patch('/returnRequest',   checkUserBlock, tokenVerify, asyncHandler(returnProduct));
userRoute.put('/updateOrderPaymentStatus', checkUserBlock, tokenVerify, asyncHandler(updateStatusRazorpay))

//wishlist
userRoute.post('/addWishlist',   checkUserBlock, tokenVerify, asyncHandler(addWishlist));
userRoute.post('/deleteWishlist',   checkUserBlock, tokenVerify, asyncHandler(deleteWishlist));
userRoute.post('/moveToCart',   checkUserBlock, tokenVerify, asyncHandler(addToCart));
userRoute.get('/getWishlist/:userId', checkUserBlock, tokenVerify, asyncHandler(getWishlist));

//wallet
userRoute.get('/getWallet/:userId', checkUserBlock, tokenVerify, asyncHandler(getUserWallet));
userRoute.patch('/updateWallet/:userId',   checkUserBlock, tokenVerify, asyncHandler(updateWallet));

//coupon
userRoute.get('/getCoupons', checkUserBlock, tokenVerify, asyncHandler(getUserCoupons))

export default userRoute;