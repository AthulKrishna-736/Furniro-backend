import cartModel from "../../models/cartModel.js";
import categoryModel from "../../models/categorySchema.js";
import catOfferModel from "../../models/catOffers.js";
import productModel from "../../models/productSchema.js";
import userModel from "../../models/userModel.js";
import wishlistModel from "../../models/wishlistModel.js";

//add to wishlist
export const addWishlist = async (req, res, next) => {
  const { userId, productId } = req.body;

  const user = await userModel.findById(userId);
  if (!user) {
    return next({ statusCode: 400, message: "User not found" });
  }

  const product = await productModel.findById(productId);
  if (!product) {
    return next({ statusCode: 400, message: "Product not found" });
  }

  let wishlist = await wishlistModel.findOne({ userId });

  if (!wishlist) {
    wishlist = new wishlistModel({
      userId,
      products: [
        {
          productId: product._id,
          productName: product.name,
          price: product.salesPrice,
        },
      ],
    });

    await wishlist.save();
    return res.status(201).json({
      message: "Wishlist created and product added",
      wishlist,
    });
  }

  const productExists = wishlist.products.some(
    (item) => item.productId.toString() === productId
  );

  if (productExists) {
    return res.status(400).json({
      success: false,
      message: "Product is already in the wishlist",
    });
  }

  wishlist.products.push({
    productId: product._id,
    productName: product.name,
    price: product.salesPrice,
  });

  await wishlist.save();

  res.status(200).json({
    message: "Product added to wishlist",
    wishlist,
  });
};

//delete item
export const deleteWishlist = async (req, res, next) => {
  const { userId, productId } = req.body;

  const wishlist = await wishlistModel.findOne({ userId });

  if (!wishlist) {
    return next({ statusCode: 404, message: "Wishlist not found for this user" });
  }

  const productExists = wishlist.products.find(
    (product) => product.productId.toString() === productId
  );

  if (!productExists) {
    return next({ statusCode: 404, message: "Product not found in the wishlist" });
  }

  wishlist.products = wishlist.products.filter(
    (product) => product.productId.toString() !== productId
  );

  await wishlist.save();

  return res.status(200).json({
    message: "Product removed from wishlist successfully",
    wishlist,
  });
};

//adding wishlist to cart
export const moveToCart = async (req, res, next) => {
  const { userId, productId } = req.body;

  const wishlist = await wishlistModel.findOne({ userId });
  if (!wishlist) {
    return next({ statusCode: 404, message: "Wishlist not found for this user." });
  }

  const productInWishlist = wishlist.products.find(
    (product) => product.productId.toString() === productId
  );

  if (!productInWishlist) {
    return next({ statusCode: 404, message: "Product not found in the wishlist." });
  }

  let cart = await cartModel.findOne({ userId });
  if (!cart) {
    cart = new cartModel({ userId, items: [], totalPrice: 0 });
  }

  const productInCart = cart.items.find(
    (item) => item.productId.toString() === productId
  );

  if (productInCart) {
    productInCart.quantity += 1;

    if (productInCart.quantity > 5) {
      productInCart.quantity = 5;
      return next({ statusCode: 400, message: "Maximum quantity reached for this product in the cart." });
    }
  } else {
    cart.items.push({
      productId: productInWishlist.productId,
      name: productInWishlist.productName,
      quantity: 1,
      price: productInWishlist.price,
    });
  }

  cart.totalPrice += productInWishlist.price;

  await cart.save();

  wishlist.products = wishlist.products.filter(
    (product) => product.productId.toString() !== productId
  );

  await wishlist.save();

  res.status(200).json({
    message: "Product moved from wishlist to cart successfully.",
    cart,
  });
};

//getwishlist
export const getWishlist = async (req, res, next) => {
  const { userId } = req.params;

  if (!userId) {
    return next({ statusCode: 400, message: 'User ID is required' });
  }

  try {
    const wishlist = await wishlistModel.findOne({ userId })
      .populate('products.productId', 'name salesPrice images category')
      .exec();

    if (!wishlist) {
      return next({ statusCode: 404, message: 'Wishlist not found' });
    }

    const now = new Date();
    let wishlistUpdated = false;

    // Loop through the wishlist products and apply category offer if active
    for (const productItem of wishlist.products) {
      const product = productItem.productId;

      if (!product) continue;

      const category = await categoryModel.findById(product.category);
      if (!category) continue;

      const activeCategoryOffer = await catOfferModel.findOne({
        categoryId: category._id,
        isActive: true,
        startDate: { $lte: now },
        expiryDate: { $gte: now },
      });

      if (activeCategoryOffer) {
        if (activeCategoryOffer.discountType === 'percentage') {
          productItem.price = product.salesPrice - (product.salesPrice * activeCategoryOffer.discountValue) / 100;
        } else if (activeCategoryOffer.discountType === 'flat') {
          productItem.price = product.salesPrice - activeCategoryOffer.discountValue;
        }
        wishlistUpdated = true;
      } else {
        productItem.price = product.salesPrice;
        wishlistUpdated = true;
      }
    }

    const updatedTotalPrice = wishlist.products.reduce(
      (total, productItem) => total + productItem.price,
      0
    );

    if (wishlistUpdated || wishlist.totalPrice !== updatedTotalPrice) {
      wishlist.totalPrice = updatedTotalPrice;
      await wishlist.save();
    }

    res.status(200).json({
      message: 'Wishlist fetched successfully',
      wishlist: wishlist.products,
      totalPrice: wishlist.totalPrice,
    });

  } catch (error) {
    next({ statusCode: 500, message: error.message || 'Failed to retrieve wishlist' });
  }
};


