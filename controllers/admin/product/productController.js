import productModel from "../../../models/productSchema.js";

//add product
export const addProduct = async (req, res, next) => {
  const { name, description, category, salesPrice, stockQuantity, images } = req.body;

  // Input Validation
  if (!name || !description || !category || !salesPrice || !stockQuantity || images.length < 3) {
    return next({ statusCode: 400, message: 'All fields are required, and at least 3 images must be provided.' });
  }

  // Create a new product
  const newProduct = new productModel({
    name,
    description,
    category,
    salesPrice,
    stockQuantity,
    images,
  });

  // Save product to database
  await newProduct.save().catch((error) => {
    console.error('Error adding product:', error.message);
    return next({ statusCode: 500, message: 'Server error, please try again later.' });
  });

  return res.status(201).json({ message: 'Product added successfully!' });
};

//get products
export const getAllProducts = async (req, res, next) => {
  const products = await productModel.find().populate('category').catch((error) => {
    console.error('Error fetching products:', error.message);
    return next({ statusCode: 500, message: 'Failed to fetch products, please try again later.' });
  });

  if (!products.length) {
    return res.status(200).json({ message: 'No products available' });
  }

  return res.status(200).json({ message: 'Got all products', products });
};
  
//block products
export const blockProducts = async (req, res, next) => {
  const { id } = req.params;
  console.log('req params = ', req.params);

  const product = await productModel.findById(id);
  
  if (!product) {
    console.log('No product found for this id');
    return next({ statusCode: 404, message: 'Product not found' });
  }

  product.isBlocked = !product.isBlocked; 
  
  await product.save().catch((error) => {
    console.error('Error saving product:', error.message);
    return next({ statusCode: 500, message: 'Error while saving product' });
  });

  res.status(200).json({
    message: `Product ${product.isBlocked ? 'blocked' : 'unblocked'} successfully`,
    isBlocked: product.isBlocked,
  });
};

//get user product
export const getUserProducts = async (req, res, next) => {
  const { page = 1, limit = 8, sortBy, categoryId } = req.query;
  console.log('req query in here: ', req.query);

  const skip = (page - 1) * limit;

  const query = { isBlocked: false };
  if (categoryId) {
    query.category = categoryId; 
  }

  let sort = {};
  switch (sortBy) {
    case 'low-high':
      sort = { salesPrice: 1 };
      break;
    case 'high-low':
      sort = { salesPrice: -1 };
      break;
    case 'new-arrivals':
      sort = { createdAt: -1 };
      break;
    case 'a-z':
      sort = { name: 1 };
      break;
    case 'z-a':
      sort = { name: -1 };
      break;
    default:
      sort = {}; 
      break;
  }

    const totalProducts = await productModel.countDocuments(query);

    const allProducts = await productModel
      .find(query)
      .sort(sort) 
      .skip(skip)
      .limit(Number(limit)) 
      .populate('category', 'name isBlocked');

    // Filter out blocked categories
    const filteredProducts = allProducts.filter(
      (product) => product.category && !product.category.isBlocked
    );

    if (!filteredProducts.length) {
      return res.status(200).json({ message: 'No active products available' });
    }

    res.status(200).json({
      message: 'Fetched active products successfully',
      products: filteredProducts,
      totalProducts,
      totalPages: Math.ceil(totalProducts / limit),
      currentPage: Number(page),
    });
};

//product details
export const productDetails = async (req, res, next) => {
  const { productId } = req.params; 

  const product = await productModel.findById(productId);

  if (!product) {
    return res.status(404).json({ message: 'Product not found' });
  }

  const recommendedProducts = await productModel.find({
    category: product.category,
    _id: { $ne: productId },   
  }).limit(4);

  return res.status(200).json({
    product,
    recommendedProducts,
  });
};

//edit product 
export const editProduct = async (req, res, next) => {
  const { productId } = req.params; 
  const { name, description, price, category, images, stockQuantity } = req.body;
  console.log(req.body)
  console.log('req body in editproduct: ', [req.body, req.params]);

  const product = await productModel.findById(productId);

  if (!product) {
    return next({ statusCode: 404, message: 'Product not found.' });
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.price = price || product.price;
  product.category = category || product.category;
  product.images = images || product.images;
  product.stockQuantity = stockQuantity || product.stockQuantity;

  const updatedProduct = await product.save();

  return res.status(200).json({
    message: 'Product updated successfully.',
    product: updatedProduct
  });
};
