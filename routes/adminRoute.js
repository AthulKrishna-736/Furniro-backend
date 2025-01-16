import express from 'express'
import { blockUser, getUsers } from '../controllers/admin/userManage/userManageController.js';
import { addCategory, blockCategory, getCategory, updateCategory } from '../controllers/admin/category/categoryController.js';
import { addProduct, blockProducts, editProduct, getAllProducts } from '../controllers/admin/product/productController.js';
import { adminLogin } from '../controllers/admin/adminLogin.js';
import { addBanners, editBanner, getBanners } from '../controllers/admin/bannerManage.js';
import { generateSalesReport, getAllOrders, updateOrderStatus } from '../controllers/user/orderController.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { createCoupon, deleteCoupon, getAllCoupons } from '../controllers/user/couponController.js';
import { getCategories, createCatOffer, toggleCatOfferStatus, getOffers } from '../controllers/user/offerController.js'
import { downloadPdf } from '../utils/pdfMaker.js';


const adminRoute = express.Router();

//admin route
adminRoute.post('/login', asyncHandler(adminLogin));

//user management
adminRoute.get('/getUsers', asyncHandler(getUsers));
adminRoute.patch('/blockUser/:id', asyncHandler(blockUser));

//category management
adminRoute.post('/addCategory', asyncHandler(addCategory));
adminRoute.get('/getCategories', asyncHandler(getCategory));
adminRoute.patch('/blockCategory/:id', asyncHandler(blockCategory));
adminRoute.patch('/updateCategory/:id', asyncHandler(updateCategory));

//product management
adminRoute.post('/addProducts', asyncHandler(addProduct));
adminRoute.get('/getProducts', asyncHandler(getAllProducts));
adminRoute.patch('/blockProduct/:id', asyncHandler(blockProducts));
adminRoute.put('/updateProduct/:productId', asyncHandler(editProduct));

//banner management
adminRoute.get('/getBanners', asyncHandler(getBanners) );
adminRoute.post('/addBanners', asyncHandler(addBanners));
adminRoute.patch('/editBanners/:id', asyncHandler(editBanner));

//orders
adminRoute.get('/getOrders', asyncHandler(getAllOrders));
adminRoute.patch('/updateOrderStatus', asyncHandler(updateOrderStatus))

//coupon manage
adminRoute.get('/getCoupons', asyncHandler(getAllCoupons));
adminRoute.post('/createCoupon', asyncHandler(createCoupon));
adminRoute.delete('/deleteCoupon', asyncHandler(deleteCoupon));

//offers manage
adminRoute.get('/getCatOffers', asyncHandler(getOffers));
adminRoute.get('/getCat', asyncHandler(getCategories));
adminRoute.post('/createOffer', asyncHandler(createCatOffer));
adminRoute.patch('/blockCatOffer/:id', asyncHandler(toggleCatOfferStatus));

//sales report
adminRoute.get('/getSalesReport', asyncHandler(generateSalesReport))
adminRoute.get('/downloadPdf', asyncHandler(downloadPdf))



export default adminRoute;


