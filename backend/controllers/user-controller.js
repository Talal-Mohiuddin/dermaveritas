import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import { generateToken } from "../utils/jwtverify.js";
import { User } from "../models/user-model.js";
import validator from "validator";

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
    return next(new ErrorHandler("You can not lgoin with an admin email", 401));
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

export { registerUser, loginUser, logoutUser, loginAdmin, logoutAdmin };
