import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import { Order } from "../models/order-model.js";
import { User } from "../models/user-model.js";
import { Product } from "../models/product.model.js";

// Get all orders (admin only)
const getAllOrders = catchAsyncErrors(async (req, res, next) => {
  const orders = await Order.find()
    .populate("userId", "name email")
    .populate("products.productId", "name images")
    .sort({ createdAt: -1 });

  res.status(200).json({
    success: true,
    orders,
  });
});

// Get order by ID
const getOrderById = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findById(req.params.id)
    .populate("userId", "name email")
    .populate("products.productId", "name images description");

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.status(200).json({
    success: true,
    order,
  });
});

// Update order status
const updateOrderStatus = catchAsyncErrors(async (req, res, next) => {
  const { status } = req.body;

  if (!status) {
    return next(new ErrorHandler("Status is required", 400));
  }

  const validStatuses = [
    "pending",
    "processing",
    "shipped",
    "delivered",
    "cancelled",
  ];
  if (!validStatuses.includes(status)) {
    return next(new ErrorHandler("Invalid status", 400));
  }

  const order = await Order.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true }
  ).populate("userId", "name email");

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Order status updated successfully",
    order,
  });
});

// Delete order
const deleteOrder = catchAsyncErrors(async (req, res, next) => {
  const order = await Order.findByIdAndDelete(req.params.id);

  if (!order) {
    return next(new ErrorHandler("Order not found", 404));
  }

  res.status(200).json({
    success: true,
    message: "Order deleted successfully",
  });
});

// Create order from stripe webhook
const createOrderFromStripe = catchAsyncErrors(
  async (paymentIntent, customer) => {
    try {
      // Extract order data from payment intent metadata
      const { userId, products, shippingAddress } = paymentIntent.metadata;

      if (!userId || !products) {
        throw new Error("Missing required order data");
      }

      // Parse products from metadata
      const orderProducts = JSON.parse(products);

      // Calculate total amount
      const totalAmount = orderProducts.reduce((total, product) => {
        return total + product.price * product.quantity;
      }, 0);

      // Create order
      const order = await Order.create({
        userId,
        products: orderProducts,
        totalAmount,
        shippingAddress: JSON.parse(shippingAddress || "{}"),
        paymentStatus: "completed",
        stripePaymentIntentId: paymentIntent.id,
      });

      // Update user's buying history
      await User.findByIdAndUpdate(userId, {
        $push: {
          Buyinghistory: orderProducts.map((product) => ({
            productId: product.productId,
            date: new Date(),
          })),
        },
      });

      // Update product stock
      for (const product of orderProducts) {
        await Product.findByIdAndUpdate(product.productId, {
          $inc: { stockQuantity: -product.quantity },
        });
      }

      return order;
    } catch (error) {
      console.error("Error creating order from stripe:", error);
      throw error;
    }
  }
);

export {
  getAllOrders,
  getOrderById,
  updateOrderStatus,
  deleteOrder,
  createOrderFromStripe,
};
