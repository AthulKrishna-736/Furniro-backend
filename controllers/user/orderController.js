import userModel from '../../models/userModel.js';
import addressModel from '../../models/addressSchema.js';
import cartModel from '../../models/cartModel.js';
import orderModel from '../../models/orderModel.js';
import productModel from '../../models/productSchema.js';
import walletModel from '../../models/walletModel.js';
import couponModel from '../../models/couponModel.js';
import categoryModel from '../../models/categorySchema.js';

// Add orders
export const userOrders = async (req, res, next) => {
  const { userId, cartId, selectedAddress, paymentMethod, totalPrice, selectedCoupon, discountedPrice } = req.body;

  if (!cartId) {
    return next({ statusCode: 400, message: 'Cart is empty' });
  }

  if (!selectedAddress) {
    return next({ statusCode: 404, message: 'Address not selected' });
  }

  if (!paymentMethod) {
    return next({ statusCode: 404, message: 'Payment method is not selected' });
  }

  if (paymentMethod === 'COD' && totalPrice > 1000) {
    return next({ statusCode: 404, message: 'Cash on Delivery (COD) is not available for orders exceeding ₹1000. Please select an alternative payment method' });
  }

  const user = await userModel.findById(userId).select('name');
  if (!user) {
    return next({ statusCode: 404, message: 'User not found' });
  }

  const cart = await cartModel.findById(cartId).populate('items.productId', 'name salesPrice stockQuantity');
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

    if (product.isBlocked) {
      return next({ statusCode: 403, message: `The product "${product.name}" is currently unavailable.` });
    }

    const category = await categoryModel.findById(product.category);
    if (category?.isBlocked) {
      return next({ statusCode: 403, message: `The category "${category.name}" for the product "${product.name}" is currently unavailable.` });
    }

    if (product.stockQuantity < item.quantity) {
      return next({ statusCode: 400, message: `Insufficient stock for "${product.name}". Available: ${product.stockQuantity}` });
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
  }

  if (paymentMethod === 'Wallet') {
    const wallet = await walletModel.findOne({ userId });
    if (!wallet) {
      return next({ statusCode: 400, message: 'Wallet not found' });
    }

    if (wallet.balance <= totalPrice) {
      return next({ statusCode: 400, message: 'Insufficient balance in wallet' });
    }
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

  // stock updation after creating a order
  for (const item of savedOrder.orderedItems) {
    const product = await productModel.findById(item.productId);
    product.stockQuantity -= item.quantity;
    await product.save();
  }

  // Update orderedItems status to "Processing" when the order status changes to "Processing"
  if (savedOrder.status === 'Processing') {
    for (const item of savedOrder.orderedItems) {
      item.status = savedOrder.status;
    }
    await savedOrder.save();
  }

  if (paymentMethod === 'Wallet') {
    const wallet = await walletModel.findOne({ userId });

    wallet.balance -= totalPrice;
    wallet.transactions.push({
      type: 'debit',
      amount: totalPrice,
      description: `Order payment for Order ID: ${savedOrder._id}`,
      relatedOrderId: savedOrder._id,
    });
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
  const limit = 7;
  const { page = 1 } = req.query;

  try {
    const orders = await orderModel
      .find({ userId })
      .populate({
        path: 'userId',
        select: 'firstName',
      })
      .populate({
        path: 'orderedItems.productId',
        select: 'images name stockQuantity type',
      })
      .populate({
        path: 'couponApplied', // Populate coupon details
        select: 'name discountValue',
      })
      .select(
        'selectedAddress totalPrice status payment orderedItems createdAt paymentStatus couponApplied'
      )
      .sort({ createdAt: -1 })
      .limit(limit)
      .skip((page - 1) * limit);

    const totalOrders = await orderModel.countDocuments({ userId });
    const totalPages = Math.ceil(totalOrders / limit);

    if (!orders || orders.length === 0) {
      return next({ statusCode: 404, message: 'No orders found' });
    }

    const formattedOrders = orders.map((order) => ({
      orderId: order._id,
      name: order.userId?.firstName,
      address: order.selectedAddress,
      totalPrice: order.totalPrice,
      status: order.status,
      payment: order.payment,
      paymentStatus: order.paymentStatus,
      createdAt: order.createdAt,
      coupon: order.couponApplied
        ? {
          name: order.couponApplied.name,
          discountValue: order.couponApplied.discountValue,
        }
        : null,
      orderedItems: order.orderedItems.map((item) => ({
        productId: item.productId?._id,
        name: item.productId?.name || 'Product Name Not Available',
        image: item.productId?.images?.[0] || 'No image available',
        type: item.productId?.type,
        price: item.price,
        quantity: item.quantity,
        status: item.status,
        returnRequest: {
          status: item.returnRequest?.status || 'Not Requested',
          reason: item.returnRequest?.reason || null,
          requestedAt: item.returnRequest?.requestedAt || null,
          updatedAt: item.returnRequest?.updatedAt || null,
        },
      })),
    }));

    res.status(200).json({
      message: 'Order details sent successfully',
      orders: formattedOrders,
      pagination: {
        currentPage: parseInt(page, 10),
        totalPages,
        totalOrders,
      },
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return next({ statusCode: 500, message: 'Internal server error' });
  }
};

//getall orders
export const getAllOrders = async (req, res, next) => {
  try {
    const orders = await orderModel
      .find()
      .populate('userId', 'firstName lastName email')
      .populate('couponApplied', 'name discountType discountValue')
      .populate({
        path: 'orderedItems.productId',
        select: 'name images',
      })
      .sort({ createdAt: -1 });

    if (!orders || orders.length === 0) {
      return next({ statusCode: 404, message: 'No orders found' });
    }

    const formattedOrders = orders.map((order) => {
      const calculatedTotalPrice = order.orderedItems.reduce((total, item) => {
        return total + item.price * item.quantity;
      }, 0);

      let discountAmount = 0;
      if (order.couponApplied) {
        const { discountType, discountValue } = order.couponApplied;
        if (discountType === 'PERCENTAGE') {
          discountAmount = (calculatedTotalPrice * discountValue) / 100;
        } else if (discountType === 'FLAT') {
          discountAmount = discountValue;
        }
      }

      const finalPrice = calculatedTotalPrice - discountAmount;

      return {
        orderId: order._id,
        userName: `${order.userId?.firstName || ''} ${order.userId?.lastName || ''}`.trim(),
        userEmail: order.userId?.email || 'Unknown',
        totalPrice: calculatedTotalPrice,
        finalPrice: finalPrice.toFixed(2),
        discountAmount: discountAmount.toFixed(2),
        couponApplied: order.couponApplied?.name || 'No Coupon',
        status: order.status,
        paymentStatus: order.paymentStatus,
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
          pricePerUnit: item.price,
          quantity: item.quantity,
          totalItemPrice: (item.price * item.quantity).toFixed(2),
          productStatus: item.status,
          returnRequest: {
            status: item.returnRequest?.status || 'N/A',
            reason: item.returnRequest?.reason || 'No reason provided',
            requestedAt: item.returnRequest?.requestedAt
              ? new Date(item.returnRequest.requestedAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              : 'N/A',
            updatedAt: item.returnRequest?.updatedAt
              ? new Date(item.returnRequest.updatedAt).toLocaleString('en-GB', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
                hour12: true,
              })
              : 'N/A',
          },
        })),
      };
    });

    res.status(200).json({
      message: 'Orders fetched successfully',
      orders: formattedOrders,
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return next({ statusCode: 500, message: 'Internal server error' });
  }
};

//update order status
export const updateOrderStatus = async (req, res, next) => {
  const { orderId, status } = req.body;

  try {
    const order = await orderModel.findById(orderId);

    if (!order) {
      return next({ statusCode: 404, message: 'Order not found' });
    }

    if (status === 'Cancelled' || status === 'Returned') {
      return next({
        statusCode: 400,
        message: 'Cancelled or returned orders cannot have their status updated',
      });
    }

    order.paymentStatus = 'Completed';
    order.status = status;

    for (const item of order.orderedItems) {
      if (order.status === 'Shipped') {
        item.status = 'Processing';
      } else {
        item.status = status;
      }
    }

    await order.save();

    res.status(200).json({
      message: 'Order status updated successfully',
      order,
    });
  } catch (error) {
    console.log('error updaing the status', error)
    next({ statusCode: 500, message: 'Error updating order status', error });
  }
};

//razor pay status change
export const updateStatusRazorpay = async (req, res, next) => {
  const { paymentStatus, orderId } = req.body;

  const order = await orderModel.findById(orderId);
  if (!order) {
    return next({ statusCode: 404, message: 'Order not found' });
  }

  // if (paymentStatus === 'Failed') {
  //   return next({ statusCode: 400, message: 'Payment failed. Cannot update status.' });
  // }

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
  console.log('order status gets upated as properly here.')

  res.status(200).json({ message: 'Order payment status updated successfully', order });
};

