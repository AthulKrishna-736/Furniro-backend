import categoryModel from "../../../models/categorySchema.js";
import catOfferModel from "../../../models/catOffers.js";
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
    return next({ statusCode: 500, message: 'Server error, please try again later.' });
  });

  return res.status(201).json({ message: 'Product added successfully!' });
};

//get products
export const getAllProducts = async (req, res, next) => {
  const products = await productModel.find().populate('category').catch((error) => {
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

  const product = await productModel.findById(id);

  if (!product) {
    return next({ statusCode: 404, message: 'Product not found' });
  }

  product.isBlocked = !product.isBlocked;

  await product.save().catch((error) => {
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

  try {
    const totalProducts = await productModel.countDocuments(query);

    const allProducts = await productModel
      .find(query)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit))
      .populate('category', 'name isBlocked');

    const now = new Date();

    // Adjust prices based on active category offers
    const productsWithAdjustedPrices = await Promise.all(
      allProducts.map(async (product) => {
        if (product.category && !product.category.isBlocked) {
          const activeCategoryOffer = await catOfferModel.findOne({
            categoryId: product.category._id,
            isActive: true,
            startDate: { $lte: now },
            expiryDate: { $gte: now },
          });

          // Apply active category offer if available
          if (activeCategoryOffer) {
            if (activeCategoryOffer.discountType === 'percentage') {
              product.salesPrice =
                product.salesPrice -
                (product.salesPrice * activeCategoryOffer.discountValue) / 100;
            } else if (activeCategoryOffer.discountType === 'flat') {
              product.salesPrice =
                product.salesPrice - activeCategoryOffer.discountValue;
            }
          }
        }
        return product;
      })
    );

    // Filter out blocked categories
    const filteredProducts = productsWithAdjustedPrices.filter(
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
  } catch (error) {
    next({ statusCode: 500, message: error.message || 'Failed to fetch products' });
  }
};

export const productDetails = async (req, res, next) => {
  const { productId } = req.params;

  try {
    // Fetch the product
    const product = await productModel
      .findById(productId)
      .populate('category', 'name isBlocked currentOffer');

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    // Check for active category offer
    let adjustedPrice = product.salesPrice;
    const category = product.category;

    if (category && !category.isBlocked && category.currentOffer) {
      const offer = await catOfferModel.findById(category.currentOffer);

      if (offer && offer.isActive && new Date() < new Date(offer.expiryDate)) {
        if (offer.discountType === 'percentage') {
          adjustedPrice = Math.max(0, product.salesPrice - (product.salesPrice * offer.discountValue) / 100);
        } else if (offer.discountType === 'flat') {
          adjustedPrice = Math.max(0, product.salesPrice - offer.discountValue);
        }
      }
    }

    // Fetch recommended products
    const recommendedProducts = await productModel
      .find({
        category: product.category,
        _id: { $ne: productId },
        isBlocked: false,
      })
      .populate('category', 'name isBlocked currentOffer')
      .limit(4);

    // Adjust prices for recommended products based on category offer
    const adjustedRecommendedProducts = await Promise.all(
      recommendedProducts.map(async (recProduct) => {
        let recAdjustedPrice = recProduct.salesPrice;
        const recCategory = recProduct.category;

        if (recCategory && !recCategory.isBlocked && recCategory.currentOffer) {
          const recOffer = await catOfferModel.findById(recCategory.currentOffer);

          if (recOffer && recOffer.isActive && new Date() < new Date(recOffer.expiryDate)) {
            if (recOffer.discountType === 'percentage') {
              recAdjustedPrice = Math.max(0, recProduct.salesPrice - (recProduct.salesPrice * recOffer.discountValue) / 100);
            } else if (recOffer.discountType === 'flat') {
              recAdjustedPrice = Math.max(0, recProduct.salesPrice - recOffer.discountValue);
            }
          }
        }

        return {
          ...recProduct.toObject(),
          salesPrice: recAdjustedPrice, 
        };
      })
    );

    // Return the product and adjusted recommended products
    return res.status(200).json({
      product: {
        ...product.toObject(),
        salesPrice: adjustedPrice, // Adjusted price for the main product
      },
      recommendedProducts: adjustedRecommendedProducts,
    });
  } catch (error) {
    next({ statusCode: 500, message: error.message || 'Failed to fetch product details' });
  }
};


//edit product 
export const editProduct = async (req, res, next) => {
  const { productId } = req.params;
  const { name, description, salesPrice, category, images, stockQuantity } = req.body;

  const product = await productModel.findById(productId);

  if (!product) {
    return next({ statusCode: 404, message: 'Product not found.' });
  }

  product.name = name || product.name;
  product.description = description || product.description;
  product.salesPrice = salesPrice || product.salesPrice;
  product.category = category || product.category;
  product.images = images || product.images;
  product.stockQuantity = stockQuantity || product.stockQuantity;

  const updatedProduct = await product.save();

  return res.status(200).json({
    message: 'Product updated successfully.',
    product: updatedProduct
  });
};
