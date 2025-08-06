import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import { generateToken } from "../utils/jwtverify.js";
import { User } from "../models/user-model.js";
import validator from "validator";
import { BannedUsers } from "../models/bannedusers-model.js";
import Stripe from "stripe";
import dotenv from "dotenv";
import {
  generateVerificationToken,
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendContactFormEmail,
} from "../utils/emailService.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
  typescript: true,
});

const plans = [
  {
    name: "Veritas Glow",
    price: 89,
  },
  {
    name: "Veritas Sculpt",
    price: 169,
  },
  {
    name: "Veritas Prestige",
    price: 299,
  },
];

const registerUser = catchAsyncErrors(async (req, res, next) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return next(new ErrorHandler("Please fill all fields", 400));
  }
  const userExist = await User.findOne({ email });
  if (userExist) {
    return next(new ErrorHandler("User already exists", 400));
  }
  if (!validator.isEmail(email)) {
    return next(new ErrorHandler("Please enter a valid email", 400));
  }

  const bannedUsers = await BannedUsers.findOne({ userEmail: email });
  if (bannedUsers) {
    return next(new ErrorHandler("You are banned from registering", 403));
  }

  // Generate verification token
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  const user = await User.create({
    name,
    email,
    password,
    emailVerificationToken: verificationToken,
    emailVerificationExpires: verificationExpires,
  });

  try {
    // Send verification email
    await sendVerificationEmail(user, verificationToken);

    res.status(201).json({
      success: true,
      message:
        "Registration successful! Please check your email to verify your account.",
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        isEmailVerified: user.isEmailVerified,
      },
    });
  } catch (error) {
    // If email sending fails, delete the user and return error
    await User.findByIdAndDelete(user._id);
    return next(
      new ErrorHandler("Registration failed. Please try again.", 500)
    );
  }
});

const loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  if (user.role === "admin") {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  if (user.isBanned) {
    return next(
      new ErrorHandler("You are banned from accessing this service", 403)
    );
  }

  // Check if email is verified (only for regular users, not admins)
  if (!user.isEmailVerified) {
    return next(
      new ErrorHandler(
        "Please verify your email address before logging in. Check your inbox for the verification link.",
        401
      )
    );
  }

  generateToken(user, "User logged in successfully", 200, res);
});

const logoutUser = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("user", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "User logout successfully",
    });
});

const loginAdmin = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return next(new ErrorHandler("Please enter email and password", 400));
  }
  const user = await User.findOne({ email }).select("+password");
  if (user && user.role !== "admin") {
    return next(new ErrorHandler("Only admin can access this route", 401));
  }
  if (!user) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  const isPasswordMatched = await user.comparePassword(password);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Invalid email or password", 401));
  }
  generateToken(user, "Admin logged in successfully", 200, res);
});

const logoutAdmin = catchAsyncErrors(async (req, res, next) => {
  res
    .status(200)
    .cookie("admin", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    })
    .json({
      success: true,
      message: "Admin logout successfully",
    });
});

const changeUserName = catchAsyncErrors(async (req, res, next) => {
  const { name } = req.body;
  if (!name) {
    return next(new ErrorHandler("Please provide a name", 400));
  }
  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  user.name = name;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Name updated successfully",
    user,
  });
});

const changeUserPassword = catchAsyncErrors(async (req, res, next) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return next(new ErrorHandler("Please provide old and new passwords", 400));
  }
  const user = await User.findById(req.user._id).select("+password");
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  const isPasswordMatched = await user.comparePassword(oldPassword);
  if (!isPasswordMatched) {
    return next(new ErrorHandler("Old password is incorrect", 401));
  }
  user.password = newPassword;
  await user.save();
  res.status(200).json({
    success: true,
    message: "Password updated successfully",
    user,
  });
});

const getUser = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user._id).select("-password");
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  res.status(200).json({
    success: true,
    user,
  });
});

const getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const users = await User.find({ role: { $ne: "admin" } }).select("-password");
  if (!users || users.length === 0) {
    return next(new ErrorHandler("No users found", 404));
  }
  res.status(200).json({
    success: true,
    users,
  });
});

const banUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  user.isBanned = true;

  const bannedUser = new BannedUsers({
    userId: user._id,
    userEmail: user.email,
    banDate: new Date(),
  });

  await bannedUser.save();

  await user.save();
  res.status(200).json({
    success: true,
    message: "User banned successfully",
    user,
  });
});

const unbanUser = catchAsyncErrors(async (req, res, next) => {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }
  user.isBanned = false;
  await BannedUsers.deleteOne({ userId: user._id });

  await user.save();
  res.status(200).json({
    success: true,
    message: "User unbanned successfully",
    user,
  });
});

