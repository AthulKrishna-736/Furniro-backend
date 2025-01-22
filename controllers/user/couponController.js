import couponModel from "../../models/couponModel.js";

//create coupon
export const createCoupon = async (req, res, next) => {
  const {
    name,
    discountType,
    discountValue,
    minPrice,
    maxPrice,
    expiryDate,
    count,
  } = req.body;

  if (!name || typeof name !== "string" || name.trim().length === 0) {
    return next({
      statusCode: 400,
      message: "Coupon name is required and must be a valid string.",
    });
  }

  if (!discountType || !["PERCENTAGE", "FLAT"].includes(discountType)) {
    return next({
      statusCode: 400,
      message: "Discount type must be either 'PERCENTAGE' or 'FLAT'.",
    });
  }

  if (!discountValue || discountValue <= 0) {
    return next({
      statusCode: 400,
      message: "Discount value must be a positive number.",
    });
  }

  if (discountType === "FLAT") {
    if (minPrice === undefined || minPrice < 0) {
      return next({
        statusCode: 400,
        message: "Minimum price must be provided and be greater than or equal to 0 for flat discounts.",
      });
    }

    if (discountValue * 2 > minPrice) {
      return next({
        statusCode: 400,
        message:
          "Flat discount value cannot exceed the minimum price of eligible products.",
      });
    }
  }

  if (discountType === "PERCENTAGE") {
    if (maxPrice === undefined || maxPrice <= 0) {
      return next({
        statusCode: 400,
        message: "Maximum price must be provided and be greater than 0 for percentage discounts.",
      });
    }

    if (discountValue > 70) {
      return next({
        statusCode: 400,
        message: "Discount percentage cannot exceed 70%.",
      });
    }
  }

  if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
    return next({
      statusCode: 400,
      message: "Expiry date must be a valid date.",
    });
  }

  if (count === undefined || count < 0) {
    return next({
      statusCode: 400,
      message: "Count must be a valid non-negative number.",
    });
  }

  // Check if the coupon already exists
  const existingCoupon = await couponModel.findOne({ name });
  if (existingCoupon) {
    return next({
      statusCode: 400,
      message: "A coupon with this name already exists.",
    });
  }

  // Create a new coupon
  const newCoupon = new couponModel({
    name,
    discountType,
    discountValue,
    minPrice: discountType === "FLAT" ? minPrice : undefined,
    maxPrice: discountType === "PERCENTAGE" ? maxPrice : undefined,
    expiryDate,
    count,
  });
  
  const savedCoupon = await newCoupon.save();

  res.status(201).json({
    message: "Coupon created successfully.",
    coupon: savedCoupon,
  });
};

//delete coupons
export const deleteCoupon = async (req, res, next) => {
  const { couponId } = req.body;

  const coupon = await couponModel.findByIdAndDelete(couponId);
  if (!coupon) {
    return next({
      statusCode: 404,
      message: "Coupon not found",
    });
  }

  res.status(200).json({
    message: "Coupon deleted successfully",
  });
};

//get all coupons
export const getAllCoupons = async (req, res, next) => {
  const page = parseInt(req.query.page) || 1;
  const limit = 5;
  const skip = (page - 1) * limit;

  const totalCount = await couponModel.countDocuments();

  const coupons = await couponModel
    .find()
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPages = Math.ceil(totalCount / limit);

  res.status(200).json({
    success: true,
    message: "Coupons retrieved successfully",
    coupons,
    pagination: {
      currentPage: page,
      totalPages,
      totalCount,
      limit,
    },
  });
};

//get user coupons
export const getUserCoupons = async (req, res, next) => {
  const coupons = await couponModel.find().sort({ createdAt: -1 });
  if (!coupons || coupons.length === 0) {
    return next({
      statusCode: 404,
      message: "No coupons available"
    });
  }
  res.status(200).json({
    success: true,
    message: "Coupons retrieved successfully",
    coupons,
  });
};
