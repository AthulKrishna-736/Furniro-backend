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
import { cancelOrder, getUserOrder, returnOrder, updateStatusRazorpay, userOrders } from '../controllers/user/orderController.js'
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createOrder } from '../utils/razorPay.js';
import { addWishlist, deleteWishlist, getWishlist } from '../controllers/user/wishlistController.js';
import { getUserWallet, updateWallet } from '../controllers/user/walletController.js';
import { getUserCoupons } from '../controllers/user/couponController.js';
import { verifyCsrfToken } from '../middleware/csrfVerify.js';

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
userRoute.post('/getUserDetail', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(getIndividualUser));
userRoute.patch('/updateUserDetails', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(updateIndividualUser));
userRoute.post('/addAddress/:userId', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(addAddress));
userRoute.get('/getAddress/:userId', checkUserBlock, verifyCsrfToken, asyncHandler(getAddress));
userRoute.delete('/deleteAddress/:Id', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(deleteAddress));
userRoute.patch('/updateAddress/:id', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(updateAddress));

//cart
userRoute.post('/cart', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(addToCart));
userRoute.get('/getCart/:userId', checkUserBlock, tokenVerify, asyncHandler(getCart));
userRoute.delete('/deleteItem/:id', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(deleteItems));
userRoute.patch('/updateQuantity/:userId', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(updateQuantity));

//orders
userRoute.post('/placeOrder', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(userOrders));
userRoute.get('/getOrder/:userId', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(getUserOrder));
userRoute.patch('/cancelOrder', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(cancelOrder));
userRoute.patch('/returnOrder', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(returnOrder));
userRoute.post('/createOrder', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(createOrder));
userRoute.put('/updateStatus/:orderId', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(updateStatusRazorpay))

//wishlist
userRoute.post('/addWishlist', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(addWishlist));
userRoute.post('/deleteWishlist', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(deleteWishlist));
userRoute.post('/moveToCart', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(addToCart));
userRoute.get('/getWishlist/:userId', checkUserBlock, tokenVerify, asyncHandler(getWishlist));

//wallet
userRoute.get('/getWallet/:userId', checkUserBlock, tokenVerify, asyncHandler(getUserWallet));
userRoute.patch('/updateWallet/:userId', verifyCsrfToken, checkUserBlock, tokenVerify, asyncHandler(updateWallet));

//coupon
userRoute.get('/getCoupons', checkUserBlock, tokenVerify, asyncHandler(getUserCoupons))

export default userRoute;