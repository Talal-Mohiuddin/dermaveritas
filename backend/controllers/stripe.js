import express from "stripe";
import { User } from "../models/user-model.js";
import { Cart } from "../models/cart-model.js";
import { createOrderFromStripe } from "./order-controller.js";
import dotenv from "dotenv";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";

dotenv.config();

const stripe = new express(process.env.STRIPE_SECRET_KEY);

// Webhook handler for Stripe events
export const handleStripeWebhook = catchAsyncErrors(async (req, res, next) => {
  const sig = req.headers["stripe-signature"];
  const webhookSecret = process.env.STRIPE_SECRET_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error(`Webhook signature verification failed: ${err.message}`);
    return res.status(400).json({
      success: false,
      message: "Webhook signature verification failed"
    });
  }

  // Handle the checkout.session.completed event
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;

    try {
      const sessionWithMetadata = await stripe.checkout.sessions.retrieve(
        session.id,
        {
          expand: ["metadata"],
        }
      );

      const { userId, cartId } = sessionWithMetadata.metadata;

      // If metadata contains cartId, process cart purchase
      if (cartId) {
        const user = await User.findById(userId);
        const cart = await Cart.findById(cartId).populate("Products.productId");

        if (!user || !cart) {
          console.error("User or cart not found");
          return res.status(404).json({
            success: false,
            message: "User or cart not found",
          });
        }

        // Create order from cart
        const orderProducts = cart.Products.map((item) => ({
          productId: item.productId._id,
          name: item.productId.name,
          price: item.productId.price,
          quantity: item.quantity,
        }));

        // Create order
        await createOrderFromStripe(session, {
          userId,
          products: JSON.stringify(orderProducts),
          shippingAddress: JSON.stringify({}), // Add shipping address if available
        });

        // Empty the cart
        cart.Products = [];
        cart.totalPrice = 0;
        await cart.save();

        console.log(`Order created and cart cleared for user: ${userId}`);
        return res.status(200).json({
          success: true,
          message: "Order created successfully",
        });
      }

      // Handle plan upgrade (existing logic)
      const planName = sessionWithMetadata?.planName;
      if (userId && planName) {
        // Validate planName
        const validPlans = [
          "Glow & Hydrate",
          "Lift & Reshape",
          "Correct & Renew",
        ];
        if (!validPlans.includes(planName)) {
          console.error(`Invalid plan name: ${planName}`);
          return res.status(400).json({
            success: false,
            message: "Invalid plan name",
          });
        }

        // Update user plan
        const user = await User.findById(userId);
        if (!user) {
          console.error(`User not found: ${userId}`);
          return res.status(404).json({
            success: false,
            message: "User not found",
          });
        }

        user.plan = planName;
        await user.save();

        console.log(`Updated plan to ${planName} for user: ${userId}`);
        res.status(200).json({
          success: true,
          message: "Webhook processed successfully",
        });
      }
    } catch (error) {
      console.error(`Error processing webhook: ${error.message}`);
      return next(
        new ErrorHandler(`Webhook processing failed: ${error.message}`, 500)
      );
    }
  } else {
    // Acknowledge other events
    res.status(200).json({
      success: true,
      message: "Event received",
    });
  }
});
