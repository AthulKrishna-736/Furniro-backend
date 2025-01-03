import categoryModel from "../../models/categorySchema.js";
import catOfferModel from "../../models/catOffers.js";

//create offer
export const createCatOffer = async (req, res, next) => {
    const { categoryId, discountType, discountValue, startDate, expiryDate } = req.body;
  
    // Validate input
    if (!categoryId || !discountType || !discountValue || !startDate || !expiryDate) {
      return next({ statusCode: 400, message: "All fields are required" });
    }
  
    if (!['flat', 'percentage'].includes(discountType)) {
      return next({ statusCode: 400, message: "Invalid discount type. Must be 'flat' or 'percentage'" });
    }
  
    if (discountValue <= 0) {
      return next({ statusCode: 400, message: "Discount value must be greater than 0" });
    }
  
    const category = await categoryModel.findById(categoryId);
    if (!category) {
      return next({ statusCode: 404, message: "Category not found" });
    }
  
    const newOffer = await catOfferModel
      .create({
        categoryId,
        discountType,
        discountValue,
        startDate,
        expiryDate,
      })
  
    if (!newOffer) return; 
  
    const updatedCategory = await categoryModel
      .findByIdAndUpdate(
        categoryId,
        { $set: { currentOffer: newOffer._id } },
        { new: true }
      )
  
    if (!updatedCategory) return; 
  
    res.status(201).json({ message: "Category offer created successfully", newOffer });
  };
  
//delete offer
export const toggleCatOfferStatus = async (req, res, next) => {
    const { id } = req.params;
    console.log("Request params = ", req.params);
  
    const categoryOffer = await catOfferModel.findById(id);
  
    if (!categoryOffer) {
      return next({ statusCode: 404, message: "Category offer not found" });
    }
  
    categoryOffer.isActive = !categoryOffer.isActive;
  
    await categoryOffer.save();

    res.status(200).json({ message: `Category offer ${categoryOffer.isActive ? "unblocked" : "blocked"} successfully` });
  };

//get offers
export const getOffers = async (req, res, next) => {
    const offers = await catOfferModel.find().populate("categoryId", "name");
  
    const offerDetails = offers.map(offer => ({
      offerId: offer._id,
      categoryName: offer.categoryId.name,
      discountPercentage: offer.discountPercentage,
      startDate: offer.startDate,
      expiryDate: offer.expiryDate,
      isActive: offer.isActive,
    }));
  
    res.status(200).json({
      message: "All offers fetched successfully",
      offers: offerDetails,
    });
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
