import cartModel from '../../models/cartModel.js';
import productModel from '../../models/productSchema.js';

// Add to cart
export const addToCart = async (req, res, next) => {
  const { userId, productId, quantity } = req.body;

  const product = await productModel.findById(productId);
  if (!product) {
    return next({ statusCode: 404, message: 'Product not found' });
  }

  if (quantity > product.stockQuantity) {
    return next({ statusCode: 400, message: 'Not enough stock available' });
  }

  let cart = await cartModel.findOne({ userId });

  if (!cart) {
    cart = new cartModel({
      userId,
      items: [{
        productId: product._id,
        name: product.name,
        price: product.salesPrice,
        quantity,
      }],
      totalPrice: product.salesPrice * quantity,
    });
  } else {
    const existingItem = cart.items.find(
      (item) => item.productId.toString() === productId
    );

    if (existingItem) {
      existingItem.quantity += quantity;

      if(existingItem.quantity > 5){
        return next({ statusCode: 400, message: `Max limit exceeded: You can only add up to 5 units per order` })
      }

      if (existingItem.quantity > product.stockQuantity) {
        return next({ statusCode: 400, message: 'Not enough stock available' });
      }
    } else {
      cart.items.push({
        productId: product._id,
        name: product.name,
        price: product.salesPrice,
        quantity,
      });
    }

    cart.totalPrice = cart.items.reduce(
      (total, item) => total + item.price * item.quantity,
      0
    );
  }

  await cart.save();

  res.status(200).json({ message: 'Product added to cart', cart });
};

//getcart
export const getCart = async (req, res, next) => {
  const { userId } = req.params;
  console.log('Fetching cart for user: ', userId);

  const cart = await cartModel
    .findOne({ userId })
    .populate('items.productId', 'name salesPrice images stockQuantity');

  if (!cart) {
    console.log('No cart found for user');
    return next({ statusCode: 404, message: 'Cart not found' });
  }

  console.log('Cart found: ', cart);
  res.status(200).json({ message: 'Cart retrieved successfully', cart });
};

//delete cart items
export const deleteItems = async (req, res, next) => {
  const { id } = req.params;
  console.log('req params = ', req.params);

  const result = await cartModel.updateOne(
    { "items._id": id },
    { $pull: { items: { _id: id } } }
  );

  if (result.modifiedCount > 0) {
    console.log('item removed from the cart');
    return res.status(200).json({ message: "Item removed successfully" });
  } else {
    console.log('item not found in cart, cannot delete');
    return next({ statusCode: 404, message: "Item not found in cart" });
  }
};
  
//update quantity
export const updateQuantity = async (req, res, next) => {
  const { itemId, action } = req.body;
  const { userId } = req.params;
  console.log('Request body and params for cart update:', [req.body, req.params]);

  const cart = await cartModel.findOne({ userId }).populate('items.productId');
  if (!cart) {
    return next({ statusCode: 404, message: 'Cart not found' });
  }

  const item = cart.items.find(item => item._id.toString() === itemId);
  if (!item) {
    return next({ statusCode: 404, message: 'Item not found in cart' });
  }

  const product = item.productId; 
  const currentQuantity = item.quantity;

  // Handle increase and decrease actions
  let newQuantity = currentQuantity;
  if (action === 'increase') {
    if (currentQuantity >= 5) {
      return next({ statusCode: 400, message: 'Maximum limit of 5 items per product reached.' });
    }
    newQuantity += 1;
  } else if (action === 'decrease') {
    newQuantity = Math.max(currentQuantity - 1, 1); 
  }

  // Update the quantity in the cart (but don't reduce product stock)
  item.quantity = newQuantity;
  await cart.save();

  console.log('Cart quantity updated properly');
  res.status(200).json({ message: 'Quantity updated successfully', cart });
};

