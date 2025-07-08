import { catchAsyncErrors } from "../middlewares/catchAysncErrors.js";
import { ErrorHandler } from "../middlewares/error.middleware.js";
import { verifyJWT } from "../utils/jwtverify.js";
import { User } from "../models/user-model.js";

const verifyToken = catchAsyncErrors(async (req, res, next) => {
  const authHeader = req.headers.authorization;

  const token = authHeader?.split("Bearer ")[1];
  if (!token) {
    return next(new ErrorHandler("No token provided", 401));
  }

  try {
    const decoded = verifyJWT(token);

    if (!decoded || !decoded.id) {
      return next(new ErrorHandler("Invalid token or missing user ID", 401));
    }

    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new ErrorHandler("User not found", 404));
    }

    res.status(200).json({
      success: true,
      user: { role: user.role },
    });
  } catch (error) {
    console.error("Token verification error:", error);
    return next(
      new ErrorHandler("Token verification failed: " + error.message, 401)
    );
  }
});

const getSession = catchAsyncErrors(async (req, res, next) => {
  const token = req.cookies.user || req.cookies.admin;
  if (!token) {
    return next(new ErrorHandler("No active session", 401));
  }
  res.status(200).json({
    success: true,
    token,
  });
});

export { verifyToken, getSession };
