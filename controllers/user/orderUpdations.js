import orderModel from '../../models/orderModel.js';
import productModel from '../../models/productSchema.js';
import walletModel from '../../models/walletModel.js';

//cancel order
export const cancelOrder = async (req, res, next) => {
    const { orderId } = req.body;

    try {
        const order = await orderModel.findById(orderId).populate('couponApplied');

        if (!order) {
            return next({ statusCode: 404, message: 'Order not found' });
        }

        if (order.status === 'Cancelled') {
            return next({ statusCode: 400, message: 'Order is already cancelled' });
        }

        let refundAmount = 0;
        let totalCouponDiscount = 0;

        if (order.couponApplied) {
            const { discountType, discountValue } = order.couponApplied;

            if (discountType === 'FLAT') {
                totalCouponDiscount = discountValue;
            } else if (discountType === 'PERCENTAGE') {
                totalCouponDiscount = (discountValue / 100) * order.totalPrice;
            }
        }

        const couponDiscountPerProduct = totalCouponDiscount / order.orderedItems.length;

        for (const item of order.orderedItems) {
            if (item.status === 'Cancelled') {
                continue;
            }

            const product = await productModel.findById(item.productId);

            if (product) {
                product.stockQuantity += item.quantity;
                await product.save();
            }

            const itemRefund = item.price * item.quantity - couponDiscountPerProduct;
            refundAmount += Math.max(0, itemRefund);
            item.status = 'Cancelled';
        }

        refundAmount = Math.round(refundAmount * 100) / 100;

        if (refundAmount > 0 && 
           ((order.payment === 'Wallet' && order.paymentStatus === 'Completed') ||
            (order.payment === 'Razorpay' && order.paymentStatus === 'Completed'))
        ) {
            const wallet = await walletModel.findOne({ userId: order.userId });

            if (wallet) {
                wallet.balance += refundAmount;
                wallet.transactions.push({
                    type: 'credit',
                    amount: refundAmount,
                    description: `Refund for cancelled order (${orderId})`,
                    relatedOrderId: orderId,
                });
                await wallet.save();
            } else {
                await walletModel.create({
                    userId: order.userId,
                    balance: refundAmount,
                    transactions: [
                        {
                            type: 'credit',
                            amount: refundAmount,
                            description: `Refund for cancelled order (${orderId})`,
                            relatedOrderId: orderId,
                        },
                    ],
                });
            }
        }

        order.status = 'Cancelled';
        await order.save();

        const refundMessage =
            refundAmount > 0
                ? `A refund of ₹${refundAmount} has been credited to your wallet.`
                : 'No refund applicable for this payment method.';

        res.status(200).json({
            message: `Order cancelled successfully! ${refundMessage}`,
            order,
        });
    } catch (error) {
        next({ statusCode: 500, message: 'Error occurred while cancelling order', error });
    }
};

//cancel individual product
export const cancelProduct = async (req, res, next) => {
    const { orderId, productId } = req.body;

    try {
        const product = await productModel.findById(productId);
        if (!product) {
            return next({ statusCode: 404, message: 'Product not found in the database' });
        }

        const order = await orderModel.findById(orderId).populate('couponApplied');
        if (!order) {
            return next({ statusCode: 404, message: 'Order not found' });
        }

        const item = order.orderedItems.find((item) => item.productId.toString() === productId);
        if (!item) {
            return next({ statusCode: 404, message: 'Product not found in the order' });
        }

        if (order.status === 'Cancelled') {
            return next({ statusCode: 400, message: 'Order is already cancelled' });
        }

        if (item.status === 'Cancelled') {
            return next({ statusCode: 400, message: 'Product is already cancelled' });
        }

        if (order.status === 'Delivered') {
            return next({
                statusCode: 400,
                message: 'Cannot cancel a product from an order that is already delivered',
            });
        }

        let refundAmount = item.price * item.quantity;
        if (order.couponApplied) {
            const { discountType, discountValue } = order.couponApplied;
            const productCount = order.orderedItems.length;
            if (discountType === 'FLAT') {
                const discountPerProduct = discountValue / productCount;
                refundAmount -= discountPerProduct;
            } else if (discountType === 'PERCENTAGE') {
                const percentageDiscount = (discountValue / 100) * order.totalPrice;
                const discountPerProduct = percentageDiscount / productCount;
                refundAmount -= discountPerProduct;
            }
        }
        refundAmount = Math.round(refundAmount * 100) / 100;

        if (
            (order.payment === 'Razorpay' && order.paymentStatus !== 'Failed') ||
            order.payment === 'Wallet' ||
            (order.payment === 'COD' && order.status === 'Delivered')
        ) {
            const wallet = await walletModel.findOne({ userId: order.userId });

            if (wallet) {
                wallet.balance += refundAmount;
                wallet.transactions.push({
                    type: 'credit',
                    amount: refundAmount,
                    description: `Refund for cancelled product (${product.name}) from order (${orderId})`,
                    relatedOrderId: orderId,
                });
                await wallet.save();
            } else {
                await walletModel.create({
                    userId: order.userId,
                    balance: refundAmount,
                    transactions: [
                        {
                            type: 'credit',
                            amount: refundAmount,
                            description: `Refund for cancelled product (${product.name}) from order (${orderId})`,
                            relatedOrderId: orderId,
                        },
                    ],
                });
            }
        }

        if (order.orderedItems.length === 1) {
            order.status = 'Cancelled';
            item.status = 'Cancelled';
            await order.save();

            if (product) {
                product.stockQuantity += item.quantity;
                await product.save();
            }

            return res.status(200).json({
                message: 'Order cancelled successfully!',
                order,
            });
        }

        item.status = 'Cancelled';

        const allProductsCancelled = order.orderedItems.every((item) => item.status === 'Cancelled');
        if (allProductsCancelled) {
            order.status = 'Cancelled';
        }

        await order.save();

        if (product) {
            product.stockQuantity += item.quantity;
            await product.save();
        }

        const responseMessage = allProductsCancelled
            ? 'Order cancelled successfully as all products are now cancelled!'
            : 'Product cancelled successfully!';

        res.status(200).json({
            message: responseMessage,
            order,
        });
    } catch (error) {
        next({ statusCode: 500, message: 'Error occurred while cancelling product', error });
    }
};

