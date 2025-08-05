import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import { generateToken } from "../utils/jwtverify.js";
import { User } from "../models/user-model.js";
import validator from "validator";
import { BannedUsers } from "../models/bannedusers-model.js";
import Stripe from "stripe";
import dotenv from "dotenv";

dotenv.config();


const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: "2022-11-15",
  typescript: true,
});

const plans = [
  {
    name: "Glow & Hydrate",
    price: 699,
  },
  {
    name: "Lift & Reshape",
    price: 1299,
  },
  {
    name: "Correct & Renew",
    price: 1499,
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

  const user = await User.create({
    name,
    email,
    password,
  });
  generateToken(user, "User registered successfully", 201, res);
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
      success_url: `${process.env.FRONTEND_URL}/success`,
      cancel_url: `${process.env.FRONTEND_URL}/cancel`,
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
};
