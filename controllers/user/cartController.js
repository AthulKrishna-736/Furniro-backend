import cartModel from '../../models/cartModel.js';
import categoryModel from '../../models/categorySchema.js';
import catOfferModel from '../../models/catOffers.js';
import productModel from '../../models/productSchema.js';

// Add to cart
export const addToCart = async (req, res, next) => {
  const { userId, productId, quantity } = req.body;

  const product = await productModel.findById(productId);
  if (!product) {
    return next({ statusCode: 404, message: 'Product not found' });
  }

  if (product.isBlocked) {
    return next({ statusCode: 403, message: 'This product is currently unavailable.' });
  }

  // Check if the product's category is blocked
  const category = await categoryModel.findById(product.category);
  if (!category) {
    return next({ statusCode: 404, message: 'Category not found' });
  }

  if (category.isBlocked) {
    return next({ statusCode: 403, message: 'This category is currently unavailable.' });
  }

  let cart = await cartModel.findOne({ userId });

  // Fetch active offers for the product's category
  const activeOffer = await catOfferModel.findOne({
    categoryId: category._id,
    isActive: true,
    startDate: { $lte: new Date() },
    expiryDate: { $gte: new Date() },
  });

  let priceAfterOffer = product.salesPrice;

  // Apply the offer if available
  if (activeOffer) {
    if (activeOffer.discountType === 'percentage') {
      priceAfterOffer -= (priceAfterOffer * activeOffer.discountValue) / 100;
    } else if (activeOffer.discountType === 'flat') {
      priceAfterOffer -= activeOffer.discountValue;
    }
  }

  const totalPriceForProduct = priceAfterOffer * quantity;

  if (!cart) {
    // Create a new cart if one doesn't exist
    cart = new cartModel({
      userId,
      items: [
        {
          productId: product._id,
          name: product.name,
          price: priceAfterOffer,
          quantity,
        },
      ],
      totalPrice: totalPriceForProduct,
    });
  } else {
    // Check if the item already exists in the cart
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      if (existingItem.quantity >= 5) {
        return next({ statusCode: 400, message: `Max limit exceeded: You can only add up to 5 units per order.` });
      }

      existingItem.quantity += quantity; // Update the quantity
      existingItem.price = priceAfterOffer; // Update the price with the active offer, if any
    } else {
      // Add a new item to the cart
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: priceAfterOffer,
        quantity,
      });
    }

    // Recalculate the total price of the cart
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + item.price * item.quantity;
    }, 0);
  }

  await cart.save();

  res.status(200).json({ message: 'Product added to cart', cart });
};

//getcart
export const getCart = async (req, res, next) => {
  const { userId } = req.params;
  try {
    const cart = await cartModel
      .findOne({ userId })
      .populate('items.productId', 'name salesPrice images stockQuantity isBlocked category')
      .select('totalPrice items');

    if (!cart) {
      return next({ statusCode: 404, message: 'Cart not found' });
    }

    const blockedItems = [];
    const stockIssues = [];
    const categoryBlockedItems = [];
    let cartUpdated = false;

    const now = new Date();

    // Loop through each item in the cart
    for (const item of cart.items) {
      const product = item.productId;

      if (!product) continue;

      // Check if product is blocked
      if (product.isBlocked) {
        blockedItems.push({
          productId: product._id,
          name: product.name,
        });
        item.price = product.salesPrice;  
        cartUpdated = true;
      }

      const category = await categoryModel.findById(product.category);
      if (category?.isBlocked) {
        categoryBlockedItems.push({
          productId: product._id,
          name: product.name,
          categoryName: category.name,
        });
        item.price = product.salesPrice; 
        cartUpdated = true;
      }

      if (product.stockQuantity < item.quantity) {
        stockIssues.push({
          productId: product._id,
          name: product.name,
          availableStock: product.stockQuantity,
        });
      }

      // Fetch the active category offer for the product's category
      const activeCategoryOffer = await catOfferModel.findOne({
        categoryId: category._id,
        isActive: true,
        startDate: { $lte: now },
        expiryDate: { $gte: now },
      });

      if (activeCategoryOffer) {
        if (activeCategoryOffer.discountType === 'percentage') {
          item.price = product.salesPrice - (product.salesPrice * activeCategoryOffer.discountValue) / 100;
        } else if (activeCategoryOffer.discountType === 'flat') {
          item.price = product.salesPrice - activeCategoryOffer.discountValue;
        }
        cartUpdated = true;
      } else {
        item.price = product.salesPrice;
        cartUpdated = true;
      }
    }

    const updatedTotalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );

    if (cartUpdated || cart.totalPrice !== updatedTotalPrice) {
      cart.totalPrice = updatedTotalPrice;
      await cart.save();
    }

    if (blockedItems.length > 0 || stockIssues.length > 0 || categoryBlockedItems.length > 0) {
      return res.status(200).json({
        message: 'Cart retrieved successfully, but some products have issues. Please review your cart.',
        cart,
        blockedItems,
        categoryBlockedItems,
        stockIssues,
      });
    }

    res.status(200).json({ message: 'Cart retrieved successfully', cart });
  } catch (error) {
    next({ statusCode: 500, message: error.message || 'Failed to retrieve cart' });
  }
};