//return individual product
export const returnProduct = async (req, res, next) => {
    const { orderId, productId, reason } = req.body;

    const order = await orderModel.findById(orderId);
    if (!order) {
        return next({ statusCode: 404, message: 'Order not found' });
    }

    if (order.status === 'Cancelled' || order.status === 'Returned') {
        return next({
            statusCode: 400,
            message: 'Order cannot be returned as it is already cancelled or returned',
        });
    }

    if (order.status !== 'Delivered') {
        return next({
            statusCode: 400,
            message: 'Products can only be returned after the order is delivered',
        });
    }

    const product = order.orderedItems.find(
        (item) => item.productId.toString() === productId
    );

    if (!product) {
        return next({ statusCode: 404, message: 'Product not found in the order' });
    }

    if (product.returnRequest?.status) {
        return next({
            statusCode: 400,
            message: 'Return request has already been initiated for this product',
        });
    }

    product.returnRequest = {
        status: 'Pending',
        reason: reason || 'No reason provided',
        requestedAt: new Date(),
        updatedAt: new Date(),
    };

    await order.save();

    res.status(200).json({
        message: 'Return request initiated successfully',
        productId,
        returnRequest: product.returnRequest,
    });
}

//return product update
export const returnProductStatus = async (req, res, next) => {
    const { orderId, productId, action } = req.body;

    try {
        const order = await orderModel.findOne({
            _id: orderId,
            'orderedItems.productId': productId,
        }).populate('couponApplied');

        if (!order) {
            return next({ statusCode: 404, message: 'Order or Product not found' });
        }

        const item = order.orderedItems.find(
            (item) => item.productId.toString() === productId.toString()
        );

        if (!item) {
            return next({ statusCode: 404, message: 'Product not found in this order' });
        }

        if (item.returnRequest?.status === 'Accepted' || item.returnRequest?.status === 'Rejected') {
            return next({
                statusCode: 400,
                message: 'Return request has already been processed',
            });
        }

        let partialCouponDiscount = 0;
        if (order.couponApplied) {
            const totalQuantity = order.orderedItems.reduce((sum, orderedItem) => sum + orderedItem.quantity, 0);
            const couponValue = order.couponApplied.discountValue;

            if (order.couponApplied.discountType === 'FLAT') {
                const perProductDiscount = couponValue / totalQuantity;
                partialCouponDiscount = +(perProductDiscount * item.quantity).toFixed(2);
            } else if (order.couponApplied.discountType === 'PERCENTAGE') {
                const totalItemsPrice = order.orderedItems.reduce((sum, orderedItem) => {
                    return sum + orderedItem.price * orderedItem.quantity;
                }, 0);
                const percentageDiscount = (order.couponApplied.discountValue / 100);
                const totalDiscount = percentageDiscount * totalItemsPrice;
                const perProductDiscount = totalDiscount / totalQuantity;
                partialCouponDiscount = +(perProductDiscount * item.quantity).toFixed(2);
            }
        }

        if (action === 'Accepted') {
            const product = await productModel.findById(productId);
            if (!product) {
                return next({ statusCode: 404, message: 'Product not found in the database' });
            }

            product.stockQuantity += item.quantity;
            await product.save();

            // Credit user wallet
            const wallet = await walletModel.findOne({ userId: order.userId });
            if (!wallet) {
                return next({ statusCode: 404, message: 'Wallet not found for the user' });
            }

            const refundAmount = (item.price * item.quantity) - partialCouponDiscount;
            wallet.balance += refundAmount;
            wallet.transactions.push({
                type: 'credit',
                amount: refundAmount,
                description: `Refund for returned product: ${product.name}`,
                relatedOrderId: orderId,
                date: new Date(),
            });
            await wallet.save();

            item.returnRequest.status = 'Accepted';
            item.returnRequest.updatedAt = new Date();
            item.status = 'Returned';
        }

        if (action === 'Rejected') {
            item.returnRequest.status = 'Rejected';
            item.returnRequest.updatedAt = new Date();
        }

        await order.save();

        res.status(200).json({
            message: `Return request ${action} successfully`,
            productId,
            updatedReturnRequest: item.returnRequest,
        });
    } catch (error) {
        next({ statusCode: 500, message: 'Internal server error', details: error.message });
    }
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