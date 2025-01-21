import userModel from '../../models/userModel.js';
import addressModel from '../../models/addressSchema.js';
import cartModel from '../../models/cartModel.js';
import orderModel from '../../models/orderModel.js';
import productModel from '../../models/productSchema.js';
import walletModel from '../../models/walletModel.js';
import couponModel from '../../models/couponModel.js';

// Add orders
export const userOrders = async (req, res, next) => {
  const { userId, cartId, selectedAddress, paymentMethod, totalPrice, selectedCoupon, discountedPrice } = req.body;
  console.log('Request body of order:', req.body);

  if (!cartId) {
    return next({ statusCode: 400, message: 'Cart is empty' });
  }

  if (!selectedAddress) {
    return next({ statusCode: 404, message: 'Address not selected' });
  }

  if (!paymentMethod) {
    return next({ statusCode: 404, message: 'Payment method is not selected' });
  }

  if (paymentMethod == 'COD' && totalPrice > 1000) {
    return next({ statusCode: 404, message: 'Cash on Delivery (COD) is not available for orders exceeding ₹1000. Please select an alternative payment method' })
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

  const orderedItems = [];
  for (const item of cart.items) {
    const product = await productModel.findById(item.productId);

    if (!product) {
      return next({ statusCode: 404, message: `Product not found: ${item.productId}` });
    }

    orderedItems.push({
      productId: product._id,
      name: product.name,
      quantity: item.quantity,
      price: item.price,
    });
  }

  let finalTotalPrice = totalPrice;
  if (selectedCoupon) {
    const coupon = await couponModel.findById(selectedCoupon);
    if (!coupon) {
      return next({ statusCode: 404, message: 'Coupon not found' });
    }

    console.log('coupon details : ', coupon)
    const currentDate = new Date();
    if (coupon.expiryDate && coupon.expiryDate < currentDate) {
      return next({ statusCode: 400, message: 'Coupon has expired' });
    }

    const userCouponUsage = await orderModel.countDocuments({
      userId,
      couponApplied: selectedCoupon,
    });

    if (userCouponUsage >= 5) {
      return next({ statusCode: 400, message: 'You have already used this coupon 5 times.' });
    }

    if (discountedPrice) {
      finalTotalPrice = discountedPrice;
    }
    coupon.user = userId;
    coupon.usedCount = (coupon.usedCount || 0) + 1;
    await coupon.save();
    console.log('coupon console: ', coupon);
  }

  // Create new order
  const newOrder = new orderModel({
    userId,
    orderedItems,
    selectedAddress: fullAddress,
    totalPrice: finalTotalPrice,
    payment: paymentMethod,
    couponApplied: selectedCoupon || null,
    status: paymentMethod === 'Wallet' ? 'Processing' : 'Pending',
    paymentStatus: paymentMethod === 'Wallet' ? 'Completed' : 'Pending',
  });

  const savedOrder = await newOrder.save();
  console.log('Order saved successfully.', savedOrder);

  if (paymentMethod == 'Wallet') {
    const wallet = await walletModel.findOne({ userId });
    if (!wallet) {
      return next({ statusCode: 400, message: 'Wallet not found' });
    }

    if (wallet.balance < totalPrice) {
      return next({ statusCode: 400, message: 'Insufficient balance in wallet' })
    }

    wallet.balance -= totalPrice;
    wallet.transactions.push({
      type: 'debit',
      amount: totalPrice,
      description: `Order payment for Order ID: ${savedOrder._id}`,
      relatedOrderId: savedOrder._id,
    })
    await wallet.save();
  }

  cart.items = [];
  await cart.save();

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
      paymentStatus: savedOrder.paymentStatus,
      status: savedOrder.status,
      createdAt: savedOrder.createdAt,
      updatedAt: savedOrder.updatedAt,
    },
  });
};

// Get individual user orders
export const getUserOrder = async (req, res, next) => {
  const { userId } = req.params;
  const limit = 4;
  const { page = 1 } = req.query;

  const orders = await orderModel.find({ userId })
    .populate({
      path: 'userId',
      select: 'firstName',
    })
    .populate({
      path: 'orderedItems.productId',
      select: 'name salesPrice stockQuantity type images',
    })
    .select('selectedAddress totalPrice status payment orderedItems createdAt paymentStatus')
    .sort({ createdAt: -1 })
    .limit(limit)
    .skip((page - 1) * limit);

  const totalOrders = await orderModel.countDocuments({ userId })
  const totalPages = Math.ceil(totalOrders / limit);

  if (!orders || orders.length === 0) {
    return next({ statusCode: 404, message: 'No orders found' });
  }

  res.status(200).json({ message: 'Order details sent successfully', orders, pagination: { currentPage: parseInt(page), totalPages, totalOrders, } });
};

