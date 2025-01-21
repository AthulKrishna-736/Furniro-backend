import express from 'express'
import { blockUser, getUsers } from '../controllers/admin/userManage/userManageController.js';
import { addCategory, blockCategory, getCategory, updateCategory } from '../controllers/admin/category/categoryController.js';
import { addProduct, blockProducts, editProduct, getAllProducts } from '../controllers/admin/product/productController.js';
import { adminLogin } from '../controllers/admin/adminLogin.js';
import { addBanners, editBanner, getBanners } from '../controllers/admin/bannerManage.js';
import { getAllOrders, updateOrderStatus } from '../controllers/user/orderController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { adminAuth } from '../middleware/checkAdmin.js';
import { createCoupon, deleteCoupon, getAllCoupons } from '../controllers/user/couponController.js';
import { getCategories, createCatOffer, toggleCatOfferStatus, getOffers, deleteOffer, getProductsAndOffers } from '../controllers/user/offerController.js'
import { generateChartData, generateSalesReport, topSellingDetails } from '../controllers/user/salesController.js';


const adminRoute = express.Router();

//admin route
adminRoute.post('/login', asyncHandler(adminLogin));

//user management
adminRoute.get('/getUsers', asyncHandler(getUsers));
adminRoute.patch('/blockUser/:id', adminAuth, asyncHandler(blockUser));

//category management
adminRoute.post('/addCategory', adminAuth, asyncHandler(addCategory));
adminRoute.get('/getCategories', asyncHandler(getCategory));
adminRoute.patch('/blockCategory/:id', adminAuth, asyncHandler(blockCategory));
adminRoute.patch('/updateCategory/:id', adminAuth, asyncHandler(updateCategory));

//product management
adminRoute.post('/addProducts', adminAuth, asyncHandler(addProduct));
adminRoute.get('/getProducts', asyncHandler(getAllProducts));
adminRoute.patch('/blockProduct/:id', adminAuth, asyncHandler(blockProducts));
adminRoute.put('/updateProduct/:productId', adminAuth, asyncHandler(editProduct));

//banner management
adminRoute.get('/getBanners', asyncHandler(getBanners));
adminRoute.post('/addBanners', adminAuth, asyncHandler(addBanners));
adminRoute.patch('/editBanners/:id', adminAuth, asyncHandler(editBanner));

//orders
adminRoute.get('/getOrders', asyncHandler(getAllOrders));
adminRoute.patch('/updateOrderStatus', adminAuth, asyncHandler(updateOrderStatus))

//coupon manage
adminRoute.get('/getCoupons', asyncHandler(getAllCoupons));
adminRoute.post('/createCoupon', adminAuth, asyncHandler(createCoupon));
adminRoute.delete('/deleteCoupon', adminAuth, asyncHandler(deleteCoupon));

//offers manage
adminRoute.get('/getCatOffers', asyncHandler(getOffers));
adminRoute.get('/getCat', asyncHandler(getCategories));
adminRoute.post('/createOffer', adminAuth, asyncHandler(createCatOffer));
adminRoute.patch('/blockCatOffer/:id', adminAuth, asyncHandler(toggleCatOfferStatus));
adminRoute.delete('/deleteCatOffer/:id', adminAuth, asyncHandler(deleteOffer))
adminRoute.get('/catoffers', asyncHandler(getProductsAndOffers))

//sales report
adminRoute.get('/getSalesReport', adminAuth, asyncHandler(generateSalesReport))
adminRoute.get('/chartData', adminAuth, asyncHandler(generateChartData))
adminRoute.get('/topSelling', adminAuth, asyncHandler(topSellingDetails))


export default adminRoute;
