import express from 'express'
import { blockUser, getUsers } from '../controllers/admin/userManage/userManageController.js';
import { addCategory, blockCategory, getCategory, updateCategory } from '../controllers/admin/category/categoryController.js';
import { addProduct, blockProducts, editProduct, getAllProducts } from '../controllers/admin/product/productController.js';
import { adminLogin } from '../controllers/admin/adminLogin.js';
import { addBanners, editBanner, getBanners } from '../controllers/admin/bannerManage.js';

const adminRoute = express.Router();

//admin route
adminRoute.post('/login', adminLogin);

//user management
adminRoute.get('/getUsers', getUsers);
adminRoute.patch('/blockUser/:id', blockUser);

//category management
adminRoute.post('/addCategory', addCategory);
adminRoute.get('/getCategories', getCategory);
adminRoute.patch('/blockCategory/:id', blockCategory);
adminRoute.patch('/updateCategory/:id', updateCategory);

//product management
adminRoute.post('/addProducts', addProduct);
adminRoute.get('/getProducts', getAllProducts);
adminRoute.patch('/blockProduct/:id', blockProducts);
adminRoute.put('/updateProduct/:productId', editProduct);

//banner management
adminRoute.get('/getBanners', getBanners );
adminRoute.post('/addBanners', addBanners);
adminRoute.patch('/editBanners/:id', editBanner)


export default adminRoute;


