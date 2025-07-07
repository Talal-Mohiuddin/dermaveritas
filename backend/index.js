import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import bodyParser from "body-parser";
import path from "path";
import { fileURLToPath } from "url";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import connectDB from "./utils/connectdb.js";
import Userrouter from "./routes/user-route.js";
import Cartrouter from "./routes/cart-route.js";
import Productrouter from "./routes/product-route.js";
import Blogrouter from "./routes/blog-route.js";
import cookieParser from "cookie-parser";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());

// Serve static files from public directory
app.use("/uploads", express.static(path.join(__dirname, "public/uploads")));

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});

const frontendPath = path.join(__dirname, "../frontend");
app.use(express.static(frontendPath));

// API routes
app.use("/api/users", Userrouter);
app.use("/api/cart", Cartrouter);
app.use("/api/products", Productrouter);
app.use("/api/blog", Blogrouter);

// Serve index.html for non-API routes
app.get(/^\/(?!api).*/, (req, res) => {
  res.sendFile(path.join(frontendPath, "index.html"));
});

app.use(errorMiddleware);
export default app;
