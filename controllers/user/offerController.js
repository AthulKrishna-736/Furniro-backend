import categoryModel from "../../models/categorySchema.js";
import catOfferModel from "../../models/catOffers.js";
import productModel from "../../models/productSchema.js";

//create offer
export const createCatOffer = async (req, res, next) => {
  const { categoryId, discountType, discountValue, startDate, expiryDate } = req.body;

  if (!categoryId || !discountType || !discountValue || !startDate || !expiryDate) {
    return next({ statusCode: 400, message: "All fields are required" });
  }

  if (!['flat', 'percentage'].includes(discountType)) {
    return next({ statusCode: 400, message: "Invalid discount type. Must be 'flat' or 'percentage'" });
  }

  if (discountValue <= 0) {
    return next({ statusCode: 400, message: "Discount value must be greater than 0" });
  }

  if (discountType === 'percentage' && discountValue > 50) {
    return next({ statusCode: 400, message: "Percentage discount cannot exceed 50%" });
  }

  if (new Date(startDate) >= new Date(expiryDate)) {
    return next({ statusCode: 400, message: "Start date must be before the expiry date" });
  }

  const activeOffer = await catOfferModel.findOne({
    categoryId,
    isActive: true,
    $or: [
      { startDate: { $lte: expiryDate }, expiryDate: { $gte: startDate } }, // overlap with the new offer
    ],
  });

  if (activeOffer) {
    return next({ statusCode: 400, message: "An active offer already exists for this category during the specified time range." });
  }

  const category = await categoryModel.findById(categoryId);
  if (!category) {
    return next({ statusCode: 404, message: "Category not found" });
  }

  const newOffer = await catOfferModel.create({
    categoryId,
    discountType,
    discountValue,
    startDate,
    expiryDate,
  });

  if (!newOffer) {
    return next({ statusCode: 500, message: "Failed to create offer" });
  }

  const updatedCategory = await categoryModel.findByIdAndUpdate(
    categoryId,
    { $set: { currentOffer: newOffer._id } },
    { new: true }
  );

  if (!updatedCategory) {
    return next({ statusCode: 500, message: "Failed to update category with the new offer" });
  }

  res.status(201).json({ message: "Category offer created successfully", newOffer });
};

//block offer
export const toggleCatOfferStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryOffer = await catOfferModel.findById(id);

    if (!categoryOffer) {
      return res.status(404).json({ message: "Category offer not found" });
    }

    // Toggle the isActive status
    categoryOffer.isActive = !categoryOffer.isActive;
    await categoryOffer.save();
    res.status(200).json({
      message: `Category offer ${categoryOffer.isActive ? "unblocked" : "blocked"} successfully`,
    });
  } catch (error) {
    console.error("Error in toggleCatOfferStatus:", error);
    next(error); // Pass the error to the global error handler
  }
};

//get offers
export const getOffers = async (req, res, next) => {
  try {
    const offers = await catOfferModel.find().populate("categoryId", "name");

    // Map and format the response
    const offerDetails = offers.map(offer => ({
      offerId: offer._id,
      categoryName: offer.categoryId?.name || 'N/A',
      discountType: offer.discountType,
      discountValue: offer.discountValue,
      startDate: offer.startDate,
      expiryDate: offer.expiryDate,
      isActive: offer.isActive,
      createdAt: offer.createdAt,
      updatedAt: offer.updatedAt,
    }));

    res.status(200).json({
      message: "All offers fetched successfully",
      offers: offerDetails,
    });
  } catch (error) {
    console.error("Error fetching offers:", error);
    next(error); // Handle errors with middleware if configured
  }
};

//get categories
export const getCategories = async (req, res, next) => {
  const categories = await categoryModel.find({}, "name");

  res.status(200).json({
    message: "Categories fetched successfully",
    categories: categories.map(category => ({
      id: category._id,
      name: category.name
    }))
  });
};

//delete offers
export const deleteOffer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const categoryOffer = await catOfferModel.findById(id);
    if (!categoryOffer) {
      return res.status(404).json({ message: "Category offer not found" });
    }
    await categoryOffer.deleteOne();

    res.status(200).json({ message: "Category offer deleted successfully" });
  } catch (error) {
    console.error("Error in deleteOffer:", error);
    next(error);
  }
};

// cat offer to products
export const getProductsAndOffers = async (req, res, next) => {
  try {
    const now = new Date();
    const allCategoryOffers = await categoryModel
      .find()
      .populate({
        path: 'currentOffer',
        model: 'CategoryOffer',
        match: {
          isActive: true,
          startDate: { $lte: now },
          expiryDate: { $gte: now },
        },
      })
      .exec();

    const categoryOfferMap = allCategoryOffers.reduce((map, category) => {
      const { _id, name, currentOffer } = category;

      if (currentOffer) {
        map[_id] = {
          name,
          discountType: currentOffer.discountType,
          discountValue: currentOffer.discountValue,
        };
      }

      return map;
    }, {});

    const products = await productModel.find().exec();

    const productsWithOffers = products.map((product) => {
      const categoryOffer = categoryOfferMap[product.category] || {};
      const originalPrice = product.salesPrice; // Original price is the sales price
      let discountPrice = null; // Default discount price
      let discountValue = 0; // Default discount value

      if (categoryOffer.discountType === 'flat') {
        discountValue = categoryOffer.discountValue;
        discountPrice = Math.max(0, originalPrice - discountValue);
      } else if (categoryOffer.discountType === 'percentage') {
        discountValue = (originalPrice * categoryOffer.discountValue) / 100;
        discountPrice = Math.max(0, originalPrice - discountValue);
      }

      return {
        _id: product._id,
        name: product.name,
        description: product.description,
        categoryName: categoryOffer.name || null,
        originalPrice, // Original price of the product
        discountPrice, // Price after applying the discount
        discountType: categoryOffer.discountType || null,
        discountValue: discountValue || 0, // Discount value in flat or percentage
        stockQuantity: product.stockQuantity,
      };
    });

    res.status(200).json({
      message: 'Products with offers fetched successfully',
      products: productsWithOffers,
    });
  } catch (error) {
    console.error('Error fetching products and offers:', error);
    next(error);
  }
};





 