import couponModel from "../../models/couponModel.js";

  //create coupon
  export const createCoupon = async (req, res, next) => {
    const { name, discountType, discountValue, minPrice, expiryDate, usedCount } = req.body;

    // Backend validation
    if (!name || typeof name !== 'string' || name.trim().length === 0) {
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

    if (!minPrice || minPrice < 0) {
      return next({
        statusCode: 400,
        message: "Minimum price must be a valid number greater than or equal to 0.",
      });
    }

    if (!expiryDate || isNaN(new Date(expiryDate).getTime())) {
      return next({
        statusCode: 400,
        message: "Expiry date must be a valid date.",
      });
    }

    if (usedCount < 0) {
      return next({
        statusCode: 400,
        message: "Used count must be a valid non-negative number.",
      });
    }

    const existingCoupon = await couponModel.findOne({ name });
    if (existingCoupon) {
      return next({
        statusCode: 400,
        message: "Coupon with this name already exists.",
      });
    }

    // Create new coupon
    const newCoupon = new couponModel({
      name,
      discountType,
      discountValue,
      minPrice,
      expiryDate,
      usedCount, // usedCount is set as received from frontend
    });

    const savedCoupon = await newCoupon.save();

    res.status(201).json({
      message: "Coupon created successfully",
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
    const coupons = await couponModel.find().sort({ createdAt: -1 }).catch((error) =>
      next({
        statusCode: 500,
        message: "Failed to retrieve coupons",
      })
    );
  
    if (coupons) {
      res.status(200).json({
        success: true,
        message: "Coupons retrieved successfully",
        coupons,
      });
    }
  };