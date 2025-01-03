import cartModel from "../../models/cartModel.js";
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
  
    const wishlist = await wishlistModel.findOne({ userId })
      .populate('products.productId', 'name price images')
      .exec();
  
    if (!wishlist) {
      return next({ statusCode: 404, message: 'Wishlist not found' });
    }

    wishlist.products = wishlist.products.sort(
      (a,b) => new Date(b.addedAt) - new Date(a.addedAt)
    );
  
    res.status(200).json({
      message: 'Wishlist fetched successfully',
      wishlist: wishlist.products,
      totalPrice: wishlist.totalPrice,
    });
  };
  
