import { Cart } from "../models/cart-model.js";
import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import { Product } from "../models/product.model.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
  typescript: true,
});

// Helper function to calculate total price
const calculateTotalPrice = async (cart) => {
  let totalPrice = 0;
  for (const item of cart.Products) {
    const product = await Product.findById(item.productId);
    if (product) {
      totalPrice += product.price * item.quantity;
    }
  }
  cart.totalPrice = totalPrice;
};

const addToCart = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new ErrorHandler("Product ID is required", 400));
  }

  let cart = await Cart.findOne({ userId });

  if (!cart) {
    cart = new Cart({ userId, Products: [] });
  }

  const existingProductIndex = cart.Products.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (existingProductIndex > -1) {
    cart.Products[existingProductIndex].quantity += quantity;
  } else {
    cart.Products.push({ productId, quantity });
  }

  await calculateTotalPrice(cart);
  await cart.save();

  res.status(200).json({
    success: true,
    message: "Item added to cart",
    cart,
  });
});

const removeFromCart = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const { productId, quantity = 1 } = req.body;

  if (!productId) {
    return next(new ErrorHandler("Product ID is required", 400));
  }

  const cart = await Cart.findOne({ userId });

  if (!cart) {
    return next(new ErrorHandler("Cart not found", 404));
  }

  const productIndex = cart.Products.findIndex(
    (item) => item.productId.toString() === productId
  );

  if (productIndex === -1) {
    return next(new ErrorHandler("Item not in cart", 400));
  }

  if (cart.Products[productIndex].quantity <= quantity) {
    cart.Products.splice(productIndex, 1);
  } else {
    cart.Products[productIndex].quantity -= quantity;
  }

  await calculateTotalPrice(cart);
  await cart.save();

  res.status(200).json({
    success: true,
    message: "Item removed from cart",
    cart,
  });
});

const getCart = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;

  const cart = await Cart.findOne({ userId }).populate("Products.productId");

  if (!cart) {
    return res.status(200).json({
      success: true,
      cart: { Products: [], totalPrice: 0 },
    });
  }

  res.status(200).json({
    success: true,
    cart,
  });
});

const buyCart = catchAsyncErrors(async (req, res, next) => {
  const userId = req.user._id;
  const cart = await Cart.findOne({ userId }).populate("Products.productId");

  if (!cart || cart.Products.length === 0) {
    return next(new ErrorHandler("Cart is empty", 400));
  }

  const lineItems = await Promise.all(
    cart.Products.map(async (item) => {
      const product = item.productId;
      return {
        price_data: {
          currency: "usd",
          product_data: {
            name: product.name,
            description: product.description,
          },
          unit_amount: product.price * 100,
        },
        quantity: item.quantity,
      };
    })
  );

  const session = await stripe.checkout.sessions.create({
    line_items: lineItems,
    mode: "payment",
    success_url: `${process.env.FRONTEND_URL}/success`,
    cancel_url: `${process.env.FRONTEND_URL}/cancel`,
    metadata: {
      userId: userId.toString(),
      cartId: cart._id.toString(),
    },
  });

  if (!session) {
    return next(new ErrorHandler("Failed to create payment session", 500));
  }

  res.status(200).json({
    success: true,
    session,
  });
});

export { addToCart, removeFromCart, getCart, buyCart };
