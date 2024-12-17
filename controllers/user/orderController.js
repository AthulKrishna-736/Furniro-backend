import userModel from '../../models/userModel.js';
import addressModel from '../../models/addressSchema.js';
import cartModel from '../../models/cartModel.js';
import orderModel from '../../models/orderModel.js';
import productModel from '../../models/productSchema.js';

// Add orders
export const userOrders = async (req, res, next) => {
  const { userId, cartId, selectedAddress, paymentMethod } = req.body;
  console.log('Request body of order:', req.body);

  if (!cartId) {
    return next({ statusCode: 400, message: 'Cart is empty' });
  }

  if (!selectedAddress) {
    return next({ statusCode: 404, message: 'Address not selected' });
  }

  const user = await userModel.findById(userId).select('name');
  if (!user) {
    return next({ statusCode: 404, message: 'User not found' });
  }

  const cart = await cartModel.findById(cartId).populate('items.productId', 'name salesPrice');
  if (!cart || !cart.items || !cart.items.length) {
    return next({ statusCode: 404, message: 'Cart is empty' });
  }

  const address = await addressModel.findById(selectedAddress).select('name phoneNumber pincode locality district state type');
  if (!address) {
    return next({ statusCode: 404, message: 'Address not found' });
  }

  const fullAddress = `${address.locality}, ${address.district}, ${address.state} - ${address.pincode}`;

  let finalTotalPrice = 0;

  // Prepare ordered items from cart
  const orderedItems = [];
  for (const item of cart.items) {
    const product = await productModel.findById(item.productId);
  
    if (!product) {
      return next({ statusCode: 404, message: `Product not found: ${item.productId}` });
    }
  
    if (product.stockQuantity < item.quantity) {
      return next({ statusCode: 400, message: `Insufficient stock for ${product.name}. Only ${product.stockQuantity} left.`,});
    }
  
    product.stockQuantity -= item.quantity;
    await product.save();
  
    const productPrice = product.salesPrice * item.quantity;
    finalTotalPrice += productPrice;
  
    orderedItems.push({
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      price: productPrice,
    });
  }
  

  // Create new order
  const newOrder = new orderModel({
    userId,
    orderedItems,
    selectedAddress: fullAddress,
    totalPrice: finalTotalPrice,
    payment: paymentMethod,
  });

  const savedOrder = await newOrder.save();
  console.log('Order saved successfully.', savedOrder);

  cart.items = [];
  await cart.save();

  console.log('User cart is now empty');

  res.status(201).json({
    message: 'Order placed successfully',
    order: {
      _id: savedOrder._id,
      userName: user.name,

      cartItems: orderedItems.map((item) => ({
        productName: item.name || 'Product name not found',
        quantity: item.quantity,
        price: item.price,
      })),

      address: {
        fullAddress,
        name: address.name,
        phoneNumber: address.phoneNumber,
        type: address.type,
      },

      totalPrice: savedOrder.totalPrice,
      paymentMethod: savedOrder.payment,
      status: savedOrder.status,
      createdAt: savedOrder.createdAt,
      updatedAt: savedOrder.updatedAt,
    },
  });
};

// Get individual user orders
export const getUserOrder = async (req, res, next) => {
  const { userId } = req.params;

  const orders = await orderModel.find({ userId })
    .populate({
      path: 'userId',
      select: 'firstName',
    })
    .populate({
      path: 'orderedItems.productId',
      select: 'name salesPrice stockQuantity type images',
    })
    .select('selectedAddress totalPrice status payment orderedItems createdAt')

  // Handle case where no orders are found
  if (!orders || orders.length === 0) {
    return next({ statusCode: 404, message: 'No orders found for this user' });
  }

  res.status(200).json({ message: 'Order details sent successfully', orders });
};

//cancel order
export const cancelOrder = async (req, res, next) => {
  const { orderId } = req.body;

  const order = await orderModel.findById(orderId);

  if(!order){
    return next({ statusCode: 404, message:' Order not found' })
  }
  
  if(order.status == 'Cancelled'){
    return next({ statusCode: 400, message: 'Order is already cancelled' })
  }

  for(const item of order.orderedItems){
    const product = await productModel.findById(item.productId);

    if(product){
      product.stockQuantity += item.quantity;
      await product.save();
    }
  }

  order.status = 'Cancelled';
  await order.save();

  res.status(200).json({ message: 'Order cancelled successfully!', order });
};

//getall orders
export const getAllOrders = async (req, res, next) => {
  const orders = await orderModel
  .find()
  .populate('userId', 'firstName lastName email selectedAddress') 
  .populate('orderedItems.productId', 'name images salesPrice');


  // Check if orders exist
  if (!orders || orders.length === 0) {
    return next({ statusCode: 404, message:'Order not found' });
  }

  // Format the orders for the response
  const formattedOrders = orders.map((order) => ({
    orderId: order._id,
    userName: `${order.userId?.firstName || ''} ${order.userId?.lastName || ''}`.trim(),
    userEmail: order.userId?.email || 'Unknown',
    totalPrice: order.totalPrice,
    status: order.status,
    createdAt: new Date(order.createdAt).toLocaleString('en-GB',{
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    }),
    payment: order.payment,
    address: order.selectedAddress,
    orderedItems: order.orderedItems.map((item) => ({
      productId: item.productId?._id || null,
      productName: item.productId?.name || 'Unknown',
      productImage: item.productId?.images?.[0] || 'No Image',
      pricePerUnit: item.productId?.salesPrice || 0,
      quantity: item.quantity,
      totalItemPrice: item.quantity * (item.productId?.salesPrice || 0),
    })),
  }));

  // Send the response
  res.status(200).json({
    message: 'Orders fetched successfully',
    orders: formattedOrders,
  });
};

//return order
export const returnOrder = async (req, res, next)=>{
  const { orderId } = req.body;

  const order = await orderModel.findById(orderId);

  if(!order){
    return next({ statusCode: 404, message: 'Order not found' });
  }

  if(order.status == 'Cancelled' || order.status == 'Returned'){
    return next({ statusCode: 400, message: 'Order cannot be returned as its already cancelled or returned' })
  }

  if(order.status != 'Delivered'){
    return next({ statusCode: 400, message: 'Order can only be returned once delivered' })
  }

  for(const item of order.orderedItems){
    const product = await productModel.findById(item.productId);

    if(product){
      product.stockQuantity += item.quantity;
      await product.save();
    }
  }

  order.status = 'Returned';
  await order.save();

  res.status(200).json({ message: 'Order returned successfully' });
}

//update order status
export const updateOrderStatus = async (req, res, next) => {
  const { orderId, status } = req.body;

  const order = await orderModel.findById(orderId);

  if(!order){
    return next({ statusCode: 404, message: 'Order not found' })
  }

  if(status == 'Cancelled' || status == 'Returned'){
    return next({ statusCode: 400, message: 'Cancelled or returned order canonot change status' })
  }

  order.status = status;
  await order.save();

  res.status(200).json({ message: 'Order status updated successfully' })
}