//delete cart items
export const deleteItems = async (req, res, next) => {
  const { id } = req.params;

  const cart = await cartModel.findOne({ "items._id": id });
  if (!cart) {
    return next({ statusCode: 404, message: "Cart not found" });
  }

  const item = cart.items.find((item) => item._id.toString() === id);
  if (!item) {
    return next({ statusCode: 404, message: "Item not found in cart" });
  }

  const product = await productModel.findById(item.productId);
  if (!product) {
    return next({ statusCode: 404, message: "Product not found" });
  }

  product.stockQuantity += item.quantity;
  await product.save();

  const result = await cartModel.updateOne(
    { "items._id": id },
    { $pull: { items: { _id: id } } }
  );

  if (result.modifiedCount > 0) {
    return res.status(200).json({ message: "Item removed successfully" });
  } else {
    return next({ statusCode: 404, message: "Item not found in cart" });
  }
};

//update quantity
export const updateQuantity = async (req, res, next) => {
  const { itemId, action } = req.body;
  const { userId } = req.params;

  try {
    const cart = await cartModel.findOne({ userId }).populate('items.productId');
    if (!cart) {
      return next({ statusCode: 404, message: 'Cart not found' });
    }

    const item = cart.items.find((item) => item._id.toString() === itemId);
    if (!item) {
      return next({ statusCode: 404, message: 'Item not found in cart' });
    }

    const product = item.productId;
    if (!product) {
      return next({ statusCode: 404, message: 'Product not found in cart' });
    }

    if (product.isBlocked) {
      return next({ statusCode: 403, message: 'This product is currently unavailable.' });
    }

    const category = await categoryModel.findById(product.category);
    if (!category) {
      return next({ statusCode: 404, message: 'Category not found' });
    }
    if (category.isBlocked) {
      return next({ statusCode: 403, message: 'The category of this product is currently unavailable.' });
    }

    const currentQuantity = item.quantity;
    let newQuantity = currentQuantity;

    if (action === 'increase') {
      if (currentQuantity >= 5) {
        return next({ statusCode: 400, message: 'Maximum limit of 5 items per product reached.' });
      }
      if (currentQuantity + 1 > product.stockQuantity) {
        return next({
          statusCode: 400,
          message: `Insufficient stock. Only ${product.stockQuantity} units available.`,
        });
      }
      newQuantity += 1;
    } else if (action === 'decrease') {
      if (currentQuantity > 1) {
        newQuantity -= 1;
      } else {
        return next({ statusCode: 400, message: 'Minimum quantity must be 1.' });
      }
    }

    item.quantity = newQuantity;

    await cart.save();

    res.status(200).json({ message: 'Quantity updated successfully', cart });
  } catch (error) {
    next({ statusCode: 500, message: error.message || 'Failed to update quantity' });
  }
};
