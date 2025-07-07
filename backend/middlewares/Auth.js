import jwt from "jsonwebtoken";
import { ErrorHandler } from "./error.middleware.js";
import { catchAsyncErrors } from "./catchAysncErrors.js";
import { User } from "../models/user-model.js";

const isadminAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies?.admin;
  if (!token) {
    return next(new ErrorHandler("Login first to access this resource", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  if (req.user.role !== "admin") {
    return next(
      new ErrorHandler(`${req.user.role} not autherised for this resource`, 403)
    );
  }
  next();
});

const isUserAuthenticated = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies?.user;
  if (!token) {
    return next(new ErrorHandler("Please Login First", 401));
  }
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = await User.findById(decoded.id);
  if (req.user.role !== "user") {
    return next(
      new ErrorHandler(`${req.user.role} not autherised for this resource`, 403)
    );
  }
  next();
});

export { isadminAuthenticated, isUserAuthenticated };