//cancel order
export const cancelOrder = async (req, res, next) => {
  const { orderId } = req.body;

  const order = await orderModel.findById(orderId);

  if (!order) {
    return next({ statusCode: 404, message: ' Order not found' })
  }

  if (order.status == 'Cancelled') {
    return next({ statusCode: 400, message: 'Order is already cancelled' })
  }

  for (const item of order.orderedItems) {
    const product = await productModel.findById(item.productId);

    if (product) {
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
    .populate('couponApplied', 'name discountType discountValue')
    .populate('orderedItems.productId', 'name images salesPrice')
    .sort({ createdAt : -1 });

  if (!orders || orders.length === 0) {
    return next({ statusCode: 404, message: 'Order not found' });
  }

  // Format the orders for the response
  const formattedOrders = orders.map((order) => {
    // Calculate the total price manually
    const calculatedTotalPrice = order.orderedItems.reduce((total, item) => {
      const pricePerUnit = item.productId?.salesPrice || 0;
      return total + pricePerUnit * item.quantity;
    }, 0);

    // Calculate the discount amount
    let discountAmount = 0;
    if (order.couponApplied) {
      const { discountType, discountValue } = order.couponApplied;
      if (discountType === 'PERCENTAGE') {
        discountAmount = (calculatedTotalPrice * discountValue) / 100;
      } else if (discountType === 'FLAT') {
        discountAmount = discountValue;
      }
    }

    // Calculate the final price after applying the discount
    const finalPrice = calculatedTotalPrice - discountAmount;

    // Format the order object
    return {
      orderId: order._id,
      userName: `${order.userId?.firstName || ''} ${order.userId?.lastName || ''}`.trim(),
      userEmail: order.userId?.email || 'Unknown',
      totalPrice: calculatedTotalPrice,
      finalPrice: finalPrice.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      couponApplied: order.couponApplied?.name || 'No Coupon',
      status: order.status,
      createdAt: new Date(order.createdAt).toLocaleString('en-GB', {
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
        totalItemPrice: (item.quantity * (item.productId?.salesPrice || 0)).toFixed(2),
      })),
    };
  });

  res.status(200).json({
    message: 'Orders fetched successfully',
    orders: formattedOrders,
  });
};

//return order
export const returnOrder = async (req, res, next) => {
  const { orderId } = req.body;

  const order = await orderModel.findById(orderId);

  if (!order) {
    return next({ statusCode: 404, message: 'Order not found' });
  }

  if (order.status == 'Cancelled' || order.status == 'Returned') {
    return next({ statusCode: 400, message: 'Order cannot be returned as its already cancelled or returned' })
  }

  if (order.status != 'Delivered') {
    return next({ statusCode: 400, message: 'Order can only be returned once delivered' })
  }

  for (const item of order.orderedItems) {
    const product = await productModel.findById(item.productId);

    if (product) {
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

  if (!order) {
    return next({ statusCode: 404, message: 'Order not found' })
  }

  if (status == 'Cancelled' || status == 'Returned') {
    return next({ statusCode: 400, message: 'Cancelled or returned order canonot change status' })
  }

  order.paymentStatus = 'Completed';
  order.status = status;
  await order.save();

  res.status(200).json({ message: 'Order status updated successfully' })
}

//razor pay status change
export const updateStatusRazorpay = async (req, res, next) => {
  const { paymentStatus } = req.body;
  const { orderId } = req.params;

  const order = await TempOrderModel.findById(orderId);

  if (!order) {
    return next({ statusCode: 404, message: 'Order not found' });
  }

  if (paymentStatus === 'Failed') {
    return next({ statusCode: 400, message: 'Payment failed. Cannot update status.' });
  }

  if (order.status === 'Cancelled' || order.status === 'Returned') {
    return next({
      statusCode: 400,
      message: 'Cancelled or returned order cannot change status.',
    });
  }

  order.paymentStatus = paymentStatus;

  if (paymentStatus === 'Completed') {
    order.status = 'Processing';
  }

  await order.save();

  res.status(200).json({ message: 'Order payment status updated successfully', order });
};

