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

  if (quantity > product.stockQuantity) {
    return next({ statusCode: 400, message: 'Not enough stock available' });
  }

  let cart = await cartModel.findOne({ userId });

  // Fetch active offers for the product's category
  const category = await categoryModel.findById(product.category);
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
      priceAfterOffer = priceAfterOffer - (priceAfterOffer * activeOffer.discountValue) / 100;
    } else if (activeOffer.discountType === 'flat') {
      priceAfterOffer = priceAfterOffer - activeOffer.discountValue;
    }
  }

  const totalPriceForProduct = priceAfterOffer * quantity;

  if (!cart) {
    cart = new cartModel({
      userId,
      items: [{
        productId: product._id,
        name: product.name,
        price: priceAfterOffer,
        quantity,
      }],
      totalPrice: totalPriceForProduct,
    });
    product.stockQuantity -= quantity;
  } else {
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      if (existingItem.quantity >= 5) {
        return next({ statusCode: 400, message: `Max limit exceeded: You can only add up to 5 units per order` });
      }

      if (existingItem.quantity + quantity > product.stockQuantity) {
        return next({ statusCode: 400, message: 'Not enough stock available' });
      }

      product.stockQuantity -= quantity;
      existingItem.quantity += quantity;
      existingItem.price = priceAfterOffer;  // Update price after applying offer
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: priceAfterOffer,
        quantity,
      });
      product.stockQuantity -= quantity;
    }

    // Recalculate the total price of the cart, considering the discounted price for each item
    cart.totalPrice = cart.items.reduce((total, item) => {
      return total + (item.price * item.quantity);  // Recalculate each item's price after discount
    }, 0);
  }

  await product.save();
  await cart.save();

  res.status(200).json({ message: 'Product added to cart', cart });
};

//getcart
export const getCart = async (req, res, next) => {
  const { userId } = req.params;

  // Find the cart and populate product details
  const cart = await cartModel
    .findOne({ userId })
    .populate('items.productId', 'name salesPrice images stockQuantity isBlocked')
    .select('totalPrice items');

  if (!cart) {
    return next({ statusCode: 404, message: 'Cart not found' });
  }

  // Update cart total price
  cart.totalPrice = cart.items.reduce((total, item) => total + item.price * item.quantity, 0);
  await cart.save();

  const blockedItems = [];
  cart.items.forEach((item) => {
    if (item.productId?.isBlocked) {
      blockedItems.push(item.productId); 
    }
  });

  if (blockedItems.length > 0) {
    return res.status(200).json({
      message: 'Cart retrieved successfully, but some products are blocked. Please remove them to proceed.',
      cart,
      blockedItems,
    });
  }

  res.status(200).json({ message: 'Cart retrieved successfully', cart });
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

  const cart = await cartModel.findOne({ userId }).populate('items.productId');
  if (!cart) {
    return next({ statusCode: 404, message: 'Cart not found' });
  }

  const item = cart.items.find(item => item._id.toString() === itemId);
  if (!item) {
    return next({ statusCode: 404, message: 'Item not found in cart' });
  }

  const product = await productModel.findById(item.productId._id);
  if (!product) {
    return next({ statusCode: 404, message: 'Product not found' });
  }

  const currentQuantity = item.quantity;


  let newQuantity = currentQuantity;
  if (action === 'increase') {
    if (currentQuantity >= 5) {
      return next({ statusCode: 400, message: 'Maximum limit of 5 items per product reached.' });
    }
    if (product.stockQuantity <=0) {
      return next({ statusCode:400, message: 'Stock is not available for this product.' });
    }
    newQuantity += 1;
    product.stockQuantity -= 1;
  } else if (action === 'decrease') {
    if (currentQuantity > 1) {
      newQuantity -= 1;
      product.stockQuantity += 1; 
    } else {
      return next({ statusCode: 400, message: 'Minimum quantity must be 1.' });
    }
  }

  await product.save();
  item.quantity = newQuantity;
  await cart.save();

  res.status(200).json({ message: 'Quantity updated successfully', cart });
};

