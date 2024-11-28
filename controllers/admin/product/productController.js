import productModel from "../../../models/productSchema.js";


//add product
export const addProduct = async (req, res) => {
    try {
      const { name, description, category, salesPrice, stockQuantity, images } = req.body;
  
      // Input Validation
      if (!name || !description || !category || !salesPrice || !stockQuantity || images.length < 3) {
        return res.status(400).json({ message: 'All fields are required, and at least 3 images must be provided.' });
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
      await newProduct.save();
  
      return res.status(201).json({ message: 'Product added successfully!' });
    } catch (error) {
      console.error('Error adding product:', error.message);
      return res.status(500).json({ message: 'Server error, please try again later.' });
    }
  };


//get products
export const getAllProducts = async (req, res) => {
    try {
      const products = await productModel.find().populate('category');

      if(!products.length){
        return res.status(200).json({ message:'No products available' })
      }

      console.log('products console: ', products.category)
      console.log('products console: ', products.name)
  
      res.status(200).json({ message:"got all products", products });
    } catch (error) {
      console.error('Error fetching products:', error.message);
      res.status(500).json({
        message: 'Failed to fetch products, please try again later.',
      });
    }
  };

  
//block products
export const blockProducts = async(req, res)=>{
  const { id } = req.params;
  console.log('req params = ', req.params);
  try {
    const product = await productModel.findById(id);
    console.log('product block promise = ', product);

    if(!product){
      console.log('no product found in this id')
      res.status(404).json({ message:'Product not found' })
    }

    product.isBlocked = !product.isBlocked; //reversing the bool value as each request
    const response = product.save();
    res.status(200).json({ message:`Product ${product.isBlocked ? 'blocked' : 'unblocked'} successfully`, isBlocked:product.isBlocked })
     
  } catch (error) {
    console.log('error while blocking the product ', error)
    res.status(500).json({ message:'Error while blocking product', error:error.message })
  }
}

//get user product
export const getUserProducts = async (req, res) => {
  try {
    // Fetch products and populate their category details
    const products = await productModel.find()
      .populate('category', 'name isBlocked') // Populate category with required fields
      .exec();

    if (!products.length) {
      return res.status(200).json({ message: 'No products available' });
    }

    // Filter out products or categories that are blocked
    const filteredProducts = products.filter(product => 
      !product.isBlocked && product.category && !product.category.isBlocked
    );

    if (!filteredProducts.length) {
      return res.status(200).json({ message: 'No active products available' });
    }

    // Logging for debugging
    filteredProducts.forEach(product => {
      console.log('Product Name:', product.name);
      console.log('Category Name:', product.category.name);
    });

    // Send response with filtered products
    res.status(200).json({
      message: 'Fetched active products successfully',
      products: filteredProducts,
    });
  } catch (error) {
    console.error('Error fetching products:', error.message);
    res.status(500).json({
      message: 'Failed to fetch products, please try again later.',
    });
  }
};


//product details
export const productDetails = async (req, res) => {
  const { productId } = req.params; 

  try {
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

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error', error: error.message });
  }
}


//edit product 
export const editProduct =async (req, res) => {
  try {
    const { productId } = req.params; // Use the productId from the URL params
    const { name, description, price, category, images } = req.body;

    // // Check if all necessary fields are provided
    // if (!name || !description || !price || !category || !images) {
    //   return res.status(400).json({ message: 'All fields are required.' });
    // }

    // Find the product by ID
    const product = await productModel.findById(productId);

    if (!product) {
      return res.status(404).json({ message: 'Product not found.' });
    }

    // Update the product fields
    product.name = name || product.name;
    product.description = description || product.description;
    product.price = price || product.price;
    product.category = category || product.category;
    product.images = images || product.images;

    // Save the updated product
    const updatedProduct = await product.save();

    // Send a success response
    return res.status(200).json({
      message: 'Product updated successfully.',
      product: updatedProduct
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Server error.' });
  }
}

