import categoryModel from "../../models/categorySchema.js";
import orderModel from "../../models/orderModel.js";
import productModel from "../../models/productSchema.js";


//salesreport generate 
export const generateSalesReport = async (req, res, next) => {
    const { filter, page = 1, startDate, endDate } = req.query;
    const now = new Date();
    let calculatedStartDate;

    switch (filter) {
        case "daily":
            calculatedStartDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            break;
        case "weekly":
            calculatedStartDate = new Date(now.setDate(now.getDate() - now.getDay()));
            break;
        case "yearly":
            calculatedStartDate = new Date(now.getFullYear(), 0, 1);
            break;
        default:
            calculatedStartDate = new Date(0);
            break;
    }

    // Use custom date range if provided
    const queryStartDate = startDate ? new Date(startDate) : calculatedStartDate;
    const queryEndDate = endDate ? new Date(new Date(endDate).setHours(23, 59, 59, 999)) : now;

    try {
        const limit = 7;
        const skip = (page - 1) * limit;

        const query = {
            status: "Delivered",
            createdAt: { $gte: queryStartDate, $lte: queryEndDate },
        };

        const totalOrdersResult = await orderModel.find(query).countDocuments();
        const totalSalesAndDiscountResult = await orderModel
            .find(query)
            .populate("orderedItems.productId", "salesPrice")
            .populate("couponApplied", "discountType discountValue")
            .exec();

        let totalSales = 0;
        let totalDiscount = 0;

        totalSalesAndDiscountResult.forEach((order) => {
            const orderTotal = order.orderedItems.reduce((sum, item) => {
                return sum + item.quantity * (item.productId?.salesPrice || 0);
            }, 0);

            let discountAmount = 0;
            if (order.couponApplied) {
                if (order.couponApplied.discountType === "PERCENTAGE") {
                    discountAmount = (orderTotal * order.couponApplied.discountValue) / 100;
                } else if (order.couponApplied.discountType === "FLAT") {
                    discountAmount = order.couponApplied.discountValue;
                }
            }

            totalSales += orderTotal - discountAmount;
            totalDiscount += discountAmount;
        });

        const totalOrders = totalOrdersResult;

        // Fetch all orders (without pagination)
        const allOrders = await orderModel
            .find(query)
            .populate("userId", "firstName lastName")
            .populate("orderedItems.productId", "name salesPrice")
            .populate("couponApplied", "name discountType discountValue")
            .exec();

        if (!allOrders.length) {
            return res.status(404).json({ message: "No sales data available for the selected filter or date range" });
        }

        // Fetch the orders for the current page (paginated data)
        const orders = await orderModel
            .find(query)
            .sort({ createdAt: -1 })
            .populate("userId", "firstName lastName")
            .populate("orderedItems.productId", "name salesPrice")
            .populate("couponApplied", "name discountType discountValue")
            .skip(skip)
            .limit(limit);

        const formattedOrders = orders.map((order) => {
            const orderTotal = order.orderedItems.reduce((sum, item) => {
                return sum + item.quantity * (item.productId?.salesPrice || 0);
            }, 0);

            let discountAmount = 0;
            if (order.couponApplied) {
                if (order.couponApplied.discountType === "PERCENTAGE") {
                    discountAmount = (orderTotal * order.couponApplied.discountValue) / 100;
                } else if (order.couponApplied.discountType === "FLAT") {
                    discountAmount = order.couponApplied.discountValue;
                }
            }

            const finalTotal = orderTotal - discountAmount;

            return {
                orderId: order._id,
                customerName: `${order.userId?.firstName || "Unknown"} ${order.userId?.lastName || ""}`.trim(),
                products: order.orderedItems.map((item) => ({
                    name: item.productId?.name || "Unknown",
                    quantity: item.quantity,
                })),
                totalPrice: finalTotal.toFixed(2),
                orderDate: new Date(order.createdAt).toLocaleDateString("en-GB"),
                status: order.status,
            };
        });

        res.status(200).json({
            statistics: {
                totalOrders,
                totalSales: totalSales.toFixed(2),
                totalDiscount: totalDiscount.toFixed(2),
            },
            tableData: formattedOrders,
            allOrdersData: allOrders.map(order => ({
                orderId: order._id,
                customerName: `${order.userId?.firstName || "Unknown"} ${order.userId?.lastName || ""}`.trim(),
                products: order.orderedItems.map((item) => ({
                    name: item.productId?.name || "Unknown",
                    quantity: item.quantity,
                })),
                totalPrice: order.orderedItems.reduce((sum, item) => sum + item.quantity * (item.productId?.salesPrice || 0), 0).toFixed(2),
                orderDate: new Date(order.createdAt).toLocaleDateString("en-GB"),
                status: order.status,
            })),
            pagination: {
                currentPage: parseInt(page, 10),
                totalPages: Math.ceil(totalOrders / limit),
                totalOrders,
            },
        });
    } catch (error) {
        console.error("Error generating sales report:", error);
        next({ statusCode: 500, message: "Error generating sales report" });
    }
};