const upgradePlan = catchAsyncErrors(async (req, res, next) => {
  const { planName } = req.body;
  console.log("Plan Name:", planName);
  if (!planName) {
    return next(new ErrorHandler("Please provide a plan name", 400));
  }
  const plan = plans.find((p) => p.name === planName);
  if (!plan) {
    return next(new ErrorHandler("Invalid plan name", 400));
  }

  const user = await User.findById(req.user._id);
  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user.plan) {
    return next(new ErrorHandler("You already have a plan", 400));
  }

  try {
    const customer = await stripe.customers.create({
      email: user.email,
      name: user.name,
    });

    // Fix 2: Add return statement and proper response
    const session = await stripe.checkout.sessions.create({
      customer: customer.id,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: plan.name,
            },
            unit_amount: plan.price * 100, // Convert to cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: `${
        process.env.FRONTEND_URL
      }/success.html?plan=${encodeURIComponent(plan.name)}`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel.html`,
      metadata: {
        userId: user._id.toString(),
        planName: plan.name,
      },
    });

    // Return the session URL to frontend
    res.status(200).json({
      success: true,
      message: "Checkout session created successfully",
      sessionUrl: session.url,
      sessionId: session.id,
    });
  } catch (error) {
    return next(new ErrorHandler("Failed to create checkout session", 500));
  }
});

const getCurrentPlan = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user._id).select("-password");
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    if (!user.plan) {
      return res.status(200).json({
        success: true,
        hasPlan: false,
        message: "No active plan found",
      });
    }

    // Define plan benefits based on the plan name
    const planBenefits = {
      "Veritas Glow": [
        "Monthly choice of HydraFacial, RF Microneedling (small area), or PRP Hair/Face treatment",
        "10% discount on all injectables and skincare products",
        "Complimentary birthday facial treatment",
        "Priority booking for all appointments",
        "Exclusive access to member-only flash offers",
      ],
      "Veritas Sculpt": [
        "Monthly Profhilo treatment (every 2 months)",
        "Botox treatment (3 areas every 3 months)",
        "Laser hair removal session (any area)",
        "RF Microneedling or PRP facial monthly",
        "15% discount on injectables, fillers, and exosomes",
        "Complimentary face scan every 3 months",
        "VIP event invitations and early access to product launches",
      ],
      "Veritas Prestige": [
        "Custom facial treatment plan every 6 weeks (CO2 + PRP + Polynucleotide combo)",
        "Discounted Endolift treatment once per year",
        "Exosome therapy included every 3 months",
        "20% discount on all fillers and Botox treatments",
        "Complimentary curated product of the month",
        "Exclusive 'members only' transformation days",
        "Annual comprehensive skin health report with future planning",
      ],
    };

    const planPrice = {
      "Veritas Glow": "£89",
      "Veritas Sculpt": "£169",
      "Veritas Prestige": "£299",
    };

    res.status(200).json({
      success: true,
      hasPlan: true,
      planName: user.plan,
      price: planPrice[user.plan],
      benefits: planBenefits[user.plan] || [],
    });
  } catch (error) {
    return next(new ErrorHandler("Error fetching current plan", 500));
  }
});

const getDashboardStats = catchAsyncErrors(async (req, res, next) => {
  try {
    // Get total users count
    const totalUsers = await User.countDocuments({ role: "user" });

    // Get new users in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newUsers = await User.countDocuments({
      role: "user",
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get users by plan
    const usersByPlan = await User.aggregate([
      { $match: { role: "user", plan: { $ne: null } } },
      { $group: { _id: "$plan", count: { $sum: 1 } } },
    ]);

    // Get banned users count
    const bannedUsers = await User.countDocuments({ isBanned: true });

    // Get recent users (last 5)
    const recentUsers = await User.find({ role: "user" })
      .select("name email createdAt plan")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalUsers,
        newUsers,
        usersByPlan,
        bannedUsers,
        recentUsers,
      },
    });
  } catch (error) {
    return next(new ErrorHandler("Error fetching dashboard stats", 500));
  }
});

const getProductStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const { Product } = await import("../models/product.model.js");

    // Get total products count
    const totalProducts = await Product.countDocuments();

    // Get new products in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const newProducts = await Product.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get products by category
    const productsByCategory = await Product.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get low stock products (less than 10)
    const lowStockProducts = await Product.countDocuments({
      stockQuantity: { $lt: 10 },
    });

    // Get recent products (last 5)
    const recentProducts = await Product.find()
      .select("name category stockQuantity createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalProducts,
        newProducts,
        productsByCategory,
        lowStockProducts,
        recentProducts,
      },
    });
  } catch (error) {
    return next(new ErrorHandler("Error fetching product stats", 500));
  }
});

const getOrderStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const { Order } = await import("../models/order-model.js");

    // Get total orders count
    const totalOrders = await Order.countDocuments();

    // Get orders in last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const recentOrders = await Order.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get total revenue
    const revenueData = await Order.aggregate([
      { $group: { _id: null, totalRevenue: { $sum: "$totalAmount" } } },
    ]);
    const totalRevenue =
      revenueData.length > 0 ? revenueData[0].totalRevenue : 0;

    // Get recent orders (last 5)
    const recentOrderDetails = await Order.find()
      .populate("userId", "name email")
      .populate("products.productId", "name price")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalOrders,
        recentOrders,
        totalRevenue,
        recentOrderDetails,
      },
    });
  } catch (error) {
    return next(new ErrorHandler("Error fetching order stats", 500));
  }
});

