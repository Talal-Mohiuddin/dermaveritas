import jwt from "jsonwebtoken";

function verifyJWT(token) {
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded;
  } catch (error) {
    console.error("JWT verification error:", error);
    return null;
  }
}

const generateToken = (user, message, status, res) => {
  const token = user.generateWebToken();
  const cookieName = user.role === "admin" ? "admin" : "user";
  res
    .status(status)
    .cookie(cookieName, token, {
      expires: new Date(
        Date.now() + process.env.COOKIE_EXPIERY * 24 * 60 * 60 * 1000
      ),
      httpOnly: true,
    })
    .json({
      success: true,
      message,
      token,
      user,
    });
};

export { generateToken, verifyJWT };
