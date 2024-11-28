import express from 'express'
import { blockUser, getUsers } from '../controllers/admin/userManage/userManageController.js';
import { addCategory, blockCategory, getCategory, updateCategory } from '../controllers/admin/category/categoryController.js';
import { addProduct, blockProducts, editProduct, getAllProducts } from '../controllers/admin/product/productController.js';
import { adminLogin } from '../controllers/admin/adminLogin.js';

const adminRoute = express.Router();

//admin route
adminRoute.post('/login', adminLogin);
adminRoute.get('/getUsers', getUsers);
adminRoute.patch('/blockUser/:id', blockUser);
adminRoute.post('/addCategory', addCategory);
adminRoute.get('/getCategories', getCategory);
adminRoute.patch('/blockCategory/:id', blockCategory);
adminRoute.patch('/updateCategory/:id', updateCategory);
adminRoute.post('/addProducts', addProduct);
adminRoute.get('/getProducts', getAllProducts);
adminRoute.patch('/blockProduct/:id', blockProducts);
adminRoute.put('/updateProduct/:productId', editProduct)

export default adminRoute;