const getBlogStats = catchAsyncErrors(async (req, res, next) => {
  try {
    const { Blog } = await import("../models/blog-model.js");

    // Get total blogs count
    const totalBlogs = await Blog.countDocuments();

    // Get published blogs count
    const publishedBlogs = await Blog.countDocuments({ status: "published" });

    // Get draft blogs count
    const draftBlogs = await Blog.countDocuments({ status: "draft" });

    // Get blogs by category
    const blogsByCategory = await Blog.aggregate([
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    // Get recent blogs (last 5)
    const recentBlogs = await Blog.find()
      .populate("author", "name")
      .select("title category status createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        blogsByCategory,
        recentBlogs,
      },
    });
  } catch (error) {
    return next(new ErrorHandler("Error fetching blog stats", 500));
  }
});

// Verify email endpoint
const verifyEmail = catchAsyncErrors(async (req, res, next) => {
  const { token } = req.params;

  if (!token) {
    return next(new ErrorHandler("Verification token is required", 400));
  }

  const user = await User.findOne({
    emailVerificationToken: token,
    emailVerificationExpires: { $gt: Date.now() },
  });

  if (!user) {
    console.log("No user found with this token or token expired");
    return next(new ErrorHandler("Invalid or expired verification token", 400));
  }

  // Mark email as verified
  user.isEmailVerified = true;
  user.emailVerificationToken = undefined;
  user.emailVerificationExpires = undefined;
  await user.save();

  console.log("Email verified successfully for user:", user.email);

  res.status(200).json({
    success: true,
    message: "Email verified successfully! You can now log in to your account.",
  });
});

// Resend verification email
const resendVerificationEmail = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  if (user.isEmailVerified) {
    return next(new ErrorHandler("Email is already verified", 400));
  }

  // Generate new verification token
  const verificationToken = generateVerificationToken();
  const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

  user.emailVerificationToken = verificationToken;
  user.emailVerificationExpires = verificationExpires;
  await user.save();

  try {
    await sendVerificationEmail(user, verificationToken);

    res.status(200).json({
      success: true,
      message: "Verification email sent successfully! Please check your inbox.",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        "Failed to send verification email. Please try again.",
        500
      )
    );
  }
});

// Forgot password endpoint
const forgotPassword = catchAsyncErrors(async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(new ErrorHandler("Email is required", 400));
  }

  const user = await User.findOne({ email });

  if (!user) {
    return next(new ErrorHandler("User not found", 404));
  }

  // Generate password reset token
  const resetToken = generateVerificationToken();
  const resetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

  user.passwordResetToken = resetToken;
  user.passwordResetExpires = resetExpires;
  await user.save();

  try {
    await sendPasswordResetEmail(user, resetToken);

    res.status(200).json({
      success: true,
      message:
        "Password reset email sent successfully! Please check your inbox.",
    });
  } catch (error) {
    return next(
      new ErrorHandler(
        "Failed to send password reset email. Please try again.",
        500
      )
    );
  }
});

// Reset password endpoint
const resetPassword = catchAsyncErrors(async (req, res, next) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return next(new ErrorHandler("Token and password are required", 400));
  }

  const user = await User.findOne({
    passwordResetToken: token,
    passwordResetExpires: { $gt: Date.now() },
  });

  if (!user) {
    return next(new ErrorHandler("Invalid or expired reset token", 400));
  }

  // Update password
  user.password = password;
  user.passwordResetToken = undefined;
  user.passwordResetExpires = undefined;
  await user.save();

  res.status(200).json({
    success: true,
    message:
      "Password reset successfully! You can now log in with your new password.",
  });
});

// Contact form submission endpoint
const submitContactForm = catchAsyncErrors(async (req, res, next) => {
  const { name, email, phone, service, message } = req.body;

  // Validate required fields
  if (!name || !email) {
    return next(new ErrorHandler("Name and email are required", 400));
  }

  // Validate email format
  if (!validator.isEmail(email)) {
    return next(new ErrorHandler("Please enter a valid email", 400));
  }

  // Prepare contact data
  const contactData = {
    name: name.trim(),
    email: email.trim(),
    phone: phone ? phone.trim() : null,
    service: service ? service.trim() : null,
    message: message ? message.trim() : null,
    ip: req.ip || req.connection.remoteAddress,
  };
  console.log("Contact Data:", contactData);

  try {
    // Send contact form email
    await sendContactFormEmail(contactData);

    res.status(200).json({
      success: true,
      message: "Thank you for your message! We'll get back to you soon.",
    });
  } catch (error) {
    console.error("Contact form submission error:", error);
    return next(
      new ErrorHandler(
        "Failed to send your message. Please try again later.",
        500
      )
    );
  }
});

export {
  registerUser,
  loginUser,
  logoutUser,
  loginAdmin,
  logoutAdmin,
  changeUserName,
  changeUserPassword,
  getUser,
  getAllUsers,
  banUser,
  unbanUser,
  upgradePlan,
  getCurrentPlan,
  getDashboardStats,
  getProductStats,
  getOrderStats,
  getBlogStats,
  verifyEmail,
  resendVerificationEmail,
  forgotPassword,
  resetPassword,
  submitContactForm,
};