//get chart data
export const generateChartData = async (req, res, next) => {
    try {
        const { filter } = req.query;

        let dateGroupFormat;
        switch (filter) {
            case 'Weekly':
                dateGroupFormat = { week: { $week: '$createdAt' }, year: { $year: '$createdAt' } };
                break;
            case 'Monthly':
                dateGroupFormat = { month: { $month: '$createdAt' }, year: { $year: '$createdAt' } };
                break;
            case 'Yearly':
                dateGroupFormat = { year: { $year: '$createdAt' } };
                break;
            default:
                return res.status(400).json({ message: 'Invalid filter type' });
        }

        const chartData = await orderModel.aggregate([
            { $match: { status: 'Delivered' } },
            {
                $group: {
                    _id: dateGroupFormat,
                    totalSales: { $sum: '$totalPrice' },
                    totalOrders: { $sum: 1 },
                },
            },
            { $sort: { '_id.year': 1, '_id.month': 1, '_id.week': 1 } },
        ]);

        // Format the response
        const formattedData = chartData.map((entry) => ({
            period:
                filter === 'Yearly'
                    ? `${entry._id.year}`
                    : filter === 'Monthly'
                        ? `${entry._id.month}/${entry._id.year}`
                        : `Week ${entry._id.week}, ${entry._id.year}`,
            totalSales: entry.totalSales,
            totalOrders: entry.totalOrders,
        }));

        res.status(200).json(formattedData);
    } catch (error) {
        next(error);
    }
};


//top selling
export const topSellingDetails = async (req, res, next) => {
    try {
        // Top 10 Best-Selling Products
        const topProducts = await orderModel.aggregate([
            { $unwind: "$orderedItems" }, // Deconstruct the orderedItems array
            {
                $group: {
                    _id: "$orderedItems.productId",
                    totalQuantity: { $sum: "$orderedItems.quantity" }, // Sum the quantities
                },
            },
            { $sort: { totalQuantity: -1 } }, // Sort by totalQuantity in descending order
            { $limit: 10 }, // Limit to top 10 products
            {
                $lookup: {
                    from: "products", // Collection name for products
                    localField: "_id",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    productDetails: { $arrayElemAt: ["$productDetails", 0] }, // Extract product details
                },
            },
        ]);

        // Top 10 Best-Selling Categories
        const topCategories = await orderModel.aggregate([
            { $unwind: "$orderedItems" }, // Deconstruct the orderedItems array
            {
                $lookup: {
                    from: "products", // Collection name for products
                    localField: "orderedItems.productId",
                    foreignField: "_id",
                    as: "productDetails",
                },
            },
            { $unwind: "$productDetails" }, // Unwind productDetails array
            {
                $group: {
                    _id: "$productDetails.category",
                    totalQuantity: { $sum: "$orderedItems.quantity" }, // Sum the quantities per category
                },
            },
            { $sort: { totalQuantity: -1 } }, // Sort by totalQuantity in descending order
            { $limit: 10 }, // Limit to top 10 categories
            {
                $lookup: {
                    from: "categories", // Collection name for categories
                    localField: "_id",
                    foreignField: "_id",
                    as: "categoryDetails",
                },
            },
            {
                $project: {
                    _id: 1,
                    totalQuantity: 1,
                    categoryDetails: { $arrayElemAt: ["$categoryDetails", 0] }, // Extract category details
                },
            },
        ]);

        // Response
        res.status(200).json({
            success: true,
            topProducts,
            topCategories,
        });
    } catch (error) {
        next(error); // Handle errors using middleware
    }
};
